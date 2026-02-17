-- ============================================================
-- Set Montequilla's GDP to $109B (matching design doc)
-- ============================================================

-- Update live GDP
UPDATE nations SET gdp = 109000000000 WHERE name = 'Montequilla';

-- Update seed_stats so shard resets preserve this value
UPDATE nations
SET seed_stats = jsonb_set(seed_stats, '{gdp}', '109000000000')
WHERE name = 'Montequilla' AND seed_stats IS NOT NULL;

-- Verify
SELECT name, gdp, seed_stats->>'gdp' AS seed_gdp
FROM nations WHERE name = 'Montequilla';
