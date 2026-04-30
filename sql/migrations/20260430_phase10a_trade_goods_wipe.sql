-- =========================================================================
-- PHASE 10A — Trade goods wipe
--
-- Wipes the goods-trade economy (TRADE_SECTORS export/import flow,
-- per-sector tariffs, tariff bills) to prepare for a clean rebuild.
-- Diplomatic trade agreements (`trade_agreements` table) are KEPT
-- intact — they're a political relationship, not a goods-flow mechanic.
--
-- Dropped:
--   * trade_flows           (per-tick per-nation per-sector flow rows)
--   * trade_summary         (aggregated trade metrics)
--   * trade_partners        (per-tick exporter/importer affinity rows)
--   * food_stockpiles       (per-nation per-sector reserves)
--   * food_land_allocation  (per-nation arable land allocation pcts)
--   * nations.sector_tariffs (per-sector tariff override jsonb)
--   * bill_articles rows with effect_data.type = 'TARIFF_RATE_CHANGE'
--
-- Preserved:
--   * trade_agreements      (diplomacy — political relationships)
--   * trade_negotiations    (diplomacy — in-flight agreement drafting)
--   * shipping_routes       (corp logistics, separate system)
-- =========================================================================

DROP TABLE IF EXISTS trade_flows;
DROP TABLE IF EXISTS trade_summary;
DROP TABLE IF EXISTS trade_partners;
DROP TABLE IF EXISTS food_stockpiles;
DROP TABLE IF EXISTS food_land_allocation;

ALTER TABLE nations
    DROP COLUMN IF EXISTS sector_tariffs;

-- bill_articles stores the effect kind in `effect_data->>'type'`
-- (matches the bills.js apply path: `effect.type === 'TARIFF_RATE_CHANGE'`).
-- Delete every row whose payload references the retired tariff effect.
DELETE FROM bill_articles
WHERE effect_data IS NOT NULL
  AND effect_data->>'type' = 'TARIFF_RATE_CHANGE';

-- Spot-checks: each should return zero rows after the migration.
SELECT 'trade_flows table'              AS check, COUNT(*) AS remaining FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'trade_flows'
UNION ALL
SELECT 'trade_summary table'            AS check, COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'trade_summary'
UNION ALL
SELECT 'trade_partners table'           AS check, COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'trade_partners'
UNION ALL
SELECT 'food_stockpiles table'          AS check, COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'food_stockpiles'
UNION ALL
SELECT 'food_land_allocation table'     AS check, COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'food_land_allocation'
UNION ALL
SELECT 'nations.sector_tariffs column'  AS check, COUNT(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'nations' AND column_name = 'sector_tariffs'
UNION ALL
SELECT 'TARIFF_RATE_CHANGE bill articles' AS check, COUNT(*) FROM bill_articles
    WHERE effect_data IS NOT NULL AND effect_data->>'type' = 'TARIFF_RATE_CHANGE';
