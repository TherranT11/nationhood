-- ════════════════════════════════════════════════════════════════
-- Backfill: existing Light Industrial Facility starter buildings
-- become Light Assembly Plants
--
-- Aviation Manufacturing corps were founded with a starter building
-- of type='light_industrial_facility' (see corp-nation-select.html
-- prior to this commit). That type is a phantom — no aviation
-- design / production / order-fulfilment path recognises it. In
-- particular, start_aircraft_design_research (introduced in
-- 20261028_aviation_aircraft_design.sql) gates on:
--
--     type IN ('light_assembly_plant',
--              'aircraft_assembly_facility',
--              'heavy_manufacturing_plant')
--
-- so every existing aviation corp founded before this migration
-- cannot click "Design Aircraft" until they go and buy a real
-- assembly plant on Expansion. The founding flow has been updated
-- to seed type='light_assembly_plant' directly; this migration
-- migrates the rows that were already inserted.
--
-- Scope of update:
--   * type → 'light_assembly_plant'
--   * role → 'light_assembly_plant'
--   * name suffix " Industrial Facility" → " Light Assembly Plant"
--     (only when the row was named by the founding flow; rows whose
--      names do not end in " Industrial Facility" are left alone).
--
-- NOT changed: purchase_price, monthly_maintenance, condition,
-- capacity. Existing players keep the cheaper "founding-discount"
-- value the original lightIndustrialFacilityValue formula produced
-- — bumping retroactively would inflate property value, raise
-- maintenance, and shift bankruptcy / bailout calculations for
-- already-running corps. New corps founded after this migration
-- will use the real lightAssemblyPlantValue(cost_of_living).
--
-- Idempotent: filtered on type='light_industrial_facility', so
-- re-running after the column is empty is a no-op.
-- ════════════════════════════════════════════════════════════════

UPDATE corp_properties
SET type = 'light_assembly_plant',
    role = 'light_assembly_plant',
    name = CASE
        WHEN name LIKE '% Industrial Facility'
            THEN REGEXP_REPLACE(name, ' Industrial Facility$', ' Light Assembly Plant')
        ELSE name
    END
WHERE type = 'light_industrial_facility';
