-- Add last_action_tick column to factions for quick_study / slow_to_act trait tracking
ALTER TABLE factions ADD COLUMN IF NOT EXISTS last_action_tick integer DEFAULT 0;
