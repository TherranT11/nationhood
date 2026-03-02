-- Ambassador term limits + extend to 60 ticks (5 years).
-- Combines 20260219 migration (add columns) with 60-tick update.

-- Add columns if they don't exist yet
ALTER TABLE ambassadors ADD COLUMN IF NOT EXISTS term_length INT NOT NULL DEFAULT 60;
ALTER TABLE ambassadors ADD COLUMN IF NOT EXISTS retirement_warning_shown BOOLEAN NOT NULL DEFAULT false;

-- If term_length already existed with default 36, update the default
ALTER TABLE ambassadors ALTER COLUMN term_length SET DEFAULT 60;

-- Backfill: set appointed_at_tick for existing active ambassadors that are missing it
UPDATE ambassadors
SET appointed_at_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1)
WHERE is_active = true
  AND status = 'active'
  AND appointed_at_tick IS NULL;

-- Update any existing ambassadors still on the old 36-tick term
UPDATE ambassadors
SET term_length = 60
WHERE is_active = true
  AND status = 'active'
  AND term_length = 36;
