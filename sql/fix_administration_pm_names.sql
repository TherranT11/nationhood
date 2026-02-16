-- Backfill administration records with missing data.
--
-- 1) PM names: rolloverAdministration() created admin records before PM
--    selection, so prime_minister and admin_name were never populated.
-- 2) Coalition seats: some records were created when factions.seats was 0
--    (before seats were synced), so coalition_parties JSONB has seats: 0.
--
-- Run once in the Supabase SQL editor.

-- ============================================================
-- PART 1: Fix null prime_minister
-- ============================================================

-- 1a) Closed administrations: match HoG by appointed_tick within tenure
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

-- 1b) Open administrations: use the currently active HoG
UPDATE administrations a
SET prime_minister = hog.first_name || ' ' || hog.last_name,
    admin_name    = hog.last_name || ' Administration',
    updated_at    = now()
FROM head_of_government hog
WHERE hog.nation_id = a.nation_id
  AND hog.active = true
  AND a.prime_minister IS NULL
  AND a.ended_at_tick IS NULL;

-- ============================================================
-- PART 2: Fix coalition_parties with 0 seats and total_seats = 0
-- ============================================================

-- Rebuild coalition_parties JSONB and total_seats from current factions data
-- for any administration where total_seats is 0 but the coalition has parties.
UPDATE administrations a
SET coalition_parties = cp.rebuilt_parties,
    total_seats      = cp.rebuilt_total,
    updated_at       = now()
FROM (
    SELECT
        a2.id AS admin_id,
        jsonb_agg(
            jsonb_build_object(
                'party_id', f.id,
                'party_name', f.faction_name,
                'seats', f.seats
            )
            ORDER BY f.faction_name
        ) AS rebuilt_parties,
        SUM(f.seats) AS rebuilt_total
    FROM administrations a2,
         jsonb_array_elements(a2.coalition_parties) elem
    JOIN factions f ON f.id = (elem->>'party_id')::uuid
    WHERE a2.total_seats = 0
      AND jsonb_array_length(a2.coalition_parties) > 0
    GROUP BY a2.id
) cp
WHERE a.id = cp.admin_id
  AND cp.rebuilt_total > 0;
