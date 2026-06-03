-- ════════════════════════════════════════════════════════════════════
-- 20270541 — list_resolved_cases_for_nation
--
-- Read RPC for the politician-nation.html Legal Cases panel. Returns
-- all trials with status='resolved' (verdict rendered) in the given
-- nation, with everything the panel needs to render in one round-trip:
--
--   plaintiff_name + defendant_name   — entity names already on the trial
--   case_type + litigation_type       — from court_case_drafts
--   overview                          — case description from the draft
--   plaintiff_attorney + defendant_attorney — leader names of the
--                                            advocate factions
--   winner                            — verdict_winner ('plaintiff' /
--                                       'defendant')
--   year_started                      — in-game year case began. Per
--                                       how-to.html "every tick = one
--                                       in-game month", so derived
--                                       from shard.current_date minus
--                                       (current_tick - case_started_tick)
--                                       months.
--   verdict_at_tick                   — orderable timestamp on the
--                                       trial
--
-- Filtered to status='resolved' only — settled cases (status='settled')
-- don't have a "winning side" in the verdict sense and surface
-- through the event_log dispatch instead. Sorted newest-first, capped
-- at 50 to keep the payload bounded.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.list_resolved_cases_for_nation(p_nation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick   int;
    v_date   date;
    v_cases  jsonb;
BEGIN
    IF p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT current_tick, current_date INTO v_tick, v_date
      FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'trial_id',           t.id,
            'plaintiff_name',     t.plaintiff_name,
            'defendant_name',     t.defendant_name,
            'case_type',          d.case_type,
            'litigation_type',    d.litigation_type,
            'overview',           d.overview,
            'plaintiff_attorney', NULLIF(btrim(COALESCE(pa.leader_first_name, '') || ' ' || COALESCE(pa.leader_last_name, '')), ''),
            'defendant_attorney', NULLIF(btrim(COALESCE(da.leader_first_name, '') || ' ' || COALESCE(da.leader_last_name, '')), ''),
            'winner',             t.verdict_winner,
            'year_started',       CASE
                WHEN v_date IS NOT NULL THEN
                    EXTRACT(YEAR FROM (v_date
                        - ((v_tick - COALESCE(t.pre_trial_started_at_tick, t.matched_at_tick, v_tick))
                           * INTERVAL '1 month')))::int
                ELSE NULL
            END,
            'verdict_at_tick',    t.verdict_at_tick
        ) ORDER BY t.verdict_at_tick DESC
    ), '[]'::jsonb) INTO v_cases
    FROM public.court_case_trials t
    JOIN public.court_case_drafts d ON d.id = t.case_draft_id
    LEFT JOIN public.factions pa ON pa.id = t.plaintiff_advocate_id
    LEFT JOIN public.factions da ON da.id = t.defendant_advocate_id
    WHERE t.nation_id = p_nation_id
      AND t.status    = 'resolved'
    LIMIT 50;

    RETURN jsonb_build_object('success', true, 'cases', v_cases);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_resolved_cases_for_nation(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_resolved_cases_for_nation(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
