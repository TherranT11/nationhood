-- ══════════════════════════════════════════════════════════════
-- Restore legacy finance_loan_* tables
--
-- Backstory: 20260430_corp_simplify_v2.sql DROP'd these tables CASCADE
-- on the assumption the v2 simplification was complete, but the
-- equity / bond / insurance flows in the client were never migrated
-- off them. As a result Apply for Equity (and several other code
-- paths in corp-dashboard, corp-topbar, corp-operations-shipping,
-- and advance-corp-tick) error with "Could not find the table
-- 'public.finance_loan_requests' in the schema cache".
--
-- This restoration migration recreates the three tables with the
-- full column set the live client code reads/writes — base columns
-- from the original migrations plus every ALTER ADD COLUMN that was
-- layered on later (request_type, equity_pct, series,
-- insured_contract_id, issuer_nation_id, coupon_rate,
-- original_principal, remaining_principal, active_claim_id, etc.)
-- consolidated into one CREATE TABLE so the schema is reproducible
-- in one shot.
--
-- A few base constraints are intentionally relaxed vs. the
-- originals because equity raises don't carry loan-shaped fields:
--   * finance_loan_requests.term_months — kept NOT NULL but range
--     widened to allow the 120-month equity sentinel.
--   * finance_active_loans.offer_id — relaxed to NULLable because
--     equity positions are funded directly via buy-stake without
--     an offers row.
--   * finance_active_loans.interest_rate / monthly_payment —
--     relaxed to NULLable for the same reason.
--
-- New tables are created idempotently (IF NOT EXISTS); the script
-- is safe to run on a DB where the tables already exist.
--
-- RLS posture mirrors the direct-INSERT pattern the existing client
-- code uses (Apply for Equity, manual offer accept on the dashboard,
-- shipping insurance request, government bond issuance):
--   * SELECT: authenticated → all rows (loan market is public)
--   * INSERT/UPDATE: authenticated → only when caller owns one of
--     the factions named on the row
--   * DELETE: nobody (rows live forever; cancel via status flip)
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- 1. finance_loan_requests
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS finance_loan_requests (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    requesting_faction_id UUID         NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id             UUID         NOT NULL REFERENCES nations(id),

    -- request_type splits the polymorphic flows that live in this
    -- table — corp loans, government bonds, insurance policies, and
    -- equity raises. Each flow uses a different subset of columns.
    request_type          TEXT         NOT NULL DEFAULT 'loan'
                              CHECK (request_type IN ('loan', 'bond', 'insurance', 'equity')),

    -- Generic financial fields used by every flow.
    amount                BIGINT       NOT NULL CHECK (amount > 0),
    term_months           INTEGER      NOT NULL CHECK (term_months >= 1 AND term_months <= 120),
    purpose               TEXT         NOT NULL,
    status                TEXT         NOT NULL DEFAULT 'open'
                              CHECK (status IN ('open', 'funded', 'expired', 'cancelled', 'declined')),
    accepted_offer_id     UUID,
    funded_tick           INTEGER,
    created_tick          INTEGER      NOT NULL,
    expires_tick          INTEGER      NOT NULL,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),

    -- Equity raise fields (NULL for non-equity).
    equity_pct            NUMERIC(5,2),
    series                TEXT,

    -- Insurance fields (NULL for non-insurance). FK is SET NULL so
    -- a contract delete doesn't cascade-kill the policy history.
    insured_contract_id   UUID         REFERENCES construction_contracts(id) ON DELETE SET NULL,

    -- Government-bond fields (NULL for non-bond).
    issuer_nation_id      UUID         REFERENCES nations(id),
    coupon_rate           NUMERIC(4,2)
);

CREATE INDEX IF NOT EXISTS idx_flr_requesting_faction ON finance_loan_requests (requesting_faction_id);
CREATE INDEX IF NOT EXISTS idx_flr_nation             ON finance_loan_requests (nation_id);
CREATE INDEX IF NOT EXISTS idx_flr_status             ON finance_loan_requests (status);
CREATE INDEX IF NOT EXISTS idx_flr_request_type       ON finance_loan_requests (request_type);
CREATE INDEX IF NOT EXISTS idx_flr_expires_tick       ON finance_loan_requests (expires_tick);

