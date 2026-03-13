-- Reset last_seen_tick for ALL active factions to current shard tick.
-- This ensures inactivity tracking starts fresh from this moment,
-- so no one is penalized for activity before the system was deployed.
UPDATE factions
SET last_seen_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard')
WHERE nation_id IS NOT NULL
  AND abandoned_at IS NULL;
