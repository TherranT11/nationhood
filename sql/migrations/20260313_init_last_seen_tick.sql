-- Backfill last_seen_tick for all active factions to current shard tick
-- so they don't immediately trigger inactivity penalties on deploy.
UPDATE factions
SET last_seen_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard')
WHERE nation_id IS NOT NULL
  AND abandoned_at IS NULL
  AND last_seen_tick IS NULL;
