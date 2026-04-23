-- Atomic client-callable RPCs for the two remaining finance handlers
-- that bypassed ownership / type guards and, in the dispute case, had
-- a broken semantic flow.
--
-- Same template as the earlier finance RPCs (ee03a9e, ffe1fd9):
-- SECURITY DEFINER, granted to 'authenticated', auth.uid() gate,
-- FOR UPDATE row lock, type guard against finance_active_loans
-- polymorphism, ownership gate via id/linked_user_id.

-- ============================================================
-- process_bond_sell_position
--   Lender sells a performance bond position at an 85% discount
--   (a "fire sale" for instant liquidity). Marks the loan repaid.
--
--   DESIGN NOTE — money origination.
--   The 85% market_value is credited to the lender without a
--   counterparty debit. Semantically this is "the market" as an
--   unmodeled buyer. It matches the prior client-side behavior
--   verbatim; this RPC is only fixing atomicity + ownership +
--   type guards, not the economic mechanic. If a future product
--   pass wants a proper buyer or a full write-off, reshape this
--   function then.
-- ============================================================

CREATE OR REPLACE FUNCTION process_bond_sell_position(p_bond_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user_id       UUID := auth.uid();
    v_bond          finance_active_loans%ROWTYPE;
    v_request_type  TEXT;
    v_remaining     BIGINT;
    v_market_value  BIGINT;
    v_current_tick  INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_bond
    FROM finance_active_loans
    WHERE id = p_bond_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'position_not_found');
    END IF;

    SELECT request_type INTO v_request_type
    FROM finance_loan_requests
    WHERE id = v_bond.request_id;

    IF COALESCE(v_request_type, '') <> 'bond' THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_a_bond', 'request_type', v_request_type);
    END IF;

    IF v_bond.status IN ('defaulted', 'repaid') THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'position_already_closed', 'status', v_bond.status);
    END IF;

    -- Ownership gate: only the bond holder (lender) can sell.
    IF NOT EXISTS (
        SELECT 1 FROM factions
        WHERE id = v_bond.lender_faction_id
          AND (id = v_user_id OR linked_user_id = v_user_id)
    ) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_lender');
    END IF;

    v_remaining    := GREATEST(0, COALESCE(v_bond.principal, 0) - COALESCE(v_bond.total_paid, 0));
    v_market_value := GREATEST(0, ROUND(v_remaining * 0.85));

    SELECT COALESCE(current_tick, 0) INTO v_current_tick
    FROM shard WHERE name = 'Alpha Shard';
    v_current_tick := COALESCE(v_current_tick, 0);

    -- Atomic: credit lender + close the position.
    IF v_market_value > 0 THEN
        UPDATE factions
           SET corp_cash_reserves = corp_cash_reserves + v_market_value
         WHERE id = v_bond.lender_faction_id;
    END IF;

    UPDATE finance_active_loans
       SET status         = 'repaid',
           completed_tick = v_current_tick
     WHERE id = p_bond_id;

    RETURN jsonb_build_object('ok', true, 'proceeds', v_market_value);
END;
$fn$;

