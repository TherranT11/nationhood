-- =========================================================================
-- Repair existing open administrations rows that have null PM / seats /
-- coalition fields by re-syncing them from the live game state.
--
-- The backfill in 20260429_backfill_administrations.sql only INSERTed
-- for nations missing a row. Pre-existing rows (e.g. Sangreza's
-- "Pacheco Administration", Hajjara's "Al-Shammari Administration")
-- carried null prime_minister + null total_seats from earlier in
-- development. This migration patches those fields IN PLACE on every
-- OPEN admin row (ended_at_tick IS NULL), but only when the existing
-- value is null/empty — never overwrites real data.
--
-- Idempotent: re-running just no-ops on already-populated rows.
-- =========================================================================

WITH live AS (
    SELECT
        n.id AS nation_id,
        -- Live PM name
        NULLIF(TRIM(
            COALESCE(hog.first_name, '') || ' ' ||
            COALESCE(hog.last_name, '')
        ), '') AS pm_name,
        pmf.faction_name AS pm_party_name,
        hog.faction_id   AS pm_party_id,
        -- Coalition snapshot expanded from active_coalitions.party_ids.
        -- Fallback for nations without an active_coalitions row: a
        -- single-party "coalition" containing just the PM's party so the
        -- card has something to show (better than an empty array).
        COALESCE(
            (
                SELECT jsonb_agg(jsonb_build_object(
                    'party_id',  f.id,
                    'party_name', f.faction_name,
                    'seats',      f.seats
                ))
                FROM unnest(ac.party_ids) pid(party_id)
                JOIN factions f ON f.id = pid.party_id
            ),
            CASE
                WHEN pmf.id IS NOT NULL THEN
                    jsonb_build_array(jsonb_build_object(
                        'party_id',   pmf.id,
                        'party_name', pmf.faction_name,
                        'seats',      pmf.seats
                    ))
                ELSE '[]'::jsonb
            END
        ) AS coalition_parties,
        -- Seat count: prefer the active coalition's total, fall back to
        -- the PM's party seats (single-party government), then 0.
        COALESCE(ac.total_seats, pmf.seats, 0) AS total_seats,
        n.government_type AS government_type,
        n.head_of_state_title AS head_of_state_title,
        NULLIF(TRIM(
            COALESCE(n.head_of_state_first_name, '') || ' ' ||
            COALESCE(n.head_of_state_last_name, '')
        ), '') AS hos_name
    FROM nations n
    LEFT JOIN head_of_government hog
        ON hog.nation_id = n.id AND hog.active = true
    LEFT JOIN factions pmf
        ON pmf.id = hog.faction_id
    LEFT JOIN active_coalitions ac
        ON ac.nation_id = n.id AND ac.dissolved_at IS NULL
)
UPDATE administrations a
SET
    -- Only patch fields that are currently null/empty so we never overwrite
    -- live data. coalition_parties is special: '[]'::jsonb is treated as
    -- empty and replaced if live has parties; non-empty existing arrays
    -- are preserved.
    prime_minister      = COALESCE(NULLIF(a.prime_minister, ''),    live.pm_name,           a.prime_minister),
    pm_party_name       = COALESCE(NULLIF(a.pm_party_name, ''),     live.pm_party_name,     a.pm_party_name),
    pm_party_id         = COALESCE(a.pm_party_id,                   live.pm_party_id),
    head_of_state       = COALESCE(NULLIF(a.head_of_state, ''),     live.hos_name,          a.head_of_state),
    head_of_state_title = COALESCE(NULLIF(a.head_of_state_title,''), live.head_of_state_title, a.head_of_state_title),
    government_type     = COALESCE(NULLIF(a.government_type, ''),   live.government_type,   a.government_type),
    total_seats         = CASE
                              WHEN a.total_seats IS NULL OR a.total_seats = 0
                                  THEN COALESCE(live.total_seats, a.total_seats)
                              ELSE a.total_seats
                          END,
    coalition_parties   = CASE
                              WHEN a.coalition_parties IS NULL
                                   OR jsonb_array_length(a.coalition_parties) = 0
                                  THEN live.coalition_parties
                              ELSE a.coalition_parties
                          END,
    updated_at          = now()
FROM live
WHERE a.nation_id = live.nation_id
  AND a.ended_at_tick IS NULL;

-- Verify: every open admin row should now carry a PM (or stay null only
-- if the nation legitimately has no head_of_government — e.g. caretaker
-- governments).
SELECT
    n.name              AS nation,
    a.admin_name,
    a.prime_minister,
    a.head_of_state,
    a.total_seats,
    jsonb_array_length(COALESCE(a.coalition_parties, '[]'::jsonb)) AS coalition_size,
    a.started_at_tick
FROM nations n
LEFT JOIN administrations a
    ON a.nation_id = n.id AND a.ended_at_tick IS NULL
ORDER BY n.name;
