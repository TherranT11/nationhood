-- Backfill last_ap_spent_tick for existing factions that are in a nation
-- so they aren't immediately penalised by the new inactivity decay system.
-- Sets it to the current shard tick for any faction missing the value.

UPDATE factions
SET last_ap_spent_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard')
WHERE nation_id IS NOT NULL
  AND last_ap_spent_tick IS NULL;
