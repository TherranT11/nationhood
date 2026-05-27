-- ════════════════════════════════════════════════════════════════════
-- AIRLINE PASSENGERS — proportional (seats × price) split, not subtractive
-- ════════════════════════════════════════════════════════════════════
-- Bug: the allocator computed each route's pax as
--   unmet = lane_demand − Σ(other routes' seats);  pax = unmet × price_mult
-- so any carrier whose seats alone met the lane demand left ZERO unmet for
-- everyone else — the cheapest ticket got 0 passengers while one big carrier
-- swept the whole lane, and ticket price never actually competed.
--
-- Fix: split the lane demand in PROPORTION to each route's attractiveness,
-- where attractiveness = seats × price multiplier, capped at the route's own
-- seats. A cheaper fare now earns the LARGEST share (never zero), capacity
-- still matters, and demand spills across carriers. The price curve
-- (2 × (1 − ticket/500)) is unchanged — it's the tuning dial for how hard cheap
-- fares pull. Body identical to 20270231 except the competitor query and the
-- pax formula. Idempotent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.process_entrepreneur_airline_routes(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_route        RECORD;
    v_origin       airline_cities%ROWTYPE;
    v_dest         airline_cities%ROWTYPE;
    v_nation       nations%ROWTYPE;
    v_col_factor   numeric;
    v_demand_pool  numeric;
    v_total_weight numeric;
    v_my_weight    numeric;
    v_lane_share   numeric;
    v_my_seats     int;
    v_price_mult   numeric;
    v_my_attr      numeric;
    v_total_attr   numeric;
    v_my_demand    numeric;
    v_pax          int;
    v_revenue      bigint;
    v_ops_cost     bigint;
    v_net          bigint;
    v_routes_run   int    := 0;
    v_total_pax    bigint := 0;
    v_total_rev    bigint := 0;
    v_total_ops    bigint := 0;
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

        -- Lane attractiveness: Σ over ALL active routes on this lane (this one
        -- included) of (route seats × its price multiplier). Same per-aircraft
        -- seat rule as above; ticket price weights each route's pull.
        SELECT COALESCE(SUM(
                 rs.seats * GREATEST(0, 2 * (1 - COALESCE(ar.ticket_price, 0) / 500.0))), 0)
          INTO v_total_attr
          FROM airline_routes ar
          JOIN (
              SELECT ca.route_id,
                     SUM(COALESCE(d.passengers,
                                  ent_airline_seats((ca.aircraft_class = 'regional')::int,
                                                    (ca.aircraft_class = 'narrowbody')::int,
                                                    (ca.aircraft_class = 'widebody')::int)))::numeric AS seats
                FROM corp_aircraft ca
                LEFT JOIN ent_aircraft_designs d ON d.id = ca.ent_design_id
               GROUP BY ca.route_id
          ) rs ON rs.route_id = ar.id
         WHERE ar.status = 'active'
           AND ar.origin_city_id = v_route.origin_city_id
           AND ar.dest_city_id   = v_route.dest_city_id;

        -- Proportional split: this route pulls passengers in proportion to its
        -- (seats × price multiplier) share of the lane's total attractiveness,
        -- capped at its own seats. Cheaper fare → larger share, never zero.
        v_price_mult := GREATEST(0, 2 * (1 - v_route.ticket_price / 500.0));
        v_my_attr    := v_my_seats * v_price_mult;
        v_my_demand  := CASE WHEN v_total_attr > 0
                             THEN v_lane_share * (v_my_attr / v_total_attr)
                             ELSE 0 END;
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

        -- Condition decay on the assigned, in-service aircraft.
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
