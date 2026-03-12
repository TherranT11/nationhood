-- Add metadata JSONB column to bills table.
-- Used by tax_reform bills (stores tax_changes, proposer, context)
-- and minister_confirmation bills (stores pending_minister).
ALTER TABLE bills ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;
