-- Backfill administration coalition_parties seat counts
-- Some administrations were created before the seat-capture logic existed,
-- or by migrations that read from factions at a time when seats were 0.
-- This patches them by looking up the nearest completed election before
-- the administration's start tick and pulling seat data from its results.

DO $$
DECLARE
    rec RECORD;
    election_results JSONB;
    seat_results JSONB;
    new_parties JSONB;
    new_total INT;
    party JSONB;
    party_seats INT;
    seat_entry JSONB;
BEGIN
    -- Find administrations where all coalition parties have 0 seats
    FOR rec IN
        SELECT a.id, a.nation_id, a.started_at_tick, a.coalition_parties, a.admin_name
        FROM administrations a
        WHERE a.coalition_parties IS NOT NULL
          AND jsonb_array_length(a.coalition_parties) > 0
          -- Check if total seats across all parties is 0
          AND (
              SELECT COALESCE(SUM((p->>'seats')::int), 0)
              FROM jsonb_array_elements(a.coalition_parties) p
          ) = 0
    LOOP
        -- Find the most recent completed election before this administration started
        SELECT e.results INTO election_results
        FROM elections e
        WHERE e.nation_id = rec.nation_id
          AND e.status = 'completed'
          AND e.results IS NOT NULL
          AND e.election_tick <= rec.started_at_tick
        ORDER BY e.election_tick DESC
        LIMIT 1;

        IF election_results IS NULL THEN
            RAISE NOTICE 'No election found for admin % (nation %, tick %)',
                rec.admin_name, rec.nation_id, rec.started_at_tick;
            CONTINUE;
        END IF;

        seat_results := election_results->'seats';
        IF seat_results IS NULL OR jsonb_array_length(seat_results) = 0 THEN
            RAISE NOTICE 'No seat results for admin % (nation %, tick %)',
                rec.admin_name, rec.nation_id, rec.started_at_tick;
            CONTINUE;
        END IF;

        -- Rebuild coalition_parties with seat counts from the election
        new_parties := '[]'::jsonb;
        new_total := 0;

        FOR party IN SELECT * FROM jsonb_array_elements(rec.coalition_parties)
        LOOP
            party_seats := 0;

            -- Find this party's seats in the election results
            FOR seat_entry IN SELECT * FROM jsonb_array_elements(seat_results)
            LOOP
                IF seat_entry->>'party_id' = party->>'party_id' THEN
                    party_seats := (seat_entry->>'seats')::int;
                    EXIT;
                END IF;
            END LOOP;

            -- If not found in election results, try current factions table as fallback
            IF party_seats = 0 THEN
                SELECT f.seats INTO party_seats
                FROM factions f
                WHERE f.id = (party->>'party_id')::uuid;
                party_seats := COALESCE(party_seats, 0);
            END IF;

            new_parties := new_parties || jsonb_build_array(
                jsonb_build_object(
                    'party_id', party->>'party_id',
                    'party_name', party->>'party_name',
                    'seats', party_seats
                )
            );
            new_total := new_total + party_seats;
        END LOOP;

        -- Only update if we actually found seat data
        IF new_total > 0 THEN
            UPDATE administrations
            SET coalition_parties = new_parties,
                total_seats = new_total,
                updated_at = now()
            WHERE id = rec.id;

            RAISE NOTICE 'Updated admin "%" (id=%): total_seats % -> %',
                rec.admin_name, rec.id, 0, new_total;
        ELSE
            RAISE NOTICE 'Could not find seat data for admin "%" (id=%)',
                rec.admin_name, rec.id;
        END IF;
    END LOOP;
END $$;
