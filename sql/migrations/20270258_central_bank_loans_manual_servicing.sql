-- ============================================================================
-- Central Bank loans → manual servicing (matches corp_loans, 20270257).
--
-- The per-tick auto-amortization in advance-corp-tick is replaced (in the edge
-- function) with compound interest accrual on `outstanding` + default at term.
-- This migration adds the manual-payment RPC the [Debt Payment] modal calls.
--
-- pay_central_bank_debt: the borrower CEO pays an amount from treasury_cash; it
-- reduces the loan's `outstanding`, which restores the nation's CB lending
-- capacity (capacity = central_bank_discretionary × 100 − Σ active outstanding).
-- No discretionary change — the freed outstanding is the capacity restoration;
-- the cash is absorbed by the CB (no double-count). Owner-only, SECURITY DEFINER.
--
-- entrepreneur_corp_outstanding_debt already sums active central_bank_loans
-- outstanding, so the solvency gate / book value / net worth track the accrual
-- with no further change.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.pay_central_bank_debt(p_loan_id uuid, p_amount bigint)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_loan central_bank_loans%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_out  bigint;
    v_pay  bigint;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_amount IS NULL OR p_amount < 1 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount'); END IF;

    SELECT * INTO v_loan FROM central_bank_loans WHERE id = p_loan_id AND status = 'active' FOR UPDATE;
    IF v_loan.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'loan_not_found'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_loan.borrower_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    v_out := GREATEST(0, COALESCE(v_loan.outstanding, 0));
    v_pay := LEAST(p_amount, v_out, GREATEST(0, floor(COALESCE(v_corp.treasury_cash, 0))::bigint));
    IF v_pay < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint, 'balance', v_out);
    END IF;

    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) - v_pay WHERE id = v_corp.id;
    UPDATE central_bank_loans
       SET outstanding       = v_out - v_pay,
           last_payment_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1),
           status            = CASE WHEN (v_out - v_pay) < 1 THEN 'repaid' ELSE 'active' END
     WHERE id = p_loan_id;

    RETURN jsonb_build_object('success', true, 'paid', v_pay, 'remaining', GREATEST(0, v_out - v_pay));
END;
$$;
GRANT EXECUTE ON FUNCTION public.pay_central_bank_debt(uuid, bigint) TO authenticated;

COMMENT ON FUNCTION public.pay_central_bank_debt(uuid, bigint) IS
    'Borrower CEO pays an amount toward a Central Bank loan from treasury_cash; reduces outstanding (restores CB lending capacity), marks repaid at <1. Owner-only, SECURITY DEFINER. Pairs with the accrual-only CB tick in advance-corp-tick (no auto-payment).';

NOTIFY pgrst, 'reload schema';

COMMIT;
