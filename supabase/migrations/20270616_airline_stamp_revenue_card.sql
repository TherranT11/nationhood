-- ════════════════════════════════════════════════════════════════════
-- 20270616 — Airline corps: stamp last_tick_revenue / last_revenue_tick
--
-- Follow-up to 20270605, which added last_tick_revenue +
-- last_revenue_tick to entrepreneur_corps and wired the
-- corp_revenue_change_this_month RPC to read from those columns —
-- but only process_oil_and_gas was updated to stamp them at the
-- time. 20270605's commit body explicitly flagged airline routes,
-- share trades, and apartment rents as the same pattern needing
-- the same treatment.
--
-- User reported their two airline routes generating "net +$1,500"
-- each per tick (=$3,000/tick total) while the Revenue Change card
-- on entrepreneur-corp.html stayed at "$0 · no data yet". Cause:
-- process_entrepreneur_airline_routes writes to treasury_cash but
-- doesn't stamp the revenue-tracking columns; corp_revenue_change
-- _this_month reads NULL → "no data yet" → forever.
--
-- Fix: re-issue process_entrepreneur_airline_routes with the
-- entrepreneur_corps UPDATE extended to stamp the two columns
-- alongside the treasury credit. Body otherwise byte-identical to
-- 20270607 (the lane_demand-helper version) — same shares math,
-- same per-route accounting, same condition decay + overhaul reset.
--
-- Multi-route aggregation: a corp can run multiple routes in one
-- tick; each iteration of the per-route loop updates the corp row
-- once. The stamp accumulates correctly via:
--
--   last_tick_revenue = CASE
--     WHEN last_revenue_tick = p_tick           -- already stamped this tick
--          THEN COALESCE(last_tick_revenue, 0) + v_net
--     WHEN v_net <> 0                           -- first revenue this tick
--          THEN v_net
--     ELSE last_tick_revenue                    -- 0-net route → don't clobber
--   END
--
-- So two routes earning +$1500 and +$1500 in the same tick land on
-- the corp as last_tick_revenue = $3000. A loss-route adds a
-- negative — same UPDATE handles "lost money this month" cleanly.
--
-- Other bypass paths (apartment rents, share trades) still don't
-- stamp; they are tracked as separate follow-ups (same one-line
-- extension per processor when they need to surface on the card).
--
-- Apply after 20270615.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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

        -- 20270616: stamp last_tick_revenue + last_revenue_tick
        -- alongside the treasury credit so the Revenue Change card
        -- on entrepreneur-corp.html surfaces airline activity. The
        -- CASE accumulates across multiple routes processed in the
        -- same tick (corp earns from each, stamp captures the sum).
        UPDATE entrepreneur_corps
           SET treasury_cash      = COALESCE(treasury_cash, 0) + v_net,
               last_tick_revenue  = CASE
                   WHEN last_revenue_tick = p_tick
                        THEN COALESCE(last_tick_revenue, 0) + v_net
                   WHEN v_net <> 0
                        THEN v_net
                   ELSE last_tick_revenue
               END,
               last_revenue_tick  = CASE
                   WHEN last_revenue_tick = p_tick THEN p_tick
                   WHEN v_net <> 0                 THEN p_tick
                   ELSE last_revenue_tick
               END
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
