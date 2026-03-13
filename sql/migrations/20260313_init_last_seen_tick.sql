-- Backfill last_seen_tick for all active factions to current shard tick
-- so they don't immediately trigger inactivity penalties on deploy.
-- Skips if shard is not yet initialized to avoid writing NULL.
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM shard WHERE name = 'Alpha Shard' AND current_tick > 0) = 0 THEN
        RAISE NOTICE 'Shard not initialized or tick is 0, skipping last_seen_tick backfill';
        RETURN;
    END IF;

    UPDATE factions
    SET last_seen_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard')
    WHERE nation_id IS NOT NULL
      AND abandoned_at IS NULL
      AND last_seen_tick IS NULL;
END $$;
