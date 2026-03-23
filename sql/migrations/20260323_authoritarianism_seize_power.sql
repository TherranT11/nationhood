-- Add column to track when the "Seize Power" option becomes available
-- after the Rise of Authoritarianism crisis has been active for 18+ ticks.
-- NULL = not available, non-null tick = available since that tick.

ALTER TABLE nations ADD COLUMN IF NOT EXISTS authoritarianism_seize_available_tick INT DEFAULT NULL;
