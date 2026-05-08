-- ════════════════════════════════════════════════════════════════
-- pay_out_equity: route the cash transfer through emit_corp_cash_event
--
-- Pre-fix: the RPC mutated factions.corp_cash_reserves directly on
-- both sides of the disbursement (investor debit + borrower credit)
-- without writing a single corp_cash_events row. The dashboard's
-- Revenue / Costs cards never reflected the equity raise — silent
-- leak in two directions, identical pattern to the four RPCs the
-- 20260714 silent-leak migration patched. pay_out_equity got missed.
--
-- Fix shape:
--   1. SELECT FOR UPDATE on the investor's factions row holds a
--      lock for the whole transaction. Prevents a concurrent debit
--      from leaving the helper's GREATEST(0, ...) flooring to
--      conjure free cash on the borrower side.
--   2. Status-first reorder: flip equity_positions to 'active' BEFORE
--      moving any cash. The status flip is the single atomic gate;
--      whichever transaction wins it owns the disbursement. Race-
--      recovery refund block (553-555 in 20260604) becomes
--      unreachable and is removed.
--   3. emit_corp_cash_event handles both the corp_cash_events row
--      AND the cash adjustment in one call. Pattern matches
--      pay_out_loan (20260712:128).
--
-- Also strips stale references to `monthly_profit` (the column was
-- dropped in 20260430, before the equity system was rebuilt in
-- 20260602 — comments lied about a per-tick formula that wasn't
-- actually wired and pointed at a non-existent column). New text
-- references the 2%-of-cash_reserves dividend formula that lands in
-- 20261008's process_equity_dividends RPC.
--
-- Idempotent (CREATE OR REPLACE).
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION pay_out_equity(
    p_position_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user           UUID := auth.uid();
    v_position       equity_positions%ROWTYPE;
    v_investor       factions%ROWTYPE;
    v_borrower       factions%ROWTYPE;
    v_investor_cash  NUMERIC;
    v_tick           INT;
    v_updated_count  INT;
    v_label_investor TEXT;
    v_label_borrower TEXT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_position FROM equity_positions WHERE id = p_position_id;
    IF v_position.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Equity position not found');
    END IF;
    IF v_position.status <> 'pending_payout' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Position is %s; cannot pay out', v_position.status));
    END IF;

    SELECT * INTO v_investor FROM factions WHERE id = v_position.investor_faction_id;
    IF v_investor.id IS NULL OR
       (v_investor.id <> v_user AND v_investor.linked_user_id IS DISTINCT FROM v_user) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own the investor faction');
    END IF;

    SELECT * INTO v_borrower FROM factions WHERE id = v_position.borrower_faction_id;
    IF v_borrower.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Borrower no longer exists');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Lock the investor's factions row for the duration of the
    -- transaction. Without this lock, a concurrent debit between the
    -- sufficiency check and the emit call would let the helper floor
    -- the investor's cash at 0 while still crediting the borrower the
    -- full principal — free cash created on the books.
    PERFORM 1 FROM factions WHERE id = v_investor.id FOR UPDATE;

    SELECT COALESCE(corp_cash_reserves, 0) INTO v_investor_cash
      FROM factions WHERE id = v_investor.id;
    IF v_investor_cash < v_position.principal THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient cash — investor has $%s, needs $%s',
                            to_char(v_investor_cash,         'FM999,999,999,999'),
                            to_char(v_position.principal,    'FM999,999,999,999')));
    END IF;

    -- Atomic status flip. Acts as the per-position lock — only one
    -- transaction can move pending_payout → active. Loser sees
    -- ROW_COUNT=0 and aborts. No cash has moved at this point, so
    -- there's nothing to roll back. (The pre-fix RPC moved cash
    -- first, then needed an explicit refund path on race; that path
    -- is now unreachable and gone.)
    UPDATE equity_positions
       SET status            = 'active',
           paid_out_at_tick  = v_tick,
           updated_at        = now()
     WHERE id     = p_position_id
       AND status = 'pending_payout';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Position was already paid out');
    END IF;

    -- Cash transfer through the SSoT helper. Investor row still
    -- locked from the FOR UPDATE above; helper's GREATEST(0, ...)
    -- flooring won't fire because we already verified sufficiency
    -- under the lock.
    v_label_investor := 'Equity stake: '
        || COALESCE(v_borrower.faction_name, 'Unknown')
        || ' (Series ' || COALESCE(v_position.series, '?')
        || ', ' || v_position.equity_pct || '%)';
    v_label_borrower := 'Equity raise: Series ' || COALESCE(v_position.series, '?')
        || ' from ' || COALESCE(v_investor.faction_name, 'Unknown')
        || ' (' || v_position.equity_pct || '%)';

    PERFORM emit_corp_cash_event(
        v_investor.id, 'capital_out', v_label_investor,
        -v_position.principal, v_tick
    );
    PERFORM emit_corp_cash_event(
        v_borrower.id, 'capital_in',  v_label_borrower,
         v_position.principal, v_tick
    );

    RETURN jsonb_build_object(
        'success',             true,
        'position_id',         p_position_id,
        'principal_disbursed', v_position.principal,
        'equity_pct',          v_position.equity_pct
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION pay_out_equity(UUID) TO authenticated;

COMMENT ON FUNCTION pay_out_equity(UUID) IS
    'Investor disburses the principal of a pending_payout equity position. Status flips to active; cash transfers through emit_corp_cash_event so the dashboards Revenue / Costs cards reflect the movement. Per-cycle dividends (2% of borrower.corp_cash_reserves × equity_pct, every 12 ticks) start on the next anniversary — see process_equity_dividends in 20261008.';

-- REDUCE pass: the equity_positions table COMMENT (set in 20260602)
-- still references "negative monthly_profit" — a column dropped in
-- 20260430 and never wired to the rebuilt equity system. Replace.
COMMENT ON TABLE public.equity_positions IS
    'Active equity positions created on accept of an equity_offers row. Tracks principal, equity_pct, and cumulative payouts. One row per accepted offer (UNIQUE on raise_id and offer_id). Per-cycle dividend (2% of borrower cash_reserves × equity_pct, every 12 ticks) — payout floored at $0; no clawback when the borrower has no cash.';

COMMIT;

NOTIFY pgrst, 'reload schema';
