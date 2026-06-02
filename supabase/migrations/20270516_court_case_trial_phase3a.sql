-- ════════════════════════════════════════════════════════════════════
-- 20270516 — Trial loop Phase 3a: messages + turn loop + beat play
--
-- Phase 2 dealt the hand and stamped current_round = 1 /
-- current_turn = 'plaintiff'. Phase 3a wires the messaging surface:
-- the active lawyer types up to 4 messages of 240 chars each per
-- turn, each message can optionally play one of their favouring
-- beats, and the turn ends either after the 4th message or via
-- explicit END TURN. Round advances after defendant finishes;
-- after defendant finishes round 4 the trial enters a 'pending
-- verdict' state (Phase 3b/c land objection + settle + verdict).
--
-- This migration ships:
--   • messages_sent_this_turn counter on court_case_trials, plus
--     the columns the next phases will populate (objection use,
--     settle state, verdict winner) — defined here so the table
--     is shape-stable across the three Phase-3 commits.
--   • court_case_trial_hands gets objected_at_round + nullified
--     for the Phase 3b objection mechanic; a CHECK constraint
--     enforces a beat is either played OR objected with, not both.
--   • court_case_trial_messages table (the chat log).
--   • send_trial_message(p_faction_id, p_trial_id, p_text,
--     p_beat_index) — central action RPC. Validates turn, message
--     length (1..240), that the optional beat is in the caller's
--     hand and favours their side, that no other beat was played
--     this turn, and atomically inserts the message + flips the
--     hand row + bumps the turn counter. Auto-flips turn at 4.
--   • end_turn(p_faction_id, p_trial_id) — explicit early end-turn.
--   • get_trial_state extended with the chat log + the turn
--     counter so the modal can render the conversation and the
--     5-dot "messages this turn" pip row.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Trial row: per-turn counter + Phase 3b/c columns ─────────────
ALTER TABLE public.court_case_trials
    ADD COLUMN IF NOT EXISTS messages_sent_this_turn      int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS plaintiff_objections_used    int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS defendant_objections_used    int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS plaintiff_settle_used        boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS defendant_settle_used        boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS settle_offered_by_side       text,
    ADD COLUMN IF NOT EXISTS settle_resolved              text,
    ADD COLUMN IF NOT EXISTS verdict_winner               text,
    ADD COLUMN IF NOT EXISTS verdict_at_tick              int;

ALTER TABLE public.court_case_trials
    DROP CONSTRAINT IF EXISTS court_case_trials_settle_offered_check;
ALTER TABLE public.court_case_trials
    ADD CONSTRAINT court_case_trials_settle_offered_check
    CHECK (settle_offered_by_side IS NULL OR settle_offered_by_side IN ('plaintiff', 'defendant'));

ALTER TABLE public.court_case_trials
    DROP CONSTRAINT IF EXISTS court_case_trials_settle_resolved_check;
ALTER TABLE public.court_case_trials
    ADD CONSTRAINT court_case_trials_settle_resolved_check
    CHECK (settle_resolved IS NULL OR settle_resolved IN ('accepted', 'declined'));

ALTER TABLE public.court_case_trials
    DROP CONSTRAINT IF EXISTS court_case_trials_verdict_winner_check;
ALTER TABLE public.court_case_trials
    ADD CONSTRAINT court_case_trials_verdict_winner_check
    CHECK (verdict_winner IS NULL OR verdict_winner IN ('plaintiff', 'defendant', 'settled', 'tie'));

-- ── 2. Hands: Phase 3b objection state, with consumption guard ──────
ALTER TABLE public.court_case_trial_hands
    ADD COLUMN IF NOT EXISTS objected_at_round int,
    ADD COLUMN IF NOT EXISTS nullified         boolean NOT NULL DEFAULT false;

ALTER TABLE public.court_case_trial_hands
    DROP CONSTRAINT IF EXISTS court_case_trial_hands_consumption_check;
