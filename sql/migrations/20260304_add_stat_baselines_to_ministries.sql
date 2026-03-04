-- Migration: Add stat_baselines JSONB column to ministries table
-- Stores a snapshot of each ministry's owned stats at the time the minister was appointed.
-- Used by the delta-based minister approval system to judge ministers on improvement
-- rather than inherited stat values.

ALTER TABLE ministries ADD COLUMN IF NOT EXISTS stat_baselines JSONB DEFAULT NULL;

COMMENT ON COLUMN ministries.stat_baselines IS 'Snapshot of owned stat values at minister appointment time. Used for delta-based approval calculation.';
