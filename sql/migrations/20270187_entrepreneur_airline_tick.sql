-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR AIRLINES — v1 per-tick allocator (commit 2/3)
-- ════════════════════════════════════════════════════════════════════
-- Resolves every active entrepreneur airline route each tick: demand →
-- competitor split → pax → revenue − ops → corp treasury. Wired into
-- advance-corp-tick's global (non-per-nation) section in the same
-- commit.
--
-- ── Demand model (locked: SoL good, CoL bad) ─────────────────────
-- Preserves the legacy lane-share STRUCTURE that's already calibrated
-- against real nation populations (process_airline_route_tick), with
-- one swap: the legacy service_sector factor → an inverse
-- cost-of-living factor. Smallest change to a working model.
--
--   demand_pool = (SoL/100) × colFactor × (population/1M) × 20
--   colFactor   = (100 − cost_of_living) / 100, clamped to [0, 1]
--                 → CoL 0 ⇒ 1.0× (cheap, max travel), CoL 50 ⇒ 0.5×,
--                   CoL 100 ⇒ 0× (too expensive to fly).
--   CoL only ever DAMPENS demand (never boosts above baseline) — it
--   takes the slot the legacy service_sector/100 factor held, so total
--   demand stays in the legacy magnitude rather than ~2× it.
--
-- The pool is distributed across the origin nation's city pairs by
-- weight = (popPct_a + popPct_b) × (capital-endpoint ? 2 : 1), exactly
-- as legacy. International lanes key to the origin nation (legacy
-- simplification — kept for consistency; revisit if cross-nation
-- demand needs both-endpoint blending).
--
-- ── Capacity / competition / pricing (verbatim legacy) ───────────
--   seats:   regional 10 / narrowbody 25 / widebody 60
--   ops:     regional 500 / narrowbody 1200 / widebody 2500 per tick
--   competitor_seats = Σ seats of every OTHER active route on the lane
--                      (legacy faction routes count too — shared lanes)
--   price_mult = max(0, 2 × (1 − ticket_price/500))
--   pax        = min(floor((lane_share − competitor_seats) × price_mult),
--                    my_seats)
--   revenue    = pax × ticket_price
--
-- ── Money ────────────────────────────────────────────────────────
-- net = revenue − ops_cost, applied to entrepreneur_corps.treasury_cash.
-- May go NEGATIVE: sustained losses drive the corp insolvent, which
-- blocks further buy_aircraft / claim_terminal (their >= treasury
-- checks fail). Recovery is the player closing unprofitable routes —
-- entrepreneur_close_route costs no cash, so a broke airline can always
-- stop the bleeding and climb back on remaining-route revenue. Proper
-- auto-suspend of money-losing routes is a deferred v2 lever.
--
-- ── Out of scope (v1, mirrors commit 1) ──────────────────────────
-- No maintenance anniversary charge, no incident roll, no condition
-- aging. Ops cost is the only recurring expense.
--
-- Idempotent within a tick via last_processed_tick. Service-role only
-- (REVOKE from PUBLIC) — clients never call the tick processor.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- Single source of truth for route seat capacity (regional 10 /
-- narrowbody 25 / widebody 60). Used twice in the allocator — for the
-- route's own seats and for the competitor-seats SUM — so it lives in
-- one place. Pure arithmetic; IMMUTABLE.
CREATE OR REPLACE FUNCTION public.ent_airline_seats(
    p_regional int, p_narrowbody int, p_widebody int
) RETURNS int
LANGUAGE sql IMMUTABLE
AS $$
    SELECT COALESCE(p_regional, 0)   * 10
         + COALESCE(p_narrowbody, 0) * 25
         + COALESCE(p_widebody, 0)   * 60;
$$;

COMMENT ON FUNCTION public.ent_airline_seats(int, int, int) IS
    'Canonical seat capacity for an entrepreneur airline route: regional 10 / narrowbody 25 / widebody 60. Single source for the per-tick allocator.';

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

        -- Pax + revenue.
        v_price_mult := GREATEST(0, 2 * (1 - v_route.ticket_price / 500.0));
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

-- Tick processor — service-role only. Clients never call it (the
-- last_processed_tick guard stops double-processing within a tick, but
-- there's no reason to expose money movement to the client at all).
REVOKE EXECUTE ON FUNCTION public.process_entrepreneur_airline_routes(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_entrepreneur_airline_routes(int) TO service_role;

COMMENT ON FUNCTION public.process_entrepreneur_airline_routes(int) IS
    'Per-tick allocator for entrepreneur airline routes. Demand = (SoL/100) × colFactor × (pop/1M) × 20, colFactor = clamp((100-CoL)/100, 0, 1) (cost-of-living only dampens, holding the legacy service_sector slot); distributed across origin-nation city pairs by population/capital weight (legacy lane-share model). pax = min(floor((lane_share − competitor_seats) × price_mult), my_seats); net (revenue − ops) credited to corp treasury (may go negative = insolvency). Idempotent within a tick via last_processed_tick. Service-role only.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.process_entrepreneur_airline_routes(int);
-- COMMIT;
