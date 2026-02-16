-- Add per-bloc donor cooldown tracking to faction_bloc_approval
ALTER TABLE faction_bloc_approval
ADD COLUMN IF NOT EXISTS donor_cooldown_until_tick INTEGER DEFAULT 0;
