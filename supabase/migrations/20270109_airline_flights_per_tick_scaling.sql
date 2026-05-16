-- Airline rebalance: planes fly FLIGHTS_PER_TICK (30) round-trips/tick
--
-- Until now process_airline_route_tick treated one plane as a single
-- flight's worth of capacity per tick (regional=10 / narrowbody=25 /
-- widebody=60 seats), while the UI advertised "30 daily flights". The
-- 30 was pure display fluff the engine never applied, so revenue read
-- ~30× too low vs. what the screen implied.
--
-- Decision (explicit): scale BOTH capacity and lane demand by 30, and
-- leave the cost side UNCHANGED (ops + maintenance untouched). Net
-- effect: pax and revenue ~30×; airlines become substantially more
-- profitable by design.
--
-- Exactly three inputs are scaled by v_flights_per_tick:
--   • v_lane_share        — monthly demand pool slice for this route
--   • v_my_seats          — this route's monthly passenger capacity
--   • v_competitor_seats  — competitors' monthly capacity (must scale
--                           identically or unmet demand skews)
-- Everything else (price multiplier, ops cost, maintenance, incident
-- risk, condition decay, lifetime accumulation) is byte-for-byte the
-- 20261019 definition.
--
-- The client projection in airline-operations.html applies the same
-- FLIGHTS_PER_TICK to the same three inputs — keep the two in sync.
--
-- lifetime_pax/revenue/spend accumulate at the new scale going forward;
-- historical totals are intentionally NOT rewritten (a rebalance, not
-- a retroactive correction). Idempotent (CREATE OR REPLACE).

BEGIN;

