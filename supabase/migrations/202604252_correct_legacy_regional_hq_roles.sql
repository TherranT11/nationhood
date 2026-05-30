-- ════════════════════════════════════════════════════════════════════════════════
-- Corrective migration: robustly reclassify legacy subsidiaries in corp_properties
--
-- Problem:
--   Some historical rows still have type='regional_hq' + role='regional_hq'
--   even though they are user-created subsidiaries.
--
-- Corrective intent:
--   Reclassify only legacy rows where multiple subsidiary signals are present.
--
-- Expected final state after this migration:
--   * role='regional_hq' rows represent marketplace HQ properties only.
--   * user-created branches/subsidiaries are role='subsidiary'.
--
-- Idempotent and safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════════

WITH signals AS (
    SELECT
        cp.id,
        cp.faction_id,
        cp.nation_id,
        cp.catalog_id,
        cp.subsector,
        (cp.subsector IS NOT NULL) AS has_subsector_signal,
        EXISTS (
            SELECT 1
            FROM subsidiary_auto_rates sar
            WHERE sar.subsidiary_id = cp.id
        ) AS has_auto_rate_signal,
        EXISTS (
            SELECT 1
            FROM subsidiary_auto_policies sap
            WHERE sap.subsidiary_id = cp.id
        ) AS has_auto_policy_signal,
        EXISTS (
            SELECT 1
            FROM subsidiary_sales ss
            WHERE ss.subsidiary_id = cp.id
        ) AS has_sale_signal,
        EXISTS (
            SELECT 1
            FROM corp_properties hq
            JOIN factions f ON f.id = cp.faction_id
            WHERE hq.faction_id = cp.faction_id
              AND hq.type = 'regional_hq'
              AND hq.catalog_id IS NOT NULL
              AND hq.nation_id = f.nation_id
              AND cp.nation_id IS DISTINCT FROM f.nation_id
        ) AS has_cross_nation_branch_signal
    FROM corp_properties cp
    WHERE cp.type = 'regional_hq'
      AND cp.role = 'regional_hq'
),
legacy_subsidiary_candidates AS (
    SELECT id
    FROM signals s
    WHERE s.catalog_id IS NULL
      AND (
            s.has_subsector_signal
            OR s.has_auto_rate_signal
            OR s.has_auto_policy_signal
            OR s.has_sale_signal
            OR s.has_cross_nation_branch_signal
      )
)
UPDATE corp_properties cp
   SET role = 'subsidiary'
  FROM legacy_subsidiary_candidates lsc
 WHERE cp.id = lsc.id;

-- ════════════════════════════════════════════════════════════════════════════════
-- VERIFY — post-migration role distribution + disputed sample rows.
--
-- Disputed sample definition:
--   A) still role='regional_hq' but has one or more subsidiary signals
--   B) role='subsidiary' but catalog_id suggests marketplace HQ and no subsidiary signals
--
-- Run manually after migration execution.
-- ════════════════════════════════════════════════════════════════════════════════

-- 1) Role counts among regional_hq-typed properties.
SELECT role, COUNT(*) AS rows
FROM corp_properties
WHERE type = 'regional_hq'
GROUP BY role
ORDER BY role;

-- 2) Sample disputed rows for audit (up to 25).
WITH signal_map AS (
    SELECT
        cp.id,
        cp.name,
        cp.faction_id,
        cp.nation_id,
        cp.type,
        cp.role,
        cp.catalog_id,
        cp.subsector,
        (cp.subsector IS NOT NULL) AS has_subsector_signal,
        EXISTS (
            SELECT 1 FROM subsidiary_auto_rates sar WHERE sar.subsidiary_id = cp.id
        ) AS has_auto_rate_signal,
        EXISTS (
            SELECT 1 FROM subsidiary_auto_policies sap WHERE sap.subsidiary_id = cp.id
        ) AS has_auto_policy_signal,
        EXISTS (
            SELECT 1 FROM subsidiary_sales ss WHERE ss.subsidiary_id = cp.id
        ) AS has_sale_signal,
        EXISTS (
            SELECT 1
            FROM corp_properties hq
            JOIN factions f ON f.id = cp.faction_id
            WHERE hq.faction_id = cp.faction_id
              AND hq.type = 'regional_hq'
              AND hq.catalog_id IS NOT NULL
              AND hq.nation_id = f.nation_id
              AND cp.nation_id IS DISTINCT FROM f.nation_id
        ) AS has_cross_nation_branch_signal
    FROM corp_properties cp
    WHERE cp.type = 'regional_hq'
)
SELECT
    sm.*,
    (
        sm.has_subsector_signal
        OR sm.has_auto_rate_signal
        OR sm.has_auto_policy_signal
        OR sm.has_sale_signal
        OR sm.has_cross_nation_branch_signal
    ) AS has_any_subsidiary_signal
FROM signal_map sm
WHERE (
        sm.role = 'regional_hq'
        AND (
            sm.has_subsector_signal
            OR sm.has_auto_rate_signal
            OR sm.has_auto_policy_signal
            OR sm.has_sale_signal
            OR sm.has_cross_nation_branch_signal
        )
      )
   OR (
        sm.role = 'subsidiary'
        AND sm.catalog_id IS NOT NULL
        AND sm.subsector IS NULL
        AND NOT sm.has_auto_rate_signal
        AND NOT sm.has_auto_policy_signal
        AND NOT sm.has_sale_signal
        AND NOT sm.has_cross_nation_branch_signal
      )
ORDER BY sm.role, sm.id
LIMIT 25;
