-- ════════════════════════════════════════════════════════════════════
-- 20270704 — Appellate-aware judge routing + appellate reversal cost
--
-- Closes the two gaps the user flagged on the appellate justice role
-- (20270701 shipped the promotion path; the activity stayed wired to
-- v1's "any magistrate" routing per 20270543:23):
--
-- 1. Appeal trials route to Appellate Justices specifically, not
--    "any magistrate with the fewest active trials". Falls back to
--    a regular magistrate if no appellate justice exists in the
--    nation (graceful degradation — the appeal still resolves).
--    The judge from the appealed-from trial is excluded from the
--    candidate pool: a Magistrate must never review their own work.
--    Both rules apply on first assignment AND on the 5-tick
--    inactivity reassignment (same helper, same filter).
--
-- 2. Appellate reversals cost -5 Reputation instead of the regular
--    -3. Margin-discretion reversal at the lower-court level is
--    a judicial value call; at the appellate level it's overturning
--    a prior court — heavier political act, heavier cost. Branch on
--    appeal_of_trial_id IS NOT NULL inside judge_reverse_verdict.
--
-- Both behaviour changes mean re-emitting the existing functions:
--   • _assign_magistrate_to_trial (20270536:101)
--   • judge_reverse_verdict        (20270700:215)
--
-- judge_reverse_verdict is the long one — 150+ lines, only the rep-
-- cost line changes. Re-emit the whole body to keep the source as
-- the SoT (PG can't add statements to an existing function; CREATE
-- OR REPLACE is the standard pattern in this codebase for surgical
-- edits inside PL/pgSQL).
--
-- No schema changes — both functions already read appeal_of_trial_id
-- (added in 20270543).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 0. judge_verdict_preview — expose is_appeal in the response ────
-- The close-margin UI calls preview before showing CONFIRM / REVERSE
-- buttons. Adding is_appeal here lets the client render the right
-- REVERSE button title (-5 Rep for appeals vs. -3 for lower-court)
-- and the right confirm-dialog copy without re-emitting the much
-- larger get_trial_state function just to surface appeal_of_trial_id.
-- Same gates + math as 20270700; only the response payload widens.
CREATE OR REPLACE FUNCTION public.judge_verdict_preview(
    p_faction_id uuid,
    p_trial_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_trial     RECORD;
    v_case_type text;
    v_beats     jsonb;
    v_p_total   numeric := 0;
    v_d_total   numeric := 0;
    v_winner    text;
    v_higher    numeric;
    v_lower     numeric;
    v_margin    numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT t.*, d.case_type
      INTO v_trial
      FROM public.court_case_trials t
      JOIN public.court_case_drafts d ON d.id = t.case_draft_id
     WHERE t.id = p_trial_id;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;

    v_case_type := v_trial.case_type;
    IF v_case_type = 'criminal' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'jury_decides_criminal');
    END IF;

    IF v_trial.judge_faction_id IS NULL
       OR v_trial.judge_faction_id <> p_faction_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_judge');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.factions
         WHERE id = p_faction_id
           AND (id = v_uid OR linked_user_id = v_uid)
           AND faction_type = 'politician'
           AND abandoned_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    IF NOT v_trial.awaiting_verdict THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_awaiting_verdict');
    END IF;

    SELECT beats INTO v_beats
      FROM public.court_case_drafts
     WHERE id = v_trial.case_draft_id;

    SELECT COALESCE(SUM(CASE WHEN h.side = 'plaintiff'
                              THEN COALESCE((v_beats -> h.beat_index ->> 'strength')::int, 0)
                            ELSE 0 END), 0),
           COALESCE(SUM(CASE WHEN h.side = 'defendant'
                              THEN COALESCE((v_beats -> h.beat_index ->> 'strength')::int, 0)
                            ELSE 0 END), 0)
      INTO v_p_total, v_d_total
      FROM public.court_case_trial_hands h
     WHERE h.trial_id = p_trial_id
       AND h.played_at_round IS NOT NULL
       AND COALESCE(h.nullified, false) = false;

    v_p_total := v_p_total + COALESCE((
        SELECT SUM(strength) FROM public.court_case_trial_witness_qa
         WHERE trial_id = p_trial_id AND supports = 'plaintiff'
    ), 0);
    v_d_total := v_d_total + COALESCE((
        SELECT SUM(strength) FROM public.court_case_trial_witness_qa
         WHERE trial_id = p_trial_id AND supports = 'defendant'
    ), 0);

    v_p_total := v_p_total + COALESCE(v_trial.plaintiff_objection_strength_delta, 0);
    v_d_total := v_d_total + COALESCE(v_trial.defendant_objection_strength_delta, 0);

    IF v_p_total > v_d_total THEN
        v_winner := 'plaintiff';
        v_higher := v_p_total;
        v_lower  := v_d_total;
    ELSE
        v_winner := 'defendant';
        v_higher := v_d_total;
        v_lower  := v_p_total;
    END IF;

    IF v_higher <= 0 THEN
        v_margin := 1.0;
    ELSE
        v_margin := (v_higher - v_lower) / v_higher;
    END IF;

    RETURN jsonb_build_object(
        'success',         true,
        'plaintiff_total', v_p_total,
        'defendant_total', v_d_total,
        'math_winner',     v_winner,
        'margin_pct',      round(v_margin * 100, 1),
        'is_close',        v_margin < 0.30,
        'is_appeal',       v_trial.appeal_of_trial_id IS NOT NULL
    );
END $$;


-- ── 1. _assign_magistrate_to_trial — appellate-aware routing ───────
CREATE OR REPLACE FUNCTION public._assign_magistrate_to_trial(
    p_trial_id            uuid,
    p_exclude_faction_id  uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_trial          court_case_trials%ROWTYPE;
    v_orig_judge_id  uuid;
    v_tick           int;
    v_chosen_id      uuid;
    v_is_appeal      boolean;
BEGIN
    SELECT * INTO v_trial FROM public.court_case_trials WHERE id = p_trial_id;
    IF v_trial.id IS NULL THEN RETURN NULL; END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_is_appeal := v_trial.appeal_of_trial_id IS NOT NULL;

    -- For appeals, fetch the original judge so we can exclude them
    -- below (no magistrate should review their own work).
    IF v_is_appeal THEN
        SELECT judge_faction_id INTO v_orig_judge_id
          FROM public.court_case_trials
         WHERE id = v_trial.appeal_of_trial_id;
    END IF;

    -- Appeal trials — try appellate justices first. Same load-balance
    -- (fewest active trials, random tiebreak) and the same conflict-
    -- of-interest filters (counsel excluded, current-judge excluded
    -- on reassignment), PLUS the original judge from the appealed-
    -- from trial.
    IF v_is_appeal THEN
        SELECT m.id INTO v_chosen_id
          FROM public.factions m
          LEFT JOIN public.court_case_trials t
            ON t.judge_faction_id = m.id
           AND t.status IN ('in_progress', 'settlement_conference')
           AND t.id <> p_trial_id
         WHERE m.politician_appellate_justice_at_tick IS NOT NULL
           AND m.abandoned_at IS NULL
           AND m.faction_type = 'politician'
           AND m.nation_id = v_trial.nation_id
           AND m.id IS DISTINCT FROM p_exclude_faction_id
           AND m.id IS DISTINCT FROM v_trial.plaintiff_advocate_id
           AND m.id IS DISTINCT FROM v_trial.defendant_advocate_id
           AND m.id IS DISTINCT FROM v_orig_judge_id
         GROUP BY m.id
         ORDER BY COUNT(t.id) ASC, random() ASC
         LIMIT 1;
    END IF;

    -- Fallback: no appellate justice available (or this is a regular
    -- trial). Pick from the general magistrate pool. The original-
    -- judge exclusion still applies for appeals — graceful degradation
    -- doesn't mean letting a magistrate review their own ruling.
    IF v_chosen_id IS NULL THEN
        SELECT m.id INTO v_chosen_id
          FROM public.factions m
          LEFT JOIN public.court_case_trials t
            ON t.judge_faction_id = m.id
           AND t.status IN ('in_progress', 'settlement_conference')
           AND t.id <> p_trial_id
         WHERE m.politician_magistrate_at_tick IS NOT NULL
           AND m.abandoned_at IS NULL
           AND m.faction_type = 'politician'
           AND m.nation_id = v_trial.nation_id
           AND m.id IS DISTINCT FROM p_exclude_faction_id
           AND m.id IS DISTINCT FROM v_trial.plaintiff_advocate_id
           AND m.id IS DISTINCT FROM v_trial.defendant_advocate_id
           AND (NOT v_is_appeal OR m.id IS DISTINCT FROM v_orig_judge_id)
         GROUP BY m.id
         ORDER BY COUNT(t.id) ASC, random() ASC
         LIMIT 1;
    END IF;

    UPDATE public.court_case_trials
       SET judge_faction_id          = v_chosen_id,
           judge_assigned_at_tick    = COALESCE(v_tick, 0),
           judge_last_action_at_tick = COALESCE(v_tick, 0)
     WHERE id = p_trial_id;

    RETURN v_chosen_id;
END $$;


-- ── 2. judge_reverse_verdict — appellate reversal costs -5 Rep ─────
-- Identical to the 20270700 body except the judge's rep cost branches
-- on appeal_of_trial_id: -3 for a lower-court reversal, -5 for an
-- appellate reversal (overturning a prior court — heavier political
-- act, heavier cost). Returned 'judge_rep_cost' also reflects the
-- actual cost so the client can show the right number.
CREATE OR REPLACE FUNCTION public.judge_reverse_verdict(
    p_faction_id uuid,
    p_trial_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_trial        RECORD;
    v_case_type    text;
    v_beats        jsonb;
    v_tick         int;
    v_p_total      numeric := 0;
    v_d_total      numeric := 0;
    v_math_winner  text;
    v_reversed     text;
    v_higher       numeric;
    v_lower        numeric;
    v_margin       numeric;
    v_rep_award    numeric;
    v_winner_pol   uuid;
    v_judge_nm     text;
    v_is_appeal    boolean;
    v_judge_cost   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT t.*, d.case_type
      INTO v_trial
      FROM public.court_case_trials t
      JOIN public.court_case_drafts d ON d.id = t.case_draft_id
     WHERE t.id = p_trial_id
       FOR UPDATE OF t;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;

    v_case_type := v_trial.case_type;
    IF v_case_type = 'criminal' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'jury_decides_criminal');
    END IF;

    IF v_trial.judge_faction_id IS NULL
       OR v_trial.judge_faction_id <> p_faction_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_judge');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.factions
         WHERE id = p_faction_id
           AND (id = v_uid OR linked_user_id = v_uid)
           AND faction_type = 'politician'
           AND abandoned_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    IF NOT v_trial.awaiting_verdict THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_awaiting_verdict');
    END IF;

    IF v_trial.status = 'resolved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved');
    END IF;

    -- Beat strength from court_case_drafts.beats JSONB (canonical
    -- pattern, 20270583:159).
    SELECT beats INTO v_beats
      FROM public.court_case_drafts
     WHERE id = v_trial.case_draft_id;

    SELECT COALESCE(SUM(CASE WHEN h.side = 'plaintiff'
                              THEN COALESCE((v_beats -> h.beat_index ->> 'strength')::int, 0)
                            ELSE 0 END), 0),
           COALESCE(SUM(CASE WHEN h.side = 'defendant'
                              THEN COALESCE((v_beats -> h.beat_index ->> 'strength')::int, 0)
                            ELSE 0 END), 0)
      INTO v_p_total, v_d_total
      FROM public.court_case_trial_hands h
     WHERE h.trial_id = p_trial_id
       AND h.played_at_round IS NOT NULL
       AND COALESCE(h.nullified, false) = false;

    v_p_total := v_p_total + COALESCE((
        SELECT SUM(strength) FROM public.court_case_trial_witness_qa
         WHERE trial_id = p_trial_id AND supports = 'plaintiff'
    ), 0);
    v_d_total := v_d_total + COALESCE((
        SELECT SUM(strength) FROM public.court_case_trial_witness_qa
         WHERE trial_id = p_trial_id AND supports = 'defendant'
    ), 0);

    v_p_total := v_p_total + COALESCE(v_trial.plaintiff_objection_strength_delta, 0);
    v_d_total := v_d_total + COALESCE(v_trial.defendant_objection_strength_delta, 0);

    IF v_p_total > v_d_total THEN
        v_math_winner := 'plaintiff'; v_reversed := 'defendant';
        v_higher := v_p_total; v_lower := v_d_total;
    ELSE
        v_math_winner := 'defendant'; v_reversed := 'plaintiff';
        v_higher := v_d_total; v_lower := v_p_total;
    END IF;

    IF v_higher <= 0 THEN
        v_margin := 1.0;
    ELSE
        v_margin := (v_higher - v_lower) / v_higher;
    END IF;

    IF v_margin >= 0.30 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'margin_too_wide',
            'margin_pct', round(v_margin * 100, 1));
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- 20270704: appellate reversal costs more.
    v_is_appeal  := v_trial.appeal_of_trial_id IS NOT NULL;
    v_judge_cost := CASE WHEN v_is_appeal THEN 5 ELSE 3 END;

    v_rep_award := GREATEST(0, round(v_higher / 10.0, 1));

    IF v_reversed = 'plaintiff' THEN
        v_winner_pol := v_trial.plaintiff_advocate_id;
    ELSE
        v_winner_pol := v_trial.defendant_advocate_id;
    END IF;

    IF v_winner_pol IS NOT NULL THEN
        UPDATE public.factions
           SET politician_reputation = GREATEST(0,
                   COALESCE(politician_reputation, 0) + ROUND(v_rep_award)::int),
               politician_influence  = COALESCE(politician_influence, 0) + 1
         WHERE id = v_winner_pol;
    END IF;

    UPDATE public.factions
       SET politician_reputation = GREATEST(0,
               COALESCE(politician_reputation, 0) - v_judge_cost)
     WHERE id = v_trial.judge_faction_id;

    UPDATE public.court_case_trials
       SET status              = 'resolved',
           verdict_winner      = v_reversed,
           verdict_at_tick     = v_tick,
           awaiting_verdict    = false,
           is_appeal_eligible  = true,
           judge_last_action_at_tick = v_tick
     WHERE id = p_trial_id;

    SELECT leader_first_name || ' ' || leader_last_name
      INTO v_judge_nm
      FROM public.factions
     WHERE id = v_trial.judge_faction_id;

    INSERT INTO public.court_case_trial_messages
        (trial_id, side, round, turn_seq, text, kind)
    VALUES (
        p_trial_id, 'judge', COALESCE(v_trial.current_round, 4), 0,
        CASE WHEN v_is_appeal
             THEN 'Judgment is rendered for the ' || v_reversed ||
                  '. The lower court is overturned.'
             ELSE 'Judgment is rendered for the ' || v_reversed ||
                  '. The court has departed from the weight of the evidence; this verdict is eligible for appeal.'
        END,
        'verdict'
    );

    INSERT INTO public.event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_trial.nation_id, v_trial.judge_faction_id,
        CASE WHEN v_is_appeal THEN 'Appellate Reversal'
                              ELSE 'Judicial Reversal' END,
        'The Hon. ' || COALESCE(NULLIF(btrim(v_judge_nm), ''), 'Magistrate')
            || CASE WHEN v_is_appeal
                    THEN ' has overturned the lower court, rendering judgment for the '
                    ELSE ' has rendered judgment for the ' END
            || v_reversed
            || CASE WHEN v_is_appeal
                    THEN ' on appeal.'
                    ELSE ', reversing the weight of the evidence on a close case. The verdict is eligible for appeal.' END,
        'politician',
        CASE WHEN v_is_appeal THEN 'judge_appellate_reversal'
                              ELSE 'judge_verdict_reversed' END,
        v_tick
    );

    RETURN jsonb_build_object(
        'success',         true,
        'verdict_winner',  v_reversed,
        'math_winner',     v_math_winner,
        'margin_pct',      round(v_margin * 100, 1),
        'rep_award',       v_rep_award,
        'judge_rep_cost',  v_judge_cost,
        'is_appeal',       v_is_appeal
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
