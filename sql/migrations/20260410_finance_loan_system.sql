-- Finance loan system: construction corps request loans, finance corps compete to fund them.

-- Loan requests from construction (or other non-finance) corporations
CREATE TABLE IF NOT EXISTS finance_loan_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who is asking
    requesting_faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id UUID NOT NULL REFERENCES nations(id),

    -- Loan parameters (set by the requesting corp)
    amount BIGINT NOT NULL CHECK (amount > 0),
    term_months INTEGER NOT NULL CHECK (term_months >= 1 AND term_months <= 120),
    purpose TEXT NOT NULL,                        -- Why they need the money

    -- Lifecycle
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'funded', 'expired', 'cancelled')),
    accepted_offer_id UUID,                       -- FK added after finance_loan_offers exists
    funded_tick INTEGER,                          -- Tick when the loan was funded

    -- Timing
    created_tick INTEGER NOT NULL,
    expires_tick INTEGER NOT NULL,                 -- created_tick + 5

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Offers from finance corporations competing to fund a loan request
CREATE TABLE IF NOT EXISTS finance_loan_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    request_id UUID NOT NULL REFERENCES finance_loan_requests(id) ON DELETE CASCADE,
    offering_faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,

    -- Terms set by the finance corp
    interest_rate NUMERIC(4,2) NOT NULL CHECK (interest_rate >= 1.0 AND interest_rate <= 20.0),
    collateral_type TEXT NOT NULL DEFAULT 'unsecured' CHECK (collateral_type IN ('unsecured', 'equipment', 'property')),

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),

    created_tick INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One offer per finance corp per request
    UNIQUE(request_id, offering_faction_id)
);

-- Now add the FK from requests to offers
ALTER TABLE finance_loan_requests
    ADD CONSTRAINT fk_accepted_offer
    FOREIGN KEY (accepted_offer_id) REFERENCES finance_loan_offers(id) ON DELETE SET NULL;

-- Active loans: created when a construction corp accepts an offer.
-- Tracks repayment lifecycle tick-by-tick.
CREATE TABLE IF NOT EXISTS finance_active_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    request_id UUID NOT NULL REFERENCES finance_loan_requests(id),
    offer_id UUID NOT NULL REFERENCES finance_loan_offers(id),

    -- Parties
    borrower_faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    lender_faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id UUID NOT NULL REFERENCES nations(id),

    -- Loan terms (snapshot from request + offer)
    principal BIGINT NOT NULL,
    interest_rate NUMERIC(4,2) NOT NULL,
    term_months INTEGER NOT NULL,
    collateral_type TEXT NOT NULL DEFAULT 'unsecured',
    purpose TEXT,

    -- Payment tracking
    monthly_payment BIGINT NOT NULL,              -- Fixed monthly payment (principal + interest / term)
    total_paid BIGINT NOT NULL DEFAULT 0,
    total_interest_paid BIGINT NOT NULL DEFAULT 0,
    payments_made INTEGER NOT NULL DEFAULT 0,
    payments_missed INTEGER NOT NULL DEFAULT 0,

    -- Status
    status TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('current', 'late', 'delinquent', 'defaulted', 'repaid')),
    -- current: on track, late: 1-2 missed, delinquent: 3+ missed, defaulted: 4+ missed, repaid: done

    -- Lifecycle
    started_tick INTEGER NOT NULL,
    last_payment_tick INTEGER,
    completed_tick INTEGER,                       -- When repaid or defaulted

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

-- Loan requests: anyone in the same nation can read (so finance corps see them in Deal Flow)
CREATE POLICY loan_requests_read ON finance_loan_requests
    FOR SELECT USING (true);

-- Loan requests: only the requesting faction's members can insert
CREATE POLICY loan_requests_insert ON finance_loan_requests
    FOR INSERT WITH CHECK (
        requesting_faction_id IN (
            SELECT faction_id FROM faction_members WHERE user_id = auth.uid()
        )
    );

-- Loan requests: only the requesting faction can update (to cancel or accept)
CREATE POLICY loan_requests_update ON finance_loan_requests
    FOR UPDATE USING (
        requesting_faction_id IN (
            SELECT faction_id FROM faction_members WHERE user_id = auth.uid()
        )
    );

-- Loan offers: anyone can read (so borrowers can see competing offers)
CREATE POLICY loan_offers_read ON finance_loan_offers
    FOR SELECT USING (true);

-- Loan offers: only finance corp members can insert offers
CREATE POLICY loan_offers_insert ON finance_loan_offers
    FOR INSERT WITH CHECK (
        offering_faction_id IN (
            SELECT faction_id FROM faction_members WHERE user_id = auth.uid()
        )
    );

-- Active loans: readable by both parties + same-nation corps
CREATE POLICY active_loans_read ON finance_active_loans
    FOR SELECT USING (true);

-- Active loans: only service-role (tick processor) should insert/update
-- No direct client writes — loans are created by accepting an offer (RPC or client logic)
CREATE POLICY active_loans_service ON finance_active_loans
    FOR ALL USING (true) WITH CHECK (true);