COMMENT ON TABLE finance_loan_requests IS
    'Polymorphic financial requests: corp loans, government bonds, insurance policies, equity raises. request_type discriminates which subset of columns is meaningful.';

-- ══════════════════════════════════════════════════════════════
-- 2. finance_loan_offers
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS finance_loan_offers (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id            UUID         NOT NULL REFERENCES finance_loan_requests(id) ON DELETE CASCADE,
    offering_faction_id   UUID         NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    interest_rate         NUMERIC(4,2) NOT NULL CHECK (interest_rate >= 0.0 AND interest_rate <= 20.0),
    collateral_type       TEXT         NOT NULL DEFAULT 'unsecured'
                              CHECK (collateral_type IN ('unsecured', 'equipment', 'property')),
    status                TEXT         NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'accepted', 'declined')),
    created_tick          INTEGER      NOT NULL,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE(request_id, offering_faction_id)
);

CREATE INDEX IF NOT EXISTS idx_flo_request  ON finance_loan_offers (request_id);
CREATE INDEX IF NOT EXISTS idx_flo_offering ON finance_loan_offers (offering_faction_id);
CREATE INDEX IF NOT EXISTS idx_flo_status   ON finance_loan_offers (status);

COMMENT ON TABLE finance_loan_offers IS
    'Competitive offers from finance corps to fund a loan request. Equity raises bypass this table — investors fund directly into finance_active_loans.';

-- ══════════════════════════════════════════════════════════════
-- 3. finance_active_loans
-- ══════════════════════════════════════════════════════════════
-- Active financial positions. Despite the name, also holds equity
-- positions (request_type='equity' on the request, equity_pct set,
-- offer_id NULL, monthly_payment NULL). The dividend branch in
-- advance-corp-tick reads request_type via the joined request and
-- pays out a percentage of the borrower's monthly_profit each tick
-- instead of the standard amortization schedule.
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS finance_active_loans (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id            UUID         NOT NULL REFERENCES finance_loan_requests(id),
    -- Relaxed: equity positions don't go through finance_loan_offers,
    -- so offer_id is NULL for equity rows.
    offer_id              UUID         REFERENCES finance_loan_offers(id),
    borrower_faction_id   UUID         NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    lender_faction_id     UUID         NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id             UUID         NOT NULL REFERENCES nations(id),

    -- Loan shape — populated for loan/bond/insurance, NULL/zero for equity.
    principal             BIGINT       NOT NULL,
    -- original_principal + remaining_principal are dashboard-facing
    -- snapshots that diverge from `principal` over the loan's life
    -- (principal stays constant; remaining_principal amortizes down).
    original_principal    BIGINT,
    remaining_principal   BIGINT,
    interest_rate         NUMERIC(4,2),
    term_months           INTEGER      NOT NULL,
    collateral_type       TEXT         DEFAULT 'unsecured',
    purpose               TEXT,
    monthly_payment       BIGINT,
    total_paid            BIGINT       NOT NULL DEFAULT 0,
    total_interest_paid   BIGINT       NOT NULL DEFAULT 0,
    payments_made         INTEGER      NOT NULL DEFAULT 0,
    payments_missed       INTEGER      NOT NULL DEFAULT 0,
    status                TEXT         NOT NULL DEFAULT 'current'
                              CHECK (status IN ('current', 'late', 'delinquent', 'defaulted', 'repaid')),
    started_tick          INTEGER      NOT NULL,
    last_payment_tick     INTEGER,
    completed_tick        INTEGER,

    -- Equity-position fields (NULL for non-equity).
    equity_pct            NUMERIC(5,2),
    series                TEXT,

    -- Insurance — pointer to the active claim (if any) so the tick
    -- processor can mark it paid out / refurbish ships referenced
    -- through the policy.
    active_claim_id       UUID,

    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fal_request   ON finance_active_loans (request_id);
CREATE INDEX IF NOT EXISTS idx_fal_borrower  ON finance_active_loans (borrower_faction_id);
CREATE INDEX IF NOT EXISTS idx_fal_lender    ON finance_active_loans (lender_faction_id);
CREATE INDEX IF NOT EXISTS idx_fal_nation    ON finance_active_loans (nation_id);
CREATE INDEX IF NOT EXISTS idx_fal_status    ON finance_active_loans (status);

COMMENT ON TABLE finance_active_loans IS
    'Active financial positions of every type — loans, bonds, insurance, equity. Dispatch on the joined request''s request_type to decide which fields are live.';

-- ══════════════════════════════════════════════════════════════
-- RLS
-- ══════════════════════════════════════════════════════════════
ALTER TABLE finance_loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_loan_offers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_active_loans  ENABLE ROW LEVEL SECURITY;

-- ── finance_loan_requests ──
DROP POLICY IF EXISTS "flr_read_all"        ON finance_loan_requests;
DROP POLICY IF EXISTS "flr_insert_own"      ON finance_loan_requests;
DROP POLICY IF EXISTS "flr_update_own"      ON finance_loan_requests;
CREATE POLICY "flr_read_all" ON finance_loan_requests
    FOR SELECT TO authenticated USING (true);
-- INSERT/UPDATE only when the caller owns the requesting faction.
-- The factions table identifies ownership via id == auth.uid() for
-- player-controlled corps, or linked_user_id == auth.uid() for
-- corps linked to a player account.
CREATE POLICY "flr_insert_own" ON finance_loan_requests
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM factions f
            WHERE f.id = requesting_faction_id
              AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
        )
    );
