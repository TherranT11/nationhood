-- Add convictions JSONB column to faction_ideology.
-- Stores per-axis conviction stacks (0-3) for the Double Down action.
-- Example: { "tradition_progress": 2, "liberty_equality": 1 }

ALTER TABLE faction_ideology ADD COLUMN IF NOT EXISTS convictions JSONB DEFAULT '{}'::JSONB;
