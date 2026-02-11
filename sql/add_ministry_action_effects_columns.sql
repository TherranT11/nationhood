-- Add columns to ministry_action_log for tick-based stat effect processing.
-- Run this in the Supabase SQL Editor.

ALTER TABLE ministry_action_log
ADD COLUMN IF NOT EXISTS stat_effects JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS effects_applied_through_tick INT DEFAULT NULL;

-- Index for the tick processor to efficiently find unprocessed actions
CREATE INDEX IF NOT EXISTS idx_ministry_action_log_unprocessed
ON ministry_action_log (nation_id)
WHERE processed = false;
