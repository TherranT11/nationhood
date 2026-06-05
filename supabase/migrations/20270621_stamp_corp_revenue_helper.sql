-- ════════════════════════════════════════════════════════════════════
-- 20270621 — Extract stamp_entrepreneur_corp_revenue helper (SoT)
--
-- The Revenue Change card stamp pattern — write treasury_cash, plus
-- accumulate-or-stamp last_tick_revenue + last_revenue_tick via a
-- three-arm CASE — was inlined verbatim into four RPCs:
--
--   process_oil_and_gas                          (20270605)
--   process_entrepreneur_airline_routes          (20270616)
--   process_trade_agreement_shipping_multiwinner (20270618)
--   process_apartment_rents                      (20270620)
--
-- Same five-line CASE in four places, with share trades pending as a
-- fifth. If we ever change how the stamp behaves (idempotency, per-
-- source breakdown, clamping, partial credit) we'd have to edit four
-- function bodies and hope no other path was missed. Audit flagged
-- this as a SoT violation per the project's "one place, read
-- everywhere" rule.
--
-- Fix: extract a single helper. Each RPC keeps its business logic
-- (compute v_net / v_payout / v_retail_revenue) and ends each
-- per-iteration block with a PERFORM call to the helper. The CASE
-- lives in exactly one place.
--
-- Behavior unchanged from the four shipped versions, with two minor
-- consolidations:
--
--   * airlines (20270616) did not stamp updated_at; the helper does.
--     One additional column write per tick per corp — negligible,
--     and brings airlines in line with shipping/apartments which
--     already touched updated_at.
--
--   * oil & gas (20270605) used a simpler `WHEN v_retail_revenue > 0`
--     pattern that didn't accumulate across iterations. process_oil_
--     and_gas only enters the inner UPDATE once per corp per tick
--     (its FOR loop iterates over distinct corps), so the accumulator
--     pattern collapses to the same behavior: first call this tick
--     with non-zero amount stamps; zero amount leaves the prior
--     stamp untouched. Negative amounts are impossible for oil & gas
--     (v_retail_revenue := non-negative * positive_price). Behavior
--     is preserved.
--
-- Oil & gas was the only RPC whose inline UPDATE also wrote business
-- columns (crude_reserve, refined_reserve, oil_last_processed_tick).
-- Those stay inline in their own UPDATE statement; the helper handles
-- only the stamp half. Two UPDATEs on the same already-locked row in
-- the same transaction — no contention.
--
-- Apply after 20270620.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Helper ────────────────────────────────────────────────────────
-- Credits p_amount to the corp's treasury and stamps the Revenue
-- Change columns. Multi-call-per-tick safe: a corp earning revenue
-- from N sources in one tick accumulates into one stamp via the
-- last_revenue_tick = p_tick arm. A p_amount = 0 call is a no-op
-- on the stamp columns (preserves the prior tick's reading).
--
-- SECURITY DEFINER so the writes go through even when the caller
-- doesn't hold UPDATE on the REVOKE'd revenue columns. GRANT
-- limited to service_role — only tick processors should call this.
CREATE OR REPLACE FUNCTION public.stamp_entrepreneur_corp_revenue(
    p_corp_id uuid,
    p_tick    int,
    p_amount  bigint
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE entrepreneur_corps
       SET treasury_cash     = COALESCE(treasury_cash, 0) + p_amount,
           last_tick_revenue = CASE
               WHEN last_revenue_tick = p_tick
                    THEN COALESCE(last_tick_revenue, 0) + p_amount
               WHEN p_amount <> 0
                    THEN p_amount
               ELSE last_tick_revenue
           END,
           last_revenue_tick = CASE
               WHEN last_revenue_tick = p_tick THEN p_tick
               WHEN p_amount <> 0              THEN p_tick
               ELSE last_revenue_tick
           END,
           updated_at = now()
     WHERE id = p_corp_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.stamp_entrepreneur_corp_revenue(uuid, int, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.stamp_entrepreneur_corp_revenue(uuid, int, bigint) TO service_role;

-- ── process_oil_and_gas — split UPDATE; helper handles stamp ──────
CREATE OR REPLACE FUNCTION public.process_oil_and_gas(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_corp                 RECORD;
    v_pumps                int;
    v_refine_cap           bigint;
    v_demand               bigint;
    v_crude_produced       bigint;
    v_refined_made         bigint;
    v_sold_to_stations     bigint;
    v_retail_revenue       bigint;
    v_count                int := 0;
    v_total_retail         bigint := 0;
    v_total_crude_added    bigint := 0;
    v_total_refined_made   bigint := 0;
BEGIN
    FOR v_corp IN
        SELECT id, crude_reserve, refined_reserve
          FROM entrepreneur_corps
         WHERE industry = 'oil_and_gas'
           AND (oil_last_processed_tick IS NULL OR oil_last_processed_tick <> p_tick)
         FOR UPDATE
    LOOP
        SELECT COUNT(*) INTO v_pumps
          FROM corp_buildings
         WHERE owner_corp_id = v_corp.id
           AND building_type = 'pump_jack'
           AND status = 'completed';
        v_crude_produced := (v_pumps * 3)::bigint;

        SELECT COALESCE(SUM(CASE building_type
            WHEN 'refinery_small'   THEN 4
            WHEN 'refinery_regular' THEN 10
            WHEN 'refinery_large'   THEN 20
            ELSE 0 END), 0)::bigint INTO v_refine_cap
          FROM corp_buildings
         WHERE owner_corp_id = v_corp.id
           AND building_type IN ('refinery_small','refinery_regular','refinery_large')
           AND status = 'completed';
        v_refined_made := LEAST(v_refine_cap, v_corp.crude_reserve + v_crude_produced);

        SELECT COALESCE(SUM(FLOOR((COALESCE(n.standard_of_living, 50)
                                 + COALESCE(n.infrastructure,    50)) / 20.0)), 0)::bigint
          INTO v_demand
          FROM corp_buildings b
          JOIN nations n ON n.id = b.nation_id
         WHERE b.owner_corp_id = v_corp.id
           AND b.building_type = 'gas_station'
           AND b.status = 'completed';
        v_sold_to_stations := LEAST(v_demand, v_corp.refined_reserve + v_refined_made);
        v_retail_revenue   := v_sold_to_stations * oil_gas_retail_price();

        -- Business-side row update: reserves + tick guard. Stamp half
        -- moved to the helper below.
        UPDATE entrepreneur_corps
           SET crude_reserve   = crude_reserve   + v_crude_produced - v_refined_made,
               refined_reserve = refined_reserve + v_refined_made   - v_sold_to_stations,
               oil_last_processed_tick = p_tick
         WHERE id = v_corp.id;

        PERFORM stamp_entrepreneur_corp_revenue(v_corp.id, p_tick, v_retail_revenue);

        v_count               := v_count + 1;
        v_total_retail        := v_total_retail + v_retail_revenue;
        v_total_crude_added   := v_total_crude_added + v_crude_produced;
        v_total_refined_made  := v_total_refined_made + v_refined_made;
    END LOOP;

    RETURN jsonb_build_object(
        'success',            true,
        'tick',               p_tick,
        'corps_processed',    v_count,
        'crude_produced',     v_total_crude_added,
        'refined_produced',   v_total_refined_made,
        'retail_revenue',     v_total_retail
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_oil_and_gas(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_oil_and_gas(int) TO service_role;

-- ── process_entrepreneur_airline_routes — stamp via helper ────────
CREATE OR REPLACE FUNCTION public.process_entrepreneur_airline_routes(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_route       RECORD;
    v_pax         int;
    v_ac_count    int;
    v_revenue     bigint;
    v_ops_cost    bigint;
    v_net         bigint;
    v_routes_run  int    := 0;
    v_total_pax   bigint := 0;
    v_total_rev   bigint := 0;
    v_total_ops   bigint := 0;
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS _route_pax_alloc (
        route_id      uuid PRIMARY KEY,
        allocated_pax int
    ) ON COMMIT DROP;
    TRUNCATE _route_pax_alloc;

    INSERT INTO _route_pax_alloc (route_id, allocated_pax)
    WITH due_routes AS (
        SELECT ar.id, ar.origin_city_id, ar.dest_city_id, ar.ticket_price
          FROM airline_routes ar
         WHERE ar.status = 'active'
           AND ar.airline_corp_id IS NOT NULL
           AND (ar.last_processed_tick IS NULL OR ar.last_processed_tick <> p_tick)
    ),
    route_seats AS (
        SELECT dr.id AS route_id, dr.origin_city_id, dr.dest_city_id, dr.ticket_price,
               COALESCE(SUM(COALESCE(d.passengers,
                              ent_airline_seats((ca.aircraft_class = 'regional')::int,
                                                (ca.aircraft_class = 'narrowbody')::int,
                                                (ca.aircraft_class = 'widebody')::int))), 0)::int AS seats
          FROM due_routes dr
          LEFT JOIN corp_aircraft ca ON ca.route_id = dr.id
          LEFT JOIN ent_aircraft_designs d ON d.id = ca.ent_design_id
         GROUP BY dr.id, dr.origin_city_id, dr.dest_city_id, dr.ticket_price
    ),
    lane_demand_cte AS (
        SELECT DISTINCT rs.origin_city_id, rs.dest_city_id,
               public.lane_demand(rs.origin_city_id, rs.dest_city_id)::numeric AS demand
          FROM route_seats rs
    ),
    lane_total_attr AS (
        SELECT origin_city_id, dest_city_id,
               SUM(seats * 500.0 / GREATEST(COALESCE(ticket_price, 0), 1)::numeric) AS total_attr
          FROM route_seats
         GROUP BY origin_city_id, dest_city_id
    ),
    shares AS (
        SELECT rs.route_id, rs.seats,
               CASE WHEN lt.total_attr > 0 AND ld.demand > 0
                    THEN ld.demand
                       * (rs.seats * 500.0 / GREATEST(COALESCE(rs.ticket_price, 0), 1)::numeric)
                       / lt.total_attr
                    ELSE 0
               END AS share
          FROM route_seats rs
          JOIN lane_demand_cte ld   USING (origin_city_id, dest_city_id)
          JOIN lane_total_attr lt USING (origin_city_id, dest_city_id)
    )
    SELECT route_id, LEAST(seats, ROUND(share)::int)::int FROM shares;

    FOR v_route IN
        SELECT * FROM airline_routes
         WHERE status = 'active'
           AND airline_corp_id IS NOT NULL
           AND (last_processed_tick IS NULL OR last_processed_tick <> p_tick)
         FOR UPDATE
    LOOP
        SELECT allocated_pax INTO v_pax FROM _route_pax_alloc WHERE route_id = v_route.id;
        v_pax     := COALESCE(v_pax, 0);
        v_revenue := (v_pax * COALESCE(v_route.ticket_price, 0))::bigint;

        SELECT COUNT(*) INTO v_ac_count
          FROM corp_aircraft WHERE route_id = v_route.id;

        v_ops_cost := (v_ac_count * CASE v_route.aircraft_class
                                        WHEN 'regional'   THEN 500
                                        WHEN 'narrowbody' THEN 1200
                                        WHEN 'widebody'   THEN 2500
                                        ELSE 0
                                    END)::bigint;

        v_net := v_revenue - v_ops_cost;

        PERFORM stamp_entrepreneur_corp_revenue(v_route.airline_corp_id, p_tick, v_net);

        UPDATE airline_routes
           SET lifetime_pax        = lifetime_pax     + v_pax,
               lifetime_revenue    = lifetime_revenue + v_revenue,
               lifetime_spend      = lifetime_spend   + v_ops_cost,
               last_tick_pax       = v_pax,
               last_tick_revenue   = v_revenue,
               last_tick_spend     = v_ops_cost,
               last_processed_tick = p_tick
         WHERE id = v_route.id;

        UPDATE corp_aircraft
           SET condition = GREATEST(0, condition - airline_condition_decay('basic'))
         WHERE route_id = v_route.id
           AND COALESCE(is_overhauling, FALSE) = FALSE;

        UPDATE corp_aircraft
           SET is_overhauling = FALSE
         WHERE route_id = v_route.id
           AND is_overhauling = TRUE;

        v_routes_run := v_routes_run + 1;
        v_total_pax  := v_total_pax + v_pax;
        v_total_rev  := v_total_rev + v_revenue;
        v_total_ops  := v_total_ops + v_ops_cost;
    END LOOP;

    RETURN jsonb_build_object(
        'success',     true,
        'tick',        p_tick,
        'routes_run',  v_routes_run,
        'total_pax',   v_total_pax,
        'total_rev',   v_total_rev,
        'total_ops',   v_total_ops
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_entrepreneur_airline_routes(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_entrepreneur_airline_routes(int) TO service_role;

-- ── process_trade_agreement_shipping_multiwinner — stamp via helper ──
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
                PERFORM stamp_entrepreneur_corp_revenue(v_bid.bidder_corp_id, v_tick, v_bid.payout);
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

-- ── process_apartment_rents — stamp via helper ────────────────────
CREATE OR REPLACE FUNCTION public.process_apartment_rents(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_b           RECORD;
    v_base_rent   bigint;
    v_occ_mult    numeric;
    v_sol         numeric;
    v_inf         numeric;
    v_stab        numeric;
    v_gross       numeric;
    v_occ         numeric;
    v_maint       numeric;
    v_net         bigint;
    v_count       int    := 0;
    v_total_net   bigint := 0;
BEGIN
    FOR v_b IN
        SELECT b.id, b.owner_corp_id, b.building_type, b.nation_id,
               n.standard_of_living, n.infrastructure, n.politician_stability
          FROM corp_buildings b
          JOIN nations n ON n.id = b.nation_id
         WHERE b.building_type IN ('apartment_basic', 'apartment_modest', 'apartment_luxury')
           AND b.status = 'completed'
           AND b.owner_corp_id IS NOT NULL
           AND (b.last_processed_tick IS NULL OR b.last_processed_tick <> p_tick)
         FOR UPDATE OF b
    LOOP
        v_base_rent := CASE v_b.building_type
            WHEN 'apartment_basic'  THEN 40000
            WHEN 'apartment_modest' THEN 90000
            WHEN 'apartment_luxury' THEN 250000
        END;

        -- Tier multiplier (20270617). Lockstep with
        -- js/utils.js APARTMENT_DEFS.occMult.
        v_occ_mult := CASE v_b.building_type
            WHEN 'apartment_basic'  THEN 1.00
            WHEN 'apartment_modest' THEN 0.85
            WHEN 'apartment_luxury' THEN 0.65
            ELSE                         1.00
        END;

        v_sol  := COALESCE(v_b.standard_of_living,   50);
        v_inf  := COALESCE(v_b.infrastructure,       50);
        v_stab := COALESCE(v_b.politician_stability, 50);

        v_gross := v_base_rent::numeric * (v_sol + v_inf) / 100.0;
        v_occ   := GREATEST(0.4, LEAST(1.0, v_stab * v_occ_mult / 100.0));
        v_maint := v_base_rent::numeric * (100.0 - v_inf) / 200.0;
        v_net   := ROUND(v_gross * v_occ - v_maint)::bigint;

        PERFORM stamp_entrepreneur_corp_revenue(v_b.owner_corp_id, p_tick, v_net);

        UPDATE corp_buildings
           SET last_processed_tick = p_tick
         WHERE id = v_b.id;

        v_count     := v_count + 1;
        v_total_net := v_total_net + v_net;
    END LOOP;

    RETURN jsonb_build_object(
        'success',         true,
        'tick',            p_tick,
        'apartments_run',  v_count,
        'total_net_rent',  v_total_net
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_apartment_rents(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_apartment_rents(int) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
