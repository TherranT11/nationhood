-- ════════════════════════════════════════════════════════════════
-- Reload PostgREST's schema cache after the found_entrepreneur_corp
-- signature change.
--
-- 20270142 DROPs found_entrepreneur_corp(text,text,text,bigint) and
-- CREATEs found_entrepreneur_corp(text,uuid,text,bigint) (p_hq text →
-- p_hq_nation_id uuid). PostgREST routes RPCs by cached argument
-- names; a signature change is the one case where the cache can stay
-- stale after apply, producing:
--   "Could not find the function
--    public.found_entrepreneur_corp(p_capital,p_hq_nation_id,
--    p_industry,p_name) in the schema cache"
-- 20270142 originally omitted the reload the rest of the codebase
-- uses after API-affecting DDL. This standalone migration runs the
-- reload for databases that already applied 20270142 before that fix.
-- Mirrors the 20270128 precedent. Idempotent; safe to re-run.
-- ════════════════════════════════════════════════════════════════

NOTIFY pgrst, 'reload schema';
