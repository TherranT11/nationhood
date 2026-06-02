-- ════════════════════════════════════════════════════════════════════
-- 20270515 — Trial loop Phase 2: beat dealing + modal-shell state
--
-- Phase 1 (20270514) shipped the pre-trial → in_progress matchmaking.
-- Phase 2 wires what each lawyer SEES when they enter the courtroom:
-- a hand of 5 beats drawn from the case's 10-beat pool, a turn
-- indicator, and a round counter (1 of 4). The modal that consumes
-- this state is the read-only shell — no messages, no plays, no
-- objections yet. Phase 3 lands the turn loop.
--
-- Beat dealing happens when the trial flips to 'in_progress' (the
-- second advocate joins via represent_pretrial). All 10 beat indices
-- are shuffled, 5 go to the plaintiff hand, 5 to the defendant hand —
-- always disjoint. Plaintiff opens the trial (current_turn =
-- 'plaintiff', current_round = 1).
--
-- This migration ships:
--   • current_round / current_turn columns on court_case_trials.
--   • court_case_trial_hands table — per-lawyer hand of 5 beats,
--     indexed by position in the case's beats jsonb array.
--   • represent_pretrial re-authored: deals beats + initialises
--     turn state in the same transaction the trial matches.
--   • get_trial_state(p_faction_id, p_trial_id) — read-only RPC that
--     returns the caller's view of the trial: case info, opponent
--     name, round + turn, their own hand (name / type / description /
--     support — NOT strength; the strength stays a judge-only fact).
--   • list_active_trials_for_advocate(p_faction_id) — for the
--     Pressing Issues "TRIAL IN PROGRESS" card.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Turn-state columns ───────────────────────────────────────────
ALTER TABLE public.court_case_trials
    ADD COLUMN IF NOT EXISTS current_round int,
    ADD COLUMN IF NOT EXISTS current_turn  text;

ALTER TABLE public.court_case_trials
    DROP CONSTRAINT IF EXISTS court_case_trials_current_turn_check;
ALTER TABLE public.court_case_trials
    ADD CONSTRAINT court_case_trials_current_turn_check
    CHECK (current_turn IS NULL OR current_turn IN ('plaintiff', 'defendant'));

COMMENT ON COLUMN public.court_case_trials.current_round IS
    '1-4 once the trial is in_progress. NULL while pre_trial. Phase 3 advances it after both sides finish their turn in the current round.';
COMMENT ON COLUMN public.court_case_trials.current_turn IS
    'plaintiff | defendant — whose turn it is to speak. Plaintiff opens; Phase 3 flips this after a turn ends.';

-- ── 2. court_case_trial_hands ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.court_case_trial_hands (
    trial_id        uuid NOT NULL REFERENCES public.court_case_trials(id) ON DELETE CASCADE,
    side            text NOT NULL CHECK (side IN ('plaintiff', 'defendant')),
    beat_index      int  NOT NULL CHECK (beat_index >= 0 AND beat_index < 10),
    played_at_round int,
    PRIMARY KEY (trial_id, side, beat_index)
);

CREATE INDEX IF NOT EXISTS idx_court_case_trial_hands_trial_side
    ON public.court_case_trial_hands (trial_id, side);

ALTER TABLE public.court_case_trial_hands ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.court_case_trial_hands IS
    'Per-advocate hand of 5 beats dealt at trial-start. beat_index references position in court_case_drafts.beats (0-9). played_at_round = NULL until the beat is played in a turn (Phase 3 writes this).';

