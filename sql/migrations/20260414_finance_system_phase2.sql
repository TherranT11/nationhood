-- ══════════════════════════════════════════════════════════════
-- Finance System Phase 2: Corp Debt, Performance Bonds, Insurance Claims
-- ══════════════════════════════════════════════════════════════

-- 1. Corporate debt tracking on factions
ALTER TABLE factions ADD COLUMN IF NOT EXISTS corp_debt BIGINT NOT NULL DEFAULT 0;

-- 2. Add 'bond' to finance_loan_requests.request_type if not already there
-- (Some setups already have loan/bond/insurance; this is idempotent)
ALTER TABLE finance_loan_requests DROP CONSTRAINT IF EXISTS finance_loan_requests_status_check;
ALTER TABLE finance_loan_requests
    ADD CONSTRAINT finance_loan_requests_status_check
    CHECK (status IN ('open', 'funded', 'expired', 'cancelled'));

-- Ensure request_type supports bond
DO $$ BEGIN
    ALTER TABLE finance_loan_requests
        ADD COLUMN IF NOT EXISTS request_type TEXT NOT NULL DEFAULT 'loan';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add bond_contract_id for linking performance bonds to construction contracts
ALTER TABLE finance_loan_requests
    ADD COLUMN IF NOT EXISTS bond_contract_id UUID REFERENCES construction_contracts(id);

ALTER TABLE finance_active_loans
    ADD COLUMN IF NOT EXISTS bond_contract_id UUID REFERENCES construction_contracts(id);

-- 3. Insurance claims table — manual adjudication by finance corps
CREATE TABLE IF NOT EXISTS insurance_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL,                     -- subsidiary_auto_policies.id or finance_active_loans.id
    policy_source TEXT NOT NULL DEFAULT 'auto',   -- 'auto' (subsidiary_auto_policies) or 'deal' (finance_active_loans)
    claimant_faction_id UUID NOT NULL REFERENCES factions(id),
    insurer_faction_id UUID NOT NULL REFERENCES factions(id),
    insured_vessel_id UUID REFERENCES corp_vessels(id),
    insured_contract_id UUID REFERENCES construction_contracts(id),
    claim_amount BIGINT NOT NULL,
    claim_reason TEXT NOT NULL,
    policy_terms TEXT,                            -- the written policy terms/conditions
    deductible_pct NUMERIC(5,2) NOT NULL DEFAULT 10,

    -- Adjudication (set by finance corp)
    status TEXT NOT NULL DEFAULT 'filed'
        CHECK (status IN ('filed', 'approved', 'partial', 'denied', 'paid')),
    adjudication_notes TEXT,
    approved_amount BIGINT,                       -- amount approved (may differ from claim_amount)
    payout_amount BIGINT,                         -- actual payout after deductible

    filed_at_tick INTEGER NOT NULL,
    adjudicated_at_tick INTEGER,
    paid_at_tick INTEGER,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insurance_claims_claimant ON insurance_claims(claimant_faction_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_insurer ON insurance_claims(insurer_faction_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_vessel ON insurance_claims(insured_vessel_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_contract ON insurance_claims(insured_contract_id);

ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read insurance_claims" ON insurance_claims
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert insurance_claims" ON insurance_claims
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update insurance_claims" ON insurance_claims
    FOR UPDATE TO authenticated USING (true);

-- 4. Add policy_terms text field to subsidiary_auto_policies for written conditions
ALTER TABLE subsidiary_auto_policies
    ADD COLUMN IF NOT EXISTS policy_terms TEXT;

-- 5. Add insurance_required flag to construction_contracts for high-value enforcement
ALTER TABLE construction_contracts
    ADD COLUMN IF NOT EXISTS insurance_required BOOLEAN NOT NULL DEFAULT false;

-- 6. Add bond_required flag to construction_contracts
ALTER TABLE construction_contracts
    ADD COLUMN IF NOT EXISTS bond_required BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE construction_contracts
    ADD COLUMN IF NOT EXISTS bond_id UUID REFERENCES finance_active_loans(id);
