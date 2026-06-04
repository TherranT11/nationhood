-- ════════════════════════════════════════════════════════════════════
-- 20270607 — lane_demand() helper + list_active_lane_demands RPC
--
-- The airline-routes panel on entrepreneur-corp.html shows a
-- "Total passengers on lane: N — You X · Sky Air Y" line under each
-- active route. N is summed from last_tick_pax across every airline
-- on the city pair, which makes a freshly-opened route render as
-- "Total: 0 — You 0" — both numbers are technically correct
-- (no tick has run yet) but the row looks broken even when nothing
-- is wrong.
--
-- What the player actually wants to see is the lane's DEMAND POOL
-- — the upper bound of pax/tick the lane sustains before
-- competitive split. That number exists today, but only inline
-- inside process_entrepreneur_airline_routes' lane_demand CTE
-- (20270465). Re-deriving it client-side would duplicate the
-- formula, exactly the drift-bug-waiting-to-happen the philosophy
-- warns about.
--
-- This migration carves the formula out into one SQL helper used by
-- both the tick processor and the new client RPC:
--
--   1. lane_demand(p_origin_city_id uuid, p_dest_city_id uuid)
--      RETURNS int — the single source of truth for per-lane demand.
--      Formula verbatim from 20270465:
--          (origin_pop% + dest_pop%)
--          × ((SoL_o + SoL_d) / 200)
--          × (either city capital ? 1.5 : 1.0)
--          × 0.5
--      Returns NULL when either city id doesn't resolve.
--
--   2. process_entrepreneur_airline_routes re-issued with the
--      lane_demand CTE replaced by a call to the helper. Body is
--      otherwise byte-identical to 20270465 — same shares math,
--      same revenue/ops accounting, same per-tick stamps.
--
--   3. list_active_lane_demands() RETURNS jsonb — returns
--      [{origin_city_id, dest_city_id, demand}] for every distinct
--      city pair that has at least one active entrepreneur airline
--      route. Single call from the client builds the lane→demand
--      map, no per-route round-trip.
--
-- Apply after 20270606.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. lane_demand helper ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.lane_demand(
    p_origin_city_id uuid,
    p_dest_city_id   uuid
) RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT ROUND(
        (oc.population_pct + dc.population_pct)
        * ((COALESCE(no.standard_of_living, 0)
          + COALESCE(nd.standard_of_living, 0)) / 200.0)
        * CASE WHEN oc.is_capital OR dc.is_capital THEN 1.5 ELSE 1.0 END
        * 0.5
    )::int
      FROM airline_cities oc
      JOIN airline_cities dc ON dc.id = p_dest_city_id
      JOIN nations no ON no.id = oc.nation_id
      JOIN nations nd ON nd.id = dc.nation_id
     WHERE oc.id = p_origin_city_id;
$$;

COMMENT ON FUNCTION public.lane_demand(uuid, uuid) IS
    'Single source of truth for per-lane passenger demand. Returns the upper bound of pax/tick the lane sustains before the competitive-share split. Called by process_entrepreneur_airline_routes (lane_demand CTE) and list_active_lane_demands. Formula: (origin_pop% + dest_pop%) × ((SoL_o + SoL_d) / 200) × (either-capital ? 1.5 : 1.0) × 0.5. Returns NULL if either city id doesn''t resolve.';

REVOKE EXECUTE ON FUNCTION public.lane_demand(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.lane_demand(uuid, uuid) TO authenticated, service_role;

-- ── 2. process_entrepreneur_airline_routes — use the helper ───────
-- Body is byte-identical to 20270465's version except that the
-- lane_demand CTE's inline formula is replaced by a call to
-- public.lane_demand(rs.origin_city_id, rs.dest_city_id). Same
-- shares math, same revenue / ops accounting, same per-tick stamps,
-- same condition-decay + overhaul reset.
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
        -- Per-lane demand via the lane_demand() helper (SoT).
        SELECT DISTINCT rs.origin_city_id, rs.dest_city_id,
               public.lane_demand(rs.origin_city_id, rs.dest_city_id)::numeric AS demand
          FROM route_seats rs
    ),
    lane_total_attr AS (
        -- Attractiveness: cheaper ticket + more seats = larger share.
        -- 500 is the ticket_price ceiling; scaling by it keeps attr
        -- bounded so the math doesn't blow up with $1 tickets.
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

-- ── 3. list_active_lane_demands client RPC ────────────────────────
-- Returns [{origin_city_id, dest_city_id, demand}] for every
-- distinct city pair carrying at least one active entrepreneur
-- airline route. One call builds the entire lane→demand map the
-- client needs, no per-route round-trips.
CREATE OR REPLACE FUNCTION public.list_active_lane_demands()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'origin_city_id', t.origin_city_id,
        'dest_city_id',   t.dest_city_id,
        'demand',         public.lane_demand(t.origin_city_id, t.dest_city_id)
    )), '[]'::jsonb)
      FROM (
        SELECT DISTINCT origin_city_id, dest_city_id
          FROM airline_routes
         WHERE status = 'active'
           AND airline_corp_id IS NOT NULL
      ) t;
$$;

REVOKE EXECUTE ON FUNCTION public.list_active_lane_demands() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_active_lane_demands() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
