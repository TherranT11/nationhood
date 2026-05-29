-- ════════════════════════════════════════════════════════════════════
-- SHIPPING — 3-tick bidding window before allocator pays
-- ════════════════════════════════════════════════════════════════════
-- The trade-agreement card has always told carriers: "corporations
-- have a 3-tick window to offer; the cheapest / fastest / safest bid
-- wins per agreement preference." The user-facing copy was right; the
-- allocator wasn't. process_trade_agreement_shipping_multiwinner ran
-- the cheapest-first fill EVERY tick from contract creation — so a
-- bid placed at tick T could be locked in by the very next tick, and
-- the Minister of Trade never got a window to review.
--
-- This migration enforces the 3-tick window the UI already promises.
-- Bids accumulate during the window; the allocator skips contracts
-- whose age is below BIDDING_WINDOW_TICKS. Once the window expires
-- (v_tick - created_at_tick >= 3), the existing rank-and-fill runs
-- per tick exactly as before.
--
-- Pre-instrumented contracts (created_at_tick NULL) read as age = ∞
-- via COALESCE(created_at_tick, 0) — they were already past their
-- window in any reasonable interpretation, so they keep filling
-- with no behaviour change.
--
-- Body otherwise verbatim from the latest allocator
-- (20270360:201-324). One added DECLARE constant, one added field on
-- the contract SELECT, one added skip CONTINUE. CREATE OR REPLACE,
-- idempotent.
--
-- The two view RPCs (get_shipping_routes_for_corp,
-- get_trade_agreement_shipping) and the shared
-- shipping_contract_winners helper are intentionally NOT changed.
-- They report what WOULD win if the allocator ran — useful so the
-- minister can see the current standing while the window is still
-- open and decide whether to veto / restore before time's up.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.process_trade_agreement_shipping_multiwinner(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    RAW_PER_ABSTRACT      constant numeric := 1000000;
    BIDDING_WINDOW_TICKS  constant int     := 3;
    v_tick            int;
    v_contract        RECORD;
    v_bid             RECORD;
    v_demand          int;
    v_units_taken     int;
    v_total_payout    bigint;
    v_buyer_budget_a  numeric;
    v_buyer_budget_r  numeric;
    v_routes_active   int := 0;
    v_routes_missed   int := 0;
    v_total_paid      bigint := 0;
    v_slots_filled    int := 0;
    v_slots_demanded  int := 0;
    v_payouts         jsonb;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, p_tick, 0);

    FOR v_contract IN
        SELECT id, nation_id,
               COALESCE(volume_required, 0) AS demand,
               COALESCE(total_paid, 0)      AS total_paid_so_far,
               COALESCE(consecutive_missed_payments, 0) AS prior_misses,
               COALESCE(created_at_tick, 0) AS created_tick,
               last_payment_tick
          FROM shipping_contracts
         WHERE status = 'open'
           AND trade_agreement_id IS NOT NULL
         FOR UPDATE
    LOOP
        v_demand := v_contract.demand;
        v_slots_demanded := v_slots_demanded + v_demand;
        IF v_demand <= 0 THEN CONTINUE; END IF;

        IF v_contract.last_payment_tick IS NOT NULL
           AND v_contract.last_payment_tick = v_tick THEN
            CONTINUE;
        END IF;

        -- 3-tick bidding window. New contracts accumulate bids for
        -- BIDDING_WINDOW_TICKS before any fill happens, so the
        -- Minister of Trade can review and veto carriers via
        -- veto_shipping_bid before the cheapest-first allocator
        -- starts paying. Once the window expires, this CONTINUEs
        -- through and the existing rank-and-fill runs every tick.
        IF v_tick - v_contract.created_tick < BIDDING_WINDOW_TICKS THEN
            CONTINUE;
        END IF;

        -- Single source: rank-and-fill comes from the helper. Same
        -- ordering (eff_rate ASC, applied_at_tick ASC, bid_id ASC),
        -- same veto exclusion, same units_won math as both view RPCs.
        WITH winners AS (
            SELECT bid_id, bidder_corp_id, units_won, bid_rate,
                   (bid_rate * units_won)::bigint AS payout
              FROM shipping_contract_winners(ARRAY[v_contract.id])
             WHERE units_won > 0 AND bid_rate IS NOT NULL AND bid_rate > 0
        )
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
                   'bid_id',         bid_id,
                   'bidder_corp_id', bidder_corp_id,
                   'units',          units_won,
                   'payout',         payout
               )), '[]'::jsonb),
               COALESCE(SUM(payout), 0)::bigint,
               COALESCE(SUM(units_won), 0)::int
          INTO v_payouts, v_total_payout, v_units_taken
          FROM winners
         WHERE payout > 0;

        IF v_total_payout <= 0 THEN
            UPDATE shipping_contracts
               SET last_tick_units_filled = 0, last_filled_tick = v_tick, updated_at = now()
             WHERE id = v_contract.id;
            CONTINUE;
        END IF;

        SELECT COALESCE(budget, 0) INTO v_buyer_budget_a
          FROM nations WHERE id = v_contract.nation_id;
        v_buyer_budget_r := v_buyer_budget_a * RAW_PER_ABSTRACT;
        IF v_buyer_budget_r < v_total_payout THEN
            UPDATE shipping_contracts
               SET consecutive_missed_payments = v_contract.prior_misses + 1,
                   last_tick_units_filled = 0, last_filled_tick = v_tick, updated_at = now()
             WHERE id = v_contract.id;
            v_routes_missed := v_routes_missed + 1;
            CONTINUE;
        END IF;

        UPDATE nations
           SET budget = (v_buyer_budget_r - v_total_payout) / RAW_PER_ABSTRACT
         WHERE id = v_contract.nation_id;

        -- Payment dispatch. entrepreneur_place_shipping_bid is the only
        -- live creator and writes bidder_corp_id only, so this no longer
        -- branches on bidder_faction_id (legacy creator dropped by 20270242).
        FOR v_bid IN
            SELECT NULLIF(e->>'bidder_corp_id','')::uuid AS bidder_corp_id,
                   (e->>'units')::int                AS units,
                   (e->>'payout')::bigint            AS payout
              FROM jsonb_array_elements(v_payouts) e
        LOOP
            IF v_bid.bidder_corp_id IS NULL THEN CONTINUE; END IF;
            UPDATE entrepreneur_corps
               SET treasury_cash = COALESCE(treasury_cash, 0) + v_bid.payout, updated_at = now()
             WHERE id = v_bid.bidder_corp_id;
            v_slots_filled := v_slots_filled + v_bid.units;
        END LOOP;

        UPDATE shipping_contracts
           SET last_payment_tick = v_tick,
               total_paid = v_contract.total_paid_so_far + v_total_payout,
               consecutive_missed_payments = 0,
               last_tick_units_filled = v_units_taken,
               last_filled_tick = v_tick, updated_at = now()
         WHERE id = v_contract.id;

        v_routes_active := v_routes_active + 1;
        v_total_paid    := v_total_paid + v_total_payout;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick,
        'routes_active', v_routes_active, 'routes_missed', v_routes_missed,
        'slots_filled', v_slots_filled, 'slots_demanded', v_slots_demanded,
        'total_paid', v_total_paid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_trade_agreement_shipping_multiwinner(int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
