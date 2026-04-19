-- ══════════════════════════════════════════════════════════════════════════
-- Phase 3: Atomic Buy-Stake RPC for Investment-corp equity positions.
--
-- Why an RPC instead of four client-side writes:
--   • finance_loan_requests RLS restricts UPDATE to the requesting faction.
--     The investor is NOT the requesting faction — so a direct client
--     UPDATE to status='funded' silently fails.
--   • factions RLS restricts UPDATE to own faction. The investor cannot
--     credit the target corp's corp_cash_reserves directly — that write
--     also silently fails.
--   • Even if RLS were loosened, the four writes aren't atomic from a
--     client. A partial failure leaves cash moved without a position,
--     or a position without cash, etc.
--
-- SECURITY DEFINER bypasses RLS; the function body enforces the actual
-- authorization rule (caller must own the buyer faction) and the deal
-- invariants (request is open, request is equity, buyer ≠ requester,
-- cash sufficient). Mirrors the pattern in accept_subsidiary_auto_policy
-- (20260419_auto_loan_origination_rpc.sql).
--
-- Idempotent — safe to re-run.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Widen finance_loan_offers.interest_rate CHECK ──
-- The shared offers table reuses interest_rate for equity's stake pct
-- (kept in the dedicated equity_pct column on active_loans as source of
-- truth). Old CHECK was loan-specific (1-20). Widen to 0-50 so equity
-- deals pass. Loans are still app-validated to sensible rates by the UI.
ALTER TABLE finance_loan_offers
    DROP CONSTRAINT IF EXISTS finance_loan_offers_interest_rate_check;
ALTER TABLE finance_loan_offers
    ADD CONSTRAINT finance_loan_offers_interest_rate_check
    CHECK (interest_rate >= 0 AND interest_rate <= 50);

-- ── 2. buy_equity_stake RPC ──
CREATE OR REPLACE FUNCTION public.buy_equity_stake(
    p_request_id       UUID,
    p_buyer_faction_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_uid   UUID := auth.uid();
    v_request      public.finance_loan_requests%ROWTYPE;
    v_buyer_cash   BIGINT;
    v_target_cash  BIGINT;
    v_current_tick INT;
    v_offer_id     UUID;
    v_position_id  UUID;
BEGIN
    -- Auth: caller must own the buyer faction (primary OR linked).
    IF NOT EXISTS (
        SELECT 1 FROM public.factions
        WHERE id = p_buyer_faction_id
          AND (id = v_caller_uid OR linked_user_id = v_caller_uid)
    ) THEN
        RAISE EXCEPTION 'Not authorized to act as buyer faction';
    END IF;

    -- Lock the request row; validate.
    SELECT * INTO v_request
    FROM public.finance_loan_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found';
    END IF;
    IF v_request.status <> 'open' THEN
        RAISE EXCEPTION 'Request no longer open (status=%)', v_request.status;
    END IF;
    IF v_request.request_type <> 'equity' THEN
        RAISE EXCEPTION 'Request is not an equity raise';
    END IF;
    IF v_request.equity_pct IS NULL OR v_request.equity_pct <= 0 THEN
        RAISE EXCEPTION 'Invalid equity_pct on request';
    END IF;
    IF v_request.requesting_faction_id = p_buyer_faction_id THEN
        RAISE EXCEPTION 'Cannot buy a stake in your own corp';
    END IF;

    -- Lock buyer row; cash sufficiency.
    SELECT corp_cash_reserves INTO v_buyer_cash
    FROM public.factions
    WHERE id = p_buyer_faction_id
    FOR UPDATE;

    IF v_buyer_cash IS NULL OR v_buyer_cash < v_request.amount THEN
        RAISE EXCEPTION 'Insufficient buyer cash (need %, have %)',
            v_request.amount, COALESCE(v_buyer_cash, 0);
    END IF;

    -- Lock target row for the cash credit.
    SELECT corp_cash_reserves INTO v_target_cash
    FROM public.factions
    WHERE id = v_request.requesting_faction_id
    FOR UPDATE;

    SELECT current_tick INTO v_current_tick FROM public.shard LIMIT 1;

    -- Offer row (status='accepted' immediately — no offer/accept two-step
    -- for equity buy-ins under the current design).
    INSERT INTO public.finance_loan_offers (
        request_id, offering_faction_id, interest_rate,
        collateral_type, status, created_tick
    ) VALUES (
        p_request_id, p_buyer_faction_id, v_request.equity_pct,
        'unsecured', 'accepted', v_current_tick
    )
    RETURNING id INTO v_offer_id;

    -- Active position. term_months uses the 120-month sentinel from
    -- Phase 1 when the raiser left it at 0; otherwise the raiser's value
    -- wins. monthly_payment is 0 — Phase 4's tick branch computes the
    -- dividend each tick as equity_pct × target.monthly_profit.
    INSERT INTO public.finance_active_loans (
        request_id, offer_id,
        borrower_faction_id, lender_faction_id, nation_id,
        principal, interest_rate, term_months,
        collateral_type, purpose, monthly_payment,
        equity_pct, series, started_tick
    ) VALUES (
        p_request_id, v_offer_id,
        v_request.requesting_faction_id, p_buyer_faction_id, v_request.nation_id,
        v_request.amount, v_request.equity_pct,
        COALESCE(NULLIF(v_request.term_months, 0), 120),
        'unsecured', v_request.purpose, 0,
        v_request.equity_pct, v_request.series, v_current_tick
    )
    RETURNING id INTO v_position_id;

    -- Move cash.
    UPDATE public.factions
    SET corp_cash_reserves = v_buyer_cash - v_request.amount
    WHERE id = p_buyer_faction_id;

    UPDATE public.factions
    SET corp_cash_reserves = COALESCE(v_target_cash, 0) + v_request.amount
    WHERE id = v_request.requesting_faction_id;

    -- Flip request to funded so it leaves Deal Flow.
    UPDATE public.finance_loan_requests
    SET status = 'funded',
        accepted_offer_id = v_offer_id,
        funded_tick = v_current_tick
    WHERE id = p_request_id;

    RETURN v_position_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_equity_stake(UUID, UUID) TO authenticated;

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- Verification
-- ══════════════════════════════════════════════════════════════════════════
-- 1. Confirm the widened offers CHECK:
--      SELECT pg_get_constraintdef(oid) FROM pg_constraint
--      WHERE conname = 'finance_loan_offers_interest_rate_check';
--    Expected: "CHECK ((interest_rate >= 0::numeric) AND (interest_rate <= 50::numeric))"
--
-- 2. Confirm the RPC exists and is callable by authenticated users:
--      SELECT proname, pronargs, prosecdef
--      FROM pg_proc WHERE proname = 'buy_equity_stake';
--    Expected: one row, pronargs=2, prosecdef=true
--
-- 3. Smoke test (seed one equity request first, then):
--      SELECT public.buy_equity_stake(
--          '<request-id>'::uuid,
--          '<investor-corp-faction-id>'::uuid
--      );
--    Expected: returns a UUID (the new finance_active_loans.id).
--    Then confirm side effects:
--      • investor corp_cash_reserves ↓ by amount
--      • target corp_cash_reserves ↑ by amount
--      • finance_active_loans row exists with equity_pct + series
--      • finance_loan_requests.status = 'funded', accepted_offer_id set
