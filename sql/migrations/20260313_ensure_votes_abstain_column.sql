-- Ensure votes_abstain and quorum_failures columns exist on bills table.
-- These were originally added in 20260227_bill_voting_overhaul.sql but may not
-- have been applied to all environments, causing PGRST204 schema cache errors.

ALTER TABLE bills ADD COLUMN IF NOT EXISTS votes_abstain INT DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS quorum_failures INT DEFAULT 0;

-- Reload PostgREST schema cache so it picks up the new columns immediately.
NOTIFY pgrst, 'reload schema';
