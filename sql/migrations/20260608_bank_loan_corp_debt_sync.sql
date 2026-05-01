-- ══════════════════════════════════════════════════════════════
-- LRP1: sync bank_loans into borrower.corp_debt
--
-- Bug context: pay_out_loan moves cash from lender to borrower but
-- never updates the borrower's corp_debt column. The dashboard's
-- Outstanding Debt card reads corp_debt directly, so a borrower
-- can be sitting on a $75M paid-out loan and still display
-- "debt-free" because nothing wrote the principal into the field.
-- The legacy finance flow updated corp_debt at accept time (see
-- corp-dashboard-home2.html:2919); the new bank_loans pipeline
-- never picked up the equivalent.
--
-- This migration:
--   1. Patches pay_out_loan to += principal on borrower.corp_debt
--      at disbursement (in the same atomic block as the cash
--      transfer).
--   2. Adds close_bank_loan(loan_id, status) helper that the
--      future per-tick processor (LRP2) calls when a loan flips
--      to 'paid' / 'defaulted' / 'foreclosed' / 'called'. The
--      helper atomically zeroes outstanding, sets close metadata,
--      decrements corp_debt by the remaining outstanding, and
--      recomputes the lender's Finance hero stats so headroom
--      returns when the loan closes.
--   3. One-shot backfill block at the bottom adds outstanding to
--      corp_debt for every bank_loan currently in 'active' status
--      so existing in-flight loans (e.g. Zellox → Hong Hua) show
--      up on the dashboard immediately. Marked RUN ONCE — a
--      re-apply would double-count.
-- ══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- 1. pay_out_loan: also += principal to borrower.corp_debt
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

    -- Atomic lender debit (audit fix from 20260521).
    UPDATE factions
       SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) - v_loan.principal
     WHERE id = v_lender.id
       AND COALESCE(corp_cash_reserves, 0) >= v_loan.principal;
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient cash — bank cash dropped below $%s before payout',
                            to_char(v_loan.principal, 'FM999,999,999,999')));
    END IF;

    -- Borrower receives cash AND takes on the debt liability. Both
    -- writes happen on the same row in one UPDATE so the dashboard
    -- never sees a "cash up, debt unchanged" intermediate state.
    UPDATE factions
       SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) + v_loan.principal,
           corp_debt          = COALESCE(corp_debt, 0)          + v_loan.principal
     WHERE id = v_borrower.id;

    UPDATE bank_loans
       SET status            = 'active',
           issued_at_tick    = v_tick,
           matures_at_tick   = v_tick + term_ticks,
           updated_at        = now()
     WHERE id     = p_loan_id
       AND status = 'pending_payout';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        -- Race recovery: refund all three columns we just moved.
        UPDATE factions SET corp_cash_reserves = corp_cash_reserves + v_loan.principal WHERE id = v_lender.id;
        UPDATE factions SET corp_cash_reserves = corp_cash_reserves - v_loan.principal,
                            corp_debt          = COALESCE(corp_debt, 0) - v_loan.principal
         WHERE id = v_borrower.id;
        RETURN jsonb_build_object('success', false, 'error', 'Loan was already paid out');
    END IF;

    -- Recompute the lender's portfolio-derived stats. Cash just
    -- dropped while outstanding stayed flat, so reserve ratio falls
    -- and corp_overleverage climbs.
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