REVOKE ALL ON FUNCTION process_bond_sell_position(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION process_bond_sell_position(UUID) TO authenticated;


-- ============================================================
-- process_insurance_claim_dispute
--   Insurer disputes a pending claim. 70% chance the investigation
--   finds the claim valid (insurer must pay full claim + 10%
--   penalty, atomic); 30% chance it finds fraud (no state change,
--   policy remains active).
--
--   The RNG runs SERVER-SIDE here, unlike negotiate (which keeps
--   its RNG on the client to match pre-existing gameplay). Dispute
--   is re-scoped to fix semantic bugs, and trusting the client's
--   RNG to decide "the insurer owes a full payout + 10% penalty"
--   would be exploitable -- a player could rig their own fraud
--   outcome. Server RNG closes that path.
--
--   Prior client-side behavior was broken in both cases:
--     * valid  -- no state change, alert told user to pay manually
--     * fraud  -- set status='repaid' (wrong, should stay active)
--                 and claims_count=0 (wiped history)
--   This RPC implements what the confirm dialog always promised.
-- ============================================================

CREATE OR REPLACE FUNCTION process_insurance_claim_dispute(p_policy_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user_id       UUID := auth.uid();
    v_policy        finance_active_loans%ROWTYPE;
    v_request_type  TEXT;
    v_is_valid      BOOLEAN;
    v_claim_amount  BIGINT;
    v_payout        BIGINT;
    v_penalty       BIGINT;
    v_total         BIGINT;
    v_insurer_cash  BIGINT;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_policy
    FROM finance_active_loans
    WHERE id = p_policy_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'policy_not_found');
    END IF;

    SELECT request_type INTO v_request_type
    FROM finance_loan_requests
    WHERE id = v_policy.request_id;

    IF COALESCE(v_request_type, '') <> 'insurance' THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_insurance', 'request_type', v_request_type);
    END IF;

    IF v_policy.status IN ('defaulted', 'repaid', 'lapsed', 'cancelled') THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'policy_closed', 'status', v_policy.status);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM factions
        WHERE id = v_policy.lender_faction_id
          AND (id = v_user_id OR linked_user_id = v_user_id)
    ) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_insurer');
    END IF;

    -- Investigation RNG. 70% valid / 30% fraud matches prior
    -- client-side probabilities.
    v_is_valid := random() < 0.7;

    IF NOT v_is_valid THEN
        -- Fraud finding. No cash moves, no state change -- policy
        -- stays active so the policyholder can file a proper claim
        -- later if warranted.
        RETURN jsonb_build_object('ok', true, 'outcome', 'fraud');
    END IF;

    -- Valid finding: full payout (no deductible -- dispute forces
    -- full pay) + 10% penalty, both credited to the policyholder.
    v_claim_amount := GREATEST(0, COALESCE(v_policy.principal, 0) - COALESCE(v_policy.claims_paid, 0));
    v_payout       := v_claim_amount;
    v_penalty      := GREATEST(0, ROUND(v_payout * 0.10));
    v_total        := v_payout + v_penalty;

    SELECT COALESCE(corp_cash_reserves, 0) INTO v_insurer_cash
    FROM factions WHERE id = v_policy.lender_faction_id;

    IF v_insurer_cash < v_total THEN
        -- Can't afford the payout + penalty. Roll back everything;
        -- the dispute can be re-attempted later once the insurer
        -- has funds. Re-try re-rolls the RNG.
        RETURN jsonb_build_object(
            'ok', false,
            'reason', 'insufficient_funds',
            'insurer_cash', v_insurer_cash,
            'required', v_total,
            'outcome', 'valid'
        );
    END IF;

    IF v_total > 0 THEN
        IF NOT EXISTS (SELECT 1 FROM factions WHERE id = v_policy.borrower_faction_id) THEN
            RETURN jsonb_build_object('ok', false, 'reason', 'policyholder_missing');
        END IF;

        UPDATE factions
           SET corp_cash_reserves = corp_cash_reserves - v_total
         WHERE id = v_policy.lender_faction_id;

        UPDATE factions
           SET corp_cash_reserves = corp_cash_reserves + v_total
         WHERE id = v_policy.borrower_faction_id;
    END IF;

    -- Claim tracking: claims_paid gets the payout (penalty is
    -- extra, not counted as claim coverage). Policy stays active.
    UPDATE finance_active_loans
       SET claims_paid  = COALESCE(claims_paid, 0) + v_payout,
           claims_count = COALESCE(claims_count, 0) + 1
     WHERE id = p_policy_id;

    RETURN jsonb_build_object(
        'ok', true,
        'outcome', 'valid',
        'payout', v_payout,
        'penalty', v_penalty
    );
END;
$fn$;

REVOKE ALL ON FUNCTION process_insurance_claim_dispute(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION process_insurance_claim_dispute(UUID) TO authenticated;
