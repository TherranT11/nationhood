-- Fix Palvera GDP: stuck at 100 (raw stat scale) instead of $106B (dollar scale).
--
-- Root cause: multiple tick processors (processStatConnections, processMinistryActions,
-- processEvents, processCrises) clamped ALL nation stats to 0-100 without checking
-- RAW_SCALING_DIVISORS. If any effect targeted 'gdp', it would be clamped from
-- ~$106,000,000,000 down to 100 by Math.min(100, ...).
--
-- Code fix: added RAW_SCALING_DIVISORS guards and GDP skip to all four processors.
-- This SQL resets the data to correct values.

-- 1. Preview: show all nations' GDP to check for other victims
SELECT name, gdp,
    CASE WHEN gdp >= 1000000000 THEN 'dollar-scale ✓'
         ELSE 'BROKEN (raw-stat) ⚠' END AS gdp_status
FROM nations
ORDER BY name;

-- 2. Reset Palvera GDP to design-doc value ($106B)
UPDATE nations
SET gdp = 106000000000
WHERE LOWER(name) = 'palvera'
  AND gdp < 1000000000;  -- safety: only fix if actually broken

-- 3. Also fix seed_stats so shard resets preserve correct value
UPDATE nations
SET seed_stats = jsonb_set(seed_stats, '{gdp}', '106000000000')
WHERE LOWER(name) = 'palvera'
  AND seed_stats IS NOT NULL;

-- 4. Verify
SELECT name, gdp,
    CASE WHEN gdp >= 1000000000 THEN 'dollar-scale ✓'
         ELSE 'BROKEN ⚠' END AS gdp_status
FROM nations
WHERE LOWER(name) = 'palvera';
