-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR AIRLINES — per-aircraft rows (commit 2/2: RPCs)
-- ════════════════════════════════════════════════════════════════════
-- Pairs with 20270203 (schema + backfill). Rewires the entrepreneur
-- airline RPCs so per-aircraft corp_aircraft rows are the source of
-- truth, while aircraft_*_owned / airline_routes.aircraft_* stay as
-- maintained caches (read by the tick allocator, UI idle math, range
-- gating). Adds condition decay to the per-tick allocator and player-
-- facing overhaul / retire that reuse the legacy condition mechanics
-- but charge entrepreneur treasury_cash (legacy charges faction
-- corp_cash_reserves via emit_corp_cash_event, which entrepreneur corps
-- don't have).
--
-- Touched:
--   entrepreneur_buy_aircraft           — INSERT N rows alongside count bump
--   entrepreneur_open_route             — row-based idle check + assign route_id
--   entrepreneur_close_route            — release assigned rows
--   process_entrepreneur_airline_routes — condition decay on flying rows
--   found_entrepreneur_corp             — seed 2 rows with the 2 starter regionals
--   entrepreneur_overhaul_aircraft (NEW)
--   entrepreneur_retire_aircraft   (NEW)
--
-- ── Overhaul cost: 0.5% of purchase price ────────────────────────
-- Entrepreneur aircraft cost $60M/$90M/$120M (regional/narrowbody/
-- widebody), so legacy's flat $40k/$120k/$300k would be trivial. But
-- the demand/revenue model is IDENTICAL to legacy (same 10/25/60 seats,
-- same ≤$500 tickets), and legacy overhaul was ~0.3-0.8% of aircraft
-- value (legacy planes are valued $5M/$25M/$100M). To stay balanced
-- against the same revenue while scaling to entrepreneur prices, cost
-- is 0.5% of purchase price:
--   regional $300k / narrowbody $450k / widebody $600k.
-- Still far cheaper than the $60M-$120M replacement, so overhaul is the
-- economical choice until the condition cap (which falls 1pp per cycle)
-- makes a plane uneconomic and the player retires it.
-- Same condition mechanic as legacy: condition resets to
-- (100 - overhaul_count); is_overhauling=TRUE sits the plane out one tick.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. entrepreneur_buy_aircraft — insert rows + maintain count ──
CREATE OR REPLACE FUNCTION public.entrepreneur_buy_aircraft(
    p_corp_id  uuid,
    p_class    text,
    p_quantity int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_corp      entrepreneur_corps%ROWTYPE;
    v_fac       factions%ROWTYPE;
    v_unit      bigint;
    v_cost      bigint;
    v_treas     numeric;
    v_col       text;
    v_new_owned int;
    v_tick      int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_class IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_class NOT IN ('regional','narrowbody','widebody') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_class');
    END IF;
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 50 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'airline' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_airline_corp');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    v_unit := CASE p_class
        WHEN 'regional'   THEN 60000000
        WHEN 'narrowbody' THEN 90000000
        WHEN 'widebody'   THEN 120000000
    END;
    v_cost  := v_unit * p_quantity::bigint;
    v_treas := COALESCE(v_corp.treasury_cash, 0);
    IF v_treas < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_treas::bigint, 'need', v_cost, 'payer', 'corp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Source of truth: one row per aircraft (condition 100, idle).
    INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
    SELECT p_corp_id, p_class, 100, v_tick
      FROM generate_series(1, p_quantity);

    -- Maintained cache: keep the owned counter in lockstep (read by the
    -- tick allocator, UI idle math, range gating).
    v_col := 'aircraft_' || p_class || '_owned';
    EXECUTE format(
        'UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash,0) - $1, %I = %I + $2 WHERE id = $3',
        v_col, v_col)
      USING v_cost, p_quantity, p_corp_id;

    EXECUTE format('SELECT %I FROM entrepreneur_corps WHERE id = $1', v_col)
       INTO v_new_owned USING p_corp_id;

    RETURN jsonb_build_object(
        'success', true,
        'corp_id', p_corp_id,
        'class',   p_class,
        'quantity_bought', p_quantity,
        'unit_cost', v_unit,
        'total_cost', v_cost,
        'owned_after', v_new_owned,
        'corp_cash_after', (v_treas - v_cost)::bigint
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_buy_aircraft(uuid, text, int) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_buy_aircraft(uuid, text, int) IS
    'Airline-corp owner buys N aircraft of a class from treasury_cash. Flat prices: regional $60M / narrowbody $90M / widebody $120M. Inserts one corp_aircraft row per plane (condition 100, idle) and keeps aircraft_*_owned in lockstep. Uncapped — per-tick ops cost is the natural limiter.';

-- ── 2. entrepreneur_open_route — idle from rows + assign route_id ─
CREATE OR REPLACE FUNCTION public.entrepreneur_open_route(
    p_corp_id        uuid,
    p_origin_city_id uuid,
    p_dest_city_id   uuid,
    p_ticket_price   int,
    p_regional       int,
    p_narrowbody     int,
    p_widebody       int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_corp         entrepreneur_corps%ROWTYPE;
    v_fac          factions%ROWTYPE;
    v_origin       airline_cities%ROWTYPE;
    v_dest         airline_cities%ROWTYPE;
    v_a            uuid;   -- canonical low city id
    v_b            uuid;   -- canonical high city id
    v_range        int;
    v_route_type   text;
    v_tick         int;
    v_reg          int := COALESCE(p_regional, 0);
    v_nar          int := COALESCE(p_narrowbody, 0);
    v_wide         int := COALESCE(p_widebody, 0);
    v_idle_reg     int;
    v_idle_nar     int;
    v_idle_wide    int;
    v_route_id     uuid;
    v_iter         RECORD;
    v_ids          uuid[];
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_origin_city_id IS NULL OR p_dest_city_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_origin_city_id = p_dest_city_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'same_city');
    END IF;
    IF p_ticket_price IS NULL OR p_ticket_price < 0 OR p_ticket_price > 500 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_ticket_price');
    END IF;
    IF (v_reg + v_nar + v_wide) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_aircraft_assigned');
    END IF;
    IF v_reg < 0 OR v_nar < 0 OR v_wide < 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_aircraft_counts');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'airline' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_airline_corp');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_origin FROM airline_cities WHERE id = p_origin_city_id;
    SELECT * INTO v_dest   FROM airline_cities WHERE id = p_dest_city_id;
    IF v_origin.id IS NULL OR v_dest.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;

    -- Must own a terminal at BOTH endpoints.
    IF NOT EXISTS (SELECT 1 FROM airline_terminals
                    WHERE city_id = p_origin_city_id AND owner_corp_id = p_corp_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_terminal_origin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM airline_terminals
                    WHERE city_id = p_dest_city_id AND owner_corp_id = p_corp_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_terminal_dest');
    END IF;

    -- Canonical pair order (the table CHECK requires origin < dest).
    IF p_origin_city_id < p_dest_city_id THEN
        v_a := p_origin_city_id; v_b := p_dest_city_id;
    ELSE
        v_a := p_dest_city_id;   v_b := p_origin_city_id;
    END IF;

    -- One active route per (corp, lane).
    IF EXISTS (SELECT 1 FROM airline_routes
                WHERE airline_corp_id = p_corp_id
                  AND origin_city_id = v_a AND dest_city_id = v_b
                  AND status = 'active') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'route_exists');
    END IF;

    -- Range lookup + per-class gating. regional/narrowbody can't fly
    -- lanes longer than their ceiling; only widebody serves cross-nation.
    SELECT range_units INTO v_range FROM airline_city_ranges
     WHERE city_a_id = v_a AND city_b_id = v_b;
    IF v_range IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_range_data');
    END IF;
    IF v_range > 20 AND v_reg > 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'regional_out_of_range',
            'range', v_range, 'class_max', 20);
    END IF;
    IF v_range > 60 AND v_nar > 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'narrowbody_out_of_range',
            'range', v_range, 'class_max', 60);
    END IF;

    -- Idle fleet from the rows themselves (source of truth) — a plane is
    -- idle when route_id IS NULL. This can never disagree with the
    -- route-count caches the way owned − Σ(route counts) could drift.
    SELECT COUNT(*) FILTER (WHERE aircraft_class = 'regional'),
           COUNT(*) FILTER (WHERE aircraft_class = 'narrowbody'),
           COUNT(*) FILTER (WHERE aircraft_class = 'widebody')
      INTO v_idle_reg, v_idle_nar, v_idle_wide
      FROM corp_aircraft
     WHERE entrepreneur_corp_id = p_corp_id AND route_id IS NULL;

    IF v_reg > v_idle_reg OR v_nar > v_idle_nar OR v_wide > v_idle_wide THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_idle_aircraft',
            'idle_regional', v_idle_reg, 'idle_narrowbody', v_idle_nar, 'idle_widebody', v_idle_wide,
            'requested_regional', v_reg, 'requested_narrowbody', v_nar, 'requested_widebody', v_wide);
    END IF;

    v_route_type := CASE WHEN v_origin.nation_id = v_dest.nation_id THEN 'domestic' ELSE 'international' END;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO airline_routes (
        airline_corp_id, airline_faction_id,
        origin_city_id, dest_city_id, ticket_price, maintenance_tier,
        aircraft_regional, aircraft_narrowbody, aircraft_widebody,
        route_type, status, opened_at_tick
    ) VALUES (
        p_corp_id, NULL,
        v_a, v_b, p_ticket_price, 'basic',
        v_reg, v_nar, v_wide,
        v_route_type, 'active', v_tick
    ) RETURNING id INTO v_route_id;

    -- Assign idle rows to the route (mirrors set_up_route). The idle
    -- check above + the corp-row FOR UPDATE guarantee enough rows.
    FOR v_iter IN
        SELECT klass, need FROM (VALUES
            ('regional'::text,   v_reg),
            ('narrowbody'::text, v_nar),
            ('widebody'::text,   v_wide)
        ) AS t(klass, need)
    LOOP
        IF v_iter.need <= 0 THEN CONTINUE; END IF;
        SELECT array_agg(id) INTO v_ids FROM (
            SELECT id FROM corp_aircraft
             WHERE entrepreneur_corp_id = p_corp_id
               AND aircraft_class = v_iter.klass
               AND route_id IS NULL
             ORDER BY created_at ASC
             LIMIT v_iter.need
             FOR UPDATE
        ) picks;
        UPDATE corp_aircraft SET route_id = v_route_id WHERE id = ANY(v_ids);
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'route_id', v_route_id,
        'corp_id', p_corp_id,
        'origin_city_id', v_a,
        'dest_city_id', v_b,
        'ticket_price', p_ticket_price,
        'route_type', v_route_type,
        'range_units', v_range,
        'aircraft', jsonb_build_object('regional', v_reg, 'narrowbody', v_nar, 'widebody', v_wide)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_open_route(uuid, uuid, uuid, int, int, int, int) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_open_route(uuid, uuid, uuid, int, int, int, int) IS
    'Airline-corp owner opens a route between two cities. Requires owning a terminal at both endpoints + idle aircraft (counted from corp_aircraft rows with route_id IS NULL). Assigns those rows route_id and stores matching denorm counts on the route. Range-gated: regional ≤ 20, narrowbody ≤ 60, widebody any. ticket_price 0-500. maintenance_tier pinned ''basic'' in v1.';

