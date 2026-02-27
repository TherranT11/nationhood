-- Add inactivity tracking column to factions table
-- Tracks the last tick at which a faction spent AP (action points).
-- Used by processInactivityDecay() to penalise idle factions.
ALTER TABLE factions
ADD COLUMN IF NOT EXISTS last_ap_spent_tick INTEGER DEFAULT NULL;

-- Backfill last_ap_spent_tick for existing factions that are in a nation
-- so they aren't immediately penalised by the new inactivity decay system.
-- Sets it to the current shard tick for any faction missing the value.
UPDATE factions
SET last_ap_spent_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard')
WHERE nation_id IS NOT NULL
  AND last_ap_spent_tick IS NULL;
