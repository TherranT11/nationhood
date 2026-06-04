-- ════════════════════════════════════════════════════════════════════
-- 20270578 — list_appealable_cases: explicit jsonb_build_object
--
-- Prod surfaced "function row_to_jsonb(record) does not exist" when
-- the FILE AN APPEAL modal called list_appealable_cases. The
-- 20270560 body used row_to_jsonb(c) over a UNION ALL subquery
-- aliased `c` — anonymous-record types don't satisfy the row_to_jsonb
-- overloads. Same bug pattern as 20270564 → 20270568 fixed for
-- list_corp_history.
--
-- Fix: project each row with explicit jsonb_build_object, dropping
-- row_to_jsonb entirely. Function shape + output keys unchanged so
-- the appeal modal client (politician-home.html) keeps working
-- without an edit.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.list_appealable_cases(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_tick    int;
    v_can_sc  boolean;
    v_cases   jsonb;
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
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;
    IF v_pol.politician_magistrate_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'cases', '[]'::jsonb);
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    v_can_sc := v_pol.politician_experienced_advocate_at_tick IS NOT NULL
             OR v_pol.politician_state_prosecutor_at_tick    IS NOT NULL;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'appeal_kind',       c.appeal_kind,
        'original_trial_id', c.original_trial_id,
        'plaintiff_name',    c.plaintiff_name,
        'defendant_name',    c.defendant_name,
        'case_type',         c.case_type,
        'litigation_type',   c.litigation_type,
        'winner',            c.winner,
        'ticks_remaining',   c.ticks_remaining,
        'verdict_at_tick',   c.verdict_at_tick
    ) ORDER BY c.verdict_at_tick DESC), '[]'::jsonb)
      INTO v_cases
      FROM (
        -- (a) Regular appealable verdicts.
        SELECT
            'verdict'::text   AS appeal_kind,
            t.id              AS original_trial_id,
            t.plaintiff_name,
            t.defendant_name,
            d.case_type,
            d.litigation_type,
            t.verdict_winner  AS winner,
            12 - (v_tick - t.verdict_at_tick) AS ticks_remaining,
            t.verdict_at_tick
          FROM public.court_case_trials t
          JOIN public.court_case_drafts d ON d.id = t.case_draft_id
         WHERE t.nation_id           = v_pol.bar_admitted_nation_id
           AND t.status              = 'resolved'
           AND t.appeal_of_trial_id IS NULL
           AND t.verdict_at_tick    IS NOT NULL
           AND (v_tick - t.verdict_at_tick) <= 12
           AND NOT EXISTS (
               SELECT 1 FROM public.court_case_trials a
                WHERE a.appeal_of_trial_id = t.id
                  AND a.status IN ('pre_trial', 'settlement_conference', 'in_progress')
           )

        UNION ALL

        -- (b) SC-appealable appeals. Only when caller can file SC.
        SELECT
            'appeal'::text     AS appeal_kind,
            t.id               AS original_trial_id,
            t.plaintiff_name,
            t.defendant_name,
            d.case_type,
            d.litigation_type,
            t.verdict_winner   AS winner,
            12 - (v_tick - t.verdict_at_tick) AS ticks_remaining,
            t.verdict_at_tick
          FROM public.court_case_trials t
          JOIN public.court_case_drafts d ON d.id = t.case_draft_id
          JOIN public.court_case_trials parent ON parent.id = t.appeal_of_trial_id
         WHERE v_can_sc
           AND t.nation_id           = v_pol.bar_admitted_nation_id
           AND t.status              = 'resolved'
           AND t.appeal_of_trial_id IS NOT NULL
           AND parent.appeal_of_trial_id IS NULL
           AND t.verdict_at_tick    IS NOT NULL
           AND (v_tick - t.verdict_at_tick) <= 12
           AND NOT EXISTS (
               SELECT 1 FROM public.court_case_trials sc
                WHERE sc.appeal_of_trial_id = t.id
                  AND sc.status IN ('pre_trial', 'settlement_conference', 'in_progress')
           )
      ) c;

    RETURN jsonb_build_object('success', true, 'cases', v_cases);
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
