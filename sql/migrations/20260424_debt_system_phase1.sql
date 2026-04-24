-- ============================================================
-- DEBT & DEFICIT SYSTEM — Phase 1 (v1-MANUAL)
--
-- Government deficits split into bonds vs printing based on credit.
-- Bond portion gets posted to Deal Flow as a finance_loan_requests row
-- with request_type='bond'; Investment Corps (corp_sector='finance' AND
-- corp_subsector='investment') manually buy slices via the buy_bond
-- RPC. Unfilled portions auto-print at expiry.
--
-- This migration reuses the existing finance_loan_requests + Deal Flow
-- UI scaffolding rather than creating a parallel table — the
-- 20260410_government_bonds.sql migration already added request_type,
-- issuer_nation_id, and coupon_rate columns. Two more changes needed
-- to make the table actually usable for bonds:
--   1. requesting_faction_id NULLABLE (bond issuer is a nation, not a faction)
--   2. principal_remaining BIGINT for partial fills
--
-- New table: bond_holdings — corp positions, SSoT for who owes what
-- to whom. Distinct from finance_active_loans because bonds are
-- coupon-only with balloon principal at maturity, not amortizing.
--
-- nations.debt is kept in sync with SUM(active_holdings.principal) by
-- buy_bond (on purchase) and processBondMaturitiesTick (on payback) so
-- existing readers (getDebtToGDP, calculateCreditDeterioration,
-- budget.js) keep working without code changes.
--
-- Per-tick processing lives in js/game/debt.js. This migration only
-- sets up schema + the buy_bond RPC.
--
-- Safe to re-run: ALTER ... IF NOT EXISTS / DROP NOT NULL / CREATE OR REPLACE.
-- ============================================================

-- ==================== SCHEMA: extend finance_loan_requests for bonds ====================

-- Bond issuer is a nation, not a faction. Make the existing NOT NULL
-- constraint nullable so we can insert bond rows without a faction.
ALTER TABLE finance_loan_requests
    ALTER COLUMN requesting_faction_id DROP NOT NULL;

-- Partial-fill support. NULL for non-bond rows (loans/equity are still
-- all-or-nothing); set to amount at issuance for bonds, decremented as
-- Investment Corps buy slices.
ALTER TABLE finance_loan_requests
    ADD COLUMN IF NOT EXISTS principal_remaining BIGINT;

-- ==================== TABLE: bond_holdings ====================

CREATE TABLE IF NOT EXISTS bond_holdings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id          UUID NOT NULL REFERENCES finance_loan_requests(id) ON DELETE RESTRICT,
    issuer_nation_id    UUID NOT NULL REFERENCES nations(id),
    holder_faction_id   UUID NOT NULL REFERENCES factions(id),
    principal           BIGINT NOT NULL CHECK (principal > 0),
    coupon_rate         NUMERIC(6,5) NOT NULL CHECK (coupon_rate > 0),
    issued_at_tick      INT NOT NULL,
    matures_at_tick     INT NOT NULL,
    matured             BOOLEAN NOT NULL DEFAULT false,
    matured_at_tick     INT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bond_holdings_active_by_nation
    ON bond_holdings(issuer_nation_id) WHERE matured = false;
CREATE INDEX IF NOT EXISTS idx_bond_holdings_active_by_holder
    ON bond_holdings(holder_faction_id) WHERE matured = false;
CREATE INDEX IF NOT EXISTS idx_bond_holdings_maturity_sweep
    ON bond_holdings(matures_at_tick) WHERE matured = false;

-- ==================== RLS ====================

ALTER TABLE bond_holdings ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE tablename = 'bond_holdings' AND policyname = 'Allow select for all') THEN
        CREATE POLICY "Allow select for all" ON bond_holdings FOR SELECT USING (true);
    END IF;
END $$;

-- ==================== RPC: buy_bond ====================
-- Atomic bond purchase. Caller must own the buyer faction; buyer must
-- be an active Investment Corp. Partial fills allowed via the
-- principal_remaining column.

