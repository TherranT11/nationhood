-- ════════════════════════════════════════════════════════════════════
-- 20270524 — OBJECTION v2 (dice roll) + CALL WITNESS
--
-- Two mechanic changes to the in-trial action set:
--
--   1. OBJECTION rewrite. Layers a 1d10 roll on top of the 20270517
--      reactive-nullify behaviour:
--        • Target: opponent's most recently played, non-nullified
--          beat (same as 20270517). If no such target exists, the
--          action errors out and no resources are spent.
--        • Roll 1d10:
--            1-5  → "Objection sustained." Target beat is marked
--                   nullified (0 verdict contribution) AND opponent
--                   loses an additional 3 strength on the verdict
--                   tally. Big swing.
--            6-10 → "Objection overruled." Target beat STAYS in
--                   evidence (not nullified) and the objector loses
--                   3 strength on the verdict tally.
--        • Ammo beat (opp-supporting beat from caller's hand) is
--          consumed (objected_at_round) either way.
--        • Action slot: OBJECTION now consumes one of the lawyer's
--          4 per-turn action slots (it didn't before). 3-objection
--          cap stays.
--
--   2. CALL WITNESS (new). Lawyer on turn picks a witness + one
--      direct/cross Q&A from the case's witnesses[] (Section VI).
--      Consumes an action slot like a beat. The answer's hidden
--      strength + supports flow into the verdict tally same as a
--      beat. A Q&A may set requires_beat: an INDEX into the case
--      beats[] of a beat that must already be in evidence. The gate
--      is satisfied when that beat was PLAYED by either side
--      (nullified or not — a played-then-nullified beat is still
--      on the record). Ammo beats from a hand (consumed via
--      objection but never played) do NOT satisfy the gate. Under
--      this design, witness questions requiring an opp-side beat
--      depend on the opponent playing that beat; if they never do,
--      the question remains locked. That's the explicit trade-off
--      of the reactive-only OBJECTION mechanic.
--
--   3. Verdict tally now folds in witness QA strengths + per-side
--      objection strength deltas. Nullified-beat carve-out is
--      actively used by the sustained-objection path (see above)
--      to strip the target beat from the strength sum.
--
-- This migration ships:
--   • court_case_trials columns:
--       plaintiff_objection_strength_delta,
--       defendant_objection_strength_delta
--   • court_case_trial_witness_qa table — once-per-trial-per-Q&A
--     record of what's been asked + the strength/supports contribution.
--   • court_case_trial_messages.kind CHECK widened to allow
--     'judge_ruling', 'witness_q', 'witness_a'.
--   • send_objection v2 (dice + restored reactive nullify, action slot).
--   • call_witness_qa RPC.
--   • _apply_verdict folds witness QA + objection deltas into tally.
--   • get_trial_state exposes case_beats (name + type for all 10),
--     witnesses, asked QA, and in_evidence_beats (played-only).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Trial columns: per-side objection strength deltas ───────────
ALTER TABLE public.court_case_trials
    ADD COLUMN IF NOT EXISTS plaintiff_objection_strength_delta int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS defendant_objection_strength_delta int NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.court_case_trials.plaintiff_objection_strength_delta IS
    'Signed cumulative strength adjustment from objections. -3 per overruled own-side objection, -3 per sustained objection by the opponent. Folded into _apply_verdict tally on top of the played-beat strength sum.';
COMMENT ON COLUMN public.court_case_trials.defendant_objection_strength_delta IS
    'Mirror of plaintiff_objection_strength_delta for the defendant side.';

-- ── 2. Asked-witness-QA tracking ───────────────────────────────────
-- One row per (trial, witness_index, phase, qa_index). PK prevents
-- re-asking. Stores the strength + supports snapshot so verdict
-- tally + chat display don't need to re-parse the case witnesses
-- jsonb after the fact.
CREATE TABLE IF NOT EXISTS public.court_case_trial_witness_qa (
    trial_id        uuid NOT NULL REFERENCES public.court_case_trials(id) ON DELETE CASCADE,
    witness_index   int  NOT NULL,
    phase           text NOT NULL CHECK (phase IN ('direct','cross')),
    qa_index        int  NOT NULL,
    asked_at_round  int  NOT NULL,
    asked_by_side   text NOT NULL CHECK (asked_by_side IN ('plaintiff','defendant')),
    strength        int  NOT NULL,
    supports        text NOT NULL CHECK (supports IN ('plaintiff','defendant')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (trial_id, witness_index, phase, qa_index)
);
ALTER TABLE public.court_case_trial_witness_qa ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_trial_witness_qa_trial
    ON public.court_case_trial_witness_qa (trial_id);

-- ── 3. Widen court_case_trial_messages.kind CHECK ──────────────────
ALTER TABLE public.court_case_trial_messages
    DROP CONSTRAINT IF EXISTS court_case_trial_messages_kind_check;
ALTER TABLE public.court_case_trial_messages
    ADD CONSTRAINT court_case_trial_messages_kind_check
    CHECK (kind IN ('argument', 'objection', 'settle_offer', 'settle_response',
                    'judge_note', 'verdict', 'judge_ruling',
                    'witness_q', 'witness_a'));

-- ── 4. send_objection — reactive nullify + 1d10 dice + action slot ─
CREATE OR REPLACE FUNCTION public.send_objection(
    p_faction_id  uuid,
    p_trial_id    uuid,
    p_beat_index  int,
    p_text        text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_trial        court_case_trials%ROWTYPE;
    v_case         court_case_drafts%ROWTYPE;
    v_side         text;
    v_opp_side     text;
    v_beat_support text;
    v_beat_in_hand int;
    v_used         int;
    v_clean_text   text;
    v_roll         int;
    v_sustained    boolean;
    v_judge_text   text;
    v_target_idx   int;
    v_next_seq     int;
    v_new_count    int;
    v_flipped      boolean := false;
    v_verdict      jsonb := NULL;
    v_tick         int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL OR p_beat_index IS NULL THEN
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
        v_side := 'plaintiff'; v_opp_side := 'defendant';
    ELSIF v_trial.defendant_advocate_id = v_pol.id THEN
        v_side := 'defendant'; v_opp_side := 'plaintiff';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_trial');
    END IF;
    IF v_trial.current_turn <> v_side THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_turn');
    END IF;
    IF v_trial.messages_sent_this_turn >= 4 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'turn_message_cap');
    END IF;

    v_used := CASE WHEN v_side = 'plaintiff' THEN v_trial.plaintiff_objections_used
                                              ELSE v_trial.defendant_objections_used END;
    IF v_used >= 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'objection_cap_reached');
    END IF;

    -- Ammo: opp-supporting beat in caller's hand, unspent.
    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;
    v_beat_support := v_case.beats -> p_beat_index ->> 'support';
    IF v_beat_support IS DISTINCT FROM v_opp_side THEN
        RETURN jsonb_build_object('success', false, 'reason', 'beat_not_objection_material');
    END IF;
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

    -- Target: opp's most recently played, non-nullified beat.
    SELECT h.beat_index INTO v_target_idx
      FROM public.court_case_trial_hands h
      JOIN public.court_case_trial_messages m
        ON m.trial_id = h.trial_id
       AND m.side     = h.side
       AND m.beat_played_index = h.beat_index
     WHERE h.trial_id = p_trial_id
       AND h.side     = v_opp_side
       AND h.played_at_round IS NOT NULL
       AND h.nullified = false
     ORDER BY m.created_at DESC
     LIMIT 1;
    IF v_target_idx IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_objection_target');
    END IF;

    -- Consume ammo beat from hand.
    UPDATE public.court_case_trial_hands
       SET objected_at_round = v_trial.current_round
     WHERE trial_id = p_trial_id AND side = v_side AND beat_index = p_beat_index;

    -- Objection counter.
    IF v_side = 'plaintiff' THEN
        UPDATE public.court_case_trials
           SET plaintiff_objections_used = plaintiff_objections_used + 1
         WHERE id = p_trial_id;
    ELSE
        UPDATE public.court_case_trials
           SET defendant_objections_used = defendant_objections_used + 1
         WHERE id = p_trial_id;
    END IF;

    -- 1d10. 1-5 sustained: nullify target + opp -3. 6-10 overruled:
    -- target stays + objector -3. Either way ammo is gone.
    v_roll      := 1 + floor(random() * 10)::int;
    v_sustained := v_roll <= 5;

    IF v_sustained THEN
        v_judge_text := 'Objection sustained.';
        UPDATE public.court_case_trial_hands
           SET nullified = true
         WHERE trial_id = p_trial_id AND side = v_opp_side AND beat_index = v_target_idx;
        IF v_opp_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET plaintiff_objection_strength_delta =
                   plaintiff_objection_strength_delta - 3
             WHERE id = p_trial_id;
        ELSE
            UPDATE public.court_case_trials
               SET defendant_objection_strength_delta =
                   defendant_objection_strength_delta - 3
             WHERE id = p_trial_id;
        END IF;
    ELSE
        v_judge_text := 'Objection overruled.';
        IF v_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET plaintiff_objection_strength_delta =
                   plaintiff_objection_strength_delta - 3
             WHERE id = p_trial_id;
        ELSE
            UPDATE public.court_case_trials
               SET defendant_objection_strength_delta =
                   defendant_objection_strength_delta - 3
             WHERE id = p_trial_id;
        END IF;
    END IF;

    v_clean_text := btrim(COALESCE(p_text, ''));
    IF length(v_clean_text) = 0 THEN
        v_clean_text := 'Objection, your Honor.';
    END IF;
    IF length(v_clean_text) > 240 THEN
        v_clean_text := substring(v_clean_text from 1 for 240);
    END IF;

    -- Counsel's objection (consumes action slot) + judge ruling (free).
    v_next_seq := v_trial.messages_sent_this_turn + 1;
    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind,
        beat_played_index, objected_beat_index
    ) VALUES (
        p_trial_id, v_side, v_trial.current_round, v_next_seq,
        v_clean_text, 'objection',
        p_beat_index, v_target_idx
    );

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, 'system', v_trial.current_round, 0,
        v_judge_text, 'judge_ruling'
    );

    -- Turn-flip / verdict-trigger after action slot consumed.
    -- NOTE: this block is duplicated in call_witness_qa below and in
    -- send_trial_message (20270517). Pre-existing duplication, flagged
    -- in pre-commit audit; refactoring into a helper deferred to keep
    -- the regression-risk surface small for this migration.
    v_new_count := v_next_seq;
    IF v_new_count >= 4 THEN
        IF v_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET current_turn = 'defendant',
                   messages_sent_this_turn = 0
             WHERE id = p_trial_id;
            v_flipped := true;
        ELSE
            IF v_trial.current_round < 4 THEN
                UPDATE public.court_case_trials
                   SET current_turn  = 'plaintiff',
                       current_round = v_trial.current_round + 1,
                       messages_sent_this_turn = 0
                 WHERE id = p_trial_id;
                v_flipped := true;
            ELSE
                UPDATE public.court_case_trials
                   SET messages_sent_this_turn = 0
                 WHERE id = p_trial_id;
                SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
                v_verdict := public._apply_verdict(p_trial_id, COALESCE(v_tick, 0));
                v_flipped := true;
            END IF;
        END IF;
    ELSE
        UPDATE public.court_case_trials
           SET messages_sent_this_turn = v_new_count
         WHERE id = p_trial_id;
    END IF;

    RETURN jsonb_build_object(
        'success',              true,
        'side',                 v_side,
        'consumed_beat_index',  p_beat_index,
        'target_beat_index',    v_target_idx,
        'nullified_beat_index', CASE WHEN v_sustained THEN v_target_idx END,
        'roll',                 v_roll,
        'sustained',            v_sustained,
        'ruling_text',          v_judge_text,
        'objections_used',      v_used + 1,
        'objections_remaining', 3 - (v_used + 1),
        'flipped',              v_flipped,
        'verdict',              v_verdict
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.send_objection(uuid, uuid, int, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.send_objection(uuid, uuid, int, text) TO authenticated;

-- ── 5. call_witness_qa ─────────────────────────────────────────────
-- Pick a witness (0..2) + a phase (direct/cross) + a Q&A index. The
-- referenced Q&A's answer strength + supports go straight into the
-- verdict tally (via court_case_trial_witness_qa). Consumes one
-- action slot. Gated by requires_beat: if non-null, that beat must
-- already be PLAYED by either side (the in_evidence map exposed by
-- get_trial_state — see § 7).
CREATE OR REPLACE FUNCTION public.call_witness_qa(
    p_faction_id    uuid,
    p_trial_id      uuid,
    p_witness_idx   int,
    p_phase         text,
    p_qa_idx        int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_trial         court_case_trials%ROWTYPE;
    v_case          court_case_drafts%ROWTYPE;
    v_side          text;
    v_witness       jsonb;
    v_qa            jsonb;
    v_question      text;
    v_answer        text;
    v_supports      text;
    v_strength      int;
    v_req_beat      int;
    v_in_evidence   int;
    v_witness_name  text;
    v_next_seq      int;
    v_new_count     int;
    v_flipped       boolean := false;
    v_verdict       jsonb := NULL;
    v_tick          int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL OR p_witness_idx IS NULL
       OR p_phase IS NULL OR p_qa_idx IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;
    IF p_phase NOT IN ('direct', 'cross') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_phase');
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

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;
    v_witness := v_case.witnesses -> p_witness_idx;
    IF v_witness IS NULL OR jsonb_typeof(v_witness) <> 'object' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'witness_not_found');
    END IF;
    v_witness_name := COALESCE(NULLIF(btrim(v_witness ->> 'name'), ''), 'Witness');
    v_qa := v_witness -> p_phase -> p_qa_idx;
    IF v_qa IS NULL OR jsonb_typeof(v_qa) <> 'object' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'qa_not_found');
    END IF;

    PERFORM 1 FROM public.court_case_trial_witness_qa
     WHERE trial_id = p_trial_id
       AND witness_index = p_witness_idx
       AND phase = p_phase
       AND qa_index = p_qa_idx;
    IF FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'qa_already_asked');
    END IF;

    -- requires_beat: if set, that beat must already be played by some
    -- side (nullified or not). Ammo beats (objected, never played) do
    -- NOT satisfy this gate.
    v_req_beat := NULLIF(v_qa ->> 'requires_beat', '')::int;
    IF v_req_beat IS NOT NULL THEN
        SELECT 1 INTO v_in_evidence
          FROM public.court_case_trial_hands
         WHERE trial_id = p_trial_id
           AND beat_index = v_req_beat
           AND played_at_round IS NOT NULL
         LIMIT 1;
        IF v_in_evidence IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'requires_beat_not_in_evidence',
                'requires_beat', v_req_beat);
        END IF;
    END IF;

    v_question := COALESCE(v_qa ->> 'question', '');
    v_answer   := COALESCE(v_qa ->> 'answer', '');
    v_supports := COALESCE(v_qa ->> 'supports', '');
    v_strength := COALESCE(NULLIF(v_qa ->> 'strength', '')::int, 0);
    IF length(v_question) > 240 THEN v_question := substring(v_question from 1 for 240); END IF;
    IF length(v_answer)   > 240 THEN v_answer   := substring(v_answer   from 1 for 240); END IF;
    IF v_supports NOT IN ('plaintiff','defendant') OR v_strength <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'qa_data_invalid');
    END IF;

    INSERT INTO public.court_case_trial_witness_qa (
        trial_id, witness_index, phase, qa_index,
        asked_at_round, asked_by_side, strength, supports
    ) VALUES (
        p_trial_id, p_witness_idx, p_phase, p_qa_idx,
        v_trial.current_round, v_side, v_strength, v_supports
    );

    -- Counsel's Q — consumes the action slot.
    v_next_seq := v_trial.messages_sent_this_turn + 1;
    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, v_side, v_trial.current_round, v_next_seq,
        'Q: ' || v_question, 'witness_q'
    );

    -- Witness's A — system message, doesn't consume a slot.
    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, 'system', v_trial.current_round, 0,
        v_witness_name || ': ' || v_answer, 'witness_a'
    );

    -- Turn-flip / verdict-trigger — see note in send_objection.
    v_new_count := v_next_seq;
    IF v_new_count >= 4 THEN
        IF v_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET current_turn = 'defendant',
                   messages_sent_this_turn = 0
             WHERE id = p_trial_id;
            v_flipped := true;
        ELSE
            IF v_trial.current_round < 4 THEN
                UPDATE public.court_case_trials
                   SET current_turn  = 'plaintiff',
                       current_round = v_trial.current_round + 1,
                       messages_sent_this_turn = 0
                 WHERE id = p_trial_id;
                v_flipped := true;
            ELSE
                UPDATE public.court_case_trials
                   SET messages_sent_this_turn = 0
                 WHERE id = p_trial_id;
                SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
                v_verdict := public._apply_verdict(p_trial_id, COALESCE(v_tick, 0));
                v_flipped := true;
            END IF;
        END IF;
    ELSE
        UPDATE public.court_case_trials
           SET messages_sent_this_turn = v_new_count
         WHERE id = p_trial_id;
    END IF;

    RETURN jsonb_build_object(
        'success',       true,
        'side',          v_side,
        'witness_index', p_witness_idx,
        'phase',         p_phase,
        'qa_index',      p_qa_idx,
        'supports',      v_supports,
        'flipped',       v_flipped,
        'verdict',       v_verdict
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.call_witness_qa(uuid, uuid, int, text, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.call_witness_qa(uuid, uuid, int, text, int) TO authenticated;

-- ── 6. _apply_verdict — fold witness QA + objection deltas ─────────
-- Tally = played-beat strengths (nullified rows excluded — the
-- sustained-objection path sets nullified = true on the target) +
-- witness QA strengths (this migration) + per-side objection
-- strength deltas (this migration).
CREATE OR REPLACE FUNCTION public._apply_verdict(p_trial_id uuid, p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_trial      court_case_trials%ROWTYPE;
    v_case       court_case_drafts%ROWTYPE;
    v_p_sum      int := 0;
    v_d_sum      int := 0;
    v_p_wit      int := 0;
    v_d_wit      int := 0;
    v_p_obj      int := 0;
    v_d_obj      int := 0;
    v_p_total    int;
    v_d_total    int;
    v_winner     text;
    v_offerer    text;
    v_p_delta    numeric := 0;
    v_d_delta    numeric := 0;
    v_base       numeric;
BEGIN
    SELECT * INTO v_trial FROM public.court_case_trials WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'in_progress' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved');
    END IF;

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;

    -- Played beats, excluding sustained-objection nullifications.
    SELECT
        COALESCE(sum(CASE WHEN h.side = 'plaintiff'
                            THEN COALESCE((v_case.beats -> h.beat_index ->> 'strength')::int, 0)
                          ELSE 0 END), 0),
        COALESCE(sum(CASE WHEN h.side = 'defendant'
                            THEN COALESCE((v_case.beats -> h.beat_index ->> 'strength')::int, 0)
                          ELSE 0 END), 0)
      INTO v_p_sum, v_d_sum
      FROM public.court_case_trial_hands h
     WHERE h.trial_id = p_trial_id
       AND h.played_at_round IS NOT NULL
       AND h.nullified = false;

    -- Witness QA contributions.
    SELECT
        COALESCE(sum(CASE WHEN supports = 'plaintiff' THEN strength ELSE 0 END), 0),
        COALESCE(sum(CASE WHEN supports = 'defendant' THEN strength ELSE 0 END), 0)
      INTO v_p_wit, v_d_wit
      FROM public.court_case_trial_witness_qa
     WHERE trial_id = p_trial_id;

    v_p_obj := v_trial.plaintiff_objection_strength_delta;
    v_d_obj := v_trial.defendant_objection_strength_delta;

    v_p_total := v_p_sum + v_p_wit + v_p_obj;
    v_d_total := v_d_sum + v_d_wit + v_d_obj;

    IF v_p_total > v_d_total THEN
        v_winner := 'plaintiff';
    ELSE
        v_winner := 'defendant';
    END IF;

    v_offerer := v_trial.settle_offered_by_side;
    IF v_offerer IS NOT NULL AND v_trial.settle_resolved = 'declined' THEN
        IF v_offerer = v_winner THEN
            IF v_winner = 'plaintiff' THEN v_p_delta := -1; ELSE v_d_delta := -1; END IF;
        ELSE
            IF v_offerer = 'plaintiff' THEN
                v_p_delta := -3; v_d_delta := 5;
            ELSE
                v_d_delta := -3; v_p_delta := 5;
            END IF;
        END IF;
    ELSE
        v_base := round(
            (CASE WHEN v_winner = 'plaintiff' THEN v_d_total ELSE v_p_total END)::numeric / 10.0,
            1);
        -- Floor at 0: over-objected loser can land negative; winner
        -- doesn't lose Rep on a verdict they won.
        v_base := GREATEST(v_base, 0);
        IF v_winner = 'plaintiff' THEN v_p_delta := v_base; ELSE v_d_delta := v_base; END IF;
    END IF;

    IF v_trial.plaintiff_advocate_id IS NOT NULL THEN
        UPDATE public.factions
           SET politician_reputation = GREATEST(0,
               COALESCE(politician_reputation, 0) + ROUND(v_p_delta)::int)
         WHERE id = v_trial.plaintiff_advocate_id;
    END IF;
    IF v_trial.defendant_advocate_id IS NOT NULL THEN
        UPDATE public.factions
           SET politician_reputation = GREATEST(0,
               COALESCE(politician_reputation, 0) + ROUND(v_d_delta)::int)
         WHERE id = v_trial.defendant_advocate_id;
    END IF;

    UPDATE public.court_case_trials
       SET status          = 'resolved',
           verdict_winner  = v_winner,
           verdict_at_tick = p_tick
     WHERE id = p_trial_id;

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, 'system', v_trial.current_round, 0,
        'Verdict: judgment for the ' || v_winner ||
            '. (plaintiff ' || v_p_total ||
            ' vs defendant ' || v_d_total || ')',
        'verdict'
    );

    RETURN jsonb_build_object(
        'success',                  true,
        'winner',                   v_winner,
        'plaintiff_strength',       v_p_total,
        'defendant_strength',       v_d_total,
        'plaintiff_beat_sum',       v_p_sum,
        'defendant_beat_sum',       v_d_sum,
        'plaintiff_witness_sum',    v_p_wit,
        'defendant_witness_sum',    v_d_wit,
        'plaintiff_objection_delta', v_p_obj,
        'defendant_objection_delta', v_d_obj,
        'plaintiff_rep_delta',      v_p_delta,
        'defendant_rep_delta',      v_d_delta
    );
END $$;

-- ── 7. get_trial_state — witnesses + case_beats + in_evidence ──────
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
    v_case_beats jsonb;
    v_messages  jsonb;
    v_witnesses jsonb;
    v_asked_qa  jsonb;
    v_evidence  jsonb;
    v_obj_used  int;
    v_set_used  boolean;
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
            'status', v_trial.status, 'verdict_winner', v_trial.verdict_winner);
    END IF;

    IF v_trial.plaintiff_advocate_id = v_pol.id THEN
        v_side := 'plaintiff'; v_opp_id := v_trial.defendant_advocate_id;
        v_obj_used := v_trial.plaintiff_objections_used;
        v_set_used := v_trial.plaintiff_settle_used;
    ELSIF v_trial.defendant_advocate_id = v_pol.id THEN
        v_side := 'defendant'; v_opp_id := v_trial.plaintiff_advocate_id;
        v_obj_used := v_trial.defendant_objections_used;
        v_set_used := v_trial.defendant_settle_used;
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_trial');
    END IF;

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;
    IF v_case.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_found');
    END IF;

    IF v_opp_id IS NOT NULL THEN
        SELECT btrim(COALESCE(leader_first_name, '') || ' ' || COALESCE(leader_last_name, ''))
          INTO v_opp_name FROM public.factions WHERE id = v_opp_id;
    END IF;

    -- Own hand: full per-beat info (name, type, description, support)
    -- + per-row state (played/objected/nullified). Strength withheld.
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'beat_index',        h.beat_index,
        'name',              v_case.beats -> h.beat_index ->> 'name',
        'type',              v_case.beats -> h.beat_index ->> 'type',
        'description',       v_case.beats -> h.beat_index ->> 'description',
        'support',           v_case.beats -> h.beat_index ->> 'support',
        'played_at_round',   h.played_at_round,
        'objected_at_round', h.objected_at_round,
        'nullified',         h.nullified
    ) ORDER BY h.beat_index), '[]'::jsonb)
      INTO v_hand
      FROM public.court_case_trial_hands h
     WHERE h.trial_id = p_trial_id AND h.side = v_side;

    -- All 10 case beats: name + type only. Witness-Q picker uses
    -- this to label requires_beat references. Description, strength,
    -- support are withheld for beats not in the caller's hand.
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'beat_index', (ord - 1)::int,
        'name',       b ->> 'name',
        'type',       b ->> 'type'
    ) ORDER BY ord), '[]'::jsonb)
      INTO v_case_beats
      FROM jsonb_array_elements(COALESCE(v_case.beats, '[]'::jsonb))
          WITH ORDINALITY arr_b(b, ord);

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
        'settle_decision',   m.settle_decision,
        'created_at',        m.created_at
    ) ORDER BY m.created_at ASC), '[]'::jsonb)
      INTO v_messages
      FROM public.court_case_trial_messages m
     WHERE m.trial_id = p_trial_id;

    -- Witnesses: name + description + Q&A texts. Strength + supports
    -- hidden per Q&A (revealed when the Q&A is called via asked_witness_qa).
    SELECT COALESCE(jsonb_agg(witness_obj ORDER BY w_idx), '[]'::jsonb)
      INTO v_witnesses
      FROM (
        SELECT
            (ord_w - 1)::int AS w_idx,
            jsonb_build_object(
                'witness_index', (ord_w - 1)::int,
                'name',          w ->> 'name',
                'description',   w ->> 'description',
                'direct', (
                    SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'qa_index',      (ord_q - 1)::int,
                        'question',      q ->> 'question',
                        'requires_beat', NULLIF(q ->> 'requires_beat', '')::int
                    ) ORDER BY ord_q), '[]'::jsonb)
                    FROM jsonb_array_elements(COALESCE(w -> 'direct', '[]'::jsonb))
                        WITH ORDINALITY arr_q(q, ord_q)
                ),
                'cross', (
                    SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'qa_index',      (ord_q - 1)::int,
                        'question',      q ->> 'question',
                        'requires_beat', NULLIF(q ->> 'requires_beat', '')::int
                    ) ORDER BY ord_q), '[]'::jsonb)
                    FROM jsonb_array_elements(COALESCE(w -> 'cross', '[]'::jsonb))
                        WITH ORDINALITY arr_q(q, ord_q)
                )
            ) AS witness_obj
        FROM jsonb_array_elements(COALESCE(v_case.witnesses, '[]'::jsonb))
            WITH ORDINALITY arr_w(w, ord_w)
      ) sub;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'witness_index',  q.witness_index,
        'phase',          q.phase,
        'qa_index',       q.qa_index,
        'asked_by_side',  q.asked_by_side,
        'asked_at_round', q.asked_at_round,
        'supports',       q.supports,
        'strength',       q.strength
    )), '[]'::jsonb)
      INTO v_asked_qa
      FROM public.court_case_trial_witness_qa q
     WHERE q.trial_id = p_trial_id;

    -- In-evidence: beats PLAYED by either side (nullified or not).
    -- Ammo beats (objected_at_round only) are consumed, not in evidence.
    SELECT COALESCE(jsonb_agg(h.beat_index ORDER BY h.beat_index), '[]'::jsonb)
      INTO v_evidence
      FROM public.court_case_trial_hands h
     WHERE h.trial_id = p_trial_id
       AND h.played_at_round IS NOT NULL;

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
        'objections_used',         v_obj_used,
        'objections_remaining',    3 - v_obj_used,
        'settle_used',             v_set_used,
        'settle_offered_by_side',  v_trial.settle_offered_by_side,
        'settle_resolved',         v_trial.settle_resolved,
        'hand',                    v_hand,
        'case_beats',              v_case_beats,
        'messages',                v_messages,
        'witnesses',               v_witnesses,
        'asked_witness_qa',        v_asked_qa,
        'in_evidence_beats',       v_evidence
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.get_trial_state(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_trial_state(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
