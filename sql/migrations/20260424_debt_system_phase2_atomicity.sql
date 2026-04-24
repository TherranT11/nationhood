-- ============================================================
-- DEBT & DEFICIT SYSTEM — Phase 2 (atomicity + v2 gaps)
--
-- Addresses four items from the v1 audit:
--   1. Atomic mature_bond_holding RPC — pay + mark in one transaction.
--      Eliminates the double-payback risk when mark-matured fails after
--      principal was paid.
--   2. Atomic pay_bond_coupons RPC — nation debit + all holder credits
--      + shortfall inflation hit, one transaction. Closes the v2 gap
--      where "budget_reserves < totalCoupon" silently printed money
--      without an inflation consequence.
--   3. (No DB change needed for SurplusConnectors cleanup — handled in
--      handler-template.ts.)
--   4. (No DB change needed for Deal Flow BUY UI — handled in HTML.)
--
-- The inflation multiplier in pay_bond_coupons is hardcoded at 25,
-- matching DEBT_CONFIG.INFLATION_PER_PRINT_PCT in js/game/debt.js.
-- If the JS constant changes, this hardcode must move with it — a
-- targeted SSoT note, not a full duplication (the rule lives in JS;
-- this RPC just mirrors the number for atomicity).
--
-- Safe to re-run: CREATE OR REPLACE.
-- ============================================================

-- ==================== RPC: mature_bond_holding ====================
-- Atomically pay back principal + mark matured for one holding.
-- Called from processBondMaturitiesTick once per due holding.
--
-- Service-role only: the tick processor is the sole legitimate caller.
-- A manually-triggered maturity would be a design smell.

CREATE OR REPLACE FUNCTION mature_bond_holding(
    p_holding_id    UUID,
    p_current_tick  INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_h                  bond_holdings%ROWTYPE;
    v_new_holder_cash    BIGINT;
BEGIN
    -- Lock the holding to prevent concurrent maturity processing.
    SELECT * INTO v_h FROM bond_holdings
     WHERE id = p_holding_id
       FOR UPDATE;
    IF v_h.id IS NULL THEN
        RAISE EXCEPTION 'Holding not found';
    END IF;
    IF v_h.matured THEN
        -- Idempotent no-op: already matured (retry from a failed prior tick).
        RETURN jsonb_build_object('success', true, 'already_matured', true);
    END IF;

    -- Debit issuer budget + debt. GREATEST(0, ...) clamps so a nation
    -- running near-empty reserves doesn't go negative.
    --
    -- KNOWN v2 GAP: if reserves < principal, the nation effectively
    -- prints the shortfall to honor the maturity — holder is credited
    -- in full but no inflation consequence here. Same silent-print
    -- pattern as the pre-Phase-2 coupon gap (now fixed in pay_bond_coupons).
    -- The correct v2 fix is either (a) apply the inflation hit for
    -- maturity shortfall too, or (b) trigger the sovereign-default
    -- path when a scheduled maturity can't be covered. Not implemented
    -- in v1 per the "default haircut is v2" line in the original spec.
    UPDATE nations
       SET budget_reserves = GREATEST(0, COALESCE(budget_reserves, 0) - v_h.principal),
           debt            = GREATEST(0, COALESCE(debt, 0) - v_h.principal)
     WHERE id = v_h.issuer_nation_id;

    -- Credit holder.
    UPDATE factions
       SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) + v_h.principal
     WHERE id = v_h.holder_faction_id
     RETURNING corp_cash_reserves INTO v_new_holder_cash;

    -- Mark matured. If any of the above failed, the whole transaction
    -- rolls back — no double payback, no lost principal.
    UPDATE bond_holdings
       SET matured = true, matured_at_tick = p_current_tick
     WHERE id = p_holding_id;

    RETURN jsonb_build_object(
        'success',        true,
        'principal',      v_h.principal,
        'holder_new_cash', v_new_holder_cash
    );
END;
$fn$;

