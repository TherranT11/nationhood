-- ════════════════════════════════════════════════════════════════════
-- Airline pax multiplier: ×20 → ×500
--
-- Long-standing complaint: airlines see "0 pax" tick after tick. Root
-- cause is the demand_pool constant in process_entrepreneur_airline_
-- routes (20270431) being too small relative to the O(N²) growth of
-- total_weight (sum of all city pairs in a nation):
--
--   demand_pool = SoL/100 × max(0, (100-CoL)/100) × pop_M × 20
--   lane_share  = demand_pool × lane_weight / total_weight
--
-- For a typical 2-5M pop nation with 5-10 cities and mid-range
-- SoL/CoL, top lanes land at 0.4-1.1 pax/tick. FLOOR(SUM(exact_pax))
-- is the lane budget — 0.4 floors to 0, so every airline on that
-- lane gets 0, every tick, forever. Players gave up.
--
-- The 20270431 header comment flagged this exact failure mode:
--   "If the player still sees consistent 0 pax after this lands, the
--    next dial is in nation_demand: the × 20 constant on demand_pool
--    (single source) sets the overall passenger volume per nation.
--    Bumping it lifts low-demand lanes above the 1-pax floor."
--
-- This migration is that dial bump. ×20 → ×500.
--
-- ── Calibration ─────────────────────────────────────────────────────
--   Tiny  (1M pop, SoL 40, CoL 60):  pool = 0.4×0.4×1×500 = 80
--     → capital lane ≈ 10 pax/tick (was 0.4)
--   Mid   (5M pop, SoL 50, CoL 50):  pool = 0.5×0.5×5×500 = 625
--     → capital lane ≈ 25 pax/tick (was 1.1)
--   Large (50M pop, SoL 70, CoL 40): pool = 0.7×0.6×50×500 = 10500
--     → capital lane ≈ 400 pax/tick (was 17), seat-capped on Regional
--
-- Tuning rationale: real-world airlines carry 200-2000 pax per million
-- per day; the ×20 ("20 pax per M at full SoL/CoL") was an order of
-- magnitude too low. ×500 puts the low end of the real-world range
-- on the table without making top routes infeasibly profitable —
-- LEAST(seats, ...) still caps fills at aircraft capacity.
--
-- ── What this migration does ────────────────────────────────────────
-- One-line change inside process_entrepreneur_airline_routes — the
-- 20.0 constant in the nation_demand CTE becomes 500.0. Function
-- body otherwise byte-for-byte identical to 20270431.
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
    nation_demand AS (
        -- ×500 multiplier (20270464). Calibrated to lift typical
        -- nation lanes above the 1-pax floor; see header.
        SELECT n.id AS nation_id,
               (COALESCE(n.standard_of_living, 0) / 100.0
                * GREATEST(0, LEAST(1, (100 - COALESCE(n.cost_of_living, 50)) / 100.0))
                * COALESCE(n.population, 0) / 1000000.0
                * 500.0) AS demand_pool,
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
