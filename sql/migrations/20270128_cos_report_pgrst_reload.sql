-- ════════════════════════════════════════════════════════════════
-- Reload PostgREST's schema cache after the COS-report function
-- signature change.
--
-- 20270127 DROPs file_chief_of_staff_report(uuid,text) and CREATEs
-- file_chief_of_staff_report(uuid,text,boolean). PostgREST routes
-- RPCs by cached argument names; a signature change is the one case
-- where the cache can stay stale after apply, producing:
--   "Could not find the function ...(p_body,p_faction_id,p_public)
--    in the schema cache"
-- 20270126/20270127 omitted the reload the rest of the codebase uses
-- (237 migrations NOTIFY pgrst after API-affecting DDL). This runs
-- last so the new 3-arg signature + get_cos_reports are immediately
-- visible to the API. Idempotent; safe to re-run.
-- ════════════════════════════════════════════════════════════════

NOTIFY pgrst, 'reload schema';
