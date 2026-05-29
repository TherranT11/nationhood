-- ════════════════════════════════════════════════════════════════════
-- SHIPPING — bidding-window constant consolidated to one SQL function
-- ════════════════════════════════════════════════════════════════════
-- Pre-commit audit on 72a7908 caught that BIDDING_WINDOW_TICKS = 3
-- was declared inside BOTH process_trade_agreement_shipping_multiwinner
-- AND get_route_bids_for_minister — same drift class as the JS-side
-- mirror the audit had just fixed, only now it was SQL/SQL instead of
-- SQL/JS. If the window ever moved off 3, the two functions could
-- silently disagree about what counts as "in window".
--
-- Fix: factor the constant out into a tiny IMMUTABLE SQL function.
-- The two callers read from it. The literal 3 lives in exactly one
-- place in the entire codebase (here), JS has no mirror, both SQL
-- functions share the source.
--
-- Bodies are otherwise byte-for-byte verbatim from 20270389. The
-- only diffs: each function drops its local
-- "BIDDING_WINDOW_TICKS constant int := 3" declaration and reads
-- shipping_bidding_window_ticks() at the comparison site instead.
-- CREATE OR REPLACE, idempotent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. The constant ──────────────────────────────────────────────────
-- IMMUTABLE so the planner can fold it as a literal at call sites;
-- no side effects, safe to GRANT EXECUTE TO PUBLIC. This is the ONE
-- place the 3-tick bidding window lives.
CREATE OR REPLACE FUNCTION public.shipping_bidding_window_ticks()
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$ SELECT 3 $$;

GRANT EXECUTE ON FUNCTION public.shipping_bidding_window_ticks() TO PUBLIC;

COMMENT ON FUNCTION public.shipping_bidding_window_ticks() IS
    'Number of ticks pending shipping bids accumulate before the allocator pays out. ONE source of truth — process_trade_agreement_shipping_multiwinner and get_route_bids_for_minister both read this. If you change the body, every consumer changes in lockstep automatically.';

-- ── 2. Allocator — drop local constant, call the function ────────────
CREATE OR REPLACE FUNCTION public.process_trade_agreement_shipping_multiwinner(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    RAW_PER_ABSTRACT      constant numeric := 1000000;
    v_tick            int;
    v_contract        RECORD;
    v_bid             RECORD;
    v_demand          int;
    v_units_taken     int;
    v_total_payout    bigint;
    v_buyer_budget_a  numeric;
    v_buyer_budget_r  numeric;
    v_has_manual      boolean;
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

        -- Manual accepts bypass the 3-tick bidding window. The minister
        -- explicitly chose this set; no reason to make them wait. If no
        -- bid on this contract is manually_accepted, the standard
        -- bidding window still gates the cheapest-first auto-award.
        -- Window length comes from shipping_bidding_window_ticks() —
        -- one source for the constant.
        SELECT EXISTS(
            SELECT 1 FROM shipping_contract_bids
             WHERE contract_id = v_contract.id
               AND status = 'pending'
               AND COALESCE(manually_accepted, false) = true
        ) INTO v_has_manual;

        IF NOT v_has_manual
           AND v_tick - v_contract.created_tick < shipping_bidding_window_ticks() THEN
            CONTINUE;
        END IF;

        -- Single source: rank-and-fill comes from the helper, which
        -- handles the manual-mode WHERE-clause internally. Same
        -- ordering, same veto exclusion, same 3-unit capacity math as
        -- the view RPCs.
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

-- ── 3. Minister view — drop local constant, call the function ────────
CREATE OR REPLACE FUNCTION public.get_route_bids_for_minister(p_nation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_tick   int;
    v_result jsonb;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF NOT EXISTS (
        SELECT 1 FROM ministries m JOIN factions f ON f.id = m.party_id
         WHERE m.nation_id = p_nation_id AND m.ministry_key = 'trade' AND m.is_active = TRUE
           AND (f.id = v_uid OR f.linked_user_id = v_uid)
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_trade_minister');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT jsonb_agg(route ORDER BY (route->>'created_at_tick')::int DESC NULLS LAST)
      INTO v_result
      FROM (
        SELECT jsonb_build_object(
                 'id', c.id, 'name', c.name, 'commodity', c.commodity,
                 'volume_required', COALESCE(c.volume_required, 0),
                 'origin_port', c.origin_port, 'destination_port', c.destination_port,
                 'created_at_tick', c.created_at_tick,
                 'ticks_until_window_close', CASE
                     WHEN EXISTS (SELECT 1 FROM shipping_contract_bids b
                                   WHERE b.contract_id = c.id
                                     AND b.status = 'pending'
                                     AND COALESCE(b.manually_accepted, false))
                         THEN 0
                     ELSE GREATEST(0, shipping_bidding_window_ticks() - (v_tick - COALESCE(c.created_at_tick, 0)))
                 END,
                 'bids', COALESCE((
                     SELECT jsonb_agg(jsonb_build_object(
                                'bid_id', b.id,
                                'carrier', COALESCE(ec.name, bf.faction_name, 'Carrier'),
                                'rate', CASE WHEN b.bid_rate IS NOT NULL THEN b.bid_rate
                                             WHEN COALESCE(b.freighters_allocated,0) > 0
                                                  THEN (b.offered_revenue_per_tick / b.freighters_allocated)
                                             ELSE NULL END,
                                'freighters',        COALESCE(b.freighters_allocated, 0),
                                'reputation',        COALESCE(bf.ent_reputation, 0),
                                'vetoed',            COALESCE(b.vetoed, false),
                                'manually_accepted', COALESCE(b.manually_accepted, false))
                            ORDER BY b.bid_rate ASC NULLS LAST, b.applied_at_tick ASC)
                       FROM shipping_contract_bids b
                       LEFT JOIN entrepreneur_corps ec ON ec.id = b.bidder_corp_id
                       LEFT JOIN factions bf           ON bf.id = b.bidder_faction_id
                      WHERE b.contract_id = c.id AND b.status = 'pending'
                 ), '[]'::jsonb)
               ) AS route
          FROM shipping_contracts c
         WHERE c.nation_id = p_nation_id AND c.status = 'open' AND c.trade_agreement_id IS NOT NULL
      ) sub;

    RETURN jsonb_build_object('success', true, 'routes', COALESCE(v_result, '[]'::jsonb));
END; $$;
GRANT EXECUTE ON FUNCTION public.get_route_bids_for_minister(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