-- ══════════════════════════════════════════════════════════════
-- 2. close_bank_loan: atomic close + corp_debt decrement
-- ══════════════════════════════════════════════════════════════
-- Called by the per-tick processor (LRP2, not yet wired) when a
-- loan reaches a terminal state. Atomically:
--   * Flips bank_loans.status to the terminal value.
--   * Sets closed_at_tick, zeroes outstanding, bumps updated_at.
--   * Decrements borrower.corp_debt by the (pre-close) outstanding,
--     floored at 0 so a partial-payment-tracker mismatch can't
--     drive debt negative.
--   * Recomputes the lender's Finance hero stats — outstanding
--     just went to 0 so lending headroom returns.
--
-- Service-role only: GRANT not extended to authenticated; the
-- per-tick processor calls this through service_role.
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION close_bank_loan(
    p_loan_id      UUID,
    p_close_status TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_loan          bank_loans%ROWTYPE;
    v_tick          INT;
    v_updated_count INT;
BEGIN
    IF p_close_status NOT IN ('paid', 'defaulted', 'foreclosed', 'called') THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Invalid close status (must be paid / defaulted / foreclosed / called)');
    END IF;

    SELECT * INTO v_loan FROM bank_loans WHERE id = p_loan_id;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan not found');
    END IF;
    IF v_loan.status NOT IN ('pending_payout', 'active') THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Loan already terminal (%s); cannot close again', v_loan.status));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Optimistic flip with status guard. ROW_COUNT=0 means another
    -- path closed it between the SELECT and UPDATE.
    UPDATE bank_loans
       SET status         = p_close_status,
           outstanding    = 0,
           closed_at_tick = v_tick,
           updated_at     = now()
     WHERE id     = p_loan_id
       AND status IN ('pending_payout', 'active');
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Loan changed state before close');
    END IF;

    -- Decrement borrower's debt by the outstanding we just zeroed.
    -- Floor at 0 — if debt drift somehow left corp_debt smaller
    -- than the outstanding being closed (legacy data import, manual
    -- admin edit), don't push it negative.
    UPDATE factions
       SET corp_debt = GREATEST(0, COALESCE(corp_debt, 0) - v_loan.outstanding)
     WHERE id = v_loan.borrower_faction_id;

    -- Lender's outstanding-loans pool shrinks → recompute their
    -- Finance hero stats so lending_capital headroom returns and
    -- overleverage relaxes.
    PERFORM recompute_finance_stats(v_loan.lender_faction_id);

    RETURN jsonb_build_object(
        'success',           true,
        'loan_id',           p_loan_id,
        'final_status',      p_close_status,
        'debt_cleared',      v_loan.outstanding,
        'closed_at_tick',    v_tick
    );
END;
$func$;

-- No GRANT TO authenticated — this is service-role only. The tick
-- processor in advance-corp-tick uses the service-role client which
-- bypasses RLS and can call SECURITY DEFINER functions regardless
-- of GRANT. Keeping the grant scoped prevents a player from forcing
-- their own loan closed via direct RPC dispatch.
COMMENT ON FUNCTION close_bank_loan(UUID, TEXT) IS
    'Atomically closes a bank_loan to a terminal status (paid/defaulted/foreclosed/called), zeroes outstanding, decrements borrower.corp_debt by the pre-close outstanding, and recomputes the lender''s Finance hero stats. Service-role only — called from advance-corp-tick (LRP2).';


-- ══════════════════════════════════════════════════════════════
-- 3. One-shot backfill of corp_debt for active bank_loans
-- ══════════════════════════════════════════════════════════════
-- RUN ONCE. Re-applying this migration would double-count the
-- backfill. The CREATE OR REPLACE above is idempotent; this UPDATE
-- block is not.
--
-- For every bank_loan currently in 'active' status (i.e. paid out
-- before this migration ran), add the outstanding principal to the
-- borrower's corp_debt. pending_payout loans haven't disbursed cash
-- yet so they don't carry debt; terminal-status loans are already
-- settled.
DO $$
BEGIN
    UPDATE factions f
       SET corp_debt = COALESCE(f.corp_debt, 0) + loan_sum.total
      FROM (
        SELECT borrower_faction_id, SUM(outstanding) AS total
          FROM bank_loans
         WHERE status = 'active'
         GROUP BY borrower_faction_id
      ) loan_sum
     WHERE f.id = loan_sum.borrower_faction_id;
END $$;

NOTIFY pgrst, 'reload schema';
