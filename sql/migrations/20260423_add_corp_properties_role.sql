-- ════════════════════════════════════════════════════════════════════════════════
-- Add explicit `role` column to corp_properties
--
-- Fixes the long-standing architectural issue where Subsidiary and Regional HQ
-- are two distinct game concepts but stored in the same table with the same
-- `type = 'regional_hq'` value. Distinguished today only by implicit signals
-- (catalog_id NULL + subsector NOT NULL = subsidiary). That ambiguity is what
-- caused the payout bug: processSubsidiaryRevenue filtered on `type` and
-- caught both kinds, and only one ever actually updated.
--
-- After this migration:
--   role = 'subsidiary'   → user-created business branches (sub_cash, GDP formula)
--   role = 'regional_hq'  → marketplace-purchased HQ properties (flat property income)
--   role = 'office' | 'factory' | etc. → non-HQ physical property (unchanged)
--
-- Idempotent. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════════

-- 1. Add the column (nullable for transition)
ALTER TABLE corp_properties
    ADD COLUMN IF NOT EXISTS role TEXT;

-- 2. Backfill: anything created via "Create Subsidiary" flow = subsidiary.
--    Signal: type='regional_hq' + catalog_id NULL + subsector populated.
UPDATE corp_properties
   SET role = 'subsidiary'
 WHERE type = 'regional_hq'
   AND catalog_id IS NULL
   AND subsector IS NOT NULL
   AND role IS NULL;

-- 3. Backfill: anything else with type='regional_hq' = marketplace property.
UPDATE corp_properties
   SET role = 'regional_hq'
 WHERE type = 'regional_hq'
   AND role IS NULL;

-- 4. Backfill: non-HQ property types inherit their role from their type.
UPDATE corp_properties
   SET role = type
 WHERE role IS NULL
   AND type IS NOT NULL;

-- 5. Enforce non-null going forward
ALTER TABLE corp_properties
    ALTER COLUMN role SET NOT NULL;

-- 6. Constrain allowed values
DO $$ BEGIN
    ALTER TABLE corp_properties
        ADD CONSTRAINT corp_properties_role_check
        CHECK (role IN ('regional_hq', 'subsidiary', 'office', 'factory', 'warehouse', 'retail', 'campus'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. Partial index for fast tick-processor filtering (only active rows matter)
CREATE INDEX IF NOT EXISTS idx_corp_properties_role_nation_active
    ON corp_properties (role, nation_id)
    WHERE is_active = true;

-- ════════════════════════════════════════════════════════════════════════════════
-- VERIFY — run this after the migration to confirm backfill worked.
-- ════════════════════════════════════════════════════════════════════════════════
SELECT role, type, COUNT(*) AS rows
FROM corp_properties
GROUP BY role, type
ORDER BY role, type;
-- Expected: 'subsidiary' rows all type='regional_hq'; 'regional_hq' rows all
-- type='regional_hq'; office/factory/etc rows with matching role.
