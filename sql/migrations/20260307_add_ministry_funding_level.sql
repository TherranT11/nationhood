-- Add explicit funding_level to ministries (1.0 = 100%)
-- This is the single source of truth for ministry funding state.
-- Future phases will modify this value; for now all ministries are fully funded.
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS funding_level NUMERIC DEFAULT 1.0;

-- Seed all existing ministry rows to 100%
UPDATE ministries SET funding_level = 1.0 WHERE funding_level IS NULL;
