-- Bill voting overhaul: quorum + majority system
--
-- Adds votes_abstain tracking and quorum_failures for the one-deferral system.
-- The quorum threshold is 50% of total seats for ordinary bills.
-- Foundational/impeachment/confidence bills use absolute thresholds with no quorum.

-- Track abstain votes on the bills table (currently only votes_for and votes_against exist)
ALTER TABLE bills ADD COLUMN IF NOT EXISTS votes_abstain INT DEFAULT 0;

-- Track quorum failures for the one-deferral system:
--   0 = no failures yet
--   1 = first failure (vote was deferred by 1 tick)
--   2+ = bill dies on second failure
ALTER TABLE bills ADD COLUMN IF NOT EXISTS quorum_failures INT DEFAULT 0;
