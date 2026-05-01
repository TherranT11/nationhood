-- ══════════════════════════════════════════════════════════════
-- Finance hero stats: portfolio-derived recompute
--
-- Bug context: corp_lending_capital and corp_overleverage on
-- factions are static columns seeded to 3 / 0 for new Finance corps
-- (per 20260514_finance_operations.sql). The column comment on
-- corp_overleverage says it "drifts up when loans are issued, down
-- when loans close" but no code ever actually wrote to either stat
-- — accept_loan_offer, pay_out_loan, and advance-corp-tick all
-- moved cash without touching the dials. Players reported their
-- stats frozen at seed values after Zellox-style loan flow.
--
-- Fix shape (design fork A): a SECURITY DEFINER helper that
-- recomputes both stats from the bank's current portfolio, called
-- at every loan event so the UI reacts synchronously. Strategic
-- Actions still nudge the dials manually; the next loan event
-- snaps them back to derived-from-portfolio.
--
-- Formulas:
--   lending_capital = clamp(0, 10, outstanding / 50M)
--     Every $5M of outstanding principal = 0.1 stat points. So $50M
--     outstanding = 1, $250M = 5, $500M+ = 10. Track-record stat:
--     the bank earns capacity by actually deploying capital.
--
--   overleverage = clamp(0, 10, (1 − reserve_ratio) × 10)
--     where reserve_ratio = cash / (cash + outstanding). Maps the
--     0–8 zone to "healthy", 8+ to Stressed (matches the gate in
--     submit_loan_offer), 10 = Bank Run threshold.
--
-- Idempotent: re-running on the same portfolio produces the same
-- numbers. Cheap (one aggregate query); safe to call from any
-- loan-event RPC.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION recompute_finance_stats(p_faction_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_faction         factions%ROWTYPE;
    v_cash            NUMERIC;
    v_outstanding     NUMERIC;
    v_total           NUMERIC;
    v_reserve_ratio   NUMERIC;
    v_lending_capital NUMERIC;
    v_overleverage    NUMERIC;
BEGIN
    SELECT * INTO v_faction FROM factions WHERE id = p_faction_id;
    -- Silently skip non-corps and non-Finance corps. Strategic
    -- Actions on Construction / Shipping might call this through
    -- shared paths in the future; this guard keeps the function
    -- safe-by-default.
    IF v_faction.id IS NULL
       OR v_faction.faction_type <> 'corporation'
       OR v_faction.corp_sector  <> 'Finance' THEN
        RETURN;
    END IF;

    v_cash := COALESCE(v_faction.corp_cash_reserves, 0);

    -- Outstanding = sum of unpaid principal across loans this
    -- faction is the lender on. Includes pending_payout because
    -- the bank is already committed at accept time, even though
    -- cash hasn't physically moved yet.
    SELECT COALESCE(SUM(outstanding), 0) INTO v_outstanding
      FROM bank_loans
     WHERE lender_faction_id = p_faction_id
       AND status IN ('pending_payout', 'active');

    v_total := v_cash + v_outstanding;

    -- ── Lending Capital ──
    -- Linear: every $5M outstanding = 0.1 stat points (i.e.
    -- $50M = 1, $500M = 10). Track-record stat — the bank's
    -- capacity grows as it actually deploys capital. Clamped at
    -- 10 so a megabank doesn't blow out the chart.
    v_lending_capital := GREATEST(0, LEAST(10,
        v_outstanding / 50000000.0
    ));

    -- ── Overleverage ──
    IF v_total <= 0 THEN
        v_overleverage := 0;
    ELSE
        v_reserve_ratio := v_cash / v_total;
        v_overleverage := GREATEST(0, LEAST(10,
            (1 - v_reserve_ratio) * 10
        ));
    END IF;

    -- Round to 2 decimal places (column type is NUMERIC(4,2)).
    UPDATE factions
       SET corp_lending_capital = ROUND(v_lending_capital::numeric, 2),
           corp_overleverage    = ROUND(v_overleverage::numeric,    2)
     WHERE id = p_faction_id;
END;
$func$;

GRANT EXECUTE ON FUNCTION recompute_finance_stats(UUID) TO authenticated;

COMMENT ON FUNCTION recompute_finance_stats(UUID) IS
    'Recompute corp_lending_capital + corp_overleverage from the bank''s current portfolio. Called from accept_loan_offer + pay_out_loan so the player sees the dials react in the same UI action. No-op for non-Finance factions.';

-- ══════════════════════════════════════════════════════════════
-- Wire into accept_loan_offer (L2)
-- ══════════════════════════════════════════════════════════════
-- Recompute the LENDER's stats at the end. The borrower side is
-- non-Finance (the gate in submit_loan_offer enforces that) so
-- there's nothing to recompute on that side.
CREATE OR REPLACE FUNCTION accept_loan_offer(
    p_offer_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user           UUID := auth.uid();
    v_offer          bank_loan_offers%ROWTYPE;
    v_request        bank_loan_requests%ROWTYPE;
    v_borrower       factions%ROWTYPE;
    v_tick           INT;
    v_loan_id        UUID;
    v_updated_count  INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_offer FROM bank_loan_offers WHERE id = p_offer_id;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Offer not found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Offer is %s; cannot accept', v_offer.status));
    END IF;

    SELECT * INTO v_request FROM bank_loan_requests WHERE id = v_offer.request_id;
    IF v_request.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan request not found');
    END IF;
    IF v_request.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Request is %s; cannot accept offers', v_request.status));
    END IF;

    SELECT * INTO v_borrower FROM factions WHERE id = v_request.requesting_faction_id;
    IF v_borrower.id IS NULL OR
       (v_borrower.id <> v_user AND v_borrower.linked_user_id IS DISTINCT FROM v_user) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this faction');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE bank_loan_offers
       SET status            = 'accepted',
           resolved_at_tick  = v_tick,
           updated_at        = now()
     WHERE id     = p_offer_id
       AND status = 'pending';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Offer changed state before accept (accepted or expired by another path)');
    END IF;

    UPDATE bank_loan_offers
       SET status            = 'auto_rejected',
           resolved_at_tick  = v_tick,
           updated_at        = now()
     WHERE request_id = v_offer.request_id
       AND id        <> p_offer_id
       AND status     = 'pending';

    UPDATE bank_loan_requests
       SET status            = 'approved',
           winning_bank_id   = v_offer.bank_faction_id,
           resolved_at_tick  = v_tick,
           updated_at        = now()
     WHERE id     = v_offer.request_id
       AND status = 'pending';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RAISE EXCEPTION 'Request resolved by another action just now; try refresh';
    END IF;

    INSERT INTO bank_loans (
        request_id, lender_faction_id, borrower_faction_id, nation_id,
        principal, apr, term_ticks, outstanding,
        status, issued_at_tick, matures_at_tick
    ) VALUES (
        v_offer.request_id,
        v_offer.bank_faction_id,
        v_request.requesting_faction_id,
        v_request.requesting_nation_id,
        v_request.principal,
        v_offer.offered_apr,
        v_offer.offered_term_ticks,
        v_request.principal,
        'pending_payout',
        v_tick,
        v_tick + v_offer.offered_term_ticks
    ) RETURNING id INTO v_loan_id;

    -- Recompute the lender's portfolio-derived stats. Synchronously
    -- updates corp_lending_capital + corp_overleverage on the
    -- lender's faction row so the Finance Operations hero stats
    -- react in the same UI action that accepted the offer.
    PERFORM recompute_finance_stats(v_offer.bank_faction_id);

    RETURN jsonb_build_object(
        'success',  true,
        'loan_id',  v_loan_id,
        'status',   'pending_payout',
        'message',  'Offer accepted. Lender uses Pay Out Loan to disburse.'
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION accept_loan_offer(UUID) TO authenticated;

-- ══════════════════════════════════════════════════════════════
-- Wire into pay_out_loan
-- ══════════════════════════════════════════════════════════════
-- pay_out_loan is the call site where overleverage moves
-- meaningfully — cash drops while outstanding stays the same, so
-- the reserve ratio falls and the dial climbs. Recompute the
-- lender's stats at the end (after the bank_loans status flip and
-- the cash transfer).
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

    UPDATE factions
       SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) + v_loan.principal
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
        UPDATE factions SET corp_cash_reserves = corp_cash_reserves + v_loan.principal WHERE id = v_lender.id;
        UPDATE factions SET corp_cash_reserves = corp_cash_reserves - v_loan.principal WHERE id = v_borrower.id;
        RETURN jsonb_build_object('success', false, 'error', 'Loan was already paid out');
    END IF;

    -- Recompute the lender's portfolio-derived stats. This is
    -- the call site where overleverage typically jumps — cash
    -- just dropped while outstanding stayed flat, so the reserve
    -- ratio falls and the dial climbs.
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
-- One-time backfill for existing Finance corps
-- ══════════════════════════════════════════════════════════════
-- Recompute every Finance corp's stats from their current portfolio
-- so the dials reflect reality right after this migration applies,
-- without waiting for the next loan event. Strategic-Action overrides
-- get clobbered here — that's intentional. Players who want a
-- transient override re-fire the action.
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
