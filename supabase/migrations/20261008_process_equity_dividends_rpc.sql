-- ════════════════════════════════════════════════════════════════
-- E5: process_equity_dividends — annual dividend payout processor
--
-- Pays equity dividends on every active equity_positions row whose
-- anniversary has come up (12 ticks since the later of
-- last_payout_tick or paid_out_at_tick). Per-position anniversary,
-- not global modulo — a position activated at tick 13 gets its
-- first dividend at tick 25, not at the next system-wide modulo
-- boundary (which would only be 11 ticks of holding).
--
-- Formula:
--   pool   = floor(borrower.corp_cash_reserves × 0.02)
--   payout = floor(pool × equity_pct / 100)
--
-- Since equity_pct is capped at 50%, the per-investor payout is at
-- most 1% of the borrower's cash — never exceeds available balance.
-- Floored at $0 → no clawback when the borrower is broke; the
-- position's last_payout_tick still advances so the loop doesn't
-- spin retrying every tick.
--
-- Both sides emit through emit_corp_cash_event:
--   borrower  → 'dividend_paid'  (P&L expense, lands in Costs card)
--   investor  → 'revenue_finance' (P&L revenue, lands in Revenue card)
--
-- Wire-up: called once per tick from advance-tick. NOT granted to
-- authenticated — player actions don't trigger dividends.
--
-- Idempotent (CREATE OR REPLACE).
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION process_equity_dividends(p_current_tick INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_position       equity_positions%ROWTYPE;
    v_borrower       factions%ROWTYPE;
    v_investor       factions%ROWTYPE;
    v_borrower_cash  NUMERIC;
    v_payout         BIGINT;
    v_paid_count     INT := 0;
    v_skipped_count  INT := 0;
    v_label_borrower TEXT;
    v_label_investor TEXT;
BEGIN
    FOR v_position IN
        SELECT * FROM equity_positions
         WHERE status = 'active'
           AND p_current_tick - COALESCE(last_payout_tick, paid_out_at_tick) >= 12
         ORDER BY id
    LOOP
        -- Lock borrower row for this iteration. Without it, a concurrent
        -- debit between the cash read and the emit could let the helpers
        -- GREATEST(0, ...) flooring conjure free cash on the investor side.
        PERFORM 1 FROM factions WHERE id = v_position.borrower_faction_id FOR UPDATE;

        SELECT * INTO v_borrower FROM factions WHERE id = v_position.borrower_faction_id;
        SELECT * INTO v_investor FROM factions WHERE id = v_position.investor_faction_id;
        IF v_borrower.id IS NULL OR v_investor.id IS NULL THEN
            -- Both should exist (FKs are RESTRICT). Defensive skip if not;
            -- advance the anniversary to avoid a retry storm.
            UPDATE equity_positions
               SET last_payout_tick = p_current_tick, updated_at = now()
             WHERE id = v_position.id;
            v_skipped_count := v_skipped_count + 1;
            CONTINUE;
        END IF;

        v_borrower_cash := COALESCE(v_borrower.corp_cash_reserves, 0);
        v_payout := FLOOR(GREATEST(0, v_borrower_cash) * 0.02
                          * v_position.equity_pct / 100.0);

        IF v_payout <= 0 THEN
            -- Skip-zero rule: don't clutter the ledger with $0 events.
            -- Anniversary still advances so the loop doesn't retry every tick.
            UPDATE equity_positions
               SET last_payout_tick = p_current_tick, updated_at = now()
             WHERE id = v_position.id;
            v_skipped_count := v_skipped_count + 1;
            CONTINUE;
        END IF;

        v_label_borrower := 'Series ' || COALESCE(v_position.series, '?')
            || ' dividend → ' || COALESCE(v_investor.faction_name, 'Unknown')
            || ' (' || v_position.equity_pct || '%)';
        v_label_investor := COALESCE(v_borrower.faction_name, 'Unknown')
            || ' dividend (Series ' || COALESCE(v_position.series, '?')
            || ', ' || v_position.equity_pct || '%)';

        PERFORM emit_corp_cash_event(
            v_borrower.id, 'dividend_paid', v_label_borrower,
            -v_payout, p_current_tick
        );
        PERFORM emit_corp_cash_event(
            v_investor.id, 'revenue_finance', v_label_investor,
             v_payout, p_current_tick
        );

        UPDATE equity_positions
           SET total_paid_out   = COALESCE(total_paid_out, 0) + v_payout,
               last_payout_tick = p_current_tick,
               updated_at       = now()
         WHERE id = v_position.id;

        v_paid_count := v_paid_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'tick',    p_current_tick,
        'paid',    v_paid_count,
        'skipped', v_skipped_count
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION process_equity_dividends(INT) FROM PUBLIC;

COMMENT ON FUNCTION process_equity_dividends(INT) IS
    'Per-tick processor: pays annual equity dividends (2% of borrower cash_reserves × equity_pct) on positions whose anniversary has come up. Each position pays 12 ticks after its last payout (or paid_out_at_tick on first cycle). Borrower side: dividend_paid (Cost). Investor side: revenue_finance (Revenue). $0 payouts skipped to keep the ledger clean. NOT granted to authenticated — wired into advance-tick.';

COMMIT;

NOTIFY pgrst, 'reload schema';
