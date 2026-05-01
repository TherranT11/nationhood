-- ══════════════════════════════════════════════════════════════
-- Equity Counter-Offer Pipeline E1: schema
--
-- Direct mirror of the loan counter-offer pipeline (L1) with
-- equity-specific shape. Three tables:
--
--   equity_raises     — borrower posts. Targeted to a list of
--                       Finance corps. Carries the borrower's ASKING
--                       terms (amount, equity_pct).
--   equity_offers     — Finance corp counter-offers on a raise.
--                       Carries the OFFERING terms (offered_amount,
--                       offered_equity_pct) which can deviate freely
--                       from the asking terms (per design fork C —
--                       all four directions allowed; only the global
--                       0–50% equity cap and amount > 0 enforced).
--                       UNIQUE(raise, finance) — strict one-shot.
--   equity_positions  — minted on accept. Two-step like loans:
--                       'pending_payout' until the investor calls
--                       pay_out_equity to disburse, then 'active',
--                       finally 'closed' on cancel/repurchase.
--
-- Lifecycle:
--   1. Borrower opens an equity_raises row targeting N Finance corps
--      with their asking amount + equity_pct.
--   2. Each targeted Finance corp reviews and submits ONE counter
--      via E2's submit_equity_offer RPC. The offer carries the
--      finance corp's chosen amount + equity_pct (validated > 0
--      and equity_pct <= 50).
--   3. Borrower sees every received offer in Pressing Issues and
--      accepts one (others auto-reject) or rejects individually.
--   4. Acceptance flips the chosen offer to 'accepted', auto-rejects
--      siblings, mints an equity_positions row in 'pending_payout'.
--      Investor then explicitly pay_out_equity to disburse cash and
--      kick off the per-tick profit-share payouts.
--
-- Profit share: per-tick payouts are floored at $0 (per fork — no
-- clawback when the borrower's monthly_profit is negative). E5 will
-- wire the actual processor.
--
-- RLS:
--   * SELECT all rows for authenticated (equity market is public).
--   * No client INSERT/UPDATE policies — every write goes through
--     SECURITY DEFINER RPCs in E2.
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- 1. equity_raises
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS equity_raises (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who's raising. Faction id of the borrower (corp or party).
    requesting_faction_id UUID         NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    requesting_nation_id  UUID         NOT NULL REFERENCES nations(id),

    -- Finance corps targeted. Mirrors bank_loan_requests.target_bank_ids.
    -- Empty array = nobody can offer; RPC validates non-empty at submit.
    target_finance_ids    UUID[]       NOT NULL DEFAULT '{}',

    -- Borrower's asking terms. Finance corps can offer above OR below
    -- on either dimension (per design fork C — all four directions
    -- allowed). Equity_pct hard-capped at 50% to match the historical
    -- finance_loan_requests check.
    requested_amount      BIGINT       NOT NULL CHECK (requested_amount > 0),
    requested_equity_pct  NUMERIC(5,2) NOT NULL CHECK (requested_equity_pct >= 1 AND requested_equity_pct <= 50),

    -- Auto-classified at submit time from the count of prior funded
    -- raises by this borrower (A, B, C, …, Z). Free-form TEXT so future
    -- phases can rename to 'LATE' / 'PRE-IPO' / etc.
    series                TEXT,
    purpose               TEXT,

    -- Lifecycle. 'accepted' = borrower picked one offer. 'rejected'
    -- here would be every-target-declined (parallel to bank_loan_requests
    -- 'declined' state); reserved for a future every-target-decline
    -- detector but the value is already in the CHECK to avoid a churn.
    status                TEXT         NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','accepted','rejected','expired','cancelled')),
    expires_at_tick       INT          NOT NULL,
    winning_finance_id    UUID         REFERENCES factions(id) ON DELETE SET NULL,

    -- Audit.
    created_at_tick       INT          NOT NULL,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    resolved_at_tick      INT,
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eqr_requesting_faction  ON equity_raises (requesting_faction_id);
CREATE INDEX IF NOT EXISTS idx_eqr_status              ON equity_raises (status);
CREATE INDEX IF NOT EXISTS idx_eqr_expires             ON equity_raises (expires_at_tick);
-- GIN lets the Finance Operations page query
-- "WHERE finance_id = ANY(target_finance_ids)" in O(log n).
CREATE INDEX IF NOT EXISTS idx_eqr_target_finance_gin  ON equity_raises USING GIN (target_finance_ids);

COMMENT ON TABLE equity_raises IS
    'Equity raises opened by non-finance corps, targeting one or more Finance corps. Counter-offer model: targeted Finance corps each submit one equity_offers row; borrower picks one to accept.';

-- ══════════════════════════════════════════════════════════════
-- 2. equity_offers
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS equity_offers (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The raise this offer is responding to. CASCADE on raise delete
    -- because offers have no meaning without their parent raise.
    raise_id              UUID         NOT NULL REFERENCES equity_raises(id) ON DELETE CASCADE,

    -- The finance corp making the offer. RESTRICT — finance corps with
    -- live offers can't be deleted; resolve the offers first.
    finance_faction_id    UUID         NOT NULL REFERENCES factions(id) ON DELETE RESTRICT,

    -- The Finance corp's counter-offer. Both can deviate from the
    -- raise's asking terms in either direction (per design fork C).
    -- Equity_pct hard-capped at 50% to match equity_raises and the
    -- historical request constraint.
    offered_amount        BIGINT       NOT NULL CHECK (offered_amount > 0),
    offered_equity_pct    NUMERIC(5,2) NOT NULL CHECK (offered_equity_pct >= 0 AND offered_equity_pct <= 50),

    -- Lifecycle. status enum follows the bank_loan_offers shape so
    -- future code that reads both can use the same vocabulary.
    --   pending      — awaiting borrower decision
    --   accepted     — the one offer the borrower picked
    --   rejected     — borrower explicitly turned this down
    --   auto_rejected — lost the race when borrower picked another
    --   expired      — raise expired before borrower decided
    --   withdrawn    — finance corp pulled their own offer (reserved;
    --                  out of scope for E2 but value present so a
    --                  future ALTER doesn't churn the constraint)
    status                TEXT         NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','accepted','rejected','auto_rejected','expired','withdrawn')),

    -- Mirrors the parent raise's expires_at_tick at submit time so the
    -- offer auto-expires with the raise. Same invariant as the loan
    -- pipeline — L5's defensive sweep also catches drift here.
    expires_at_tick       INT          NOT NULL,

    -- Audit.
    created_at_tick       INT          NOT NULL,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    resolved_at_tick      INT,
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),

    -- One offer per (raise, finance corp), strictly. UNIQUE matches on
    -- all statuses; finance corps cannot re-bid after their offer
    -- terminates. Same one-shot rule as bank_loan_offers.
    UNIQUE (raise_id, finance_faction_id)
);

CREATE INDEX IF NOT EXISTS idx_eqo_raise    ON equity_offers (raise_id);
CREATE INDEX IF NOT EXISTS idx_eqo_finance  ON equity_offers (finance_faction_id);
CREATE INDEX IF NOT EXISTS idx_eqo_status   ON equity_offers (status);
CREATE INDEX IF NOT EXISTS idx_eqo_expires  ON equity_offers (expires_at_tick);

COMMENT ON TABLE equity_offers IS
    'Finance corp counter-offers on equity_raises. One row per (raise, finance). Borrower picks one offer to accept; siblings auto-reject. Strict one-shot per (raise, finance) — no re-bidding.';

-- ══════════════════════════════════════════════════════════════
-- 3. equity_positions
-- ══════════════════════════════════════════════════════════════
-- Minted on accept of an equity_offers row. Two-step like bank_loans:
-- 'pending_payout' until pay_out_equity is called, then 'active' with
-- per-tick profit-share payouts (E5). 'closed' is terminal — set when
-- borrower buys back the stake or the position is otherwise wound up
-- (out of scope for E2; value reserved).
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS equity_positions (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source raise + offer (one position per accepted offer).
    raise_id              UUID         NOT NULL UNIQUE REFERENCES equity_raises(id),
    offer_id              UUID         NOT NULL UNIQUE REFERENCES equity_offers(id),

    -- Investor + borrower (denormalized for fast queries; immutable
    -- once written so they can't drift from the raise/offer).
    investor_faction_id   UUID         NOT NULL REFERENCES factions(id) ON DELETE RESTRICT,
    borrower_faction_id   UUID         NOT NULL REFERENCES factions(id) ON DELETE RESTRICT,
    nation_id             UUID         NOT NULL REFERENCES nations(id),

    -- Terms snapshot from the accepted offer (NOT the raise's asking
    -- terms — the offer is what the borrower agreed to).
    principal             BIGINT       NOT NULL CHECK (principal > 0),
    equity_pct            NUMERIC(5,2) NOT NULL CHECK (equity_pct >= 0 AND equity_pct <= 50),
    series                TEXT,

    -- Live state.
    status                TEXT         NOT NULL DEFAULT 'pending_payout'
                              CHECK (status IN ('pending_payout','active','closed')),

    -- Schedule. issued_at_tick is set on accept; updated on pay-out.
    -- Equity has no maturity — positions live forever unless closed.
    issued_at_tick        INT          NOT NULL,
    paid_out_at_tick      INT,
    closed_at_tick        INT,

    -- Cumulative payout tracking — read by the dashboard for
    -- "total returned to investor" displays.
    total_paid_out        BIGINT       NOT NULL DEFAULT 0,
    last_payout_tick      INT,

    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eqp_investor  ON equity_positions (investor_faction_id);
CREATE INDEX IF NOT EXISTS idx_eqp_borrower  ON equity_positions (borrower_faction_id);
CREATE INDEX IF NOT EXISTS idx_eqp_nation    ON equity_positions (nation_id);
CREATE INDEX IF NOT EXISTS idx_eqp_status    ON equity_positions (status);

COMMENT ON TABLE equity_positions IS
    'Active equity positions created on accept of an equity_offers row. Tracks principal, equity_pct, and cumulative payouts. One row per accepted offer (UNIQUE on raise_id and offer_id). Per-tick profit share floored at $0 — no clawback on negative monthly_profit.';

-- ══════════════════════════════════════════════════════════════
-- RLS
-- ══════════════════════════════════════════════════════════════
-- Read-all for authenticated (equity market is public — same model as
-- bank_loan_requests / bank_loan_offers). All writes are SECURITY
-- DEFINER RPC only (E2). No client INSERT/UPDATE/DELETE policies.
ALTER TABLE equity_raises    ENABLE ROW LEVEL SECURITY;
ALTER TABLE equity_offers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE equity_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "equity_raises_read_all" ON equity_raises;
CREATE POLICY "equity_raises_read_all"
    ON equity_raises FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "equity_offers_read_all" ON equity_offers;
CREATE POLICY "equity_offers_read_all"
    ON equity_offers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "equity_positions_read_all" ON equity_positions;
CREATE POLICY "equity_positions_read_all"
    ON equity_positions FOR SELECT TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';
