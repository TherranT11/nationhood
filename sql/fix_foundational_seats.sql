-- ============================================================
-- Fix: Redistribute seats after foundational law left empty seats
--
-- When a foundational bill passed but seat redistribution failed
-- (no election data), the nation's total_seats was updated but
-- faction seats were not rescaled, leaving empty/unallocated seats.
--
-- This script proportionally scales existing faction seats to
-- match the nation's current total_seats.
--
-- Usage: Set the nation_id below, then run.
-- ============================================================

DO $$
DECLARE
    v_nation_id UUID;
    v_total_seats INT;
    v_current_sum INT;
    v_faction RECORD;
    v_quota NUMERIC;
    v_guaranteed INT;
    v_allocated INT := 0;
    v_fractionals JSONB := '[]'::JSONB;
    v_remaining INT;
    v_i INT;
    v_fid TEXT;
BEGIN
    -- ========== SET YOUR NATION ID HERE ==========
    -- Find it with: SELECT id, name, total_seats FROM nations;
    -- v_nation_id := 'YOUR-NATION-UUID-HERE'::UUID;

    -- Or auto-detect: find nations where faction seats don't sum to total_seats
    FOR v_nation_id, v_total_seats IN
        SELECT n.id, n.total_seats
        FROM nations n
        WHERE n.total_seats IS NOT NULL
          AND n.total_seats > 0
          AND (
              SELECT COALESCE(SUM(f.seats), 0)
              FROM factions f
              WHERE f.nation_id = n.id AND f.faction_type = 'party'
          ) <> n.total_seats
    LOOP
        SELECT COALESCE(SUM(f.seats), 0) INTO v_current_sum
        FROM factions f
        WHERE f.nation_id = v_nation_id AND f.faction_type = 'party';

        RAISE NOTICE 'Nation %: total_seats=%, faction sum=%. Fixing...', v_nation_id, v_total_seats, v_current_sum;

        IF v_current_sum = 0 THEN
            -- Edge case: all parties at 0 seats, distribute evenly
            DECLARE
                v_count INT;
                v_per INT;
                v_rem INT;
                v_idx INT := 0;
            BEGIN
                SELECT COUNT(*) INTO v_count FROM factions WHERE nation_id = v_nation_id AND faction_type = 'party';
                v_per := v_total_seats / v_count;
                v_rem := v_total_seats - v_per * v_count;
                FOR v_faction IN SELECT id FROM factions WHERE nation_id = v_nation_id AND faction_type = 'party' ORDER BY id LOOP
                    UPDATE factions SET seats = v_per + (CASE WHEN v_idx < v_rem THEN 1 ELSE 0 END) WHERE id = v_faction.id;
                    v_idx := v_idx + 1;
                END LOOP;
            END;
        ELSE
            -- Largest Remainder (Hare Quota) redistribution
            v_allocated := 0;
            v_fractionals := '[]'::JSONB;

            FOR v_faction IN
                SELECT id, seats FROM factions
                WHERE nation_id = v_nation_id AND faction_type = 'party' AND seats > 0
                ORDER BY seats DESC
            LOOP
                v_quota := (v_faction.seats::NUMERIC / v_current_sum) * v_total_seats;
                v_guaranteed := FLOOR(v_quota);
                UPDATE factions SET seats = v_guaranteed WHERE id = v_faction.id;
                v_allocated := v_allocated + v_guaranteed;
                v_fractionals := v_fractionals || jsonb_build_object(
                    'id', v_faction.id,
                    'frac', v_quota - v_guaranteed
                );
            END LOOP;

            -- Distribute remaining seats by largest fractional remainder
            v_remaining := v_total_seats - v_allocated;

            -- Sort by fractional desc and award remaining seats
            FOR v_i IN 0..(jsonb_array_length(v_fractionals) - 1) LOOP
                EXIT WHEN v_remaining <= 0;
                -- Find the entry with the largest fractional
                SELECT val->>'id' INTO v_fid
                FROM (
                    SELECT elem AS val, (elem->>'frac')::NUMERIC AS frac
                    FROM jsonb_array_elements(v_fractionals) AS elem
                    ORDER BY frac DESC
                    OFFSET v_i LIMIT 1
                ) sub;

                IF v_fid IS NOT NULL THEN
                    UPDATE factions SET seats = seats + 1 WHERE id = v_fid::UUID;
                    v_remaining := v_remaining - 1;
                END IF;
            END LOOP;
        END IF;

        -- Verify
        SELECT COALESCE(SUM(f.seats), 0) INTO v_current_sum
        FROM factions f WHERE f.nation_id = v_nation_id AND f.faction_type = 'party';
        RAISE NOTICE 'Nation % fixed: faction sum now = % (target: %)', v_nation_id, v_current_sum, v_total_seats;
    END LOOP;
END $$;
