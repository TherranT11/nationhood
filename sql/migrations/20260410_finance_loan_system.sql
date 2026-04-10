-- Finance loan system: construction corps request loans, finance corps compete to fund them.

-- Loan requests from construction (or other non-finance) corporations
CREATE TABLE IF NOT EXISTS finance_loan_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requesting_faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id UUID NOT NULL REFERENCES nations(id),
    amount BIGINT NOT NULL CHECK (amount > 0),
    term_months INTEGER NOT NULL CHECK (term_months >= 1 AND term_months <= 120),
    purpose TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'funded', 'expired', 'cancelled')),
    accepted_offer_id UUID,
    funded_tick INTEGER,
    created_tick INTEGER NOT NULL,
    expires_tick INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Offers from finance corporations competing to fund a loan request
CREATE TABLE IF NOT EXISTS finance_loan_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES finance_loan_requests(id) ON DELETE CASCADE,
    offering_faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    interest_rate NUMERIC(4,2) NOT NULL CHECK (interest_rate >= 1.0 AND interest_rate <= 20.0),
    collateral_type TEXT NOT NULL DEFAULT 'unsecured' CHECK (collateral_type IN ('unsecured', 'equipment', 'property')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_tick INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(request_id, offering_faction_id)
);

ALTER TABLE finance_loan_requests
    ADD CONSTRAINT fk_accepted_offer
    FOREIGN KEY (accepted_offer_id) REFERENCES finance_loan_offers(id) ON DELETE SET NULL;

-- Active loans: created when a construction corp accepts an offer.
CREATE TABLE IF NOT EXISTS finance_active_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES finance_loan_requests(id),
    offer_id UUID NOT NULL REFERENCES finance_loan_offers(id),
    borrower_faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    lender_faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id UUID NOT NULL REFERENCES nations(id),
    principal BIGINT NOT NULL,
    interest_rate NUMERIC(4,2) NOT NULL,
    term_months INTEGER NOT NULL,
    collateral_type TEXT NOT NULL DEFAULT 'unsecured',
    purpose TEXT,
    monthly_payment BIGINT NOT NULL,
    total_paid BIGINT NOT NULL DEFAULT 0,
    total_interest_paid BIGINT NOT NULL DEFAULT 0,
    payments_made INTEGER NOT NULL DEFAULT 0,
    payments_missed INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('current', 'late', 'delinquent', 'defaulted', 'repaid')),
    started_tick INTEGER NOT NULL,
    last_payment_tick INTEGER,
    completed_tick INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loan_requests_nation ON finance_loan_requests(nation_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_loan_requests_faction ON finance_loan_requests(requesting_faction_id);
CREATE INDEX IF NOT EXISTS idx_loan_offers_request ON finance_loan_offers(request_id);
CREATE INDEX IF NOT EXISTS idx_loan_offers_faction ON finance_loan_offers(offering_faction_id);
CREATE INDEX IF NOT EXISTS idx_active_loans_borrower ON finance_active_loans(borrower_faction_id) WHERE status IN ('current', 'late', 'delinquent');
CREATE INDEX IF NOT EXISTS idx_active_loans_lender ON finance_active_loans(lender_faction_id) WHERE status IN ('current', 'late', 'delinquent');

-- RLS
ALTER TABLE finance_loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_loan_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_active_loans ENABLE ROW LEVEL SECURITY;

-- Loan requests: anyone can read (so finance corps see them in Deal Flow)
CREATE POLICY loan_requests_read ON finance_loan_requests
    FOR SELECT USING (true);

-- Loan requests: only the requesting faction's owner can insert
CREATE POLICY loan_requests_insert ON finance_loan_requests
    FOR INSERT WITH CHECK (
        requesting_faction_id IN (
            SELECT id FROM factions WHERE linked_user_id = auth.uid()
        )
    );

-- Loan requests: only the requesting faction's owner can update (cancel/accept)
CREATE POLICY loan_requests_update ON finance_loan_requests
    FOR UPDATE USING (
        requesting_faction_id IN (
            SELECT id FROM factions WHERE linked_user_id = auth.uid()
        )
    );

-- Loan offers: anyone can read
CREATE POLICY loan_offers_read ON finance_loan_offers
    FOR SELECT USING (true);

-- Loan offers: only the offering faction's owner can insert
CREATE POLICY loan_offers_insert ON finance_loan_offers
    FOR INSERT WITH CHECK (
        offering_faction_id IN (
            SELECT id FROM factions WHERE linked_user_id = auth.uid()
        )
    );

-- Active loans: anyone can read
CREATE POLICY active_loans_read ON finance_active_loans
    FOR SELECT USING (true);

-- Active loans: full access (tick processor + client accept flow)
CREATE POLICY active_loans_service ON finance_active_loans
    FOR ALL USING (true) WITH CHECK (true);
