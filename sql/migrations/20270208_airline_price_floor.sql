-- ════════════════════════════════════════════════════════════════════
-- AIRLINE DEMAND — remove the max-price demand cliff
-- ════════════════════════════════════════════════════════════════════
-- v1 (20270187 + 20270204) priced demand with:
--     price_mult = GREATEST(0, 2 * (1 - ticket_price / 500))
-- ticket_price is capped at 500, so at the cap the term is exactly 0 →
-- a route priced at $500 carries ZERO passengers no matter how strong
-- the underlying demand is. Players who set the max fare see "0 pax".
--
-- Fix: floor the multiplier at 0.25 instead of 0. A route at the $500 cap
-- now carries 25% of base demand rather than nothing. Everything else is
-- unchanged:
--   • neutral point preserved — $250 still maps to 1.0×;
--   • low fares still boost demand up to 2.0× (the floor only bites above
--     ~$437.50, where 2*(1-p/500) would dip under 0.25);
--   • the revenue optimum stays at ~$250 — at the cap, revenue is
--     0.25 × $500 = 125 demand-units vs 1.0 × $250 = 250 at the optimum,
--     so pricing high remains suboptimal, just no longer fatal.
--
-- This is the ONLY change: a single coefficient in the price multiplier.
-- The rest of process_entrepreneur_airline_routes is reproduced verbatim
-- from 20270204 (CREATE OR REPLACE needs the whole body).
--
-- NOTE (not addressed here, by design): on a low-population / low-SoL
-- nation the demand POOL itself can floor to 0 pax independent of price.
-- That's a demand-pool tuning question (the pool's ×20 scalar, SoL/CoL
-- inputs), separate from this cliff fix — left for a retune pass.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.process_entrepreneur_airline_routes(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_route            RECORD;
    v_origin           airline_cities%ROWTYPE;
    v_dest             airline_cities%ROWTYPE;
    v_nation           nations%ROWTYPE;
    v_col_factor       numeric;
    v_demand_pool      numeric;
    v_total_weight     numeric;
    v_my_weight        numeric;
    v_lane_share       numeric;
    v_my_seats         int;
    v_competitor_seats int;
    v_price_mult       numeric;
    v_unmet            numeric;
    v_my_demand        numeric;
    v_pax              int;
    v_revenue          bigint;
    v_ops_cost         bigint;
    v_net              bigint;
    v_routes_run       int    := 0;
    v_total_pax        bigint := 0;
    v_total_rev        bigint := 0;
    v_total_ops        bigint := 0;
BEGIN
    FOR v_route IN
        SELECT * FROM airline_routes
         WHERE status = 'active'
           AND airline_corp_id IS NOT NULL
           AND (last_processed_tick IS NULL OR last_processed_tick <> p_tick)
         FOR UPDATE
    LOOP
        SELECT * INTO v_origin FROM airline_cities WHERE id = v_route.origin_city_id;
        SELECT * INTO v_dest   FROM airline_cities WHERE id = v_route.dest_city_id;
        IF v_origin.id IS NULL OR v_dest.id IS NULL THEN CONTINUE; END IF;

        SELECT * INTO v_nation FROM nations WHERE id = v_origin.nation_id;
        IF v_nation.id IS NULL THEN CONTINUE; END IF;

        -- Demand pool — SoL up, CoL down.
        v_col_factor := GREATEST(0, LEAST(1,
            (100 - COALESCE(v_nation.cost_of_living, 50)) / 100.0));
        v_demand_pool := (COALESCE(v_nation.standard_of_living, 0) / 100.0)
                       * v_col_factor
                       * (COALESCE(v_nation.population, 0) / 1000000.0)
                       * 20.0;

        -- Lane weight within the origin nation.
        SELECT COALESCE(SUM(
                 (a.population_pct + b.population_pct)
                 * CASE WHEN a.is_capital OR b.is_capital THEN 2 ELSE 1 END), 0)
          INTO v_total_weight
          FROM airline_cities a
          JOIN airline_cities b
            ON a.nation_id = b.nation_id AND a.id < b.id
         WHERE a.nation_id = v_nation.id;

        v_my_weight := (v_origin.population_pct + v_dest.population_pct)
                     * CASE WHEN v_origin.is_capital OR v_dest.is_capital THEN 2 ELSE 1 END;

        v_lane_share := CASE WHEN v_total_weight > 0
                             THEN v_demand_pool * (v_my_weight / v_total_weight)
                             ELSE 0 END;

        -- Capacity.
        v_my_seats := ent_airline_seats(v_route.aircraft_regional,
                                        v_route.aircraft_narrowbody,
                                        v_route.aircraft_widebody);

        -- Competitor seats: every OTHER active route on this lane.
        SELECT COALESCE(SUM(
                 ent_airline_seats(aircraft_regional, aircraft_narrowbody, aircraft_widebody)), 0)
          INTO v_competitor_seats
          FROM airline_routes
         WHERE status = 'active'
           AND id <> v_route.id
           AND origin_city_id = v_route.origin_city_id
           AND dest_city_id   = v_route.dest_city_id;

        -- Pax + revenue. Price multiplier floored at 0.25 (was 0): a route
        -- at the $500 fare cap still carries 25% of base demand instead of
        -- zero. Neutral stays at $250 → 1.0×; low fares still reach 2.0×.
        v_price_mult := GREATEST(0.25, 2 * (1 - v_route.ticket_price / 500.0));
        v_unmet      := GREATEST(0, v_lane_share - v_competitor_seats);
        v_my_demand  := v_unmet * v_price_mult;
        v_pax        := LEAST(GREATEST(0, FLOOR(v_my_demand))::int, v_my_seats);
        v_revenue    := (v_pax * COALESCE(v_route.ticket_price, 0))::bigint;

        -- Ops cost (per aircraft per tick).
        v_ops_cost := (COALESCE(v_route.aircraft_regional, 0)   * 500
                     + COALESCE(v_route.aircraft_narrowbody, 0) * 1200
                     + COALESCE(v_route.aircraft_widebody, 0)   * 2500)::bigint;

        v_net := v_revenue - v_ops_cost;

        -- Net to corp treasury (may go negative — see header).
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_net
         WHERE id = v_route.airline_corp_id;

        UPDATE airline_routes
           SET lifetime_pax        = lifetime_pax     + v_pax,
               lifetime_revenue    = lifetime_revenue + v_revenue,
               lifetime_spend      = lifetime_spend   + v_ops_cost,
               last_tick_pax       = v_pax,
               last_tick_revenue   = v_revenue,
               last_tick_spend     = v_ops_cost,
               last_processed_tick = p_tick
         WHERE id = v_route.id;

        -- Condition decay on the assigned, in-service aircraft. Entrepreneur
        -- routes pin maintenance_tier='basic' → 6.0/tick (airline_condition_decay).
        -- Decay drives the player's overhaul/retire decisions; v1 has no
        -- incident-risk loop (deferred — see 20270187 header).
        -- KNOWN v1 SIMPLIFICATION: seats/ops/revenue above are read from the
        -- denorm route counts, which include an is_overhauling plane, so an
        -- overhauling aircraft still earns/costs for the one tick it sits in
        -- MRO (unlike legacy, which excludes it from seat aggregation). The
        -- only is_overhauling effect here is skipping THIS tick's decay. Made
        -- row-aware only if/when the tick moves off denorm counts.
        UPDATE corp_aircraft
           SET condition = GREATEST(0, condition - airline_condition_decay(v_route.maintenance_tier))
         WHERE route_id = v_route.id
           AND COALESCE(is_overhauling, FALSE) = FALSE;

        -- Aircraft that overhauled this tick return to service next tick.
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
        'success',       true,
        'tick',          p_tick,
        'routes_run',    v_routes_run,
        'total_pax',     v_total_pax,
        'total_revenue', v_total_rev,
        'total_ops',     v_total_ops
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_entrepreneur_airline_routes(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_entrepreneur_airline_routes(int) TO service_role;

COMMENT ON FUNCTION public.process_entrepreneur_airline_routes(int) IS
    'Per-tick allocator for entrepreneur airline routes. Demand = (SoL/100) × colFactor × (pop/1M) × 20; pax = min(floor((lane_share − competitor_seats) × price_mult), my_seats) where price_mult = GREATEST(0.25, 2×(1 − ticket/500)) — floored at 0.25 so the $500 fare cap is no longer a zero-demand cliff (neutral $250→1.0×). Net (revenue − ops) credited to corp treasury. Decays assigned aircraft condition by airline_condition_decay(tier) (basic=6/tick) and clears is_overhauling at end of tick. Idempotent within a tick via last_processed_tick. Service-role only.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-run the 20270204 body (price_mult floor = 0) to revert.
