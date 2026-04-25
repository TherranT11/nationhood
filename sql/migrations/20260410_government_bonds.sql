-- Government Bond Issuance support.
-- Adds request_type to finance_loan_requests so the same table handles
-- both corporate loans and government bonds.

-- Add request_type column (defaults to 'loan' for backward compat)
ALTER TABLE finance_loan_requests
    ADD COLUMN IF NOT EXISTS request_type TEXT NOT NULL DEFAULT 'loan'
    CHECK (request_type IN ('loan', 'bond'));

-- Add issuer_nation_id for government bonds (null for corp loans)
ALTER TABLE finance_loan_requests
    ADD COLUMN IF NOT EXISTS issuer_nation_id UUID REFERENCES nations(id);

-- Add coupon_rate for bonds (interest rate set by government, not lender)
ALTER TABLE finance_loan_requests
    ADD COLUMN IF NOT EXISTS coupon_rate NUMERIC;

-- Index for deal flow queries
CREATE INDEX IF NOT EXISTS idx_loan_requests_type ON finance_loan_requests(request_type);
