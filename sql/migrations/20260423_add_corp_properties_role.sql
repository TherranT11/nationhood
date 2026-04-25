-- ════════════════════════════════════════════════════════════════════════════════
-- Add explicit `role` column to corp_properties
--
-- Fixes the long-standing architectural issue where Subsidiary and Regional HQ
-- are two distinct game concepts but stored in the same table with the same
-- `type = 'regional_hq'` value — distinguished previously only by implicit
-- signals (catalog_id NULL + subsector NOT NULL = subsidiary). That ambiguity
-- was the root cause of the subsidiary-payout bug: processSubsidiaryRevenue
-- filtered on `type` and caught both kinds.
--
-- After this migration:
--   role = 'subsidiary'   → user-created business branches (GDP-scaled revenue)
--   role = 'regional_hq'  → marketplace-purchased HQ properties (flat income)
--   role = 'office' | 'factory' | etc. → matches type for non-HQ properties
--
-- No CHECK constraint on role — the set of valid types expands over time
-- (branch_office, trading_floor, claims_office, etc. exist in practice),
-- and a CHECK would silently block future property categories.
--
-- Idempotent. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════════

-- 1. Add the column (nullable for transition)
ALTER TABLE corp_properties
    ADD COLUMN IF NOT EXISTS role TEXT;

-- 2. Backfill: rows created via "Create Subsidiary" flow = subsidiary.
--    IMPORTANT: subsector alone is not the only discriminator anymore.
--    We also treat a row as subsidiary if it is legacy-untyped but has
--    finance/subsidiary service references or cross-nation branch signals.
WITH subsidiary_candidates AS (
    SELECT cp.id
    FROM corp_properties cp
    LEFT JOIN factions f ON f.id = cp.faction_id
    WHERE cp.role IS NULL
      AND cp.type = 'regional_hq'
      AND cp.catalog_id IS NULL
      AND (
            cp.subsector IS NOT NULL
            OR EXISTS (
                SELECT 1
                FROM subsidiary_auto_rates sar
                WHERE sar.subsidiary_id = cp.id
            )
            OR EXISTS (
                SELECT 1
                FROM subsidiary_auto_policies sap
                WHERE sap.subsidiary_id = cp.id
            )
            OR EXISTS (
                SELECT 1
                FROM subsidiary_sales ss
                WHERE ss.subsidiary_id = cp.id
            )
            OR (
                f.nation_id IS DISTINCT FROM cp.nation_id
                AND EXISTS (
                    SELECT 1
                    FROM corp_properties hq
                    WHERE hq.faction_id = cp.faction_id
                      AND hq.type = 'regional_hq'
                      AND hq.catalog_id IS NOT NULL
                      AND hq.nation_id = f.nation_id
                )
            )
      )
)
UPDATE corp_properties cp
   SET role = 'subsidiary'
  FROM subsidiary_candidates sc
 WHERE cp.id = sc.id;

-- 3. Backfill: everything else inherits role from type.
UPDATE corp_properties
   SET role = type
 WHERE role IS NULL
   AND type IS NOT NULL;

-- 4. Enforce non-null going forward (after backfill, every row has a role).
ALTER TABLE corp_properties
    ALTER COLUMN role SET NOT NULL;

-- 5. Partial index for fast tick-processor filtering.
CREATE INDEX IF NOT EXISTS idx_corp_properties_role_nation_active
    ON corp_properties (role, nation_id)
    WHERE is_active = true;

-- ════════════════════════════════════════════════════════════════════════════════
-- VERIFY — run this to confirm backfill worked.
-- ════════════════════════════════════════════════════════════════════════════════
SELECT role, type, COUNT(*) AS rows
FROM corp_properties
GROUP BY role, type
ORDER BY role, type;
-- Expected: subsidiary rows (~20) all type='regional_hq'; regional_hq row(s)
-- all type='regional_hq'; office/warehouse/factory/etc rows with matching role.
