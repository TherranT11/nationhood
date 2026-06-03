-- ════════════════════════════════════════════════════════════════════
-- 20270559 — Legal Cases appeal status
--
-- Updates list_resolved_cases_for_nation so the Legal Cases panel can
-- render one of three verdict labels per case:
--
--   • "Verdict Rendered in Favor of X."   (no resolved appeal)
--   • "Sustained on Appeal."               (appeal winner == original)
--   • "Overturned on Appeal. Verdict for Y." (appeal winner != original)
--
-- Two changes vs 20270549:
--
--   1. Originals only. The previous query returned every resolved
--      trial including appeals — so an appealed case appeared twice
--      (once as original, once as appeal). The new design treats the
--      appeal as a status on the original card, so appeal trials are
--      filtered out (appeal_of_trial_id IS NULL).
--
--   2. Appeal outcome via LATERAL. Each original LEFT JOINs the most
--      recent resolved appeal for itself (LATERAL ... ORDER BY
--      verdict_at_tick DESC LIMIT 1). LATERAL+LIMIT 1 is necessary
--      because the unique-active-appeal index only constrains
--      IN-FLIGHT appeals — once one resolves, the original is
--      re-appealable, so multiple resolved appeals per original is
--      schema-legal. We surface the latest, which is the canonical
--      "final" outcome.
--
-- Payload additions:
--   • appeal_status — NULL / 'sustained' / 'overturned'. NULL when
--     no resolved appeal exists; 'sustained' when the appeal's
--     verdict_winner matches the original's; 'overturned' otherwise.
--   • appeal_winner — NULL / 'plaintiff' / 'defendant'. The appeal's
--     verdict_winner, so the client can name the appellate victor
--     without a second round-trip. NULL when no resolved appeal.
--
-- Names are NOT re-sent on the appeal row: plaintiff/defendant are
-- the same parties as the original (appeals reuse plaintiff_name +
-- defendant_name per 20270543), so the client derives the appellate
-- winner's name from the existing plaintiff_name / defendant_name
-- fields using appeal_winner as the selector.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.list_resolved_cases_for_nation(p_nation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_cases  jsonb;
BEGIN
    IF p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

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
            -- In-game year anchored at tick 0 = January 2000 (matches
            -- js/utils.js tickToYear so the panel and the topbar GAME
            -- DATE never disagree).
            'year_started',       2000 + FLOOR(
                COALESCE(t.pre_trial_started_at_tick, t.matched_at_tick, 0)
                / 12.0)::int,
            'appeal_status',      CASE
                WHEN ap.id IS NULL THEN NULL
                WHEN ap.verdict_winner = t.verdict_winner THEN 'sustained'
                ELSE 'overturned'
            END,
            'appeal_winner',      ap.verdict_winner
        ) ORDER BY t.verdict_at_tick DESC
    ), '[]'::jsonb) INTO v_cases
    FROM public.court_case_trials t
    JOIN public.court_case_drafts d ON d.id = t.case_draft_id
    LEFT JOIN public.factions pa ON pa.id = t.plaintiff_advocate_id
    LEFT JOIN public.factions da ON da.id = t.defendant_advocate_id
    LEFT JOIN LATERAL (
        SELECT a.id, a.verdict_winner
          FROM public.court_case_trials a
         WHERE a.appeal_of_trial_id = t.id
           AND a.status             = 'resolved'
         ORDER BY a.verdict_at_tick DESC
         LIMIT 1
    ) ap ON TRUE
    WHERE t.nation_id           = p_nation_id
      AND t.status              = 'resolved'
      AND t.appeal_of_trial_id IS NULL
    LIMIT 50;

    RETURN jsonb_build_object('success', true, 'cases', v_cases);
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
