-- Fix stale president records after re-election.
--
-- When processPresidentialElectionResult failed to create a new president record
-- (candidate lookup failure, silent deactivation error, etc.), the old president
-- stays active with the first-term term_ends_tick and terms_served = 1.
--
-- This migration detects active presidents whose term_ends_tick has passed AND
-- who have a completed presidential election AFTER their term_ends_tick (meaning
-- they were re-elected but the inauguration failed). It patches their record to
-- reflect the re-election: new term_ends_tick, incremented terms_served, and
-- updated elected_tick.

-- Preview: show affected presidents before fixing
-- SELECT p.id, p.first_name, p.last_name, p.elected_tick, p.term_ends_tick, p.terms_served,
--        e.election_tick AS reelection_tick, n.name AS nation_name,
--        s.current_tick
-- FROM presidents p
-- JOIN nations n ON n.id = p.nation_id
-- JOIN shard s ON s.name = 'Alpha Shard'
-- JOIN elections e ON e.nation_id = p.nation_id
--     AND e.election_type = 'presidential'
--     AND e.status = 'completed'
--     AND e.election_tick >= p.term_ends_tick
-- WHERE p.is_active = true
--   AND p.term_ends_tick <= s.current_tick
-- ORDER BY e.election_tick DESC;

-- Fix: update the stale president record with re-election data
UPDATE presidents p
SET
    elected_tick   = sub.reelection_tick,
    term_ends_tick = sub.reelection_tick + 48,  -- PRESIDENTIAL_TERM_TICKS
    terms_served   = p.terms_served + sub.elections_since_term
FROM (
    SELECT DISTINCT ON (p2.id)
        p2.id AS president_id,
        e.election_tick AS reelection_tick,
        -- Count how many presidential elections happened since this president's term started
        (SELECT COUNT(*)
         FROM elections e2
         WHERE e2.nation_id = p2.nation_id
           AND e2.election_type = 'presidential'
           AND e2.status = 'completed'
           AND e2.election_tick > p2.elected_tick
        ) AS elections_since_term
    FROM presidents p2
    JOIN shard s ON s.name = 'Alpha Shard'
    JOIN elections e ON e.nation_id = p2.nation_id
        AND e.election_type = 'presidential'
        AND e.status = 'completed'
        AND e.election_tick >= p2.term_ends_tick
    WHERE p2.is_active = true
      AND p2.term_ends_tick <= s.current_tick
    ORDER BY p2.id, e.election_tick DESC
) sub
WHERE p.id = sub.president_id;
