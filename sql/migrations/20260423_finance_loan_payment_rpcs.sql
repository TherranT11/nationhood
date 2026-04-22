-- Atomic Finance Loan Payment RPCs.
--
-- The corp tick processor used to mutate three rows in sequence with
-- bare awaits and no error checking when settling a loan payment:
--
--   1. UPDATE factions  -- debit borrower
--   2. UPDATE factions  -- credit lender
--   3. UPDATE finance_active_loans  -- record payment
--
-- Without a transaction wrapper, any failure mid-sequence left the
-- system in an inconsistent state. Worst cases:
--   * Step 2 fails: borrower lost cash, lender never received it,
--                   loan untouched -> next tick re-debits.
--   * Step 3 fails: cash moved on both sides, loan untouched ->
--                   next tick re-debits AND re-credits.
--
-- These two RPCs put each scenario into a single PL/pgSQL block so
-- Postgres' implicit transaction guarantees atomicity. The borrower
-- row is locked FOR UPDATE inside the success path so a concurrent
-- payment for a different loan against the same corp can't cause
-- a phantom-overdraft.
--
-- Both functions are SECURITY DEFINER and granted to service_role
-- only -- the corp tick processor runs as service role; no client
-- ever calls these directly.

-- ============================================================
-- process_finance_loan_payment
--   Successful monthly payment path.
-- ============================================================

CREATE OR REPLACE FUNCTION process_finance_loan_payment(
    p_loan_id           UUID,
    p_borrower_id       UUID,
    p_lender_id         UUID,
    p_payment           BIGINT,
    p_new_total_paid    BIGINT,
    p_new_interest_paid BIGINT,
    p_new_remaining     BIGINT,
    p_new_payments_made INT,
    p_is_repaid         BOOLEAN,
    p_current_tick      INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_borrower_cash BIGINT;
BEGIN
    -- Lock borrower row, re-check cash inside the transaction so a
    -- concurrent payment can't double-spend.
    SELECT corp_cash_reserves INTO v_borrower_cash
    FROM factions WHERE id = p_borrower_id FOR UPDATE;

    IF v_borrower_cash IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'borrower_not_found');
    END IF;

    IF v_borrower_cash < p_payment THEN
        RETURN jsonb_build_object(
            'ok', false,
            'reason', 'insufficient_cash',
            'borrower_cash', v_borrower_cash,
            'payment', p_payment
        );
    END IF;

    UPDATE factions
       SET corp_cash_reserves = corp_cash_reserves - p_payment
     WHERE id = p_borrower_id;

    UPDATE factions
       SET corp_cash_reserves = corp_cash_reserves + p_payment
     WHERE id = p_lender_id;

    UPDATE finance_active_loans
       SET total_paid          = p_new_total_paid,
           total_interest_paid = p_new_interest_paid,
           remaining_principal = p_new_remaining,
           payments_made       = p_new_payments_made,
           payments_missed     = 0,
           last_payment_tick   = p_current_tick,
           status              = CASE WHEN p_is_repaid THEN 'repaid' ELSE 'current' END,
           completed_tick      = CASE WHEN p_is_repaid THEN p_current_tick ELSE NULL END
     WHERE id = p_loan_id;

    RETURN jsonb_build_object('ok', true);
END;
$fn$;

REVOKE ALL ON FUNCTION process_finance_loan_payment(UUID, UUID, UUID, BIGINT, BIGINT, BIGINT, BIGINT, INT, BOOLEAN, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION process_finance_loan_payment(UUID, UUID, UUID, BIGINT, BIGINT, BIGINT, BIGINT, INT, BOOLEAN, INT) TO service_role;


-- ============================================================
-- process_finance_loan_default
--   Failed monthly payment path. Handles late / delinquent /
--   defaulted in one place so the optional collateral recovery
--   credit is always atomic with the loan-status update.
--
--   p_recovered_amount  > 0  -> credit lender that amount
--                       == 0 -> no cash transfer (late/delinquent
--                               or defaulted unsecured loan)
-- ============================================================

CREATE OR REPLACE FUNCTION process_finance_loan_default(
    p_loan_id              UUID,
    p_lender_id            UUID,
    p_recovered_amount     BIGINT,
    p_new_payments_missed  INT,
    p_new_status           TEXT,
    p_current_tick         INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
    IF p_new_status NOT IN ('late', 'delinquent', 'defaulted') THEN
        RAISE EXCEPTION 'process_finance_loan_default: invalid status %', p_new_status;
    END IF;

    IF p_recovered_amount > 0 THEN
        UPDATE factions
           SET corp_cash_reserves = corp_cash_reserves + p_recovered_amount
         WHERE id = p_lender_id;
    END IF;

    UPDATE finance_active_loans
       SET payments_missed = p_new_payments_missed,
           status          = p_new_status,
           completed_tick  = CASE WHEN p_new_status = 'defaulted' THEN p_current_tick ELSE NULL END
     WHERE id = p_loan_id;

    RETURN jsonb_build_object('ok', true);
END;
$fn$;

REVOKE ALL ON FUNCTION process_finance_loan_default(UUID, UUID, BIGINT, INT, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION process_finance_loan_default(UUID, UUID, BIGINT, INT, TEXT, INT) TO service_role;
