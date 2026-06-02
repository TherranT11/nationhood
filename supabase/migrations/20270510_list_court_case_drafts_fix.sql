-- ════════════════════════════════════════════════════════════════════
-- 20270510 — Fix list_court_case_drafts: row-to-jsonb resolution
--
-- 20270508 used `row_to_jsonb(d)` inside list_court_case_drafts. On
-- the deployed Postgres, that call resolved to a lookup for
-- `row_to_jsonb(court_case_drafts)` (the table's composite type),
-- which doesn't exist as a function signature. Symptom on
-- courtcaseadmin.html: "Could not load queue: function
-- row_to_jsonb(court_case_drafts) does not exist".
--
-- Fix: stop casting the row composite to jsonb at all. Spell out
-- every column we want in the response via jsonb_build_object —
-- no anyelement/record dispatch, no named-type lookup, no surprise.
-- This is also better hygiene: the client now reads a fixed shape
-- regardless of what columns later land on court_case_drafts.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.list_court_case_drafts(p_status_filter text DEFAULT 'pending')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_result jsonb;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF NOT public.is_court_admin() THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_admin');
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id',                    d.id,
        'submitted_by_user_id',  d.submitted_by_user_id,
        'submitter_email',       u.email,
        'status',                d.status,
        'case_type',             d.case_type,
        'litigation_type',       d.litigation_type,
        'plaintiff_party_type',  d.plaintiff_party_type,
        'plaintiff_corp_type',   d.plaintiff_corp_type,
        'defendant_party_type',  d.defendant_party_type,
        'defendant_corp_type',   d.defendant_corp_type,
        'overview',              d.overview,
        'beats',                 d.beats,
        'created_at',            d.created_at,
        'accepted_at',           d.accepted_at,
        'accepted_by_user_id',   d.accepted_by_user_id,
        'entrepreneur_credited', d.entrepreneur_credited
    ) ORDER BY d.created_at DESC), '[]'::jsonb)
      INTO v_result
      FROM public.court_case_drafts d
      LEFT JOIN auth.users u ON u.id = d.submitted_by_user_id
     WHERE p_status_filter IS NULL
        OR p_status_filter = 'all'
        OR d.status = p_status_filter;

    RETURN jsonb_build_object('success', true, 'drafts', v_result);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_court_case_drafts(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_court_case_drafts(text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
