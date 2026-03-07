-- Add last_rename_tick column to factions for tracking rename cooldowns.
-- Rename is locked for 60 ticks after each rename action.
ALTER TABLE factions ADD COLUMN IF NOT EXISTS last_rename_tick INTEGER DEFAULT 0;