CREATE POLICY "flr_update_own" ON finance_loan_requests
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM factions f
            WHERE f.id = requesting_faction_id
              AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
        )
    );

-- ── finance_loan_offers ──
DROP POLICY IF EXISTS "flo_read_all"        ON finance_loan_offers;
DROP POLICY IF EXISTS "flo_insert_own"      ON finance_loan_offers;
DROP POLICY IF EXISTS "flo_update_own"      ON finance_loan_offers;
CREATE POLICY "flo_read_all" ON finance_loan_offers
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "flo_insert_own" ON finance_loan_offers
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM factions f
            WHERE f.id = offering_faction_id
              AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
        )
    );
-- UPDATE permitted to either side: the offering bank can withdraw
-- their own offer; the requesting borrower can flip status to
-- accepted/declined when they choose.
CREATE POLICY "flo_update_own" ON finance_loan_offers
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM factions f
            WHERE (f.id = offering_faction_id
                   OR f.id IN (SELECT requesting_faction_id
                               FROM finance_loan_requests
                               WHERE id = finance_loan_offers.request_id))
              AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
        )
    );

-- ── finance_active_loans ──
DROP POLICY IF EXISTS "fal_read_all"        ON finance_active_loans;
DROP POLICY IF EXISTS "fal_insert_party"    ON finance_active_loans;
DROP POLICY IF EXISTS "fal_update_party"    ON finance_active_loans;
CREATE POLICY "fal_read_all" ON finance_active_loans
    FOR SELECT TO authenticated USING (true);
-- INSERT permitted when caller owns the lender side (matches the
-- "buy stake" / "fund this loan" client flow).
CREATE POLICY "fal_insert_party" ON finance_active_loans
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM factions f
            WHERE f.id = lender_faction_id
              AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
        )
    );
-- UPDATE permitted to either side (borrower marks repaid, lender
-- forecloses, etc.). Service role bypasses RLS for tick processor
-- writes regardless of these policies.
CREATE POLICY "fal_update_party" ON finance_active_loans
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM factions f
            WHERE (f.id = lender_faction_id OR f.id = borrower_faction_id)
              AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
        )
    );

-- Trigger PostgREST schema cache reload so the new tables are
-- visible immediately to the API.
NOTIFY pgrst, 'reload schema';
