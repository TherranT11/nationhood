-- Repair Hajjara seat totals: HNF + RSA + TAC + PRF should sum to nation.total_seats (100).
-- Current state (per screenshot): HNF=72, RSA=30, TAC=1, PRF=0 => 103 (3 over cap).
-- Fix: take 3 from the king (HNF) so king now seats = 69, sum = 100.
-- Run as a single transaction so it either fully applies or fully rolls back.

BEGIN;

DO $$
DECLARE
    v_nation_id uuid;
    v_cap       int;
    v_sum       int;
BEGIN
    SELECT id, COALESCE(total_seats, 100)
      INTO v_nation_id, v_cap
      FROM nations
     WHERE name = 'Hajjara'
     LIMIT 1;

    IF v_nation_id IS NULL THEN
        RAISE EXCEPTION 'Hajjara nation not found';
    END IF;

    SELECT COALESCE(SUM(GREATEST(seats, 0)), 0)
      INTO v_sum
      FROM factions
     WHERE nation_id = v_nation_id
       AND faction_type = 'party'
       AND abandoned_at IS NULL;

    RAISE NOTICE 'Hajjara: cap=%, current sum=%, delta=%', v_cap, v_sum, v_sum - v_cap;

    -- If the sum exceeds the cap, trim the surplus from the king (Hajjar National Front).
    IF v_sum > v_cap THEN
        UPDATE factions
           SET seats = GREATEST(1, seats - (v_sum - v_cap))
         WHERE nation_id = v_nation_id
           AND faction_type = 'party'
           AND abandoned_at IS NULL
           AND faction_name = 'The Hajjar National Front';
    -- If the sum is below the cap, top the king up so the sum matches.
    ELSIF v_sum < v_cap THEN
        UPDATE factions
           SET seats = seats + (v_cap - v_sum)
         WHERE nation_id = v_nation_id
           AND faction_type = 'party'
           AND abandoned_at IS NULL
           AND faction_name = 'The Hajjar National Front';
    END IF;

    -- Final invariant check.
    SELECT COALESCE(SUM(GREATEST(seats, 0)), 0)
      INTO v_sum
      FROM factions
     WHERE nation_id = v_nation_id
       AND faction_type = 'party'
       AND abandoned_at IS NULL;

    IF v_sum <> v_cap THEN
        RAISE EXCEPTION 'Hajjara seat sum % does not match cap % after fix', v_sum, v_cap;
    END IF;

    RAISE NOTICE 'Hajjara repaired: sum now matches cap (%).', v_cap;
END $$;

-- Verify final state.
SELECT faction_name, abbreviation, seats
  FROM factions
 WHERE nation_id = (SELECT id FROM nations WHERE name = 'Hajjara' LIMIT 1)
   AND faction_type = 'party'
   AND abandoned_at IS NULL
 ORDER BY seats DESC NULLS LAST, faction_name;

COMMIT;
