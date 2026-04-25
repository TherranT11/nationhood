-- Atomic client-callable foreclose for tier-1 finance_active_loans.
--
-- apForeclose in corp-operations-finance.html used to settle a
-- foreclosure with two sequential bare awaits:
--
--   1. UPDATE factions  -- credit lender with recovered collateral
--   2. UPDATE finance_active_loans  -- mark defaulted
--
-- Without a transaction wrapper, a mid-sequence failure left the
-- lender credited but the loan still late/delinquent, or vice
-- versa. Same atomicity hole the tick processor had before
-- process_finance_loan_default (commit cbde998).
--
-- This RPC folds the cash credit and the status update into one
-- PL/pgSQL block so Postgres' implicit transaction guarantees
-- atomicity. The recovery amount is computed INSIDE the function
-- from collateral_type and remaining_principal -- the client never
-- gets to declare how much the lender should receive.
--
-- The function is SECURITY DEFINER and granted to authenticated
-- users (not service_role only, unlike the tick-side RPCs) because
-- foreclose is a player action. The auth gate checks that the
-- caller actually owns the lender faction before crediting it.

CREATE OR REPLACE FUNCTION process_finance_loan_foreclose(p_loan_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user_id         UUID := auth.uid();
    v_loan            finance_active_loans%ROWTYPE;
    v_lender_id       UUID;
    v_request_type    TEXT;
    v_recovery_rate   NUMERIC;
    v_recovered       BIGINT;
    v_current_tick    INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    END IF;

    -- Lock loan row and re-validate every precondition the UI gated on.
    SELECT * INTO v_loan
    FROM finance_active_loans
    WHERE id = p_loan_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'loan_not_found');
    END IF;

    -- Type guard: finance_active_loans is polymorphic -- it also
    -- holds insurance, bond, and equity rows. Foreclose only applies
    -- to 'loan' rows. Without this guard, a caller could POST this
    -- RPC with an insurance policy's id and forcibly mark it
    -- 'defaulted' (voiding coverage), or touch a bond/equity row.
    -- The UI gates FORECLOSE rendering on d.type === 'LOAN', but a
    -- crafted client could bypass that.
    SELECT request_type INTO v_request_type
    FROM finance_loan_requests
    WHERE id = v_loan.request_id;

    IF COALESCE(v_request_type, '') <> 'loan' THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_a_loan', 'request_type', v_request_type);
    END IF;

    IF v_loan.status IN ('defaulted', 'repaid') THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'loan_already_closed', 'status', v_loan.status);
    END IF;

    -- Foreclose gate: delinquent status OR 3+ missed payments. Mirrors
    -- the UI check in apForeclose -- a player can foreclose as soon as
    -- the loan is delinquent; they don't have to wait for the tick
    -- processor's 4-missed default threshold.
    IF NOT (v_loan.status = 'delinquent' OR COALESCE(v_loan.payments_missed, 0) >= 3) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_foreclosable');
    END IF;

    v_lender_id := v_loan.lender_faction_id;

    -- Ownership gate: caller must own the lender faction. Same two-path
    -- pattern as declare_corp_bankruptcy -- supports the legacy
    -- id = user.id model and the multi-faction linked_user_id model.
    -- A faction row passes if EITHER its id or its linked_user_id
    -- matches the caller's auth.uid().
    IF NOT EXISTS (
        SELECT 1 FROM factions
        WHERE id = v_lender_id
          AND (id = v_user_id OR linked_user_id = v_user_id)
    ) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_lender');
    END IF;

    -- Collateral recovery rate -- duplicated from js/game/loan-math.js
    -- COLLATERAL_RECOVERY_RATES. If you change those numbers, change
    -- them here too. Kept as an inline CASE rather than a table so it
    -- stays trivially reviewable and doesn't add a new migration
    -- dependency.
    v_recovery_rate := CASE v_loan.collateral_type
        WHEN 'equipment' THEN 0.60
        WHEN 'property'  THEN 0.75
        ELSE 0
    END;

    v_recovered := ROUND(GREATEST(0, COALESCE(v_loan.remaining_principal, 0)) * v_recovery_rate);

    -- Current game tick for completed_tick stamp.
    SELECT COALESCE(current_tick, 0) INTO v_current_tick
    FROM shard WHERE name = 'Alpha Shard';
    v_current_tick := COALESCE(v_current_tick, 0);

    -- Atomic: credit lender (if recovery > 0) and mark loan defaulted.
    IF v_recovered > 0 THEN
        UPDATE factions
           SET corp_cash_reserves = corp_cash_reserves + v_recovered
         WHERE id = v_lender_id;
    END IF;

    UPDATE finance_active_loans
       SET status         = 'defaulted',
           completed_tick = v_current_tick
     WHERE id = p_loan_id;

    RETURN jsonb_build_object(
        'ok', true,
        'recovered', v_recovered,
        'collateral_type', COALESCE(v_loan.collateral_type, 'unsecured')
    );
END;
$fn$;

REVOKE ALL ON FUNCTION process_finance_loan_foreclose(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION process_finance_loan_foreclose(UUID) TO authenticated;
