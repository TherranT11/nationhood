-- Ambassador Term Limits: 36-tick automatic retirement
-- Adds term tracking columns to the ambassadors table.

ALTER TABLE ambassadors ADD COLUMN IF NOT EXISTS term_length INT NOT NULL DEFAULT 36;
ALTER TABLE ambassadors ADD COLUMN IF NOT EXISTS retirement_warning_shown BOOLEAN NOT NULL DEFAULT false;

-- Backfill: set appointed_at_tick for existing active ambassadors that are missing it
UPDATE ambassadors
SET appointed_at_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1)
WHERE is_active = true
  AND status = 'active'
  AND appointed_at_tick IS NULL;
