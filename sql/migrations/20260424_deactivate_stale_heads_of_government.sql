-- ============================================================
-- ONE-TIME CLEANUP: Deactivate stale head_of_government rows
--
-- Companion to the write-site fix in js/game/elections.js that
-- unconditionally deactivates the HoG on election completion.
-- That fix prevents the stale-PM bug going forward but does not
-- heal existing broken rows.
--
-- Stale = a PM row with active=true whose appointed_tick precedes
-- the most recent completed election for that nation. Those PMs
-- should have been flipped inactive when the newer election ran
-- but weren't, because the dissolution path was gated behind
-- "if (existingGov)" — legacy auto-appointments without a
-- government_formations row never hit that branch.
--
-- Example: Melizea's Delgado (appointed ~2000) remained active
-- through the completed 2001 and 2002 elections, suppressing the
-- Formation UI across both cycles.
--
-- Idempotent: re-running this migration is a no-op.
-- ============================================================

UPDATE head_of_government hog
   SET active = false
  FROM (
    SELECT nation_id, MAX(election_tick) AS latest_tick
      FROM elections
     WHERE status = 'completed'
     GROUP BY nation_id
  ) last_elec
 WHERE hog.nation_id      = last_elec.nation_id
   AND hog.active         = true
   AND hog.appointed_tick < last_elec.latest_tick;

-- Verify: report how many stale rows remain (should be 0).
SELECT COUNT(*) AS stale_hog_remaining
  FROM head_of_government hog
  JOIN (
    SELECT nation_id, MAX(election_tick) AS latest_tick
      FROM elections
     WHERE status = 'completed'
     GROUP BY nation_id
  ) last_elec ON hog.nation_id = last_elec.nation_id
 WHERE hog.active         = true
   AND hog.appointed_tick < last_elec.latest_tick;
