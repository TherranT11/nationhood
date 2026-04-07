-- Semi-Presidential No-Confidence Tracking
-- Tracks when the last successful no-confidence vote passed (for dissolution penalty).

ALTER TABLE nations ADD COLUMN IF NOT EXISTS last_vonc_tick INT DEFAULT NULL;
