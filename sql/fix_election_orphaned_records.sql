-- Fix orphaned completed election records that are missing results.
-- These were created when processElections marked scheduled records as
-- 'completed' without copying the results from the SQL RPC call.
-- This caused processGovernmentVacancy to non-deterministically pick up
-- the wrong record, leading to false snap election cycles.

-- Backfill results from the sibling record that has them
UPDATE elections e1
SET results = (
    SELECT e2.results
    FROM elections e2
    WHERE e2.nation_id = e1.nation_id
      AND e2.election_tick = e1.election_tick
      AND e2.status = 'completed'
      AND e2.results IS NOT NULL
    LIMIT 1
)
WHERE e1.status = 'completed' AND e1.results IS NULL;
