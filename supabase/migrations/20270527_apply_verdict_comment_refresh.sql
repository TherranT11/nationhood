-- ════════════════════════════════════════════════════════════════════
-- 20270527 — _apply_verdict comment-only refresh
--
-- Cosmetic. 20270524's _apply_verdict body carried a comment that
-- claimed "nullified guard is for pre-20270524 trials in flight —
-- new objections no longer set nullified". 20270525 then restored
-- the reactive nullify on sustained objections, so the carve-out
-- is actively used by every sustained roll, not a legacy guard.
--
-- This migration re-issues the function with the same body but
-- corrected commentary. No behavioural change — function output is
-- byte-identical to 20270524's deployed version. Future readers of
-- \df+ _apply_verdict see the current truth.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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

    -- Beats: played, non-nullified. The nullified carve-out strips
    -- any beat that a sustained objection nullified (20270525
    -- restored that path on top of 20270524's dice roll).
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

    -- Witness QA: each answered Q&A adds its strength to its supports side.
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

    -- Tie → defendant (status quo).
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

NOTIFY pgrst, 'reload schema';

COMMIT;
