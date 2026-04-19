-- ══════════════════════════════════════════════════════════════════════════
-- Phase 8: Equity secondary market — list for sale + buy listed stake.
--
-- Adds the ability for an equity holder to offload a position at an asking
-- price. Any Investment-sector corp can buy the listed stake; on purchase,
-- ownership transfers and the buyer's dividend clock resets.
--
-- One new column + one RPC:
--   • finance_active_loans.for_sale_price: NULL when not listed; the
--     asking price (BIGINT USD) when listed. Sellers LIST by UPDATEing
--     their own position's row directly — the existing permissive RLS on
--     finance_active_loans allows that. CANCEL is the reverse UPDATE.
--   • buy_listed_equity_stake(p_position_id, p_buyer_faction_id): the
--     cross-faction cash move (buyer → seller) plus ownership swap. Must
--     be SECURITY DEFINER because the seller is NOT the caller's faction,
--     and factions RLS restricts cross-faction UPDATEs.
--
-- On transfer, total_paid / payments_made / last_payment_tick reset to 0
-- and the position's started_tick rolls to the current tick. This keeps
-- the buyer's portfolio honest — they see only dividends earned during
-- their ownership, not the seller's lifetime earnings. The realized gain
-- for the seller is pocketed as cash at sale time; no PnL ledger yet.
--
-- Idempotent — safe to re-run.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. for_sale_price column ──
ALTER TABLE finance_active_loans
    ADD COLUMN IF NOT EXISTS for_sale_price BIGINT;

ALTER TABLE finance_active_loans
    DROP CONSTRAINT IF EXISTS finance_active_loans_for_sale_price_check;
ALTER TABLE finance_active_loans
    ADD CONSTRAINT finance_active_loans_for_sale_price_check
    CHECK (for_sale_price IS NULL OR for_sale_price > 0);

-- Partial index: only listed positions. Keeps the secondary-market deal
-- flow query fast without bloating the main index.
CREATE INDEX IF NOT EXISTS idx_active_loans_for_sale
    ON finance_active_loans(for_sale_price)
    WHERE for_sale_price IS NOT NULL;

-- ── 2. buy_listed_equity_stake RPC ──
CREATE OR REPLACE FUNCTION public.buy_listed_equity_stake(
    p_position_id      UUID,
    p_buyer_faction_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_uid   UUID := auth.uid();
    v_position     finance_active_loans%ROWTYPE;
    v_buyer_cash   BIGINT;
    v_seller_cash  BIGINT;
    v_current_tick INT;
BEGIN
    -- Auth: caller must own the buyer faction (primary OR linked).
    IF NOT EXISTS (
        SELECT 1 FROM factions
        WHERE id = p_buyer_faction_id
          AND (id = v_caller_uid OR linked_user_id = v_caller_uid)
    ) THEN
        RAISE EXCEPTION 'Not authorized to act as buyer faction';
    END IF;

    -- Lock the position; validate it's still listed and still an equity row.
    SELECT * INTO v_position
    FROM finance_active_loans
    WHERE id = p_position_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Position not found';
    END IF;
    IF v_position.equity_pct IS NULL THEN
        RAISE EXCEPTION 'Position is not an equity stake';
    END IF;
    IF v_position.for_sale_price IS NULL OR v_position.for_sale_price <= 0 THEN
        RAISE EXCEPTION 'Position is not currently listed for sale';
    END IF;
    IF v_position.status NOT IN ('current', 'late', 'delinquent') THEN
        RAISE EXCEPTION 'Position is not active (status=%)', v_position.status;
    END IF;
    IF v_position.lender_faction_id = p_buyer_faction_id THEN
        RAISE EXCEPTION 'Cannot buy a stake you already own';
    END IF;

    -- Buyer cash sufficiency (lock buyer row).
    SELECT corp_cash_reserves INTO v_buyer_cash
    FROM factions
    WHERE id = p_buyer_faction_id
    FOR UPDATE;

    IF v_buyer_cash IS NULL OR v_buyer_cash < v_position.for_sale_price THEN
        RAISE EXCEPTION 'Insufficient buyer cash (need %, have %)',
            v_position.for_sale_price, COALESCE(v_buyer_cash, 0);
    END IF;

    -- Lock seller row for cash credit.
    SELECT corp_cash_reserves INTO v_seller_cash
    FROM factions
    WHERE id = v_position.lender_faction_id
    FOR UPDATE;

    SELECT current_tick INTO v_current_tick FROM shard LIMIT 1;

    -- Cash transfer: buyer pays seller the full asking price.
    UPDATE factions
    SET corp_cash_reserves = v_buyer_cash - v_position.for_sale_price
    WHERE id = p_buyer_faction_id;

    UPDATE factions
    SET corp_cash_reserves = COALESCE(v_seller_cash, 0) + v_position.for_sale_price
    WHERE id = v_position.lender_faction_id;

    -- Ownership transfer + delist + reset dividend counters.
    -- started_tick rolls forward so the buyer's portfolio shows "owned
    -- since tick X", not the original funding tick.
    UPDATE finance_active_loans
    SET lender_faction_id    = p_buyer_faction_id,
        for_sale_price       = NULL,
        total_paid           = 0,
        total_interest_paid  = 0,
        payments_made        = 0,
        last_payment_tick    = NULL,
        started_tick         = v_current_tick
    WHERE id = p_position_id;

    RETURN p_position_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_listed_equity_stake(UUID, UUID) TO authenticated;

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- Verification
-- ══════════════════════════════════════════════════════════════════════════
-- 1. Column + CHECK:
--      SELECT column_name, data_type FROM information_schema.columns
--      WHERE table_name = 'finance_active_loans' AND column_name = 'for_sale_price';
--      SELECT pg_get_constraintdef(oid) FROM pg_constraint
--      WHERE conname = 'finance_active_loans_for_sale_price_check';
--
-- 2. Partial index:
--      SELECT indexname FROM pg_indexes
--      WHERE tablename = 'finance_active_loans' AND indexname = 'idx_active_loans_for_sale';
--
-- 3. RPC exists:
--      SELECT proname, pronargs, prosecdef FROM pg_proc
--      WHERE proname = 'buy_listed_equity_stake';
--      -- Expected: one row, pronargs=2, prosecdef=true.
--
-- 4. End-to-end smoke (replace UUIDs):
--      -- As the current lender, list for sale:
--      UPDATE finance_active_loans SET for_sale_price = 75000000
--      WHERE id = '<position-id>';
--      -- As a different Investment corp, buy the listing:
--      SELECT public.buy_listed_equity_stake('<position-id>'::uuid,
--                                            '<new-buyer-faction-id>'::uuid);
--      -- Confirm:
--      --   • seller cash ↑ by 75M; buyer cash ↓ by 75M
--      --   • finance_active_loans.lender_faction_id swapped
--      --   • for_sale_price = NULL, total_paid = 0, payments_made = 0
--      --   • started_tick = current_tick
