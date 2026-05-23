-- ════════════════════════════════════════════════════════════════════
-- AIRLINE SEATS FROM DESIGN PASSENGERS — per-aircraft, not class-fixed
-- ════════════════════════════════════════════════════════════════════
-- The route allocator (20270204) sized capacity from the route's denorm
-- class counts × fixed class seats (ent_airline_seats: 10/25/60). Now that
-- airlines fly designed aircraft (aircraft RFPs, 20270229), capacity sums
-- each ASSIGNED aircraft's design.passengers — so a better design carries
-- more pax. Aircraft with no design (the 2-plane founding seed, legacy)
-- fall back to the class default via ent_airline_seats (one source for the
-- class numbers). Both this route's seats AND competitor seats use the same
-- per-aircraft rule, so the lane-share split stays consistent.
--
-- Ops cost stays class-rate × denorm count (designs carry no ops stat).
-- Body identical to 20270204 except the two seat calcs. Idempotent.
--
-- NOTE: range is still gated at open time by aircraft CLASS
-- (airline_city_ranges: regional ≤20 / narrowbody ≤60 / widebody ∞). The
-- design's range_nm (a 0–10 score) is NOT yet wired into lane eligibility —
-- the two scales differ and need a mapping decision.
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

        -- Capacity = Σ each assigned aircraft's design passengers (class
        -- default via ent_airline_seats when the plane has no design).
        SELECT COALESCE(SUM(
                 COALESCE(d.passengers,
                          ent_airline_seats((ca.aircraft_class = 'regional')::int,
                                            (ca.aircraft_class = 'narrowbody')::int,
                                            (ca.aircraft_class = 'widebody')::int))), 0)::int
          INTO v_my_seats
          FROM corp_aircraft ca
          LEFT JOIN ent_aircraft_designs d ON d.id = ca.ent_design_id
         WHERE ca.route_id = v_route.id;

        -- Competitor seats: every aircraft on every OTHER active route on
        -- this lane, same per-aircraft (design passengers) rule.
        SELECT COALESCE(SUM(
                 COALESCE(d.passengers,
                          ent_airline_seats((ca.aircraft_class = 'regional')::int,
                                            (ca.aircraft_class = 'narrowbody')::int,
                                            (ca.aircraft_class = 'widebody')::int))), 0)::int
          INTO v_competitor_seats
          FROM corp_aircraft ca
          JOIN airline_routes ar ON ar.id = ca.route_id
          LEFT JOIN ent_aircraft_designs d ON d.id = ca.ent_design_id
         WHERE ar.status = 'active'
           AND ar.id <> v_route.id
           AND ar.origin_city_id = v_route.origin_city_id
           AND ar.dest_city_id   = v_route.dest_city_id;

        -- Pax + revenue.
        v_price_mult := GREATEST(0, 2 * (1 - v_route.ticket_price / 500.0));
        v_unmet      := GREATEST(0, v_lane_share - v_competitor_seats);
        v_my_demand  := v_unmet * v_price_mult;
        v_pax        := LEAST(GREATEST(0, FLOOR(v_my_demand))::int, v_my_seats);
        v_revenue    := (v_pax * COALESCE(v_route.ticket_price, 0))::bigint;

        -- Ops cost (per aircraft per tick) — class rate × denorm count.
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
        UPDATE corp_aircraft
           SET condition = GREATEST(0, condition - airline_condition_decay(v_route.maintenance_tier))
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

NOTIFY pgrst, 'reload schema';

COMMIT;
