-- 20260729_pay_down_debt.sql
--
-- Pay Down Debt (CFO action). Borrower pays cash directly to the
-- lender to retire outstanding loan principal early.
--
-- Cash flows (all via emit_corp_cash_event so corp_cash_events stays
-- the single source of truth):
--   * Borrower:  −$100k  admin fee
--   * Borrower:  −amount loan principal repayment
--   * Lender:    +amount loan principal repayment
--
-- Side effects:
--   * bank_loans.outstanding decreases by amount.
--     If outstanding hits 0 → status='paid', closed_at_tick=tick,
--     last_payment_tick=tick.
--   * factions.corp_debt for the borrower decreases by amount
--     (floored at 0, matching close_bank_loan behavior).
--   * Lender's recompute_finance_stats fires so lending capital
--     headroom returns immediately.
--   * On full payoff: borrower.corp_reputation += 1 (clamped at 10).
--     Reputation is the only "credit standing" signal we surface in
--     Alpha; future loan terms emerge from this stat via downstream
--     finance pricing.
--
-- Eligible loan statuses: 'active' or 'called'. 'pending_payout'
-- isn't eligible because the cash hasn't disbursed yet (you'd be
-- paying back a loan you haven't received).
--
-- Race safety: SELECT … FOR UPDATE on both the borrower and the
-- loan row so a concurrent advance-corp-tick can't read stale state.
--
-- Idempotent: CREATE OR REPLACE on the function.

BEGIN;


-- ── pay_down_debt RPC ────────────────────────────────────────────
-- The $100k admin fee is fixed (matches the player-facing "$100k to
-- do this action" spec). It is ALWAYS charged, even on partial
-- paydowns — running this RPC at all triggers the fee. Caller-side
-- cooldown is intentionally absent: paying down your own debt is
-- something the player should be able to do as often as cash allows.
CREATE OR REPLACE FUNCTION pay_down_debt(
    p_borrower_id UUID,
    p_loan_id     UUID,
    p_amount      BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user        UUID := auth.uid();
    v_borrower    factions%ROWTYPE;
    v_loan        bank_loans%ROWTYPE;
    v_tick        INT;
    v_admin_fee   CONSTANT BIGINT := 100000;
    v_total_due   BIGINT;
    v_full_payoff BOOLEAN := false;
    v_new_outstanding BIGINT;
    v_rep_before  NUMERIC;
    v_rep_after   NUMERIC;
    v_rep_bumped  BOOLEAN := false;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment amount must be positive');
    END IF;

    -- Lock borrower row first to avoid deadlocks (consistent ordering:
    -- borrower → loan).
    SELECT * INTO v_borrower FROM factions WHERE id = p_borrower_id FOR UPDATE;
    IF v_borrower.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Borrower not found');
    END IF;
    IF v_borrower.id <> v_user
       AND COALESCE(v_borrower.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;

    SELECT * INTO v_loan FROM bank_loans WHERE id = p_loan_id FOR UPDATE;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan not found');
    END IF;
    IF v_loan.borrower_faction_id <> p_borrower_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'This loan does not belong to you');
    END IF;
    IF v_loan.status NOT IN ('active', 'called') THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Loan is %s; only active or called loans can be paid down', v_loan.status));
    END IF;
    IF v_loan.outstanding <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan has no outstanding balance');
    END IF;

    -- Cap the amount at outstanding. Don't error on overpay — the UI
    -- can pre-clamp, but if the player races a payment cycle between
    -- modal-open and submit, accept the smaller amount instead of
    -- rejecting the action.
    IF p_amount > v_loan.outstanding THEN
        p_amount := v_loan.outstanding;
    END IF;

    v_total_due := p_amount + v_admin_fee;
    IF COALESCE(v_borrower.corp_cash_reserves, 0) < v_total_due THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient cash. Need $%s (payment + $%s admin fee), have $%s',
                to_char(v_total_due, 'FM999,999,999,999'),
                to_char(v_admin_fee, 'FM999,999,999'),
                to_char(COALESCE(v_borrower.corp_cash_reserves, 0), 'FM999,999,999,999')));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    v_new_outstanding := v_loan.outstanding - p_amount;
    v_full_payoff := (v_new_outstanding = 0);

    -- ── Cash movements (all via SSoT helper) ──
    PERFORM emit_corp_cash_event(
        p_borrower_id,
        'capital_out',
        'Pay Down Debt — admin fee',
        -v_admin_fee,
        v_tick
    );
    PERFORM emit_corp_cash_event(
        p_borrower_id,
        'capital_out',
        'Loan principal repayment',
        -p_amount,
        v_tick
    );
    -- Credit lender if it still exists. If the lender corp was
    -- dissolved between issuance and now, skip the credit (cash just
    -- evaporates from the system — same handling as the bankruptcy
    -- payback loops in declare_corp_bankruptcy).
    IF EXISTS (SELECT 1 FROM factions WHERE id = v_loan.lender_faction_id) THEN
        PERFORM emit_corp_cash_event(
            v_loan.lender_faction_id,
            'capital_in',
            'Loan principal repayment received',
            p_amount,
            v_tick
        );
    END IF;

    -- ── Loan state ──
    UPDATE bank_loans
       SET outstanding       = v_new_outstanding,
           last_payment_tick = v_tick,
           status            = CASE WHEN v_full_payoff THEN 'paid' ELSE status END,
           closed_at_tick    = CASE WHEN v_full_payoff THEN v_tick ELSE closed_at_tick END,
           updated_at        = now()
     WHERE id = p_loan_id;

    -- ── Borrower debt tracker (mirrors close_bank_loan) ──
    UPDATE factions
       SET corp_debt = GREATEST(0, COALESCE(corp_debt, 0) - p_amount)
     WHERE id = p_borrower_id;

    -- ── Reputation bump on full payoff ──
    -- "Pay off a loan early → +1 reputation." Triggers only when this
    -- payment zeroes the loan out. Clamped at 10 (corp_reputation
    -- domain is 0–10 per 20260430_corp_simplify_v2).
    IF v_full_payoff THEN
        v_rep_before := COALESCE(v_borrower.corp_reputation, 5);
        v_rep_after  := LEAST(10, v_rep_before + 1);
        IF v_rep_after <> v_rep_before THEN
            UPDATE factions
               SET corp_reputation = v_rep_after
             WHERE id = p_borrower_id;
            v_rep_bumped := true;
        ELSE
            v_rep_after := v_rep_before;
        END IF;
    END IF;

    -- ── Lender finance refresh ──
    -- Outstanding shrunk → lender's lending headroom returns. Skipped
    -- if the lender is gone (recompute_finance_stats would no-op).
    IF EXISTS (SELECT 1 FROM factions WHERE id = v_loan.lender_faction_id) THEN
        PERFORM recompute_finance_stats(v_loan.lender_faction_id);
    END IF;

    RETURN jsonb_build_object(
        'success',         true,
        'loan_id',         p_loan_id,
        'amount_paid',     p_amount,
        'admin_fee',       v_admin_fee,
        'total_charged',   v_total_due,
        'new_outstanding', v_new_outstanding,
        'paid_off',        v_full_payoff,
        'rep_bumped',      v_rep_bumped,
        'rep_after',       COALESCE(v_rep_after, v_borrower.corp_reputation)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION pay_down_debt(UUID, UUID, BIGINT) TO authenticated;

COMMENT ON FUNCTION pay_down_debt(UUID, UUID, BIGINT) IS
    'CFO action: borrower retires outstanding loan principal early. Cash flows borrower→lender via emit_corp_cash_event (SSoT). Charges a fixed $100k admin fee. Decrements bank_loans.outstanding + factions.corp_debt. On full payoff: status flips to ''paid'', closed_at_tick stamped, +1 corp_reputation (clamped at 10). Recomputes lender finance stats so lending headroom returns immediately.';


COMMIT;

NOTIFY pgrst, 'reload schema';
