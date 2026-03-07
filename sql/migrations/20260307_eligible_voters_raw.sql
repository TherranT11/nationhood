-- Convert eligible_voters from 0-100 percentage to raw voter count.
-- Previously eligible_voters was stored as a percentage (e.g. 65 = 65% of population).
-- Now it stores the actual count of eligible voters (e.g. 4,322,500).
--
-- Formula: new_value = ROUND(population * old_eligible_voters / 100)

-- 1. Preview: show current values and what they'll become
SELECT name, population, eligible_voters,
    ROUND(population * eligible_voters / 100.0) AS new_eligible_voters
FROM nations ORDER BY name;

-- 2. Convert eligible_voters from percentage to raw count
UPDATE nations
SET eligible_voters = ROUND(population * eligible_voters / 100.0)
WHERE eligible_voters <= 100 AND population > 1000;

-- 3. Update seed_stats JSONB so shard resets preserve correct values
UPDATE nations
SET seed_stats = jsonb_set(seed_stats, '{eligible_voters}',
    to_jsonb(ROUND(population * (seed_stats->>'eligible_voters')::numeric / 100.0)))
WHERE seed_stats IS NOT NULL
  AND seed_stats ? 'eligible_voters'
  AND (seed_stats->>'eligible_voters')::numeric <= 100;

-- 4. Verify: eligible_voters should now be in the millions
SELECT name, population, eligible_voters,
    ROUND(eligible_voters * 100.0 / NULLIF(population, 0), 1) AS pct_check
FROM nations ORDER BY name;
