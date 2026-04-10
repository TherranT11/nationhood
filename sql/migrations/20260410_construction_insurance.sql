-- Construction Insurance support.
-- Extends finance_loan_requests to handle insurance policies alongside loans and bonds.

-- Drop the existing check constraint and replace with one that includes 'insurance'
ALTER TABLE finance_loan_requests DROP CONSTRAINT IF EXISTS finance_loan_requests_request_type_check;
ALTER TABLE finance_loan_requests ADD CONSTRAINT finance_loan_requests_request_type_check
    CHECK (request_type IN ('loan', 'bond', 'insurance'));

-- Link insurance requests to a specific construction contract
ALTER TABLE finance_loan_requests
    ADD COLUMN IF NOT EXISTS insured_contract_id UUID REFERENCES construction_contracts(id) ON DELETE SET NULL;

-- Track insurance claims on active policies
ALTER TABLE finance_active_loans
    ADD COLUMN IF NOT EXISTS claims_paid BIGINT NOT NULL DEFAULT 0;

-- Index for looking up insurance by contract
CREATE INDEX IF NOT EXISTS idx_loan_requests_insured_contract ON finance_loan_requests(insured_contract_id)
    WHERE insured_contract_id IS NOT NULL;
