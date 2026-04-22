-- ════════════════════════════════════════════════════════════════════════════════
-- Global Goods Rebalance — Oil & Energy (fuel_energy) diagnostic
-- Alpha 2.3.2.1 — 4/23/26
--
-- Pulls the latest-tick production / demand / flow data for Fuel & Energy across
-- all 12 nations plus the stat inputs that drive the formula, so we can assess
-- whether global supply is too high relative to demand.
--
-- Formula recap (supabase/functions/advance-tick/index.ts):
--   score            = oil_and_gas (+ bonus: energy_generation, capped)
--   normalizedScore  = score / 5
--   production       = normalizedScore * $500M * 1.0 (resource sector, no GDP scale)
--                      * stabilityMod (min(1, stability/40))
--   export_capacity  = production - domesticDemand (pop/manuf/urban/col/rail)
--                      × (50 / currency_strength)
--   import_demand    = grossDemand × (1 - domesticCoverage)
--                      petro-states (oil_and_gas ≥ 70) cover up to 95%; others 70%
--
-- Display basis: $2.5B capacity ≈ 1 Mbbl/d (Saudi ≈ 10 Mbbl/d).
-- ════════════════════════════════════════════════════════════════════════════════

WITH latest AS (
    SELECT MAX(tick) AS tick FROM trade_flows WHERE sector = 'fuel_energy'
)

-- ── Part 1: Per-nation detail ──────────────────────────────────────────────────
SELECT
    n.name                                                      AS nation,
    n.oil_and_gas                                               AS oil_stat,
    n.energy_generation                                         AS gen_stat,
    n.stability                                                 AS stab,
    n.currency_strength                                         AS curr,
    n.population                                                AS pop,
    n.manufacturing_output                                      AS manuf,
    n.urbanization                                              AS urban,
    ROUND(tf.domestic_production / 1e6, 0)                      AS production_m,
    ROUND(tf.export_capacity     / 1e6, 0)                      AS export_cap_m,
    ROUND(tf.export_volume       / 1e6, 0)                      AS actual_exp_m,
    ROUND(tf.import_demand       / 1e6, 0)                      AS import_dem_m,
    ROUND(tf.import_volume       / 1e6, 0)                      AS actual_imp_m,
    ROUND((tf.domestic_production / 2.5e9)::numeric, 2)         AS prod_mbpd,
    ROUND((tf.import_demand       / 2.5e9)::numeric, 2)         AS dem_mbpd,
    ROUND(tf.price_modifier::numeric, 2)                        AS price_mod
FROM trade_flows tf
JOIN nations n ON n.id = tf.nation_id
WHERE tf.sector = 'fuel_energy'
  AND tf.tick = (SELECT tick FROM latest)
ORDER BY tf.domestic_production DESC;


-- ── Part 2: Global totals ─────────────────────────────────────────────────────
-- One-line verdict on whether global supply outstrips demand.
SELECT
    (SELECT tick FROM latest)                                           AS tick,
    COUNT(*)                                                            AS nations,
    ROUND(SUM(tf.domestic_production) / 1e9, 2)                         AS total_production_b,
    ROUND(SUM(tf.export_capacity)     / 1e9, 2)                         AS total_export_capacity_b,
    ROUND(SUM(tf.import_demand)       / 1e9, 2)                         AS total_import_demand_b,
    ROUND(SUM(tf.export_volume)       / 1e9, 2)                         AS total_actual_exports_b,
    ROUND(SUM(tf.import_volume)       / 1e9, 2)                         AS total_actual_imports_b,
    -- Supply/demand balance ratio. >1.0 = oversupplied, <1.0 = shortage.
    ROUND((SUM(tf.export_capacity)    / NULLIF(SUM(tf.import_demand), 0))::numeric, 2)
                                                                        AS cap_over_dem_ratio,
    ROUND((SUM(tf.domestic_production)/ 2.5e9)::numeric, 2)             AS total_prod_mbpd,
    ROUND((SUM(tf.import_demand)      / 2.5e9)::numeric, 2)             AS total_dem_mbpd
FROM trade_flows tf
WHERE tf.sector = 'fuel_energy'
  AND tf.tick = (SELECT tick FROM latest);


-- ── Part 3: Exporter / importer classification ────────────────────────────────
-- Quick sort: who's net-long fuel, who's net-short.
SELECT
    n.name                                                      AS nation,
    n.oil_and_gas                                               AS oil_stat,
    CASE
        WHEN n.oil_and_gas >= 70 THEN 'PETRO'
        WHEN n.oil_and_gas >= 40 THEN 'PRODUCER'
        WHEN n.oil_and_gas >= 15 THEN 'MARGINAL'
        ELSE 'IMPORTER'
    END                                                         AS tier,
    ROUND(tf.domestic_production / 1e9, 2)                      AS prod_b,
    ROUND(tf.import_demand       / 1e9, 2)                      AS dem_b,
    ROUND((tf.domestic_production - tf.import_demand) / 1e9, 2) AS net_balance_b
FROM trade_flows tf
JOIN nations n ON n.id = tf.nation_id
WHERE tf.sector = 'fuel_energy'
  AND tf.tick = (SELECT tick FROM latest)
ORDER BY (tf.domestic_production - tf.import_demand) DESC;
