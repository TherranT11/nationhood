-- ════════════════════════════════════════════════════════════════════════════════
-- Insurance System Fixes
--
-- Adds missing columns for proper insurance lifecycle tracking:
--   deductible_pct   — deductible % set during underwriting, used in claim calc
--   claims_count     — number of claims filed against the policy
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TABLE finance_active_loans
    ADD COLUMN IF NOT EXISTS deductible_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS claims_count INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN finance_active_loans.deductible_pct IS 'Insurance deductible percentage (5-25%). Set during policy underwriting. Applied to claim payouts.';
COMMENT ON COLUMN finance_active_loans.claims_count IS 'Number of insurance claims filed against this policy.';
