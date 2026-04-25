-- ============================================================
-- Danwei election schedule — Phase 14 of new-nation walkthrough
-- ============================================================
-- Sets presidential term length / limit and the first election tick.
-- Run AFTER insert_danwei.sql (Phase 2) so the nations row exists.
-- Idempotent — pure UPDATE.
--
-- Term model (matches GAME_CONFIG defaults but pinned explicitly):
--   - presidential_term_ticks  = 48  (4-year term @ 1 tick = 1 month)
--   - presidential_term_limit  = 2   (Taiwan-style 2-term cap)
--   - parliamentary_term_ticks = NULL (presidential republic — no
--     separate legislative cycle; matches Sangreza precedent in
--     20260323_legislative_term_length_foundational.sql)
--   - election_frequency       = 48  (legacy fallback column —
--     coalition-formation.js:197 still reads it as a backup)
--
-- First election (caretaker handoff): 1D6 ticks from now. Rolled at
-- seed time via floor(random() * 6) + 1; the next_election_tick is
-- absolute (shard.current_tick + roll) so the caretaker holds for
-- exactly 1-6 ticks regardless of when this script runs.
-- ============================================================

UPDATE nations
   SET presidential_term_ticks  = 48,
       presidential_term_limit  = 2,
       parliamentary_term_ticks = NULL,
       election_frequency       = 48,
       next_election_tick       = (
           SELECT s.current_tick + (floor(random() * 6) + 1)::INT
             FROM shard s
            WHERE s.name = 'Alpha Shard'
       )
 WHERE LOWER(name) = 'danwei';

-- Verify: confirm scheduling columns + show how many ticks until the
-- caretaker handoff fires.
SELECT n.name,
       n.government_type,
       n.presidential_term_ticks,
       n.presidential_term_limit,
       n.parliamentary_term_ticks,
       n.election_frequency,
       s.current_tick                                AS shard_tick_now,
       n.next_election_tick                          AS first_election_tick,
       (n.next_election_tick - s.current_tick)       AS ticks_until_handoff
  FROM nations n
  JOIN shard s ON s.id = n.shard_id
 WHERE LOWER(n.name) = 'danwei';
