-- Vessel Insurance support.
-- Extends finance_loan_requests to handle vessel insurance alongside
-- construction insurance, loans, and bonds.

-- Link insurance requests to a specific vessel (in addition to construction contracts)
ALTER TABLE finance_loan_requests
    ADD COLUMN IF NOT EXISTS insured_vessel_id UUID REFERENCES corp_vessels(id) ON DELETE SET NULL;

-- Index for looking up insurance by vessel
CREATE INDEX IF NOT EXISTS idx_loan_requests_insured_vessel ON finance_loan_requests(insured_vessel_id)
    WHERE insured_vessel_id IS NOT NULL;

-- Track which vessel an active policy covers
ALTER TABLE finance_active_loans
    ADD COLUMN IF NOT EXISTS insured_vessel_id UUID REFERENCES corp_vessels(id) ON DELETE SET NULL;
