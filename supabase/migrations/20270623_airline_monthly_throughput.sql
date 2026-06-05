-- ════════════════════════════════════════════════════════════════════
-- 20270623 — Airline routes: one tick = 30 days × 3 flights/day
--
-- A tick represents a month (politicians age 1 year per 12 ticks);
-- airline math has been treating per-tick numbers as per-FLIGHT
-- since the model was sketched. A regional plane with 10 seats on
-- a route showing "last tick: 10 pax, net +$1,500" is the per-flight
-- accounting — the monthly number is 90× that (30 days × 3
-- flights/day = 90 flights per tick).
--
-- Fix: re-issue process_entrepreneur_airline_routes from 20270621
-- with a FLIGHTS_PER_TICK constant applied at the output stage. The
-- per-lane share allocation upstream stays per-flight (lane_demand
-- and seats unchanged), so the share split between competing
-- airlines on the same route works exactly as before. After the
-- LEAST(seats, share) cap, v_pax is the per-flight number; we
-- multiply once before computing revenue / stamping. v_ops_cost
-- scales by the same constant — each flight has its own ops cost.
--
-- Net per-tick numbers for the airline:
--   regional 1× plane, 10 pax/flight, $200 ticket
--     before: 10 pax × $200 − 1 × $500     = +$1,500
--     after:  900 pax × $200 − 1 × $500×90 = +$135,000
--
-- last_tick_pax / last_tick_revenue / last_tick_spend / lifetime_*
-- all jump 90× from this tick forward — historical rows accumulated
-- at the old per-flight rate stay as-is (no backfill). The Revenue
-- Change card's last_tick_revenue / last_revenue_tick stamp also
-- jumps 90× because it reads v_net.
--
-- Body is byte-identical to 20270621 except the FLIGHTS_PER_TICK
-- declaration and the two multiplications.
--
-- Apply after 20270622.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.process_entrepreneur_airline_routes(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    -- 30 days/tick × 3 flights/day. Scales the per-flight allocation
    -- (v_pax) and per-flight ops cost to the monthly throughput a
    -- tick represents. Allocation upstream is per-flight on purpose
    -- — the share split between airlines competing on a lane is a
    -- per-flight model.
    FLIGHTS_PER_TICK constant int := 90;
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
        -- Scale per-flight pax to the per-tick (monthly) total
        -- before computing revenue. v_pax stamps and the lifetime
        -- counter become monthly numbers from this tick forward.
        v_pax     := COALESCE(v_pax, 0) * FLIGHTS_PER_TICK;
        v_revenue := (v_pax * COALESCE(v_route.ticket_price, 0))::bigint;

        SELECT COUNT(*) INTO v_ac_count
          FROM corp_aircraft WHERE route_id = v_route.id;

        v_ops_cost := (v_ac_count * CASE v_route.aircraft_class
                                        WHEN 'regional'   THEN 500
                                        WHEN 'narrowbody' THEN 1200
                                        WHEN 'widebody'   THEN 2500
                                        ELSE 0
                                    END * FLIGHTS_PER_TICK)::bigint;

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

NOTIFY pgrst, 'reload schema';

COMMIT;
