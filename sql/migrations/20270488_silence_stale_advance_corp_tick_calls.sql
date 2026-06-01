-- TEMPORARY: silence stale advance-corp-tick edge function log spam.
--
-- The deployed advance-corp-tick is behind the repo source and still
-- calls into three things that have been removed from the DB:
--
--   public.corp_properties              dropped in 20270251 (corp cull 5B)
--   public.corp_executives              dropped in 20270248 (corp cull 4g)
--   public.loan_negotiations            dropped in 20270251 (corp cull 5B)
--   public.process_lawsuit_deadlines    dropped in 20270247 (4f lawsuit
--                                                            modernization)
--   public.auto_abandon_stale_negotiations
--                                       dropped in 20270249 (corp cull 4g)
--
-- Per-tick logs from those failed calls were filling the cron output:
--   [advance-corp-tick] Regional HQ income failed (corp_properties missing)
--   [advance-corp-tick] Exec expiry failed (corp_executives missing)
--   [advance-corp-tick] loan-negotiation sweep failed (relation missing)
--   [advance-corp-tick] lawsuit deadline sweep failed (function missing)
--
-- Real fix is to redeploy the edge function (the repo source has all
-- three call sites removed). Until that happens this migration drops
-- empty stub tables + no-op stub RPCs so the deployed function's
-- calls succeed silently — selects return zero rows, updates affect
-- zero rows, the RPCs return 0.
--
-- DROP THIS MIGRATION'S TABLES + FUNCTIONS the moment
-- advance-corp-tick is redeployed (supabase functions deploy
-- advance-corp-tick). They are not part of any live system.

BEGIN;

-- ── corp_properties stub ────────────────────────────────────────────
-- Columns are the union of what the deployed code selects + updates
-- (id / faction_id / nation_id / name / role / sub_cash /
-- purchase_price / monthly_maintenance / condition / capacity /
-- refurbish_until_tick / refurbish_condition / refurbish_count). The
-- table stays empty; no inserts will happen because the deployed
-- function only reads + updates by id.
CREATE TABLE IF NOT EXISTS public.corp_properties (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id               uuid,
    nation_id                uuid,
    name                     text,
    role                     text,
    type                     text,
    sub_cash                 bigint  DEFAULT 0,
    purchase_price           bigint  DEFAULT 0,
    monthly_maintenance      bigint  DEFAULT 0,
    condition                int     DEFAULT 100,
    capacity                 int     DEFAULT 0,
    refurbish_until_tick     int,
    refurbish_condition      int,
    refurbish_count          int     DEFAULT 0,
    is_active                boolean DEFAULT true,
    created_at               timestamptz DEFAULT NOW()
);
ALTER TABLE public.corp_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "corp_properties_stub_read" ON public.corp_properties;
CREATE POLICY "corp_properties_stub_read" ON public.corp_properties
    FOR SELECT TO authenticated, service_role USING (true);

COMMENT ON TABLE public.corp_properties IS
    'STUB — silences stale advance-corp-tick selects/updates after the table was dropped in 20270251. Drop me after advance-corp-tick is redeployed.';

-- ── corp_executives stub ────────────────────────────────────────────
-- Columns match the deployed code's select + update shape:
-- select salary_per_year filtered by (faction_id, status='active');
-- update {status, updated_at} where (status='active', contract_end_tick
-- < currentTick) returning (id, role, faction_id).
CREATE TABLE IF NOT EXISTS public.corp_executives (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id          uuid,
    role                text,
    status              text,
    salary_per_year     bigint  DEFAULT 0,
    contract_end_tick   int,
    updated_at          timestamptz DEFAULT NOW()
);
ALTER TABLE public.corp_executives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "corp_executives_stub_read" ON public.corp_executives;
CREATE POLICY "corp_executives_stub_read" ON public.corp_executives
    FOR SELECT TO authenticated, service_role USING (true);

COMMENT ON TABLE public.corp_executives IS
    'STUB — silences stale advance-corp-tick selects/updates after the table was dropped in 20270248. Drop me after advance-corp-tick is redeployed.';

-- ── loan_negotiations stub ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.loan_negotiations (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    status           text,
    last_action_tick int,
    created_at       timestamptz DEFAULT NOW()
);
ALTER TABLE public.loan_negotiations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "loan_negotiations_stub_read" ON public.loan_negotiations;
CREATE POLICY "loan_negotiations_stub_read" ON public.loan_negotiations
    FOR SELECT TO authenticated, service_role USING (true);

COMMENT ON TABLE public.loan_negotiations IS
    'STUB — silences stale advance-corp-tick reads after the table was dropped in 20270251. Drop me after advance-corp-tick is redeployed.';

-- ── No-op RPC stubs ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_lawsuit_deadlines()
RETURNS int LANGUAGE sql AS $$ SELECT 0; $$;
GRANT EXECUTE ON FUNCTION public.process_lawsuit_deadlines() TO service_role;
COMMENT ON FUNCTION public.process_lawsuit_deadlines() IS
    'STUB — silences stale advance-corp-tick rpc call after the original was dropped in 20270247. Drop me after advance-corp-tick is redeployed.';

CREATE OR REPLACE FUNCTION public.auto_abandon_stale_negotiations(p_tick int)
RETURNS int LANGUAGE sql AS $$ SELECT 0; $$;
GRANT EXECUTE ON FUNCTION public.auto_abandon_stale_negotiations(int) TO service_role;
COMMENT ON FUNCTION public.auto_abandon_stale_negotiations(int) IS
    'STUB — silences stale advance-corp-tick rpc call after the original was dropped in 20270249. Drop me after advance-corp-tick is redeployed.';

NOTIFY pgrst, 'reload schema';

COMMIT;
