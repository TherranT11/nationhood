-- HOTFIX: Fix stuck Carrasco administration for Palvera
-- The old Carrasco admin (Solar Union of Labour) was never closed when
-- Espinoza (National Unity Party) won the presidential election.
-- The unique constraint (uniq_open_administration_per_nation) then blocked
-- the new Espinoza admin from being created.

-- Step 1: Find the nation and verify state
-- (Run this SELECT first to confirm before applying the UPDATE/INSERT)
SELECT
    a.id,
    a.admin_name,
    a.head_of_state,
    a.president_name,
    a.president_party_name,
    a.total_seats,
    a.started_at_tick,
    a.started_at_date,
    a.ended_at_tick,
    a.end_reason,
    n.name AS nation_name,
    n.id AS nation_id
FROM administrations a
JOIN nations n ON n.id = a.nation_id
WHERE a.ended_at_tick IS NULL
  AND a.president_party_name = 'Solar Union of Labour'
  AND a.admin_name LIKE 'Carrasco%';

-- Step 2: Close the old Carrasco administration
-- (Uncomment and run after verifying Step 1)
/*
WITH target AS (
    SELECT a.id, a.nation_id, n.name AS nation_name
    FROM administrations a
    JOIN nations n ON n.id = a.nation_id
    WHERE a.ended_at_tick IS NULL
      AND a.president_party_name = 'Solar Union of Labour'
      AND a.admin_name LIKE 'Carrasco%'
    LIMIT 1
),
shard_info AS (
    SELECT current_tick, current_date FROM shard WHERE name = 'Alpha Shard'
)
UPDATE administrations
SET
    ended_at_tick = (SELECT current_tick FROM shard_info),
    ended_at_date = (SELECT current_date FROM shard_info),
    end_reason = 'election_loss',
    stats_at_end = COALESCE(stats_at_end, '{}'::JSONB),
    updated_at = now()
WHERE id = (SELECT id FROM target);
*/

-- Step 3: Create the new Espinoza / NUP administration
-- (Uncomment and run after Step 2)
/*
WITH president_info AS (
    SELECT p.first_name, p.last_name, p.faction_id, p.nation_id, p.elected_tick
    FROM presidents p
    WHERE p.is_active = true
      AND EXISTS (
          SELECT 1 FROM factions f
          WHERE f.id = p.faction_id
            AND f.faction_name = 'National Unity Party'
      )
    LIMIT 1
),
faction_info AS (
    SELECT f.id, f.faction_name, f.seats, f.approval_rating
    FROM factions f
    JOIN president_info pi ON pi.faction_id = f.id
),
nation_info AS (
    SELECT n.*
    FROM nations n
    JOIN president_info pi ON pi.nation_id = n.id
),
shard_info AS (
    SELECT current_tick, current_date FROM shard WHERE name = 'Alpha Shard'
)
INSERT INTO administrations (
    nation_id,
    admin_name,
    head_of_state,
    president_name,
    president_party_id,
    president_party_name,
    coalition_parties,
    total_seats,
    government_type,
    started_at_tick,
    started_at_date,
    stats_at_start,
    approval_at_start,
    head_of_state_title
)
SELECT
    pi.nation_id,
    pi.last_name || ' Administration, 2012',
    pi.first_name || ' ' || pi.last_name,
    pi.first_name || ' ' || pi.last_name,
    fi.id,
    fi.faction_name,
    jsonb_build_array(jsonb_build_object(
        'party_id', fi.id,
        'party_name', fi.faction_name,
        'seats', fi.seats
    )),
    fi.seats,
    'Presidential',
    pi.elected_tick,
    (SELECT current_date FROM shard_info),
    jsonb_build_object(
        'gdp', ni.gdp,
        'stability', ni.stability,
        'approval', fi.approval_rating
    ),
    fi.approval_rating,
    ni.head_of_state_title
FROM president_info pi
JOIN faction_info fi ON true
JOIN nation_info ni ON true;
*/
