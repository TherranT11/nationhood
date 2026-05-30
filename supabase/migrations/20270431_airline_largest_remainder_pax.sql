-- ════════════════════════════════════════════════════════════════════
-- Airline passenger allocation: largest-remainder per lane
--
-- Pre-20270431 process_entrepreneur_airline_routes computed each
-- route's pax independently:
--   v_my_demand = lane_share × (my_attr / total_attr)
--   v_pax       = FLOOR(v_my_demand)
-- On low-demand lanes every route's exact share was fractional (e.g.
-- 0.7, 0.5, 0.3 across three carriers totalling 1.5 lane pax) and
-- FLOOR truncated all of them to 0. The user saw "0 pax every tick"
-- on Oros↔Valdomar / Oros↔Buenavera while other higher-demand lanes
-- swept the actual allocation.
--
-- Fix: largest-remainder allocation per lane — same algorithm as
-- 20270421's general-election seats. Each route gets FLOOR(share);
-- leftover (FLOOR(lane_share) − Σ FLOOR(route_share)) is awarded
-- one-by-one to the routes with the largest fractional remainders.
-- No demand "lost to truncation"; every lane with any positive
-- demand fills up to whichever routes' fractional shares ranked
-- closest to qualifying. Cheaper-per-seat carriers (larger
-- seats/ticket → larger exact share → larger remainder) win the
-- tiebreak naturally.
--
-- ── Implementation shape ────────────────────────────────────────────
-- Two-pass:
--   1. Single CTE pre-computes allocated_pax per route_id using
--      lane-aware largest-remainder. Stored in a session-scoped
--      _route_pax_alloc temp table.
--   2. Existing per-route FOR-loop reads allocated_pax from the temp
--      table and applies per-route side effects (treasury credit,
--      lifetime + last-tick counters, condition decay, status flip).
-- Treasury / decay logic is byte-for-byte unchanged from 20270417;
-- only the pax computation moves from inline FLOOR to lookup.
--
-- ── Edge cases ──────────────────────────────────────────────────────
-- * demand_pool = 0 (zero SoL / population / etc) → every route's
--   exact_pax = 0, base = 0, leftover = 0 → all routes 0. Correct.
-- * Route with seats = 0 → exact_pax = 0 → 0 pax. Correct.
-- * Lane with one route → base = FLOOR(lane_share), leftover gets
--   the route +1 if fractional ranks first (always does in lane-of-1).
--   Single-route lanes get FLOOR(lane_share) + (1 if frac > 0).
-- * Two routes tied on remainder → ORDER BY rem DESC, route_id
--   gives a stable winner (oldest-by-id). Comparable to election
--   seat allocator's tiebreak.
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
    v_pax          int;
    v_ac_count     int;
    v_revenue      bigint;
    v_ops_cost     bigint;
    v_net          bigint;
    v_routes_run   int    := 0;
    v_total_pax    bigint := 0;
    v_total_rev    bigint := 0;
    v_total_ops    bigint := 0;
