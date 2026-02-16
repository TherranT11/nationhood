-- Backfill administration records that have null prime_minister.
--
-- rolloverAdministration() created admin records before PM selection,
-- so prime_minister and admin_name were never populated.
-- selectPMCandidate() now updates the admin record going forward,
-- but existing records need this one-time patch.
--
-- Strategy: join each null-PM administration to the head_of_government
-- whose appointed_tick falls within that administration's tenure.
-- For the current open administration, use the active HoG.
-- Run once in the Supabase SQL editor.

-- 1) Fix closed administrations: match HoG by appointed_tick within tenure
UPDATE administrations a
SET prime_minister = hog.first_name || ' ' || hog.last_name,
    admin_name    = hog.last_name || ' Administration',
    updated_at    = now()
FROM head_of_government hog
WHERE hog.nation_id = a.nation_id
  AND hog.appointed_tick >= a.started_at_tick
  AND hog.appointed_tick <= a.ended_at_tick
  AND a.prime_minister IS NULL
  AND a.ended_at_tick IS NOT NULL;

-- 2) Fix open administrations: use the currently active HoG
UPDATE administrations a
SET prime_minister = hog.first_name || ' ' || hog.last_name,
    admin_name    = hog.last_name || ' Administration',
    updated_at    = now()
FROM head_of_government hog
WHERE hog.nation_id = a.nation_id
  AND hog.active = true
  AND a.prime_minister IS NULL
  AND a.ended_at_tick IS NULL;
