-- ============================================================
-- Fix nations with GDP/debt/population stored on old 0-100 scale
-- ============================================================
--
-- The game expects:
--   GDP/debt  → raw dollars  (e.g. $100B = 100,000,000,000)
--   population → raw count   (e.g. 50M  = 50,000,000)
--
-- Some nations were created with 0-100 scale values and never
-- migrated. This script detects and scales them up.
--
-- Safe: only touches values below threshold (won't affect
-- nations that already have correct billion/million-scale values).
-- ============================================================

-- 1. Preview: show which nations have broken values
SELECT name, gdp, debt, population,
    CASE WHEN gdp IS NOT NULL AND gdp < 1000000 THEN 'NEEDS SCALING' ELSE 'OK' END AS gdp_status,
    CASE WHEN debt IS NOT NULL AND debt < 1000000 THEN 'NEEDS SCALING' ELSE 'OK' END AS debt_status,
    CASE WHEN population IS NOT NULL AND population < 100000 THEN 'NEEDS SCALING' ELSE 'OK' END AS pop_status
FROM nations
ORDER BY name;

-- 2. Scale GDP: multiply by 1 billion for nations with small values
UPDATE nations
SET gdp = gdp * 1000000000
WHERE gdp IS NOT NULL
  AND gdp > 0
  AND gdp < 1000000;

-- 3. Scale debt: multiply by 1 billion for nations with small values
UPDATE nations
SET debt = debt * 1000000000
WHERE debt IS NOT NULL
  AND debt > 0
  AND debt < 1000000;

-- 4. Scale population: multiply by 1 million for nations with small values
UPDATE nations
SET population = population * 1000000
WHERE population IS NOT NULL
  AND population > 0
  AND population < 100000;

-- 5. Fix seed_stats JSONB so shard resets don't restore broken values
-- GDP in seed_stats
UPDATE nations
SET seed_stats = jsonb_set(
    seed_stats,
    '{gdp}',
    to_jsonb((seed_stats->>'gdp')::numeric * 1000000000)
)
WHERE seed_stats IS NOT NULL
  AND seed_stats->>'gdp' IS NOT NULL
  AND (seed_stats->>'gdp')::numeric > 0
  AND (seed_stats->>'gdp')::numeric < 1000000;

-- Debt in seed_stats
UPDATE nations
SET seed_stats = jsonb_set(
    seed_stats,
    '{debt}',
    to_jsonb((seed_stats->>'debt')::numeric * 1000000000)
)
WHERE seed_stats IS NOT NULL
  AND seed_stats->>'debt' IS NOT NULL
  AND (seed_stats->>'debt')::numeric > 0
  AND (seed_stats->>'debt')::numeric < 1000000;

-- Population in seed_stats
UPDATE nations
SET seed_stats = jsonb_set(
    seed_stats,
    '{population}',
    to_jsonb((seed_stats->>'population')::numeric * 1000000)
)
WHERE seed_stats IS NOT NULL
  AND seed_stats->>'population' IS NOT NULL
  AND (seed_stats->>'population')::numeric > 0
  AND (seed_stats->>'population')::numeric < 100000;

-- 6. Verify: show final values
SELECT name, gdp, debt, population,
    CASE WHEN gdp >= 1000000000 THEN '✓' ELSE '⚠' END AS gdp_ok,
    CASE WHEN debt >= 1000000000 OR debt = 0 THEN '✓' ELSE '⚠' END AS debt_ok,
    CASE WHEN population >= 1000000 THEN '✓' ELSE '⚠' END AS pop_ok
FROM nations
ORDER BY name;
