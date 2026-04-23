-- Atomic client-callable RPCs for finance UI actions that previously
-- used bare-await UPDATE sequences with no ownership or type guards.
-- Same fix template as process_finance_loan_foreclose (commit ee03a9e):
--
--   * SECURITY DEFINER + granted to 'authenticated' so players can call
--     but RLS is bypassed by the function's own checks.
--   * auth.uid() must be set.
--   * Target row locked FOR UPDATE so concurrent callers serialize.
--   * Ownership gate: caller must own the faction on the lender/
--     insurer side of the policy.
--   * Type guard: finance_active_loans is polymorphic, so each RPC
--     explicitly joins finance_loan_requests and enforces the
--     request_type that matches the operation.
--   * Already-closed guard.
--
-- Pre-existing RLS on finance_active_loans is 'FOR ALL USING (true)'
-- so before these RPCs any authenticated user could touch any row by
-- id. The RPCs close that hole for the three handlers that mutate
-- multi-row state.

-- ============================================================
-- process_insurance_claim_pay_full
--   Insurer pays a claim in full on their own policy. Payout =
--   (principal - claims_paid) * (1 - deductible_pct/100). Policy
--   stays active (future claims still possible until principal is
--   fully exhausted).
-- ============================================================

CREATE OR REPLACE FUNCTION process_insurance_claim_pay_full(p_policy_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user_id       UUID := auth.uid();
    v_policy        finance_active_loans%ROWTYPE;
    v_request_type  TEXT;
    v_claim_amount  BIGINT;
    v_deductible    NUMERIC;
    v_payout        BIGINT;
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

    -- Ownership gate: caller must own the insurer faction.
    IF NOT EXISTS (
        SELECT 1 FROM factions
        WHERE id = v_policy.lender_faction_id
          AND (id = v_user_id OR linked_user_id = v_user_id)
    ) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_insurer');
    END IF;

    v_claim_amount := GREATEST(0, COALESCE(v_policy.principal, 0) - COALESCE(v_policy.claims_paid, 0));
    v_deductible   := LEAST(1, GREATEST(0, COALESCE(v_policy.deductible_pct, 0) / 100.0));
    v_payout       := GREATEST(0, ROUND(v_claim_amount * (1 - v_deductible)));

    -- Insurer cash check.
    SELECT COALESCE(corp_cash_reserves, 0) INTO v_insurer_cash
    FROM factions WHERE id = v_policy.lender_faction_id;

    IF v_insurer_cash < v_payout THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_funds', 'insurer_cash', v_insurer_cash, 'required', v_payout);
    END IF;

    -- Atomic: debit insurer + credit policyholder (if they still
    -- exist; missing policyholder rolls back the whole transaction
    -- to avoid a cash-sink insurer debit with no counterparty).
    IF v_payout > 0 THEN
        IF NOT EXISTS (SELECT 1 FROM factions WHERE id = v_policy.borrower_faction_id) THEN
            RETURN jsonb_build_object('ok', false, 'reason', 'policyholder_missing');
        END IF;

        UPDATE factions
           SET corp_cash_reserves = corp_cash_reserves - v_payout
         WHERE id = v_policy.lender_faction_id;

        UPDATE factions
           SET corp_cash_reserves = corp_cash_reserves + v_payout
         WHERE id = v_policy.borrower_faction_id;
    END IF;

    UPDATE finance_active_loans
       SET claims_paid  = COALESCE(claims_paid, 0) + v_payout,
           claims_count = COALESCE(claims_count, 0) + 1
     WHERE id = p_policy_id;

    RETURN jsonb_build_object('ok', true, 'payout', v_payout);
END;
$fn$;

REVOKE ALL ON FUNCTION process_insurance_claim_pay_full(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION process_insurance_claim_pay_full(UUID) TO authenticated;


-- ============================================================
-- process_insurance_claim_settle
--   Negotiated partial settlement. Payout = (principal -
--   claims_paid) * (settlement_pct/100). Deductible does NOT apply
--   (matches prior client behavior). Policy is closed afterward.
--
--   The acceptance RNG stays client-side so rejected negotiations
--   never reach this RPC -- keeps existing behavior verbatim.
-- ============================================================

CREATE OR REPLACE FUNCTION process_insurance_claim_settle(p_policy_id UUID, p_settlement_pct INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user_id       UUID := auth.uid();
    v_policy        finance_active_loans%ROWTYPE;
    v_request_type  TEXT;
    v_claim_amount  BIGINT;
    v_payout        BIGINT;
    v_insurer_cash  BIGINT;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    END IF;

    IF p_settlement_pct IS NULL OR p_settlement_pct < 10 OR p_settlement_pct > 90 THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'invalid_settlement_pct');
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

    v_claim_amount := GREATEST(0, COALESCE(v_policy.principal, 0) - COALESCE(v_policy.claims_paid, 0));
    v_payout       := GREATEST(0, ROUND(v_claim_amount * p_settlement_pct / 100.0));

    SELECT COALESCE(corp_cash_reserves, 0) INTO v_insurer_cash
    FROM factions WHERE id = v_policy.lender_faction_id;

    IF v_insurer_cash < v_payout THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_funds', 'insurer_cash', v_insurer_cash, 'required', v_payout);
    END IF;

    IF v_payout > 0 THEN
        IF NOT EXISTS (SELECT 1 FROM factions WHERE id = v_policy.borrower_faction_id) THEN
            RETURN jsonb_build_object('ok', false, 'reason', 'policyholder_missing');
        END IF;

        UPDATE factions
           SET corp_cash_reserves = corp_cash_reserves - v_payout
         WHERE id = v_policy.lender_faction_id;

        UPDATE factions
           SET corp_cash_reserves = corp_cash_reserves + v_payout
         WHERE id = v_policy.borrower_faction_id;
    END IF;

    -- Negotiated settlements close the policy. This matches the
    -- prior client behavior ('repaid' when settled). If future
    -- product work wants a distinct 'settled' status, update both
    -- this RPC and the schema's status CHECK in the same commit.
    UPDATE finance_active_loans
       SET claims_paid  = COALESCE(claims_paid, 0) + v_payout,
           claims_count = COALESCE(claims_count, 0) + 1,
           status       = 'repaid'
     WHERE id = p_policy_id;

    RETURN jsonb_build_object('ok', true, 'payout', v_payout);
END;
$fn$;

REVOKE ALL ON FUNCTION process_insurance_claim_settle(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION process_insurance_claim_settle(UUID, INTEGER) TO authenticated;


-- ============================================================
-- process_finance_loan_call
--   Lender escalates a current/late loan to 'delinquent' with
--   payments_missed = 3, so one more missed tick triggers default
--   with collateral recovery. No cash moves, so atomicity isn't
--   the concern -- this RPC exists to add ownership + type guards
--   that the direct-UPDATE path lacked.
-- ============================================================

CREATE OR REPLACE FUNCTION process_finance_loan_call(p_loan_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user_id       UUID := auth.uid();
    v_loan          finance_active_loans%ROWTYPE;
    v_request_type  TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_loan
    FROM finance_active_loans
    WHERE id = p_loan_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'loan_not_found');
    END IF;

    SELECT request_type INTO v_request_type
    FROM finance_loan_requests
    WHERE id = v_loan.request_id;

    IF COALESCE(v_request_type, '') <> 'loan' THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_a_loan', 'request_type', v_request_type);
    END IF;

    -- Only makes sense on a non-escalated, non-closed loan.
    IF v_loan.status IN ('defaulted', 'repaid') THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'loan_already_closed', 'status', v_loan.status);
    END IF;

    IF v_loan.status = 'delinquent' OR COALESCE(v_loan.payments_missed, 0) >= 3 THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'already_escalated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM factions
        WHERE id = v_loan.lender_faction_id
          AND (id = v_user_id OR linked_user_id = v_user_id)
    ) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_lender');
    END IF;

    UPDATE finance_active_loans
       SET status          = 'delinquent',
           payments_missed = 3
     WHERE id = p_loan_id;

    RETURN jsonb_build_object('ok', true);
END;
$fn$;

REVOKE ALL ON FUNCTION process_finance_loan_call(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION process_finance_loan_call(UUID) TO authenticated;
