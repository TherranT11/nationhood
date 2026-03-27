-- Add last_refresh_tick column to leadership_candidates table.
-- Used to track when candidates were last refreshed (to enforce once-per-tick limit).
ALTER TABLE leadership_candidates
    ADD COLUMN IF NOT EXISTS last_refresh_tick INTEGER DEFAULT NULL;