CREATE OR REPLACE FUNCTION buy_bond(
    p_request_id        UUID,
    p_buyer_faction_id  UUID,
    p_amount            BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user_id  UUID;
    v_buyer    factions%ROWTYPE;
    v_request  finance_loan_requests%ROWTYPE;
    v_tick     INT;
    v_holding_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    IF p_buyer_faction_id <> v_user_id THEN
        RAISE EXCEPTION 'Faction ownership required';
    END IF;
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    SELECT * INTO v_buyer FROM factions WHERE id = p_buyer_faction_id;
    IF v_buyer.id IS NULL THEN RAISE EXCEPTION 'Buyer faction not found'; END IF;
    IF v_buyer.faction_type IS DISTINCT FROM 'corporation' THEN
        RAISE EXCEPTION 'Only corporations can buy bonds';
    END IF;
    IF v_buyer.abandoned_at IS NOT NULL THEN
        RAISE EXCEPTION 'Abandoned corps cannot buy bonds';
    END IF;
    IF LOWER(COALESCE(v_buyer.corp_sector, '')) <> 'finance'
       OR LOWER(COALESCE(v_buyer.corp_subsector, '')) <> 'investment' THEN
        RAISE EXCEPTION 'Only Investment Corps can buy bonds';
    END IF;
    IF COALESCE(v_buyer.corp_cash_reserves, 0) < p_amount THEN
        RAISE EXCEPTION 'Insufficient corp cash reserves';
    END IF;

    -- Lock the request row so concurrent buyers serialize on principal_remaining.
    SELECT * INTO v_request FROM finance_loan_requests WHERE id = p_request_id FOR UPDATE;
    IF v_request.id IS NULL THEN RAISE EXCEPTION 'Bond request not found'; END IF;
    IF v_request.request_type IS DISTINCT FROM 'bond' THEN
        RAISE EXCEPTION 'Request is not a bond (%)', v_request.request_type;
    END IF;
    IF v_request.status <> 'open' THEN
        RAISE EXCEPTION 'Bond request is %', v_request.status;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';
    IF v_request.expires_tick <= v_tick THEN
        RAISE EXCEPTION 'Bond offer has expired';
    END IF;

    IF p_amount > COALESCE(v_request.principal_remaining, v_request.amount) THEN
        RAISE EXCEPTION 'Amount exceeds remaining principal (%)',
            COALESCE(v_request.principal_remaining, v_request.amount);
    END IF;

    -- Cash flow: corp → issuer nation. nations.debt incremented to keep
    -- in sync with SUM(active bond_holdings.principal).
    UPDATE factions
       SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) - p_amount
     WHERE id = p_buyer_faction_id;

    UPDATE nations
       SET budget_reserves = COALESCE(budget_reserves, 0) + p_amount,
           debt            = COALESCE(debt, 0) + p_amount
     WHERE id = v_request.issuer_nation_id;

    -- Record the holding with the request's locked coupon_rate.
    INSERT INTO bond_holdings (
        request_id, issuer_nation_id, holder_faction_id,
        principal, coupon_rate,
        issued_at_tick, matures_at_tick
    ) VALUES (
        v_request.id, v_request.issuer_nation_id, p_buyer_faction_id,
        p_amount, COALESCE(v_request.coupon_rate, 0.005),
        v_request.created_tick, v_request.created_tick + COALESCE(v_request.term_months, 36)
    )
    RETURNING id INTO v_holding_id;

    -- Decrement remaining; flip funded if exhausted.
    UPDATE finance_loan_requests
       SET principal_remaining = COALESCE(principal_remaining, amount) - p_amount,
           status = CASE WHEN COALESCE(principal_remaining, amount) - p_amount = 0
                         THEN 'funded' ELSE status END,
           funded_tick = CASE WHEN COALESCE(principal_remaining, amount) - p_amount = 0
                              THEN v_tick ELSE funded_tick END
     WHERE id = p_request_id;

    RETURN jsonb_build_object(
        'success',         true,
        'holding_id',      v_holding_id,
        'principal',       p_amount,
        'coupon_rate',     COALESCE(v_request.coupon_rate, 0.005),
        'matures_at_tick', v_request.created_tick + COALESCE(v_request.term_months, 36)
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION buy_bond(UUID, UUID, BIGINT) TO authenticated;

-- ==================== VERIFY ====================
SELECT 'bond_holdings table' AS object, COUNT(*) AS present
  FROM information_schema.tables WHERE table_name = 'bond_holdings'
UNION ALL
SELECT 'finance_loan_requests.principal_remaining',
       COUNT(*) FROM information_schema.columns
       WHERE table_name = 'finance_loan_requests' AND column_name = 'principal_remaining'
UNION ALL
SELECT 'buy_bond RPC', COUNT(*) FROM pg_proc WHERE proname = 'buy_bond';
