-- ============================================================
-- Repair: Redistribute seats for ALL nations where one party
-- has all seats and others have 0.
--
-- Strategy:
-- 1. For each nation, check if seats are monopolized (one party has all)
-- 2. If so, look for the last completed parliamentary election
-- 3. If election has vote data: redistribute by votes (fair proportional)
-- 4. If no election data: distribute evenly across all parties
-- ============================================================

DO $$
DECLARE
    v_nation RECORD;
    v_total_seats INT;
    v_party_count INT;
    v_max_seats INT;
    v_current_sum INT;
    v_faction RECORD;
    v_election RECORD;
    v_vote_entry RECORD;
    v_total_votes BIGINT;
    v_quota NUMERIC;
    v_guaranteed INT;
    v_allocated INT;
    v_fractionals JSONB;
    v_remaining INT;
    v_fid TEXT;
    v_per INT;
    v_rem INT;
    v_idx INT;
    v_repaired INT := 0;
BEGIN
    FOR v_nation IN
        SELECT n.id, n.name, n.total_seats
        FROM nations n
        WHERE n.total_seats IS NOT NULL AND n.total_seats > 0
    LOOP
        v_total_seats := v_nation.total_seats;

        -- Check party count and seat distribution
        SELECT COUNT(*), COALESCE(MAX(seats), 0), COALESCE(SUM(seats), 0)
        INTO v_party_count, v_max_seats, v_current_sum
        FROM factions
        WHERE nation_id = v_nation.id AND faction_type = 'party';

        -- Skip if no parties or seats look reasonable
        -- "Monopolized" = one party has >= 90% of total seats AND there are 2+ parties
        IF v_party_count < 2 THEN CONTINUE; END IF;
        IF v_max_seats < (v_total_seats * 0.9) THEN CONTINUE; END IF;

        RAISE NOTICE 'Nation "%" (%): max_seats=%, total=%, parties=%. Repairing...',
            v_nation.name, v_nation.id, v_max_seats, v_total_seats, v_party_count;

        -- Try to use last election vote data
        SELECT e.id, e.results
        INTO v_election
        FROM elections e
        WHERE e.nation_id = v_nation.id
          AND e.status = 'completed'
          AND e.election_type = 'parliamentary'
          AND e.results IS NOT NULL
        ORDER BY e.election_tick DESC
        LIMIT 1;

        IF v_election.results IS NOT NULL AND v_election.results->'votes' IS NOT NULL THEN
            -- Use election vote data for fair redistribution
            v_total_votes := 0;

            -- Calculate total votes from the election results
            FOR v_vote_entry IN
                SELECT
                    (elem->>'party_id') AS party_id,
                    COALESCE((elem->>'votes')::BIGINT, 0) AS votes
                FROM jsonb_array_elements(v_election.results->'votes') AS elem
            LOOP
                v_total_votes := v_total_votes + v_vote_entry.votes;
            END LOOP;

            IF v_total_votes > 0 THEN
                -- Largest Remainder (Hare Quota) seat allocation from votes
                v_allocated := 0;
                v_fractionals := '[]'::JSONB;
                v_quota := v_total_votes::NUMERIC / v_total_seats;

                -- First: set all parties to 0 (some may not be in the election results)
                UPDATE factions SET seats = 0
                WHERE nation_id = v_nation.id AND faction_type = 'party';

                FOR v_vote_entry IN
                    SELECT
                        (elem->>'party_id') AS party_id,
                        COALESCE((elem->>'votes')::BIGINT, 0) AS votes
                    FROM jsonb_array_elements(v_election.results->'votes') AS elem
                    WHERE COALESCE((elem->>'votes')::BIGINT, 0) > 0
                LOOP
                    v_guaranteed := FLOOR(v_vote_entry.votes::NUMERIC / v_quota);
                    UPDATE factions SET seats = v_guaranteed
                    WHERE id = v_vote_entry.party_id::UUID;
                    v_allocated := v_allocated + v_guaranteed;
                    v_fractionals := v_fractionals || jsonb_build_object(
                        'id', v_vote_entry.party_id,
                        'frac', (v_vote_entry.votes::NUMERIC / v_quota) - v_guaranteed
                    );
                END LOOP;

                -- Distribute remainder seats
                v_remaining := v_total_seats - v_allocated;
                FOR v_vote_entry IN
                    SELECT (elem->>'id') AS party_id
                    FROM jsonb_array_elements(v_fractionals) AS elem
                    ORDER BY (elem->>'frac')::NUMERIC DESC
                    LIMIT v_remaining
                LOOP
                    UPDATE factions SET seats = seats + 1
                    WHERE id = v_vote_entry.party_id::UUID;
                END LOOP;

                v_repaired := v_repaired + 1;
                RAISE NOTICE '  -> Redistributed from election vote data';
                CONTINUE;
            END IF;
        END IF;

        -- Fallback: distribute evenly across all parties
        v_per := v_total_seats / v_party_count;
        v_rem := v_total_seats - v_per * v_party_count;
        v_idx := 0;

        FOR v_faction IN
            SELECT id FROM factions
            WHERE nation_id = v_nation.id AND faction_type = 'party'
            ORDER BY id
        LOOP
            UPDATE factions SET seats = v_per + (CASE WHEN v_idx < v_rem THEN 1 ELSE 0 END)
            WHERE id = v_faction.id;
            v_idx := v_idx + 1;
        END LOOP;

        v_repaired := v_repaired + 1;
        RAISE NOTICE '  -> Distributed evenly (no election data)';
    END LOOP;

    RAISE NOTICE 'Repair complete: % nation(s) fixed', v_repaired;
END $$;
