-- Add public_tracker_last_tick to autocracy_tracker
-- Tracks the tick when public_tracker_value was last synced (1d3 rolled a 3)
ALTER TABLE autocracy_tracker
    ADD COLUMN IF NOT EXISTS public_tracker_last_tick INTEGER;
