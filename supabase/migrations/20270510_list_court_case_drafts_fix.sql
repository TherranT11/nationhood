-- ════════════════════════════════════════════════════════════════════
-- 20270510 — Fix list_court_case_drafts: row_to_jsonb resolution
--
-- 20270508 used `row_to_jsonb(d)` inside list_court_case_drafts. On
-- the deployed Postgres, that call resolved to a lookup for
-- `row_to_jsonb(court_case_drafts)` (the table's composite type),
-- which doesn't exist as a function signature. Symptom on
-- courtcaseadmin.html: "Could not load queue: function
-- row_to_jsonb(court_case_drafts) does not exist".
--
-- Fix: use to_jsonb(d), which accepts anyelement and serialises the
-- row directly without a named-type lookup. The `|| jsonb_build_object`
-- merge that adds the submitter email is unchanged.
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

    SELECT COALESCE(jsonb_agg(to_jsonb(d) || jsonb_build_object(
        'submitter_email', u.email
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
