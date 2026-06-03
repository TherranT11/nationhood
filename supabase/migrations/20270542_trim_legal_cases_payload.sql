-- ════════════════════════════════════════════════════════════════════
-- 20270542 — Trim list_resolved_cases_for_nation payload
--
-- Pre-commit audit on 20270541 flagged two dead fields in the
-- response payload:
--
--   trial_id        — speculatively included for a hypothetical
--                     "view trial" deep-link that doesn't exist on
--                     the Legal Cases panel. Per "don't design for
--                     hypothetical future requirements" — drop now,
--                     re-add when a real consumer needs it.
--   verdict_at_tick — already serves its purpose server-side in the
--                     ORDER BY clause. Not read client-side. The
--                     order is preserved without sending the column
--                     down the wire.
--
-- Function body otherwise byte-identical to 20270541; just the
-- jsonb_build_object payload shrinks by two keys.
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
            END
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

NOTIFY pgrst, 'reload schema';

COMMIT;
