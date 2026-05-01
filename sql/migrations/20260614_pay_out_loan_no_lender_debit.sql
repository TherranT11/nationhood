-- ══════════════════════════════════════════════════════════════
-- Decouple bank cash from loan principal (Design fork A1)
--
-- Design change: a bank's corp_cash_reserves and its loan principal
-- flows are now separate accounting axes. Paying out a loan does NOT
-- debit the bank's cash; the principal is "printed" to the borrower.
-- Per-tick repayments still credit the FULL payment (principal +
-- interest) to the bank's cash — banks are net money creators per
-- this fork.
--
-- Two parts:
--   1. CREATE OR REPLACE pay_out_loan removing the lender debit
--      (and the corresponding cash check + race-recovery refund).
--      Borrower side unchanged: cash credited + corp_debt
--      incremented in the same UPDATE.
--   2. One-shot refund: for every bank_loans row currently in
--      'active' status, refund the lender by the row's outstanding
--      amount. That undoes the wrongly-drained principal that
--      hasn't yet been repaid, leaving the bank's net cash change
--      equal to interest-collected-so-far (which is what the new
--      model would have produced from the start).
--
-- Why only refund 'active' loans, not 'paid' / 'defaulted'?
--   * 'paid'      — fully repaid. Bank's cash already balanced
--                   (-P drained, then +P + interest received). Net
--                   change = +interest. Matches new model. No
--                   refund needed.
--   * 'defaulted' — partial repayment then close. Bank ate the
--                   loss under the old model. Reconstructing the
--                   exact pre-default outstanding from migration
--                   data isn't worth the complexity; banks who got
--                   defaulted on stay in the loss state. Future
--                   defaults under the new model can't lose
--                   principal because it was never drained.
--   * 'pending_payout' — no drain yet (drain happens on payout).
--                   Future payouts under the new RPC won't drain.
-- ══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- 1. pay_out_loan: remove the lender debit
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION pay_out_loan(
    p_loan_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user     UUID := auth.uid();
    v_loan     bank_loans%ROWTYPE;
    v_lender   factions%ROWTYPE;
    v_borrower factions%ROWTYPE;
    v_tick     INT;
    v_updated_count INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_loan FROM bank_loans WHERE id = p_loan_id;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan not found');
    END IF;
    IF v_loan.status <> 'pending_payout' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Loan is %s; cannot pay out', v_loan.status));
    END IF;

    SELECT * INTO v_lender FROM factions WHERE id = v_loan.lender_faction_id;
    IF v_lender.id IS NULL OR (v_lender.id <> v_user AND v_lender.linked_user_id IS DISTINCT FROM v_user) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own the lender bank');
    END IF;

    SELECT * INTO v_borrower FROM factions WHERE id = v_loan.borrower_faction_id;
    IF v_borrower.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Borrower no longer exists');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- ── A1: principal printed to borrower; bank cash unchanged ──
    -- Borrower receives cash + takes on the debt liability in one
    -- atomic UPDATE so the dashboard never sees a mismatched pair.
    UPDATE factions
       SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) + v_loan.principal,
           corp_debt          = COALESCE(corp_debt, 0)          + v_loan.principal
     WHERE id = v_borrower.id;

    -- Flip the loan to 'active' with a tick anchor.
    UPDATE bank_loans
       SET status            = 'active',
           issued_at_tick    = v_tick,
           matures_at_tick   = v_tick + term_ticks,
           updated_at        = now()
     WHERE id     = p_loan_id
       AND status = 'pending_payout';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        -- Race recovery: only the borrower side to undo (no lender
        -- debit to reverse — it never happened in the A1 model).
        UPDATE factions SET corp_cash_reserves = corp_cash_reserves - v_loan.principal,
                            corp_debt          = COALESCE(corp_debt, 0) - v_loan.principal
         WHERE id = v_borrower.id;
        RETURN jsonb_build_object('success', false, 'error', 'Loan was already paid out');
    END IF;

    -- Recompute the lender's portfolio-derived stats. With the new
    -- A1 model cash isn't dropping at payout, but outstanding is
    -- climbing — overleverage still moves (just less dramatically),
    -- and lending_capital drops via max - outstanding/$50M.
    PERFORM recompute_finance_stats(v_loan.lender_faction_id);

    RETURN jsonb_build_object(
        'success', true,
        'loan_id', p_loan_id,
        'principal_disbursed', v_loan.principal,
        'matures_at_tick', v_tick + v_loan.term_ticks
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION pay_out_loan(UUID) TO authenticated;

COMMENT ON FUNCTION pay_out_loan(UUID) IS
    'Investor-side disbursement on a pending_payout bank_loan. Decoupled-cash model (design fork A1): principal is "printed" to the borrower (cash + debt incremented) without debiting the bank''s cash. Per-tick repayments still credit the full payment (principal + interest) to the bank''s cash. Banks are net money creators in this model.';


-- ══════════════════════════════════════════════════════════════
-- 2. One-shot refund of wrongly-drained principal
-- ══════════════════════════════════════════════════════════════
-- For every bank_loans row currently in 'active' status, refund the
-- lender by the row's outstanding amount. RUN ONCE — re-applying
-- this migration would double-refund.
--
-- The refund undoes the principal that was drained at payout under
-- the old model and hasn't yet flowed back via per-tick repayments.
-- After refund, each bank's net cash change from each active loan
-- equals interest-collected-so-far, matching what the new model
-- would have produced from the start.
DO $$
BEGIN
    UPDATE factions f
       SET corp_cash_reserves = COALESCE(f.corp_cash_reserves, 0) + refund_sum.total
      FROM (
        SELECT lender_faction_id, SUM(outstanding) AS total
          FROM bank_loans
         WHERE status = 'active'
         GROUP BY lender_faction_id
      ) refund_sum
     WHERE f.id = refund_sum.lender_faction_id;
END $$;


-- ══════════════════════════════════════════════════════════════
-- 3. Recompute every Finance corp's hero stats
-- ══════════════════════════════════════════════════════════════
-- Cash + outstanding shape changed for affected lenders; re-derive
-- corp_lending_capital + corp_overleverage so the dashboard reflects
-- the post-refund reality immediately.
DO $$
DECLARE
    v_id UUID;
BEGIN
    FOR v_id IN
        SELECT id FROM factions
         WHERE faction_type = 'corporation'
           AND corp_sector = 'Finance'
    LOOP
        PERFORM recompute_finance_stats(v_id);
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
