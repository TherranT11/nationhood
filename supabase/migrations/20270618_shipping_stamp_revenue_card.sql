-- ════════════════════════════════════════════════════════════════════
-- 20270618 — Shipping corps: stamp last_tick_revenue / last_revenue_tick
--
-- Third in the bypass-the-ledger sweep that started with 20270605
-- (oil & gas) and 20270616 (airlines): the shipping allocator
-- process_trade_agreement_shipping_multiwinner credits each winning
-- freighter bid's payout to entrepreneur_corps.treasury_cash but
-- doesn't stamp last_tick_revenue / last_revenue_tick — the two
-- columns the Revenue Change card reads. User confirmed their
-- shipping corp (Starliner Shipping Corporation) was earning from
-- an active freighter route while the card showed "$0 · no data
-- yet" — same diagnosis as airlines pre-20270616.
--
-- Source body: 20270390_shipping_always_manual_accept (confirmed
-- live via uses_window_constant=false + uses_manual_only=true
-- probe). Body lifted verbatim except for the per-bid UPDATE in
-- the FOR v_bid loop, which now stamps the two columns alongside
-- the treasury credit. Same multi-bid aggregation pattern as
-- airlines (a corp winning multiple bids in one tick accumulates
-- the payouts in one stamp via CASE).
--
-- Legacy faction-corp bidders (faction_type='corporation',
-- bidder_corp_id NULL but bidder_faction_id set) still write to
-- factions.corp_cash_reserves via the existing path — unchanged.
-- They surface revenue through the old corp_cash_events ledger
-- that's been deprecated for entrepreneur corps but kept alive
-- for the legacy faction-corp readers (per docs/legacy-corp-cull
-- and 20270251).
--
-- Apply after 20270617.
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
    v_tick                int;
    v_contract            RECORD;
    v_bid                 RECORD;
    v_demand              int;
    v_remaining           int;
    v_rate                numeric;
    v_units               int;
    v_payout              bigint;
    v_total_payout        bigint;
    v_buyer_budget_a      numeric;
    v_buyer_budget_r      numeric;
    v_routes_active       int := 0;
    v_routes_missed       int := 0;
    v_total_paid          bigint := 0;
    v_slots_filled        int := 0;
    v_slots_demanded      int := 0;
    v_payouts             jsonb;
    v_has_manual          boolean;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, p_tick, 0);

    FOR v_contract IN
        SELECT id, nation_id, created_tick,
               COALESCE(volume_required, 0) AS demand,
               COALESCE(total_paid, 0)      AS total_paid_so_far,
               COALESCE(consecutive_missed_payments, 0) AS prior_misses,
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

        SELECT EXISTS(
            SELECT 1 FROM shipping_contract_bids
             WHERE contract_id = v_contract.id
               AND status = 'pending'
               AND COALESCE(manually_accepted, false) = true
        ) INTO v_has_manual;
        IF NOT v_has_manual THEN
            UPDATE shipping_contracts
               SET last_tick_units_filled = 0, last_filled_tick = v_tick, updated_at = now()
             WHERE id = v_contract.id;
            CONTINUE;
        END IF;

        v_remaining    := v_demand;
        v_total_payout := 0;
        v_payouts      := '[]'::jsonb;

        WITH winners AS (
            SELECT bid_id, bidder_corp_id, units_won, bid_rate,
                   (bid_rate * units_won)::bigint AS payout
              FROM shipping_contract_winners(ARRAY[v_contract.id])
             WHERE units_won > 0
        ),
        bidders AS (
            SELECT w.bid_id, w.bidder_corp_id, w.units_won, w.payout,
                   b.bidder_faction_id
              FROM winners w
              JOIN shipping_contract_bids b ON b.id = w.bid_id
        )
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
                   'bid_id',            bid_id,
                   'bidder_faction_id', bidder_faction_id,
                   'bidder_corp_id',    bidder_corp_id,
                   'units',             units_won,
                   'payout',            payout
               )), '[]'::jsonb),
               COALESCE(SUM(payout), 0)::bigint,
               COALESCE(SUM(units_won), 0)::int
          INTO v_payouts, v_total_payout, v_units
          FROM bidders;
        v_remaining := v_demand - v_units;

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

        FOR v_bid IN
            SELECT (e->>'bid_id')::uuid              AS bid_id,
                   NULLIF(e->>'bidder_faction_id','')::uuid AS bidder_faction_id,
                   NULLIF(e->>'bidder_corp_id','')::uuid    AS bidder_corp_id,
                   (e->>'units')::int                AS units,
                   (e->>'payout')::bigint            AS payout
              FROM jsonb_array_elements(v_payouts) e
        LOOP
            IF v_bid.bidder_corp_id IS NOT NULL THEN
                -- 20270618: stamp last_tick_revenue + last_revenue_tick
                -- alongside the treasury credit. CASE handles a corp
                -- winning multiple bids in one tick — the second bid
                -- adds to the existing stamp instead of replacing it.
                -- Same pattern as airlines (20270616) and oil & gas
                -- (20270605).
                UPDATE entrepreneur_corps
                   SET treasury_cash      = COALESCE(treasury_cash, 0) + v_bid.payout,
                       last_tick_revenue  = CASE
                           WHEN last_revenue_tick = v_tick
                                THEN COALESCE(last_tick_revenue, 0) + v_bid.payout
                           WHEN v_bid.payout <> 0
                                THEN v_bid.payout
                           ELSE last_tick_revenue
                       END,
                       last_revenue_tick  = CASE
                           WHEN last_revenue_tick = v_tick THEN v_tick
                           WHEN v_bid.payout <> 0          THEN v_tick
                           ELSE last_revenue_tick
                       END,
                       updated_at = now()
                 WHERE id = v_bid.bidder_corp_id;
            ELSIF v_bid.bidder_faction_id IS NOT NULL THEN
                -- Legacy faction-corp bidder — writes to the old
                -- corp_cash_reserves column. Not on the new Revenue
                -- Card path (legacy faction corps were culled per
                -- docs/legacy-corp-cull). Left unchanged.
                UPDATE factions
                   SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) + v_bid.payout
                 WHERE id = v_bid.bidder_faction_id;
            END IF;
            v_slots_filled := v_slots_filled + v_bid.units;
        END LOOP;

        UPDATE shipping_contracts
           SET last_payment_tick = v_tick,
               total_paid = v_contract.total_paid_so_far + v_total_payout,
               consecutive_missed_payments = 0,
               last_tick_units_filled = v_demand - v_remaining,
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
