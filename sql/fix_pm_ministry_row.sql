-- Fix PM ministry rows that have null party_id/minister data.
--
-- selectPMCandidate() wrote to head_of_government but never updated the
-- ministries table, leaving the prime_minister row vacant.
--
-- This backfills PM ministry rows from the active head_of_government data.
-- Run once in the Supabase SQL editor.

UPDATE ministries m
SET party_id = hog.faction_id,
    minister_first_name = hog.first_name,
    minister_last_name = hog.last_name,
    minister_age = hog.age,
    minister_approval = COALESCE(m.minister_approval, 50)
FROM head_of_government hog
WHERE hog.nation_id = m.nation_id
  AND hog.active = true
  AND m.ministry_key = 'prime_minister'
  AND m.is_active = true
  AND m.party_id IS NULL;
