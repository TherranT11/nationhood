-- ════════════════════════════════════════════════════════════════════════════════
-- Add explicit `role` column to corp_properties (production migration path)
--
-- Ported from: sql/migrations/20260423_add_corp_properties_role.sql
--
-- Why:
--   Distinguish marketplace-purchased HQ properties from user-created
--   subsidiaries. Both were historically stored as type='regional_hq'.
--
-- Behavior after migration:
--   role='subsidiary'  -> user-created branches (GDP-scaled revenue)
--   role='regional_hq' -> marketplace HQ properties (flat income)
--   otherwise role defaults to type for non-HQ properties.
--
-- Idempotent and safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════════

-- 1) Add role column if missing.
ALTER TABLE corp_properties
    ADD COLUMN IF NOT EXISTS role TEXT;

-- 2) Backfill subsidiary records first (legacy rows where type ambiguity existed).
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

-- 3) Backfill all remaining NULL roles from the existing type value.
UPDATE corp_properties
   SET role = type
 WHERE role IS NULL
   AND type IS NOT NULL;

-- 4) Last-chance fallback for any legacy rows with type NULL.
--    Keeps the migration re-runnable and avoids NOT NULL failures.
UPDATE corp_properties
   SET role = 'unknown'
 WHERE role IS NULL;

-- 5) Enforce non-null now that every row has a role.
ALTER TABLE corp_properties
    ALTER COLUMN role SET NOT NULL;

-- 6) Index used by tick processor role filters.
CREATE INDEX IF NOT EXISTS idx_corp_properties_role_nation_active
    ON corp_properties (role, nation_id)
    WHERE is_active = true;

-- 7) Verification query (post-rollout smoke check).
-- SELECT role, type, COUNT(*) AS rows
-- FROM corp_properties
-- GROUP BY role, type
-- ORDER BY role, type;