-- ── 3. represent_pretrial (re-authored) ─────────────────────────────
-- Same matchmaking + attempts gate as Phase 1, plus: when both sides
-- are filled, deal 5/5 beats from the case's 10-pool and stamp the
-- opening turn state. The dealing is one INSERT that shuffles via
-- generate_series + ORDER BY random(); plaintiff gets the first 5
-- shuffled indices, defendant gets the second 5 — guaranteed disjoint.
CREATE OR REPLACE FUNCTION public.represent_pretrial(
    p_faction_id uuid,
    p_trial_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_trial     court_case_trials%ROWTYPE;
    v_tick      int;
    v_open_side text;
    v_decision  text;
    v_inserted  int;
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
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    SELECT * INTO v_trial FROM public.court_case_trials
     WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'pre_trial' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_pretrial');
    END IF;
    IF v_trial.nation_id <> v_pol.bar_admitted_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_mismatch');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_trial.pre_trial_expires_at_tick < v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'pre_trial_expired');
    END IF;

    IF v_trial.plaintiff_advocate_id IS NULL THEN
        v_open_side := 'plaintiff';
    ELSIF v_trial.defendant_advocate_id IS NULL THEN
        v_open_side := 'defendant';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'both_sides_filled');
    END IF;

    v_decision := CASE WHEN v_open_side = 'plaintiff'
                         THEN 'representing_plaintiff'
                       ELSE 'representing_defendant' END;

    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, v_trial.case_draft_id, v_decision)
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
    END IF;

    -- Fill the open slot and flip to in_progress. Plaintiff opens; the
    -- round counter starts at 1. Phase 3 advances both fields.
    IF v_open_side = 'plaintiff' THEN
        UPDATE public.court_case_trials
           SET plaintiff_advocate_id = v_pol.id,
               status                = 'in_progress',
               matched_at_tick       = v_tick,
               current_round         = 1,
               current_turn          = 'plaintiff'
         WHERE id = p_trial_id;
    ELSE
        UPDATE public.court_case_trials
           SET defendant_advocate_id = v_pol.id,
               status                = 'in_progress',
               matched_at_tick       = v_tick,
               current_round         = 1,
               current_turn          = 'plaintiff'
         WHERE id = p_trial_id;
    END IF;

    -- Deal 5/5 disjoint beats. generate_series produces 0..9; the
    -- row_number over a random ordering gives a stable shuffle within
    -- this CTE. First 5 → plaintiff, second 5 → defendant.
    INSERT INTO public.court_case_trial_hands (trial_id, side, beat_index)
    SELECT
        p_trial_id,
        CASE WHEN rn <= 5 THEN 'plaintiff' ELSE 'defendant' END,
        i
      FROM (
        SELECT i, row_number() OVER (ORDER BY random()) AS rn
          FROM generate_series(0, 9) AS i
      ) shuffled;

    RETURN jsonb_build_object(
        'success',         true,
        'decision',        v_decision,
        'side',            v_open_side,
        'trial_id',        p_trial_id,
        'case_id',         v_trial.case_draft_id,
        'trial_status',    'in_progress',
        'matched_at_tick', v_tick,
        'current_round',   1,
        'current_turn',    'plaintiff'
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.represent_pretrial(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.represent_pretrial(uuid, uuid) TO authenticated;

-- ── 4. get_trial_state ──────────────────────────────────────────────
-- Returns the caller's view of an active trial. Verifies the caller
-- owns one of the advocate slots; returns their hand only (the
-- opponent's hand is private). Strength is stripped from each beat —
-- the judge sees those numbers, not the lawyers.
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
        'beat_index',     h.beat_index,
        'name',           v_case.beats -> h.beat_index ->> 'name',
        'type',           v_case.beats -> h.beat_index ->> 'type',
        'description',    v_case.beats -> h.beat_index ->> 'description',
        'support',        v_case.beats -> h.beat_index ->> 'support',
        'played_at_round', h.played_at_round
    ) ORDER BY h.beat_index), '[]'::jsonb)
      INTO v_hand
      FROM public.court_case_trial_hands h
     WHERE h.trial_id = p_trial_id AND h.side = v_side;

    RETURN jsonb_build_object(
        'success',         true,
        'trial_id',        p_trial_id,
        'case_id',         v_case.id,
        'case_type',       v_case.case_type,
        'litigation_type', v_case.litigation_type,
        'overview',        v_case.overview,
        'plaintiff_name',  v_trial.plaintiff_name,
        'defendant_name',  v_trial.defendant_name,
        'side',            v_side,
        'opponent_name',   COALESCE(NULLIF(v_opp_name, ''), 'Opposing Counsel'),
        'current_round',   v_trial.current_round,
        'current_turn',    v_trial.current_turn,
        'your_turn',       v_trial.current_turn = v_side,
        'status',          v_trial.status,
        'hand',            v_hand
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.get_trial_state(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_trial_state(uuid, uuid) TO authenticated;

-- ── 5. list_active_trials_for_advocate ──────────────────────────────
-- One-row-per-active-trial summary for the Pressing Issues
-- "TRIAL IN PROGRESS" card. Excludes resolved / settled / expired
-- so the surface stays tight.
CREATE OR REPLACE FUNCTION public.list_active_trials_for_advocate(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_trials jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
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

    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'trials', '[]'::jsonb);
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'trial_id',        t.id,
        'case_id',         t.case_draft_id,
        'case_type',       d.case_type,
        'litigation_type', d.litigation_type,
        'plaintiff_name',  t.plaintiff_name,
        'defendant_name',  t.defendant_name,
        'side',            CASE WHEN t.plaintiff_advocate_id = v_pol.id
                                  THEN 'plaintiff' ELSE 'defendant' END,
        'your_turn',       (t.current_turn = CASE WHEN t.plaintiff_advocate_id = v_pol.id
                                                    THEN 'plaintiff' ELSE 'defendant' END),
        'current_round',   t.current_round
    ) ORDER BY t.matched_at_tick ASC NULLS LAST), '[]'::jsonb)
      INTO v_trials
      FROM public.court_case_trials t
      JOIN public.court_case_drafts d ON d.id = t.case_draft_id
     WHERE t.status = 'in_progress'
       AND (t.plaintiff_advocate_id = v_pol.id OR t.defendant_advocate_id = v_pol.id);

    RETURN jsonb_build_object('success', true, 'trials', v_trials);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_active_trials_for_advocate(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_active_trials_for_advocate(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