CREATE OR REPLACE FUNCTION process_airline_route_tick(p_route_id UUID, p_tick INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_route        airline_routes%ROWTYPE;
    v_origin       airline_cities%ROWTYPE;
    v_dest         airline_cities%ROWTYPE;
    v_nation       nations%ROWTYPE;
    v_pop_m        NUMERIC;
    v_demand_pool  NUMERIC;
    v_total_weight NUMERIC := 0;
    v_my_weight    NUMERIC := 0;
    v_lane_share   NUMERIC;
    v_my_seats     INTEGER := 0;
    v_competitor_seats INTEGER := 0;
    v_price_mult   NUMERIC;
    v_unmet        NUMERIC;
    v_my_demand    NUMERIC;
    v_pax          INTEGER;
    v_revenue      INTEGER;
    v_ops_cost     INTEGER := 0;
    v_aircraft_count INTEGER := 0;
    v_assigned_count INTEGER := 0;
    v_maint_charge INTEGER := 0;
    v_is_anniversary BOOLEAN := false;
    v_corp         factions%ROWTYPE;
    v_op_safety    NUMERIC;
    v_per_aircraft_risk NUMERIC := 0;
    v_base_risk    NUMERIC;
    v_tier_mult    NUMERIC;
    v_minor_risk   NUMERIC;
    v_mod_risk     NUMERIC;
    v_major_risk   NUMERIC;
    v_incident_log JSONB := '[]'::jsonb;
    v_pair_label   TEXT;
    -- Round-trips per tick (≈1/day for a month). Multiplies per-plane
    -- capacity, lane demand, and competitor capacity. MUST match
    -- FLIGHTS_PER_TICK in airline-operations.html.
    v_flights_per_tick CONSTANT INTEGER := 30;
BEGIN
    SELECT * INTO v_route FROM airline_routes
     WHERE id = p_route_id
     FOR UPDATE;
    IF v_route.id IS NULL OR v_route.status <> 'active' THEN
        RETURN jsonb_build_object('skipped', true, 'reason', 'inactive');
    END IF;
    IF v_route.last_processed_tick = p_tick THEN
        RETURN jsonb_build_object('skipped', true, 'reason', 'already_processed');
    END IF;
    IF v_route.grounded_until_tick IS NOT NULL AND p_tick < v_route.grounded_until_tick THEN
        UPDATE airline_routes
           SET last_tick_pax       = 0,
               last_tick_revenue   = 0,
               last_tick_spend     = 0,
               last_processed_tick = p_tick
         WHERE id = p_route_id;
        RETURN jsonb_build_object('skipped', true, 'reason', 'grounded',
            'grounded_until_tick', v_route.grounded_until_tick);
    END IF;

    SELECT * INTO v_origin FROM airline_cities WHERE id = v_route.origin_city_id;
    SELECT * INTO v_dest   FROM airline_cities WHERE id = v_route.dest_city_id;
    SELECT * INTO v_nation FROM nations        WHERE id = v_origin.nation_id;
    SELECT * INTO v_corp   FROM factions       WHERE id = v_route.airline_faction_id;

    v_pop_m       := COALESCE(v_nation.population, 0) / 1000000.0;
    v_demand_pool := (COALESCE(v_nation.standard_of_living, 0) / 100.0)
                   * (COALESCE(v_nation.service_sector, 0)     / 100.0)
                   * v_pop_m
                   * 20.0;

    SELECT COALESCE(SUM(
            (a.population_pct + b.population_pct)
            * CASE WHEN a.is_capital OR b.is_capital THEN 2 ELSE 1 END
        ), 0)
      INTO v_total_weight
      FROM airline_cities a
      JOIN airline_cities b
        ON a.nation_id = b.nation_id
       AND a.id < b.id
     WHERE a.nation_id = v_nation.id;

    v_my_weight := (v_origin.population_pct + v_dest.population_pct)
                 * CASE WHEN v_origin.is_capital OR v_dest.is_capital THEN 2 ELSE 1 END;

    -- ×v_flights_per_tick: the demand pool is per-flight-equivalent;
    -- a month is FLIGHTS_PER_TICK round-trips' worth of passengers.
    v_lane_share := (CASE WHEN v_total_weight > 0
                         THEN v_demand_pool * (v_my_weight / v_total_weight)
                         ELSE 0
                    END) * v_flights_per_tick;

    -- Aggregate non-overhauling assigned aircraft. Aircraft in MRO
    -- contribute zero seats, zero ops, zero risk this tick.
    SELECT COALESCE(SUM(airline_aircraft_seats(aircraft_class)), 0),
           COUNT(*)::INT,
           COALESCE(SUM(airline_aircraft_ops_cost(aircraft_class)), 0)
      INTO v_my_seats, v_aircraft_count, v_ops_cost
      FROM corp_aircraft
     WHERE route_id = p_route_id
       AND COALESCE(is_overhauling, FALSE) = FALSE;

    -- Total assigned (incl. overhauling) — drives the legacy fallback
    -- decision. If zero rows exist for this route at all, the route
    -- predates corp_aircraft.route_id and we read from the denorm cols.
    SELECT COUNT(*)::INT INTO v_assigned_count
      FROM corp_aircraft
     WHERE route_id = p_route_id;

    IF v_assigned_count = 0 THEN
        v_my_seats := COALESCE(v_route.aircraft_regional, 0)   * 10
                    + COALESCE(v_route.aircraft_narrowbody, 0) * 25
                    + COALESCE(v_route.aircraft_widebody, 0)   * 60;
        v_aircraft_count := COALESCE(v_route.aircraft_regional, 0)
                          + COALESCE(v_route.aircraft_narrowbody, 0)
                          + COALESCE(v_route.aircraft_widebody, 0);
        v_ops_cost := COALESCE(v_route.aircraft_regional, 0)   * 500
                    + COALESCE(v_route.aircraft_narrowbody, 0) * 1200
                    + COALESCE(v_route.aircraft_widebody, 0)   * 2500;
    END IF;

    -- Per-plane seat counts are one flight's capacity; a tick is
    -- v_flights_per_tick round-trips. Applied after both the assigned
    -- and legacy-fallback paths so it covers either.
    v_my_seats := v_my_seats * v_flights_per_tick;

    SELECT COALESCE(SUM(
        COALESCE(aircraft_regional, 0)   * 10
      + COALESCE(aircraft_narrowbody, 0) * 25
      + COALESCE(aircraft_widebody, 0)   * 60
    ), 0)
      INTO v_competitor_seats
      FROM airline_routes
     WHERE status = 'active'
       AND id <> p_route_id
       AND origin_city_id = v_route.origin_city_id
       AND dest_city_id   = v_route.dest_city_id;

    -- Competitors fly the same schedule; scale identically so unmet
    -- demand stays consistent with the ×-scaled lane share.
    v_competitor_seats := v_competitor_seats * v_flights_per_tick;

    v_price_mult := GREATEST(0, 2 * (1 - v_route.ticket_price / 500.0));
    v_unmet      := GREATEST(0, v_lane_share - v_competitor_seats);
    v_my_demand  := v_unmet * v_price_mult;
    v_pax        := LEAST(GREATEST(0, FLOOR(v_my_demand))::INT, v_my_seats);
    v_revenue    := v_pax * COALESCE(v_route.ticket_price, 0);

    v_is_anniversary := (p_tick - COALESCE(v_route.opened_at_tick, p_tick)) > 0
                    AND ((p_tick - COALESCE(v_route.opened_at_tick, p_tick)) % 12) = 0;
    IF v_is_anniversary THEN
        v_maint_charge := v_aircraft_count * airline_maint_annual(v_route.maintenance_tier);
    END IF;

    v_pair_label := COALESCE(v_origin.name, '?') || ' ↔ ' || COALESCE(v_dest.name, '?');

    IF v_revenue > 0 THEN
        PERFORM emit_corp_cash_event(
            v_route.airline_faction_id, 'revenue_airline',
            v_pair_label || ' · ticket revenue', v_revenue, p_tick);
    END IF;
    IF v_ops_cost > 0 THEN
        PERFORM emit_corp_cash_event(
            v_route.airline_faction_id, 'fixed_overhead',
            v_pair_label || ' · aircraft ops', -v_ops_cost, p_tick);
    END IF;
    IF v_maint_charge > 0 THEN
        PERFORM emit_corp_cash_event(
            v_route.airline_faction_id, 'maintenance',
            v_pair_label || ' · ' || v_route.maintenance_tier || ' maintenance (annual)',
            -v_maint_charge, p_tick);
    END IF;

    -- ── Per-aircraft, condition-weighted incident risk ───────────
    -- Each non-overhauling plane contributes
    --   0.008 × tier_mult × condition_risk_mult(its condition)
    -- A 3-plane fleet at 100% behaves identically to the old aggregate
    -- formula (3 × 0.008 × tier_mult). A worn plane shifts the curve
    -- without dragging fleet-mates along with it — but since the sum
    -- still drives a single roll, fleet-wide neglect compounds.
    v_op_safety := COALESCE(v_corp.corp_op_safety, 0);
    v_tier_mult := airline_maint_risk_mult(v_route.maintenance_tier);

    SELECT COALESCE(SUM(
        0.008 * v_tier_mult * airline_condition_risk_mult(condition)
    ), 0)
      INTO v_per_aircraft_risk
      FROM corp_aircraft
     WHERE route_id = p_route_id
       AND COALESCE(is_overhauling, FALSE) = FALSE;

    -- Legacy fallback (no rows in corp_aircraft for this route): keep
    -- old flat formula at full-condition equivalence.
    IF v_assigned_count = 0 AND v_aircraft_count > 0 THEN
        v_per_aircraft_risk := v_aircraft_count * 0.008 * v_tier_mult;
    END IF;

    v_base_risk := CASE WHEN v_per_aircraft_risk > 0
                        THEN v_per_aircraft_risk
                             / GREATEST(0.1, v_op_safety / 10.0)
                        ELSE 0
                   END;
    v_minor_risk := v_base_risk * 1.0;
    v_mod_risk   := v_base_risk * 0.3;
    v_major_risk := v_base_risk * 0.05;

    IF v_base_risk > 0 THEN
        IF random() < v_minor_risk THEN
            v_incident_log := v_incident_log || _fire_aviation_incident(
                v_route.airline_faction_id, p_route_id, 'minor', v_op_safety, p_tick);
            SELECT corp_op_safety INTO v_op_safety FROM factions WHERE id = v_route.airline_faction_id;
        END IF;
        IF random() < v_mod_risk THEN
            v_incident_log := v_incident_log || _fire_aviation_incident(
                v_route.airline_faction_id, p_route_id, 'moderate', v_op_safety, p_tick);
            SELECT corp_op_safety INTO v_op_safety FROM factions WHERE id = v_route.airline_faction_id;
        END IF;
        IF random() < v_major_risk THEN
            v_incident_log := v_incident_log || _fire_aviation_incident(
                v_route.airline_faction_id, p_route_id, 'major', v_op_safety, p_tick);
        END IF;
    END IF;

    -- ── Condition decay: applied AFTER risk roll so this tick's
    -- incident odds reflect the condition the plane started with.
    -- Decay represents wear FROM this tick.
    UPDATE corp_aircraft
       SET condition = GREATEST(0, condition - airline_condition_decay(v_route.maintenance_tier))
     WHERE route_id = p_route_id
       AND COALESCE(is_overhauling, FALSE) = FALSE;

    -- Aircraft that overhauled this tick return to service next tick.
    UPDATE corp_aircraft
       SET is_overhauling = FALSE
     WHERE route_id = p_route_id
       AND is_overhauling = TRUE;

    UPDATE airline_routes
       SET lifetime_pax        = lifetime_pax     + v_pax,
           lifetime_revenue    = lifetime_revenue + v_revenue,
           lifetime_spend      = lifetime_spend   + v_ops_cost + v_maint_charge,
           last_tick_pax       = v_pax,
           last_tick_revenue   = v_revenue,
           last_tick_spend     = v_ops_cost + v_maint_charge,
           last_processed_tick = p_tick
     WHERE id = p_route_id;

    RETURN jsonb_build_object(
        'route_id',        p_route_id,
        'tick',            p_tick,
        'pax',             v_pax,
        'revenue',         v_revenue,
        'ops_cost',        v_ops_cost,
        'maint_charge',    v_maint_charge,
        'is_anniversary',  v_is_anniversary,
        'incidents',       v_incident_log,
        'incident_count',  jsonb_array_length(v_incident_log)
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION process_airline_route_tick(UUID, INTEGER) FROM PUBLIC;

COMMIT;

NOTIFY pgrst, 'reload schema';
