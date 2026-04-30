-- =========================================================================
-- ALPHA STATS REFACTOR — Phase 9b: drop eligible_voters
--
-- The election engine doesn't actually need a separately stored
-- eligible_voters count — sectors + weight + base_turnout drive the
-- math, and the displayed "raw vote count" can be derived from
-- population × 0.65 (the typical voting-age share).
--
-- elections.js getEligibleVoters(nation) is the single source of truth
-- post-drop; all reads on the JS side now go through it.
-- =========================================================================

ALTER TABLE nations
    DROP COLUMN IF EXISTS eligible_voters;

ALTER TABLE nations_history
    DROP COLUMN IF EXISTS eligible_voters;

-- Spot-check: should return zero rows after this migration.
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('nations', 'nations_history')
  AND column_name = 'eligible_voters';