ALTER TABLE public.court_case_trial_hands
    ADD CONSTRAINT court_case_trial_hands_consumption_check
    CHECK (NOT (played_at_round IS NOT NULL AND objected_at_round IS NOT NULL));

-- ── 3. court_case_trial_messages ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.court_case_trial_messages (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_id            uuid NOT NULL REFERENCES public.court_case_trials(id) ON DELETE CASCADE,
    side                text NOT NULL CHECK (side IN ('plaintiff', 'defendant', 'judge', 'system')),
    round               int NOT NULL,
    turn_seq            int NOT NULL,
    text                text NOT NULL CHECK (length(text) BETWEEN 1 AND 240),
    kind                text NOT NULL DEFAULT 'argument'
                            CHECK (kind IN ('argument', 'objection', 'settle_offer', 'settle_response', 'judge_note', 'verdict')),
    beat_played_index   int,
    objected_beat_index int,
    settle_decision     text CHECK (settle_decision IS NULL OR settle_decision IN ('accept', 'decline')),
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_court_case_trial_messages_trial
    ON public.court_case_trial_messages (trial_id, created_at);

ALTER TABLE public.court_case_trial_messages ENABLE ROW LEVEL SECURITY;

-- ── 4. send_trial_message ───────────────────────────────────────────
-- Validates turn ownership, message length, optional beat play, then
-- inserts the message + flips the hand row + bumps the turn counter
-- in one transaction. Turn flips to the other side at 4 messages.
-- After defendant's 4th message in round 4, the trial enters a
-- pending-verdict state; Phase 3c wires the verdict RPC.
CREATE OR REPLACE FUNCTION public.send_trial_message(
    p_faction_id uuid,
    p_trial_id   uuid,
    p_text       text,
    p_beat_index int DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_trial        court_case_trials%ROWTYPE;
    v_case         court_case_drafts%ROWTYPE;
    v_side         text;
    v_clean_text   text;
    v_next_seq     int;
    v_already_played int;
    v_beat_support text;
    v_beat_in_hand int;
    v_new_count    int;
    v_msg_id       uuid;
    v_flipped      boolean := false;
    v_next_turn    text;
    v_next_round   int;
    v_pending      boolean := false;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    v_clean_text := btrim(COALESCE(p_text, ''));
    IF length(v_clean_text) = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'empty_text');
    END IF;
    IF length(v_clean_text) > 240 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'text_too_long');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_trial FROM public.court_case_trials
     WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'in_progress' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_active');
    END IF;

    IF v_trial.plaintiff_advocate_id = v_pol.id THEN
        v_side := 'plaintiff';
    ELSIF v_trial.defendant_advocate_id = v_pol.id THEN
        v_side := 'defendant';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_trial');
    END IF;

    IF v_trial.current_turn <> v_side THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_turn');
    END IF;

    IF v_trial.messages_sent_this_turn >= 4 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'turn_message_cap');
    END IF;

    -- Optional beat play. One beat per turn — refuse a second play.
    IF p_beat_index IS NOT NULL THEN
        IF p_beat_index < 0 OR p_beat_index > 9 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_beat_index');
        END IF;

        SELECT count(*) INTO v_already_played
          FROM public.court_case_trial_messages
         WHERE trial_id = p_trial_id
           AND side = v_side
           AND round = v_trial.current_round
           AND beat_played_index IS NOT NULL;
        IF v_already_played > 0 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'beat_already_played_this_turn');
        END IF;

        -- Beat must be in caller's hand and not yet consumed.
        SELECT 1 INTO v_beat_in_hand
          FROM public.court_case_trial_hands
         WHERE trial_id = p_trial_id
           AND side = v_side
           AND beat_index = p_beat_index
           AND played_at_round IS NULL
           AND objected_at_round IS NULL;
        IF v_beat_in_hand IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'beat_not_in_hand');
        END IF;

        -- Beat must favour the caller's side (opponent-favouring beats
        -- become objection material in Phase 3b, can't be argued for).
        SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;
        v_beat_support := v_case.beats -> p_beat_index ->> 'support';
        IF v_beat_support IS DISTINCT FROM v_side THEN
            RETURN jsonb_build_object('success', false, 'reason', 'beat_favours_opponent');
        END IF;
    END IF;

    -- Compute the next turn-sequence number — turn restarts each
    -- time current_turn flips, so message ordering is per turn.
    v_next_seq := v_trial.messages_sent_this_turn + 1;

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind, beat_played_index
    ) VALUES (
        p_trial_id, v_side, v_trial.current_round, v_next_seq,
        v_clean_text, 'argument', p_beat_index
    ) RETURNING id INTO v_msg_id;

    IF p_beat_index IS NOT NULL THEN
        UPDATE public.court_case_trial_hands
           SET played_at_round = v_trial.current_round
         WHERE trial_id = p_trial_id
           AND side = v_side
           AND beat_index = p_beat_index;
    END IF;

    v_new_count := v_next_seq;

    -- Flip turn at 4 messages. Plaintiff → defendant. Defendant →
    -- plaintiff next round, or pending-verdict if round 4 done.
    IF v_new_count >= 4 THEN
        IF v_side = 'plaintiff' THEN
            v_next_turn  := 'defendant';
            v_next_round := v_trial.current_round;
        ELSE
            IF v_trial.current_round < 4 THEN
                v_next_turn  := 'plaintiff';
                v_next_round := v_trial.current_round + 1;
            ELSE
                v_pending    := true;
                v_next_turn  := v_trial.current_turn;
                v_next_round := v_trial.current_round;
            END IF;
        END IF;
        UPDATE public.court_case_trials
           SET current_turn            = v_next_turn,
               current_round           = v_next_round,
               messages_sent_this_turn = 0
         WHERE id = p_trial_id;
        v_flipped := true;
    ELSE
        UPDATE public.court_case_trials
           SET messages_sent_this_turn = v_new_count
         WHERE id = p_trial_id;
    END IF;

    RETURN jsonb_build_object(
        'success',                 true,
        'message_id',              v_msg_id,
        'side',                    v_side,
        'round',                   v_trial.current_round,
        'turn_seq',                v_next_seq,
        'beat_played_index',       p_beat_index,
        'messages_sent_this_turn', CASE WHEN v_flipped THEN 0 ELSE v_new_count END,
        'turn_flipped',            v_flipped,
        'pending_verdict',         v_pending,
        'next_turn',               v_next_turn,
        'next_round',              v_next_round
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.send_trial_message(uuid, uuid, text, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.send_trial_message(uuid, uuid, text, int) TO authenticated;

-- ── 5. end_turn ─────────────────────────────────────────────────────
-- Explicit END TURN — the same flip logic as the 4th-message branch
-- of send_trial_message, but doesn't insert a message. Useful when
-- the lawyer has nothing more to say but doesn't want to waste turns.
CREATE OR REPLACE FUNCTION public.end_turn(p_faction_id uuid, p_trial_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_trial     court_case_trials%ROWTYPE;
    v_side      text;
    v_next_turn text;
    v_next_round int;
    v_pending   boolean := false;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_trial FROM public.court_case_trials
     WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'in_progress' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_active');
    END IF;

    IF v_trial.plaintiff_advocate_id = v_pol.id THEN
        v_side := 'plaintiff';
    ELSIF v_trial.defendant_advocate_id = v_pol.id THEN
        v_side := 'defendant';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_trial');
    END IF;
    IF v_trial.current_turn <> v_side THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_turn');
    END IF;

    IF v_side = 'plaintiff' THEN
        v_next_turn  := 'defendant';
        v_next_round := v_trial.current_round;
    ELSE
        IF v_trial.current_round < 4 THEN
            v_next_turn  := 'plaintiff';
            v_next_round := v_trial.current_round + 1;
        ELSE
            v_pending    := true;
            v_next_turn  := v_trial.current_turn;
            v_next_round := v_trial.current_round;
        END IF;
    END IF;

    UPDATE public.court_case_trials
       SET current_turn            = v_next_turn,
           current_round           = v_next_round,
           messages_sent_this_turn = 0
     WHERE id = p_trial_id;

    RETURN jsonb_build_object(
        'success',         true,
        'turn_flipped',    true,
        'next_turn',       v_next_turn,
        'next_round',      v_next_round,
        'pending_verdict', v_pending
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.end_turn(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.end_turn(uuid, uuid) TO authenticated;

-- ── 6. get_trial_state (extended) ───────────────────────────────────
-- Adds the chat log + the per-turn counter. Both lawyers see every
-- message — the chat is the trial record. The caller's hand still
-- redacts strength.
CREATE OR REPLACE FUNCTION public.get_trial_state(p_faction_id uuid, p_trial_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_trial     court_case_trials%ROWTYPE;
    v_case      court_case_drafts%ROWTYPE;
    v_side      text;
    v_opp_id    uuid;
    v_opp_name  text;
    v_hand      jsonb;
    v_messages  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_trial FROM public.court_case_trials WHERE id = p_trial_id;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'in_progress' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_active',
            'status', v_trial.status);
    END IF;

    IF v_trial.plaintiff_advocate_id = v_pol.id THEN
        v_side := 'plaintiff';
        v_opp_id := v_trial.defendant_advocate_id;
    ELSIF v_trial.defendant_advocate_id = v_pol.id THEN
        v_side := 'defendant';
        v_opp_id := v_trial.plaintiff_advocate_id;
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_trial');
    END IF;

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;
    IF v_case.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_found');
    END IF;

    IF v_opp_id IS NOT NULL THEN
        SELECT btrim(COALESCE(leader_first_name, '') || ' ' || COALESCE(leader_last_name, ''))
          INTO v_opp_name
          FROM public.factions WHERE id = v_opp_id;
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'beat_index',      h.beat_index,
        'name',            v_case.beats -> h.beat_index ->> 'name',
        'type',            v_case.beats -> h.beat_index ->> 'type',
        'description',     v_case.beats -> h.beat_index ->> 'description',
        'support',         v_case.beats -> h.beat_index ->> 'support',
        'played_at_round', h.played_at_round,
        'objected_at_round', h.objected_at_round,
        'nullified',       h.nullified
    ) ORDER BY h.beat_index), '[]'::jsonb)
      INTO v_hand
      FROM public.court_case_trial_hands h
     WHERE h.trial_id = p_trial_id AND h.side = v_side;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id',                m.id,
        'side',              m.side,
        'round',             m.round,
        'turn_seq',          m.turn_seq,
        'text',              m.text,
        'kind',              m.kind,
        'beat_played_index', m.beat_played_index,
        'beat_name',         CASE WHEN m.beat_played_index IS NOT NULL
                                  THEN v_case.beats -> m.beat_played_index ->> 'name' END,
        'beat_type',         CASE WHEN m.beat_played_index IS NOT NULL
                                  THEN v_case.beats -> m.beat_played_index ->> 'type' END,
        'created_at',        m.created_at
    ) ORDER BY m.created_at ASC), '[]'::jsonb)
      INTO v_messages
      FROM public.court_case_trial_messages m
     WHERE m.trial_id = p_trial_id;

    RETURN jsonb_build_object(
        'success',                 true,
        'trial_id',                p_trial_id,
        'case_id',                 v_case.id,
        'case_type',               v_case.case_type,
        'litigation_type',         v_case.litigation_type,
        'overview',                v_case.overview,
        'plaintiff_name',          v_trial.plaintiff_name,
        'defendant_name',          v_trial.defendant_name,
        'side',                    v_side,
        'opponent_name',           COALESCE(NULLIF(v_opp_name, ''), 'Opposing Counsel'),
        'current_round',           v_trial.current_round,
        'current_turn',            v_trial.current_turn,
        'your_turn',               v_trial.current_turn = v_side,
        'messages_sent_this_turn', v_trial.messages_sent_this_turn,
        'status',                  v_trial.status,
        'hand',                    v_hand,
        'messages',                v_messages
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.get_trial_state(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_trial_state(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
