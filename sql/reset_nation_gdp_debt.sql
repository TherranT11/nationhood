-- ============================================================
-- Reset GDP and National Debt to design-doc dollar-scale values
-- ============================================================
--
-- Some nations have GDP/debt stored as raw 0-100 stats instead
-- of dollar amounts. This script sets all nations to their
-- design-doc values (raw dollars).
--
-- NOTE: This overwrites any growth/drift from game ticks or
-- policy effects. Run only when you need to reset to baseline.
-- ============================================================

-- 1. Preview: show current values
SELECT name, gdp, debt,
    CASE WHEN gdp >= 1000000000 THEN 'dollar-scale' ELSE 'raw-stat' END AS gdp_scale,
    CASE WHEN debt >= 1000000000 THEN 'dollar-scale' ELSE 'raw-stat' END AS debt_scale
FROM nations
ORDER BY name;

-- 2. Set GDP and debt to design-doc dollar-scale values
-- Avelia: GDP $358B, Debt $10B
UPDATE nations
SET gdp = 358000000000,
    debt = 10000000000
WHERE LOWER(name) = 'avelia';

-- Sangreza: GDP $528B, Debt $40B
UPDATE nations
SET gdp = 528000000000,
    debt = 40000000000
WHERE LOWER(name) = 'sangreza';

-- Montequilla: GDP $109B, Debt $55B
UPDATE nations
SET gdp = 109000000000,
    debt = 55000000000
WHERE LOWER(name) = 'montequilla';

-- San Estrella: GDP $88B, Debt $83B
UPDATE nations
SET gdp = 88000000000,
    debt = 83000000000
WHERE LOWER(name) = 'san estrella';

-- Melizea: GDP $95B, Debt $95B
UPDATE nations
SET gdp = 95000000000,
    debt = 95000000000
WHERE LOWER(name) = 'melizea';

-- 3. Update seed_stats JSONB so shard resets preserve correct values
UPDATE nations
SET seed_stats = jsonb_set(
    jsonb_set(seed_stats, '{gdp}', '358000000000'),
    '{debt}', '10000000000'
)
WHERE LOWER(name) = 'avelia' AND seed_stats IS NOT NULL;

UPDATE nations
SET seed_stats = jsonb_set(
    jsonb_set(seed_stats, '{gdp}', '528000000000'),
    '{debt}', '40000000000'
)
WHERE LOWER(name) = 'sangreza' AND seed_stats IS NOT NULL;

UPDATE nations
SET seed_stats = jsonb_set(
    jsonb_set(seed_stats, '{gdp}', '109000000000'),
    '{debt}', '55000000000'
)
WHERE LOWER(name) = 'montequilla' AND seed_stats IS NOT NULL;

UPDATE nations
SET seed_stats = jsonb_set(
    jsonb_set(seed_stats, '{gdp}', '88000000000'),
    '{debt}', '83000000000'
)
WHERE LOWER(name) = 'san estrella' AND seed_stats IS NOT NULL;

UPDATE nations
SET seed_stats = jsonb_set(
    jsonb_set(seed_stats, '{gdp}', '95000000000'),
    '{debt}', '95000000000'
)
WHERE LOWER(name) = 'melizea' AND seed_stats IS NOT NULL;

-- 4. Verify: show updated values
SELECT name, gdp, debt,
    CASE WHEN gdp >= 1000000000 THEN '✓' ELSE '⚠' END AS gdp_ok,
    CASE WHEN debt >= 1000000000 THEN '✓' ELSE '⚠' END AS debt_ok
FROM nations
ORDER BY name;
