-- Add seed_stats JSONB column to nations table.
-- Stores a snapshot of all nation stats that the admin can restore on shard reset.
-- Run this once; the column is nullable (NULL = no seed saved yet).

ALTER TABLE nations ADD COLUMN IF NOT EXISTS seed_stats JSONB;

COMMENT ON COLUMN nations.seed_stats IS 'Admin-saved snapshot of original nation stats, used by shard reset to restore defaults';
