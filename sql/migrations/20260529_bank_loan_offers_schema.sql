-- ══════════════════════════════════════════════════════════════
-- Loan Offers L1: bank_loan_offers schema
--
-- Counter-offer model for the loan pipeline. Replaces the
-- "first-approval-wins" semantics from C2's approve_loan_request.
--
-- Flow:
--   1. Borrower opens a bank_loan_requests row targeting N banks
--      (no APR specified — banks set their own rate).
--   2. Each targeted bank reviews and submits ONE offer to that
--      request via the L2 submit_loan_offer RPC. The offer carries
--      the bank's chosen rate (floored at corp_interest_rates,
--      capped at 12.0) and term.
--   3. Borrower sees every received offer in Pressing Issues and
--      accepts one (the others auto-reject) or rejects individually.
--   4. Acceptance flips the chosen offer to 'accepted', auto-rejects
--      the rest, mints a bank_loans row in 'pending_payout' state.
--      Bank then explicitly pay_out_loans to disburse.
--
-- Design notes:
-- ── UNIQUE (request_id, bank_faction_id) enforces one-shot per
--    bank per request. To revise, a bank must reject its own offer
--    and the new submit goes through cleanly (the rejected row no
--    longer collides on the unique).
-- ── status enum: 'pending' (awaiting borrower decision),
--    'accepted' (the one offer borrower picked), 'rejected'
--    (borrower explicitly turned this down), 'auto_rejected'
--    (lost the race when borrower picked another), 'expired'
--    (request expired before borrower decided), 'withdrawn'
--    (bank pulled their own offer pre-decision; not in scope for
--    L2 but the value is reserved so future ALTER doesn't churn
--    the constraint).
-- ── No FK from bank_loans.request_id back through here — bank_loans
--    keeps its FK to bank_loan_requests (the request is the
--    canonical lifecycle anchor). bank_loan_offers is a sibling
--    pool the borrower picks from.
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bank_loan_offers (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The request this offer is responding to. CASCADE on request
    -- delete because offers have no meaning without their request.
    request_id        UUID         NOT NULL REFERENCES bank_loan_requests(id) ON DELETE CASCADE,

    -- The bank making the offer. ON DELETE RESTRICT — banks with
    -- live offers can't be deleted; the offers must be resolved
    -- first.
    bank_faction_id   UUID         NOT NULL REFERENCES factions(id) ON DELETE RESTRICT,

    -- Terms the bank is offering. APR floor enforced server-side at
    -- submit time (caller's corp_interest_rates ≤ offered_apr ≤ 12).
    -- Cap at 12% mirrors the mockup's slider ceiling.
    offered_apr       NUMERIC(6,3) NOT NULL CHECK (offered_apr >= 0 AND offered_apr <= 12),
    offered_term_ticks INT         NOT NULL CHECK (offered_term_ticks > 0),

    -- Lifecycle.
    status            TEXT         NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','accepted','rejected','auto_rejected','expired','withdrawn')),
    -- Mirrors the parent request's expires_at_tick at submit time so
    -- the offer auto-expires with the request.
    expires_at_tick   INT          NOT NULL,

    -- Audit.
    created_at_tick   INT          NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    resolved_at_tick  INT,
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),

    -- One offer per (request, bank). Banks revise by rejecting their
    -- old offer first; the L2 RPCs enforce that flow.
    UNIQUE (request_id, bank_faction_id)
);

CREATE INDEX IF NOT EXISTS idx_blo_request    ON bank_loan_offers (request_id);
CREATE INDEX IF NOT EXISTS idx_blo_bank       ON bank_loan_offers (bank_faction_id);
CREATE INDEX IF NOT EXISTS idx_blo_status     ON bank_loan_offers (status);
CREATE INDEX IF NOT EXISTS idx_blo_expires    ON bank_loan_offers (expires_at_tick);

COMMENT ON TABLE bank_loan_offers IS
    'Bank counter-offers on bank_loan_requests. One row per (request, bank). Borrower picks one offer to accept; others auto-reject. Replaces the first-approval-wins approve_loan_request flow from C2.';

-- ── RLS ──
-- Read-all for authenticated (loan market is public). Writes are
-- SECURITY DEFINER RPC only (submit_loan_offer / accept / reject in
-- L2). No client INSERT/UPDATE/DELETE policies.
ALTER TABLE bank_loan_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bank_loan_offers_read_all" ON bank_loan_offers;
CREATE POLICY "bank_loan_offers_read_all"
    ON bank_loan_offers FOR SELECT TO authenticated USING (true);
