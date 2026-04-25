-- ============================================================
-- corp_properties — enable Row Level Security
-- ============================================================
--
-- The original 20260403_property_system.sql created corp_properties
-- without ALTER TABLE ... ENABLE ROW LEVEL SECURITY, leaving the
-- table accessible via default role grants. This migration brings
-- it in line with every other corp-owned table in the schema
-- (shipping_applications, shipping_claims, subsidiary_sales,
-- subsidiary_bids, ship_market_listings, ...) by enabling RLS and
-- installing the same permissive read/insert/update policies those
-- tables use.
--
-- These policies are intentionally permissive: any authenticated
-- client can read, insert, and update corp_properties rows. That
-- matches the existing game model where the client trusts itself
-- to write honest faction_id values (backed by app-level checks
-- in deliverProject, pfOpenBuild, etc.). Tightening to faction-
-- ownership enforcement is a future hardening pass and would
-- require auth.uid → faction mapping at the RLS layer, which
-- the schema doesn't currently expose.
--
-- Idempotent — running twice is a no-op thanks to DO $$ …
-- EXCEPTION WHEN duplicate_object blocks around each CREATE POLICY.
-- ============================================================

ALTER TABLE corp_properties ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read corp_properties"
    ON corp_properties
    FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated can insert corp_properties"
    ON corp_properties
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated can update corp_properties"
    ON corp_properties
    FOR UPDATE
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sanity check: confirm the four reference migrations (property
-- system + the three column-adding migrations) have all landed.
-- No assertions here — just a RAISE NOTICE the operator can eyeball.
DO $$
DECLARE row_count INT;
BEGIN
    SELECT COUNT(*) INTO row_count FROM corp_properties WHERE is_active = TRUE;
    RAISE NOTICE 'corp_properties: RLS now enabled. % active rows visible.', row_count;
END $$;