BEGIN
    -- ── Pass 1: lane-aware largest-remainder allocation ─────────────
    -- Single CTE: compute exact_pax per route → base + remainder →
    -- per-lane leftover distribution. Temp table is session-scoped
    -- with ON COMMIT DROP; safe across concurrent ticks because
    -- TRUNCATE clears whatever the previous call left behind.
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
        -- Per-route seat capacity (sum of assigned aircraft passenger
        -- counts; ent_airline_seats fallback when a plane has no
        -- design row). Same formula as the pre-20270431 inline version.
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
    nation_demand AS (
        -- Per nation: demand_pool + total_weight. Computed once per
        -- nation rather than per route (the pre-20270431 code recomputed
        -- total_weight inside every route's loop iteration).
        SELECT n.id AS nation_id,
               (COALESCE(n.standard_of_living, 0) / 100.0
                * GREATEST(0, LEAST(1, (100 - COALESCE(n.cost_of_living, 50)) / 100.0))
                * COALESCE(n.population, 0) / 1000000.0
                * 20.0) AS demand_pool,
               COALESCE((
                   SELECT SUM((a.population_pct + b.population_pct)
                            * CASE WHEN a.is_capital OR b.is_capital THEN 2 ELSE 1 END)
                     FROM airline_cities a
                     JOIN airline_cities b
                       ON a.nation_id = b.nation_id AND a.id < b.id
                    WHERE a.nation_id = n.id
               ), 0) AS total_weight
          FROM nations n
         WHERE n.id IN (
             SELECT DISTINCT oc.nation_id
               FROM route_seats rs
               JOIN airline_cities oc ON oc.id = rs.origin_city_id
         )
    ),
    lane_demand AS (
        -- Per lane: lane_share = demand_pool × (lane_weight / total_weight).
        SELECT DISTINCT rs.origin_city_id, rs.dest_city_id,
               CASE WHEN nd.total_weight > 0
                    THEN nd.demand_pool
                       * ((oc.population_pct + dc.population_pct)
                          * CASE WHEN oc.is_capital OR dc.is_capital THEN 2 ELSE 1 END
                         ) / nd.total_weight
                    ELSE 0
               END AS lane_share
          FROM route_seats rs
          JOIN airline_cities oc ON oc.id = rs.origin_city_id
          JOIN airline_cities dc ON dc.id = rs.dest_city_id
          JOIN nation_demand nd ON nd.nation_id = oc.nation_id
    ),
    lane_total_attr AS (
        -- Σ (seats / ticket) over all routes on each lane.
        SELECT origin_city_id, dest_city_id,
               SUM(seats / GREATEST(COALESCE(ticket_price, 0), 1)::numeric) AS total_attr
          FROM route_seats
         GROUP BY origin_city_id, dest_city_id
    ),
    exact_shares AS (
        SELECT rs.route_id, rs.origin_city_id, rs.dest_city_id, rs.seats,
               CASE WHEN lt.total_attr > 0 AND ld.lane_share > 0
                    THEN ld.lane_share
                       * (rs.seats / GREATEST(COALESCE(rs.ticket_price, 0), 1)::numeric)
                       / lt.total_attr
                    ELSE 0
               END AS exact_pax
          FROM route_seats rs
          JOIN lane_demand ld   USING (origin_city_id, dest_city_id)
          JOIN lane_total_attr lt USING (origin_city_id, dest_city_id)
    ),
    floor_split AS (
        SELECT route_id, origin_city_id, dest_city_id, seats,
               exact_pax,
               FLOOR(exact_pax)::int AS base_pax,
               exact_pax - FLOOR(exact_pax) AS rem
          FROM exact_shares
    ),
    lane_totals AS (
        -- lane_floor = how many integer pax the lane allocates total;
        -- sum_route_floors = what FLOOR alone gives across routes;
        -- leftover = lane_floor − sum_route_floors goes to top-remainder.
        SELECT origin_city_id, dest_city_id,
               FLOOR(SUM(exact_pax))::int      AS lane_floor,
               SUM(FLOOR(exact_pax))::int      AS sum_route_floors
          FROM exact_shares
         GROUP BY origin_city_id, dest_city_id
    ),
    ranked AS (
        SELECT fs.route_id, fs.origin_city_id, fs.dest_city_id,
               fs.seats, fs.base_pax,
               ROW_NUMBER() OVER (PARTITION BY fs.origin_city_id, fs.dest_city_id
                                  ORDER BY fs.rem DESC, fs.route_id) AS rn
          FROM floor_split fs
    )
    SELECT r.route_id,
           LEAST(r.seats,
                 r.base_pax
                 + CASE WHEN r.rn <= GREATEST(0, lt.lane_floor - lt.sum_route_floors)
                        THEN 1 ELSE 0 END)::int
      FROM ranked r
      JOIN lane_totals lt USING (origin_city_id, dest_city_id);

    -- ── Pass 2: per-route side effects (treasury, decay, lifetime) ──
    -- Reads allocated_pax from the temp table; otherwise byte-for-byte
    -- the same per-route processing 20270417 already had.
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
