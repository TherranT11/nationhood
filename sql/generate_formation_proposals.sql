-- ══════════════════════════════════════════════════════════════
-- Auto-generate coalition formation proposals for nations
-- without an active government after an election.
--
-- For each nation that needs formation:
--   1. Finds the latest completed election
--   2. Picks the largest party as the proposer
--   3. Builds a coalition of the top N parties to reach majority
--   4. Inserts a government_formations row (status = 'active')
--   5. Auto-supports the proposal for each included party
--
-- Safe to run multiple times — skips nations that already have
-- an active proposal for the current election.
-- ══════════════════════════════════════════════════════════════

DO $$
DECLARE
    rec RECORD;
    nation_rec RECORD;
    party_rec RECORD;
    coalition_ids uuid[];
    coalition_seats int;
    majority_needed int;
    latest_election_id uuid;
    proposer_id uuid;
    formation_id uuid;
    game_date text;
    total_seats int;
BEGIN
    -- Get current game date from shard
    SELECT current_date INTO game_date FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Find nations that have a completed election but no formed government
    FOR nation_rec IN
        SELECT DISTINCT n.id AS nation_id, n.name AS nation_name
        FROM nations n
        -- Has at least one completed election
        JOIN elections e ON e.nation_id = n.id AND e.status = 'completed'
        -- No formed government currently active
        WHERE NOT EXISTS (
            SELECT 1 FROM government_formations gf
            WHERE gf.nation_id = n.id
            AND gf.status = 'formed'
        )
        -- Also check administrations (some older data might use this)
        AND NOT EXISTS (
            SELECT 1 FROM administrations a
            WHERE a.nation_id = n.id
            AND a.ended_at_tick IS NULL
        )
    LOOP
        -- Get the latest completed election for this nation
        SELECT e.id INTO latest_election_id
        FROM elections e
        WHERE e.nation_id = nation_rec.nation_id
        AND e.status = 'completed'
        ORDER BY e.election_tick DESC
        LIMIT 1;

        IF latest_election_id IS NULL THEN
            RAISE NOTICE 'Nation % — no completed election found, skipping', nation_rec.nation_name;
            CONTINUE;
        END IF;

        -- Skip if there's already an active proposal for this election
        IF EXISTS (
            SELECT 1 FROM government_formations gf
            WHERE gf.election_id = latest_election_id
            AND gf.status = 'active'
        ) THEN
            RAISE NOTICE 'Nation % — already has active proposal for election %, skipping', nation_rec.nation_name, latest_election_id;
            CONTINUE;
        END IF;

        -- Get all parties with seats, ordered by seats descending
        total_seats := 0;
        coalition_ids := ARRAY[]::uuid[];
        coalition_seats := 0;
        proposer_id := NULL;

        FOR party_rec IN
            SELECT f.id, f.faction_name, f.seats
            FROM factions f
            WHERE f.nation_id = nation_rec.nation_id
            AND f.faction_type = 'party'
            AND f.abandoned_at IS NULL
            AND (f.seats IS NOT NULL AND f.seats > 0)
            ORDER BY f.seats DESC
        LOOP
            total_seats := total_seats + party_rec.seats;
        END LOOP;

        -- Majority is >50% of seats
        majority_needed := (total_seats / 2) + 1;

        -- Build coalition from largest parties until majority reached
        FOR party_rec IN
            SELECT f.id, f.faction_name, f.seats
            FROM factions f
            WHERE f.nation_id = nation_rec.nation_id
            AND f.faction_type = 'party'
            AND f.abandoned_at IS NULL
            AND (f.seats IS NOT NULL AND f.seats > 0)
            ORDER BY f.seats DESC
        LOOP
            -- First party is the proposer
            IF proposer_id IS NULL THEN
                proposer_id := party_rec.id;
            END IF;

            coalition_ids := array_append(coalition_ids, party_rec.id);
            coalition_seats := coalition_seats + party_rec.seats;

            RAISE NOTICE '  Adding % (% seats) — coalition now: %/%',
                party_rec.faction_name, party_rec.seats, coalition_seats, majority_needed;

            IF coalition_seats >= majority_needed THEN
                EXIT; -- We have a majority
            END IF;
        END LOOP;

        IF proposer_id IS NULL OR array_length(coalition_ids, 1) IS NULL THEN
            RAISE NOTICE 'Nation % — no parties with seats, skipping', nation_rec.nation_name;
            CONTINUE;
        END IF;

        RAISE NOTICE 'Nation %: Creating proposal — % parties, %/% seats (need %)',
            nation_rec.nation_name, array_length(coalition_ids, 1),
            coalition_seats, total_seats, majority_needed;

        -- Insert the formation proposal
        INSERT INTO government_formations (
            nation_id, election_id, proposed_by, party_ids, status, game_year
        ) VALUES (
            nation_rec.nation_id, latest_election_id, proposer_id, coalition_ids, 'active', game_date
        ) RETURNING id INTO formation_id;

        -- Auto-support from each coalition party
        FOR i IN 1..array_length(coalition_ids, 1) LOOP
            INSERT INTO government_formation_support (formation_id, faction_id, supports)
            VALUES (formation_id, coalition_ids[i], true)
            ON CONFLICT DO NOTHING;
        END LOOP;

        RAISE NOTICE 'Nation %: Formation % created with % parties supporting',
            nation_rec.nation_name, formation_id, array_length(coalition_ids, 1);

    END LOOP;

    RAISE NOTICE 'Done — coalition formation proposals generated.';
END $$;
