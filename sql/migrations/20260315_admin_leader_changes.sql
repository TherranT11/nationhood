-- Add leader_changes JSONB column to administrations table
-- Stores party leadership changes that occurred during each administration
-- Format: [{role, description, tick}, ...]

ALTER TABLE administrations
    ADD COLUMN IF NOT EXISTS leader_changes JSONB;
