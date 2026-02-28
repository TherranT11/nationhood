-- Track when a player last loaded any game page (login activity).
-- Replaces last_ap_spent_tick which only tracked AP-spending actions
-- and missed votes/chat/browsing.

ALTER TABLE factions
ADD COLUMN IF NOT EXISTS last_seen_tick INTEGER DEFAULT NULL;

-- Backfill: set existing players to their last_ap_spent_tick or founded_tick
UPDATE factions
SET last_seen_tick = COALESCE(last_ap_spent_tick, founded_tick)
WHERE nation_id IS NOT NULL
  AND last_seen_tick IS NULL;

-- Drop the old column — no longer used anywhere
ALTER TABLE factions
DROP COLUMN IF EXISTS last_ap_spent_tick;
