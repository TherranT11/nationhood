-- ════════════════════════════════════════════════════════════════════
-- Audit fix on 20270435: extend corp_buildings CHECK for apartments
--
-- 20270435 added apartment_basic / apartment_modest / apartment_luxury
-- to corp_building_required_sector, corp_building_cost_profile,
-- corp_commercial_build_load, and the request_building_construction
-- whitelist — but missed corp_buildings_building_type_check.
--
-- That CHECK was set by 20270213 to:
--   ('regional_hq','construction_yard','port','banking_office',
--    'real_estate_office','light_assembly_plant','engine_assembly_plant')
--
-- Without this fix the Phase 1 flow appears to work end-to-end (issuer
-- posts the contract, construction corps bid, lowest auto-wins) but
-- blows up silently at completion when process_ent_construction_contracts
-- tries to INSERT INTO corp_buildings — the CHECK rejects the new
-- type and the apartment is never created. The contract sits as
-- "completed but no building delivered," and the player has paid the
-- winning bid for nothing.
--
-- Single ALTER, drop-and-recreate (PostgreSQL has no ADD-VALUE for
-- CHECK constraints — same pattern 20270213 + 20270176 used).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE corp_buildings DROP CONSTRAINT IF EXISTS corp_buildings_building_type_check;
ALTER TABLE corp_buildings ADD CONSTRAINT corp_buildings_building_type_check
    CHECK (building_type IN ('regional_hq','construction_yard','port','banking_office',
                             'real_estate_office','light_assembly_plant','engine_assembly_plant',
                             'apartment_basic','apartment_modest','apartment_luxury'));

NOTIFY pgrst, 'reload schema';

COMMIT;
