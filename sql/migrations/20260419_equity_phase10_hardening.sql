-- ══════════════════════════════════════════════════════════════════════════
-- Phase 10: Hardening pass on the equity system.
--
-- Three targeted changes, all defensive:
--
--   1. Relax finance_loan_requests.term_months CHECK from >= 1 to >= 0.
--      The original base-schema constraint was loan-specific. Insurance
--      inserts (corp-operations.html:4179, :13635, corp-operations-shipping
--      .html:4015, :13827) pass term_months=0 — either they've been silently
--      failing or the CHECK was dropped out-of-band in your production DB.
--      Either way, 0 is semantically correct for term-less deal types
--      (insurance, equity). Widen to 0-120 so every path is legal.
--
--   2. Total-stake cap in buy_equity_stake. Previously, a raiser could
--      close multiple funded rounds summing to >100% — their equity
--      holders would receive more in dividends than the corp earned (the
--      tick processor's cash clamp papered over the math, but some
--      investors got shortchanged). Enforce that existing active stakes
--      + this new stake ≤ 100%. Raisers can still POST raises freely; the
--      cap is checked at buy time against actually-funded stakes.
--
--   3. Expiry check in buy_equity_stake. Open requests past expires_tick
--      should not be buyable. The tick processor's expiry sweep catches
--      them eventually, but between ticks a stale row could still be in
--      'open' status. Server-side rejection closes that window.
--
-- Idempotent — safe to re-run. CREATE OR REPLACE FUNCTION redefines
-- buy_equity_stake in place.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Widen term_months CHECK ──
ALTER TABLE finance_loan_requests
    DROP CONSTRAINT IF EXISTS finance_loan_requests_term_months_check;
ALTER TABLE finance_loan_requests
    ADD CONSTRAINT finance_loan_requests_term_months_check
    CHECK (term_months >= 0 AND term_months <= 120);

-- ── 2 + 3. Redefine buy_equity_stake with expiry + total-stake cap ──
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
    v_caller_uid    UUID := auth.uid();
    v_request       finance_loan_requests%ROWTYPE;
    v_buyer_cash    BIGINT;
    v_target_cash   BIGINT;
    v_current_tick  INT;
    v_offer_id      UUID;
    v_position_id   UUID;
    v_existing_pct  NUMERIC;
BEGIN
    -- Auth: caller must own the buyer faction (primary OR linked).
    IF NOT EXISTS (
        SELECT 1 FROM factions
        WHERE id = p_buyer_faction_id
          AND (id = v_caller_uid OR linked_user_id = v_caller_uid)
    ) THEN
        RAISE EXCEPTION 'Not authorized to act as buyer faction';
    END IF;

    -- Lock the request row; validate.
    SELECT * INTO v_request
    FROM finance_loan_requests
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

    SELECT current_tick INTO v_current_tick FROM shard LIMIT 1;

    -- Phase 10: expiry guard.
    IF v_current_tick > v_request.expires_tick THEN
        RAISE EXCEPTION 'Request expired (current tick % > expires_tick %)',
            v_current_tick, v_request.expires_tick;
    END IF;

    -- Phase 10: total-stake cap. Existing active stakes against THIS target
    -- plus the new stake must not exceed 100%. Using FOR UPDATE on the
    -- aggregate isn't possible, but taking FOR UPDATE on the request above
    -- serializes concurrent buys against the same request; two buys against
    -- DIFFERENT requests targeting the same corp could theoretically race.
    -- The check here is the best-effort guard; the next iteration can
    -- escalate to advisory locks if races are observed.
    SELECT COALESCE(SUM(equity_pct), 0) INTO v_existing_pct
    FROM finance_active_loans
    WHERE borrower_faction_id = v_request.requesting_faction_id
      AND equity_pct IS NOT NULL
      AND status IN ('current', 'late', 'delinquent');

    IF v_existing_pct + v_request.equity_pct > 100 THEN
        -- %% emits a literal "%"; % substitutes the next argument. Previously
        -- all three were %% (escaped literals), which left the two args
        -- unconsumed and tripped PostgreSQL's "too many parameters" error
        -- instead of surfacing the cap message to the client.
        RAISE EXCEPTION 'Total outside equity would exceed 100%% (existing: %, this raise: %)',
            v_existing_pct, v_request.equity_pct;
    END IF;

    -- Lock buyer row; cash sufficiency.
    SELECT corp_cash_reserves INTO v_buyer_cash
    FROM factions
    WHERE id = p_buyer_faction_id
    FOR UPDATE;

    IF v_buyer_cash IS NULL OR v_buyer_cash < v_request.amount THEN
        RAISE EXCEPTION 'Insufficient buyer cash (need %, have %)',
            v_request.amount, COALESCE(v_buyer_cash, 0);
    END IF;

    -- Lock target row for the cash credit.
    SELECT corp_cash_reserves INTO v_target_cash
    FROM factions
    WHERE id = v_request.requesting_faction_id
    FOR UPDATE;

    -- Offer row (status='accepted' immediately — no offer/accept two-step
    -- for equity buy-ins under the current design).
    INSERT INTO finance_loan_offers (
        request_id, offering_faction_id, interest_rate,
        collateral_type, status, created_tick
    ) VALUES (
        p_request_id, p_buyer_faction_id, v_request.equity_pct,
        'unsecured', 'accepted', v_current_tick
    )
    RETURNING id INTO v_offer_id;

    -- Active position. term_months uses the 120-month sentinel from
    -- Phase 1 when the raiser left it at 0; otherwise the raiser's value
    -- wins. monthly_payment is 0 — the tick branch computes the dividend
    -- each tick as equity_pct × target.monthly_profit.
    INSERT INTO finance_active_loans (
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
    UPDATE factions
    SET corp_cash_reserves = v_buyer_cash - v_request.amount
    WHERE id = p_buyer_faction_id;

    UPDATE factions
    SET corp_cash_reserves = COALESCE(v_target_cash, 0) + v_request.amount
    WHERE id = v_request.requesting_faction_id;

    -- Flip request to funded so it leaves Deal Flow.
    UPDATE finance_loan_requests
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
-- 1. Widened CHECK:
--      SELECT pg_get_constraintdef(oid) FROM pg_constraint
--      WHERE conname = 'finance_loan_requests_term_months_check';
--    Expected: "CHECK ((term_months >= 0) AND (term_months <= 120))"
--
-- 2. Function redefined in place:
--      SELECT proname, pronargs, prosecdef
--      FROM pg_proc WHERE proname = 'buy_equity_stake';
--    Expected: one row, pronargs=2, prosecdef=true.
--
-- 3. Negative smoke — expired request:
--      -- Seed a request with expires_tick well in the past, then call:
--      SELECT public.buy_equity_stake('<expired-req-id>'::uuid,
--                                     '<investor-id>'::uuid);
--    Expected: ERROR "Request expired (current tick X > expires_tick Y)"
--
-- 4. Negative smoke — over-cap:
--      -- Seed two funded 60% stakes on the same corp by repeatedly calling
--      -- buy_equity_stake against separate raises (skip the cap by using
--      -- service-role DIRECT inserts to set up), then try to buy a third
--      -- 10% stake. Or: seed the target with 95% already held, raise for
--      -- 10%, try to buy.
--    Expected: ERROR "Total outside equity would exceed 100% (existing: 95, this raise: 10)"
--
-- 5. Positive smoke — an in-range buy still works exactly as before. The
--    cap and expiry checks are non-blocking when the raise is legal.
