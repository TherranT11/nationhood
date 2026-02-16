-- Add disband cooldown column to factions table
-- Tracks tick until which a user cannot disband their party again (24-tick cooldown)
ALTER TABLE factions
ADD COLUMN IF NOT EXISTS disband_cooldown_until_tick INTEGER DEFAULT NULL;
