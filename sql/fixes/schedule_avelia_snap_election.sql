-- Schedule a snap election in Avelia in 2 ticks from current tick.
-- Cancels any existing scheduled elections for Avelia first.

DO $$
DECLARE
    v_nation_id UUID;
    v_current_tick INT;
BEGIN
    SELECT id INTO v_nation_id FROM nations WHERE name = 'Avelia';
    SELECT current_tick INTO v_current_tick FROM shard WHERE name = 'Alpha Shard';

    -- Cancel any existing scheduled elections
    UPDATE elections
    SET status = 'cancelled'
    WHERE nation_id = v_nation_id
      AND status = 'scheduled';

    -- Schedule snap election in 2 ticks
    INSERT INTO elections (nation_id, election_tick, election_type, status)
    VALUES (v_nation_id, v_current_tick + 2, 'parliamentary', 'scheduled');

    RAISE NOTICE 'Snap election scheduled for Avelia at tick % (current: %)', v_current_tick + 2, v_current_tick;
END $$;