-- ── 3. entrepreneur_close_route — release assigned rows ──────────
CREATE OR REPLACE FUNCTION public.entrepreneur_close_route(
    p_corp_id  uuid,
    p_route_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_corp   entrepreneur_corps%ROWTYPE;
    v_fac    factions%ROWTYPE;
    v_route  airline_routes%ROWTYPE;
    v_tick   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_route_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_route FROM airline_routes WHERE id = p_route_id FOR UPDATE;
    IF v_route.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'route_not_found');
    END IF;
    IF v_route.airline_corp_id <> p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_route');
    END IF;
    IF v_route.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'route_not_active');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Closed (not deleted) so history + aggregates survive.
    UPDATE airline_routes
       SET status = 'closed', closed_at_tick = v_tick
     WHERE id = p_route_id;

    -- Release the assigned aircraft back to the idle pool. Clear
    -- is_overhauling too: if a plane was overhauled this tick and the
    -- route closes before the tick fires, the per-route flag-clear would
    -- never run and leave it stuck "in overhaul" (legacy close_airline_route
    -- handles the same edge case, 20261019).
    UPDATE corp_aircraft
       SET route_id = NULL, is_overhauling = FALSE
     WHERE route_id = p_route_id;

    RETURN jsonb_build_object('success', true, 'corp_id', p_corp_id, 'route_id', p_route_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_close_route(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_close_route(uuid, uuid) IS
    'Airline-corp owner closes a route (status=closed, kept for history). Assigned aircraft (corp_aircraft.route_id) are released to the idle pool, clearing is_overhauling.';

-- ── 4. process_entrepreneur_airline_routes — add condition decay ─
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

        -- Condition decay on the assigned, in-service aircraft. Entrepreneur
        -- routes pin maintenance_tier='basic' → 6.0/tick (airline_condition_decay).
        -- Decay drives the player's overhaul/retire decisions; v1 has no
        -- incident-risk loop (deferred — see 20270187 header).
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
    'Per-tick allocator for entrepreneur airline routes. Demand = (SoL/100) × colFactor × (pop/1M) × 20; pax = min(floor((lane_share − competitor_seats) × price_mult), my_seats); net (revenue − ops) credited to corp treasury. Now also decays assigned aircraft condition by airline_condition_decay(tier) (basic=6/tick) and clears is_overhauling at end of tick. Idempotent within a tick via last_processed_tick. Service-role only.';

-- ── 5. entrepreneur_overhaul_aircraft (NEW) ──────────────────────
CREATE OR REPLACE FUNCTION public.entrepreneur_overhaul_aircraft(
    p_corp_id     uuid,
    p_aircraft_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_corp      entrepreneur_corps%ROWTYPE;
    v_fac       factions%ROWTYPE;
    v_ac        corp_aircraft%ROWTYPE;
    v_cost      bigint;
    v_new_count int;
    v_new_cond  numeric;
    v_tick      int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_aircraft_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_ac FROM corp_aircraft WHERE id = p_aircraft_id FOR UPDATE;
    IF v_ac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'aircraft_not_found');
    END IF;
    IF v_ac.entrepreneur_corp_id IS DISTINCT FROM p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_aircraft');
    END IF;
    IF COALESCE(v_ac.is_overhauling, FALSE) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_overhauling');
    END IF;
    IF v_ac.condition >= 100 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_full_condition');
    END IF;

    -- 0.5% of purchase price ($60M/$90M/$120M).
    v_cost := CASE v_ac.aircraft_class
        WHEN 'regional'   THEN 300000
        WHEN 'narrowbody' THEN 450000
        WHEN 'widebody'   THEN 600000
        ELSE 0
    END;

    IF COALESCE(v_corp.treasury_cash, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_corp.treasury_cash, 0)::bigint, 'need', v_cost, 'payer', 'corp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    v_new_count := COALESCE(v_ac.overhaul_count, 0) + 1;
    v_new_cond  := GREATEST(0, 100 - v_new_count);

    -- Sit out one tick ONLY if the plane is flying a route — that's where
    -- the tick clears is_overhauling. An idle plane has no tick to sit out,
    -- so it overhauls instantly (avoids a flag that would never clear).
    UPDATE corp_aircraft
       SET is_overhauling = (v_ac.route_id IS NOT NULL),
           overhaul_count = v_new_count,
           condition      = v_new_cond
     WHERE id = p_aircraft_id;

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_cost
     WHERE id = p_corp_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        'Aircraft Overhaul',
        format('%s overhauled a %s aircraft (cycle #%s) for $%s.',
               v_corp.name, v_ac.aircraft_class, v_new_count, v_cost),
        'corporate', 'corp_aircraft_overhaul',
        jsonb_build_object('corp_id', p_corp_id, 'aircraft_id', p_aircraft_id,
                           'class', v_ac.aircraft_class, 'overhaul_count', v_new_count,
                           'condition', v_new_cond, 'cost', v_cost),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',        true,
        'aircraft_id',    p_aircraft_id,
        'overhaul_count', v_new_count,
        'condition',      v_new_cond,
        'cost',           v_cost,
        'corp_cash_after', (COALESCE(v_corp.treasury_cash, 0) - v_cost)::bigint
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_overhaul_aircraft(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_overhaul_aircraft(uuid, uuid) IS
    'Airline-corp owner overhauls one aircraft. Charges 0.5%% of purchase price from treasury_cash (regional $300k / narrowbody $450k / widebody $600k), increments overhaul_count, sets condition = 100 - count (cap shrinks 1pp/cycle, never resets), and marks is_overhauling=TRUE so the next tick skips wear. Logs to event_log.';

-- ── 6. entrepreneur_retire_aircraft (NEW) ────────────────────────
CREATE OR REPLACE FUNCTION public.entrepreneur_retire_aircraft(
    p_corp_id     uuid,
    p_aircraft_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_corp  entrepreneur_corps%ROWTYPE;
    v_fac   factions%ROWTYPE;
    v_ac    corp_aircraft%ROWTYPE;
    v_col   text;
    v_tick  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_aircraft_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_ac FROM corp_aircraft WHERE id = p_aircraft_id FOR UPDATE;
    IF v_ac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'aircraft_not_found');
    END IF;
    IF v_ac.entrepreneur_corp_id IS DISTINCT FROM p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_aircraft');
    END IF;

    -- If assigned to a route, decrement that route's per-class denorm
    -- count so the tick allocator + UI summary stay accurate. The route
    -- stays 'active' even if it drops to zero aircraft — a player-visible
    -- idle route they can close.
    IF v_ac.route_id IS NOT NULL THEN
        IF v_ac.aircraft_class = 'regional' THEN
            UPDATE airline_routes SET aircraft_regional = GREATEST(0, aircraft_regional - 1) WHERE id = v_ac.route_id;
        ELSIF v_ac.aircraft_class = 'narrowbody' THEN
            UPDATE airline_routes SET aircraft_narrowbody = GREATEST(0, aircraft_narrowbody - 1) WHERE id = v_ac.route_id;
        ELSIF v_ac.aircraft_class = 'widebody' THEN
            UPDATE airline_routes SET aircraft_widebody = GREATEST(0, aircraft_widebody - 1) WHERE id = v_ac.route_id;
        END IF;
    END IF;

    -- Maintained cache: decrement the owned counter.
    v_col := 'aircraft_' || v_ac.aircraft_class || '_owned';
    EXECUTE format('UPDATE entrepreneur_corps SET %I = GREATEST(0, %I - 1) WHERE id = $1', v_col, v_col)
      USING p_corp_id;

    DELETE FROM corp_aircraft WHERE id = p_aircraft_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        'Aircraft Retired',
        format('%s retired a %s aircraft.', v_corp.name, v_ac.aircraft_class),
        'corporate', 'corp_aircraft_retire',
        jsonb_build_object('corp_id', p_corp_id, 'aircraft_id', p_aircraft_id,
                           'class', v_ac.aircraft_class, 'released_route_id', v_ac.route_id),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'aircraft_id',       p_aircraft_id,
        'released_route_id', v_ac.route_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_retire_aircraft(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_retire_aircraft(uuid, uuid) IS
    'Airline-corp owner retires (scraps) one aircraft. No refund. Auto-releases from any assigned route (decrementing the route''s class-count denorm), decrements aircraft_*_owned, and DELETEs the corp_aircraft row. Logs to event_log.';

-- ── 7. found_entrepreneur_corp — seed rows with the 2 starter regionals
-- Verbatim 20270192 body + one INSERT: the airline branch already sets
-- aircraft_regional_owned = 2; materialize the 2 matching corp_aircraft
-- rows so a freshly founded airline corp has real planes (not just a
-- count) ready to assign to its first route.
CREATE OR REPLACE FUNCTION found_entrepreneur_corp(
    p_industry text, p_hq_nation_id uuid, p_name text, p_capital bigint, p_listing text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_fac       factions%ROWTYPE;
    v_capital   bigint := COALESCE(p_capital, 0);
    v_fee       bigint;
    v_total     bigint;
    v_id          uuid;
    v_tick        int;
    v_listing     text;
    v_city        uuid;
    v_seed_nation uuid;
    v_bld_type    text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_name IS NULL OR length(btrim(p_name)) < 2 OR length(btrim(p_name)) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF v_capital < 5000000 OR v_capital > 500000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_capital');
    END IF;
    IF p_industry IS NULL OR length(btrim(p_industry)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_industry');
    END IF;
    IF p_hq_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_hq_nation');
    END IF;
    v_listing := lower(COALESCE(NULLIF(btrim(p_listing), ''), 'private'));
    IF v_listing NOT IN ('private','public') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_listing');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    v_fee   := (v_capital * 5) / 100;
    v_total := v_capital + v_fee;
    IF COALESCE(v_fac.party_funds, 0) < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_total);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_total
     WHERE id = v_fac.id;

    INSERT INTO entrepreneur_corps
        (owner_faction_id, name, industry, hq_nation_id, starting_capital, founding_fee,
         listing, founded_tick, treasury_cash, shares_outstanding, share_price)
    VALUES
        (v_fac.id, btrim(p_name), p_industry, p_hq_nation_id, v_capital, v_fee,
         v_listing, COALESCE(v_tick, 0),
         v_capital::numeric,
         CASE WHEN v_listing = 'public' THEN 20 END,
         CASE WHEN v_listing = 'public' THEN v_capital::numeric / 20 END)
    RETURNING id INTO v_id;

    IF v_listing = 'public' THEN
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (v_id, v_fac.id, 20);
    END IF;

    -- Airline starter seed: 2 free regional aircraft (count + rows) + 2
    -- same-nation starter terminals so a first route is openable.
    IF p_industry = 'airline' THEN
        UPDATE entrepreneur_corps SET aircraft_regional_owned = 2 WHERE id = v_id;

        INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
        SELECT v_id, 'regional', 100, COALESCE(v_tick, 0)
          FROM generate_series(1, 2);

        SELECT nation_id INTO v_seed_nation
          FROM airline_cities
         GROUP BY nation_id
        HAVING COUNT(*) >= 2
         ORDER BY (nation_id = p_hq_nation_id) DESC, SUM(population_pct) DESC
         LIMIT 1;

        IF v_seed_nation IS NOT NULL THEN
            FOR v_city IN
                SELECT id FROM airline_cities
                 WHERE nation_id = v_seed_nation
                 ORDER BY population_pct DESC, name ASC
                 LIMIT 2
            LOOP
                UPDATE airline_terminals
                   SET owner_corp_id = v_id, acquired_at_tick = COALESCE(v_tick, 0)
                 WHERE id = (
                     SELECT id FROM airline_terminals
                      WHERE city_id = v_city
                        AND owner_airline_id IS NULL
                        AND owner_corp_id   IS NULL
                      ORDER BY terminal_number ASC
                      LIMIT 1
                 );
            END LOOP;
        END IF;
    END IF;

    -- Starter unique building (+ shipping freighters). Free, completed,
    -- owned, in the HQ nation; cost_paid 0, no GDP/ambition bonus.
    IF p_industry IN ('construction','banking','real_estate','shipping') THEN
        v_bld_type := CASE p_industry
            WHEN 'construction' THEN 'construction_yard'
            WHEN 'banking'      THEN 'banking_office'
            WHEN 'real_estate'  THEN 'real_estate_office'
            WHEN 'shipping'     THEN 'port'
        END;

        INSERT INTO corp_buildings (
            builder_corp_id, owner_corp_id, nation_id,
            name, tier, building_type,
            cost_paid, ambition_granted,
            status, started_at_tick, completes_at_tick, completed_at_tick,
            gdp_growth_applied, list_price
        ) VALUES (
            v_id, v_id, p_hq_nation_id,
            left(btrim(p_name) || ' ' || initcap(replace(v_bld_type, '_', ' ')), 80), 'small', v_bld_type,
            0, 0,
            'completed', COALESCE(v_tick, 0), COALESCE(v_tick, 0), COALESCE(v_tick, 0),
            true, NULL
        );

        IF p_industry = 'shipping' THEN
            UPDATE entrepreneur_corps SET freighters_owned = 2 WHERE id = v_id;
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'corp_id', v_id, 'listing', v_listing,
        'capital', v_capital, 'founding_fee', v_fee);
END;
$$;

GRANT EXECUTE ON FUNCTION found_entrepreneur_corp(text, uuid, text, bigint, text) TO authenticated;

COMMENT ON FUNCTION found_entrepreneur_corp(text, uuid, text, bigint, text) IS
    'Found an entrepreneur corp. Debits capital + 5%% fee from party_funds, seeds treasury_cash = capital. Public adds 20-share AMM state. Airline gets 2 regional aircraft (count + corp_aircraft rows) + 2 terminals; construction/banking/real_estate/shipping each get 1 free completed unique building (cost_paid 0) in their HQ nation, and shipping also gets 2 freighters.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.entrepreneur_retire_aircraft(uuid, uuid);
-- DROP FUNCTION IF EXISTS public.entrepreneur_overhaul_aircraft(uuid, uuid);
-- -- buy/open/close/tick/found revert by re-running 20270186 / 20270187 / 20270192 bodies.
-- COMMIT;