REVOKE EXECUTE ON FUNCTION mature_bond_holding(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mature_bond_holding(UUID, INT) TO service_role;

-- ==================== RPC: pay_bond_coupons ====================
-- Atomically: aggregate active coupons for this nation, debit the
-- issuer once, credit every holder their share, and if the nation can't
-- cover the full amount, print the shortfall AND apply the inflation
-- hit.
--
-- This closes the "coupon shortfall silently prints money" v1 gap. A
-- nation running on fumes still pays its holders in full (holders don't
-- care why the government paid — only that the coupon arrived) but the
-- printed shortfall shows up as inflation the next time downstream
-- stats cascade.
--
-- Returns totals for logging. Service-role only.

CREATE OR REPLACE FUNCTION pay_bond_coupons(
    p_nation_id     UUID,
    p_current_tick  INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_nation         nations%ROWTYPE;
    v_total_coupon   BIGINT := 0;
    v_shortfall      BIGINT;
    v_print_ratio    NUMERIC;
    v_inflation_delta NUMERIC;
    v_new_inflation  NUMERIC;
    v_new_reserves   BIGINT;
    v_holder         RECORD;
    -- Must match DEBT_CONFIG.INFLATION_PER_PRINT_PCT in js/game/debt.js.
    v_inflation_mult CONSTANT NUMERIC := 25;
BEGIN
    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id FOR UPDATE;
    IF v_nation.id IS NULL THEN
        RAISE EXCEPTION 'Nation not found';
    END IF;

    -- Aggregate coupon owed per holder, summing across their multiple
    -- holdings if any. Round per-row to integer dollars; the tiny
    -- fractional loss per coupon is preferable to accumulating floats.
    FOR v_holder IN
        SELECT holder_faction_id,
               SUM(ROUND(principal * coupon_rate))::BIGINT AS coupon
          FROM bond_holdings
         WHERE issuer_nation_id = p_nation_id
           AND matured = false
         GROUP BY holder_faction_id
    LOOP
        IF v_holder.coupon IS NULL OR v_holder.coupon <= 0 THEN CONTINUE; END IF;

        v_total_coupon := v_total_coupon + v_holder.coupon;
        UPDATE factions
           SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) + v_holder.coupon
         WHERE id = v_holder.holder_faction_id;
    END LOOP;

    IF v_total_coupon = 0 THEN
        RETURN jsonb_build_object('total_coupon', 0);
    END IF;

    -- Debit issuer. If reserves can't cover, compute the shortfall and
    -- apply the inflation hit — this is money the nation effectively
    -- printed to make holders whole.
    v_shortfall    := GREATEST(0, v_total_coupon - COALESCE(v_nation.budget_reserves, 0));
    v_new_reserves := GREATEST(0, COALESCE(v_nation.budget_reserves, 0) - v_total_coupon);

    IF v_shortfall > 0 AND COALESCE(v_nation.gdp, 0) > 0 THEN
        v_print_ratio     := v_shortfall::NUMERIC / v_nation.gdp::NUMERIC;
        v_inflation_delta := v_print_ratio * v_inflation_mult;
        v_new_inflation   := LEAST(100, GREATEST(0, COALESCE(v_nation.inflation, 0) + v_inflation_delta));
        UPDATE nations
           SET budget_reserves = v_new_reserves,
               inflation       = v_new_inflation
         WHERE id = p_nation_id;
    ELSE
        UPDATE nations
           SET budget_reserves = v_new_reserves
         WHERE id = p_nation_id;
    END IF;

    RETURN jsonb_build_object(
        'total_coupon',     v_total_coupon,
        'shortfall',        v_shortfall,
        'inflation_delta',  COALESCE(v_inflation_delta, 0)
    );
END;
$fn$;

REVOKE EXECUTE ON FUNCTION pay_bond_coupons(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pay_bond_coupons(UUID, INT) TO service_role;

-- ==================== VERIFY ====================
SELECT 'mature_bond_holding' AS rpc, COUNT(*) AS present FROM pg_proc WHERE proname = 'mature_bond_holding'
UNION ALL
SELECT 'pay_bond_coupons',    COUNT(*) FROM pg_proc WHERE proname = 'pay_bond_coupons';
