-- 20260721_phase6_airline_tick_resolution.sql
--
-- Phase 6 — server-side per-tick resolution for airline routes.
--
-- Each corp tick (advance-corp-tick), every active route:
--   1. computes pax via the same demand → lane-share → competition →
--      elasticity → capacity-cap pipeline the modal projection uses
--   2. emits revenue (revenue_airline) + ops (fixed_overhead) + maint
--      (maintenance, only on every-12-tick anniversary) cash events
--      via the SSoT helper
--   3. rolls an aviation incident with the maintenance-tier modifier
--      (basic ×1.5, standard ×1.0, premium ×0.5). On hit, writes a
--      stub event_log row — Phase 7 will attach consequences
--      (op_safety drop, lawsuits, etc.). For now: no state change.
--   4. updates the route's lifetime_pax / revenue / spend +
--      last_tick_* aggregates so the route card shows real data
--
-- Cost model preserved from the Phase 5 rebalance:
--   • aircraft ops are per-tick, per aircraft (regional 500, narrow
--     1200, wide 2500) — charged every tick
--   • maintenance is per-aircraft per-year ($12k/$30k/$48k), charged
--     as a single lump on every-12-tick route anniversary
--
-- Constants are mirrored from js/AIRCRAFT_OPS_COST + MAINT_TIER_ANNUAL.
-- The KNOWN-DUPLICATION comment in airline-operations.html still
-- applies — JS and SQL must move together.

BEGIN;

-- ── 1. corp_cash_events: add revenue_airline category ──
ALTER TABLE public.corp_cash_events
    DROP CONSTRAINT IF EXISTS corp_cash_events_category_chk;
ALTER TABLE public.corp_cash_events
    ADD CONSTRAINT corp_cash_events_category_chk CHECK (category IN (
        'revenue_market',
        'revenue_shipping',
        'revenue_trade',
        'revenue_finance',
        'revenue_airline',
        'wages',
        'exec_salary',
        'fixed_overhead',
        'maintenance',
        'tax',
        'debt_interest',
        'event_cost',
        'debt_principal',
        'capital_in',
        'capital_out'
    ));


-- ── 2. airline_routes: per-route stat aggregates ──
ALTER TABLE public.airline_routes
    ADD COLUMN IF NOT EXISTS lifetime_pax        BIGINT  NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS lifetime_revenue    BIGINT  NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS lifetime_spend      BIGINT  NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_tick_pax       INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_tick_revenue   INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_tick_spend     INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_processed_tick INTEGER;


-- ── 3. Helpers ──

-- Per-aircraft per-tick ops cost. Mirror of AIRCRAFT_OPS_COST.
CREATE OR REPLACE FUNCTION airline_aircraft_ops_cost(p_class TEXT)
RETURNS INTEGER
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_class
        WHEN 'regional'   THEN 500
        WHEN 'narrowbody' THEN 1200
        WHEN 'widebody'   THEN 2500
        ELSE 0
    END;
$$;

-- Per-aircraft per-year maintenance cost. Mirror of MAINT_TIER_ANNUAL.
CREATE OR REPLACE FUNCTION airline_maint_annual(p_tier TEXT)
RETURNS INTEGER
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_tier
        WHEN 'basic'    THEN 12000
        WHEN 'standard' THEN 30000
        WHEN 'premium'  THEN 48000
        ELSE 30000
    END;
$$;

-- Aircraft seats by class. Mirror of AIRCRAFT_SEATS.
CREATE OR REPLACE FUNCTION airline_aircraft_seats(p_class TEXT)
RETURNS INTEGER
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_class
        WHEN 'regional'   THEN 10
        WHEN 'narrowbody' THEN 25
        WHEN 'widebody'   THEN 60
        ELSE 0
    END;
$$;

-- Maintenance-tier multiplier on incident risk. Phase 6 design
-- (per Q2 confirmation): tier modifies the per-tick incident roll
-- rather than tugging op_safety up/down every tick.
CREATE OR REPLACE FUNCTION airline_maint_risk_mult(p_tier TEXT)
RETURNS NUMERIC
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_tier
        WHEN 'basic'    THEN 1.5
        WHEN 'standard' THEN 1.0
        WHEN 'premium'  THEN 0.5
        ELSE 1.0
    END;
$$;


-- ── 4. process_airline_route_tick ──
-- One-route resolver. Idempotent on (route, tick) via last_processed_tick:
-- a re-run for the same tick short-circuits and returns 'already processed'.
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
    v_maint_charge INTEGER := 0;
    v_is_anniversary BOOLEAN := false;
    v_corp         factions%ROWTYPE;
    v_op_safety    NUMERIC;
    v_risk         NUMERIC;
    v_incident     BOOLEAN := false;
    v_pair_label   TEXT;
    v_event_id     UUID;
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

    SELECT * INTO v_origin FROM airline_cities WHERE id = v_route.origin_city_id;
    SELECT * INTO v_dest   FROM airline_cities WHERE id = v_route.dest_city_id;
    SELECT * INTO v_nation FROM nations        WHERE id = v_origin.nation_id;
    SELECT * INTO v_corp   FROM factions       WHERE id = v_route.airline_faction_id;

    -- ── Lane share ──
    -- Demand pool: (SoL/100) × (SS/100) × (pop / 1M) × 20
    v_pop_m       := COALESCE(v_nation.population, 0) / 1000000.0;
    v_demand_pool := (COALESCE(v_nation.standard_of_living, 0) / 100.0)
                   * (COALESCE(v_nation.service_sector, 0)     / 100.0)
                   * v_pop_m
                   * 20.0;

    -- Total weight across every city pair in this nation. Same formula
    -- as _laneWeight: (popPct_a + popPct_b) × (capital_pair ? 2 : 1).
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

    -- My weight (this specific lane).
    v_my_weight := (v_origin.population_pct + v_dest.population_pct)
                 * CASE WHEN v_origin.is_capital OR v_dest.is_capital THEN 2 ELSE 1 END;

    v_lane_share := CASE WHEN v_total_weight > 0
                         THEN v_demand_pool * (v_my_weight / v_total_weight)
                         ELSE 0
                    END;

    -- ── Capacity ──
    -- My seats from corp_aircraft.route_id. Falls back to the route row's
    -- aircraft_* counts × seats-per-class if no aircraft are assigned via
    -- route_id (defensive — set_up_route always wires both).
    SELECT COALESCE(SUM(airline_aircraft_seats(aircraft_class)), 0),
           COUNT(*)::INT,
           COALESCE(SUM(airline_aircraft_ops_cost(aircraft_class)), 0)
      INTO v_my_seats, v_aircraft_count, v_ops_cost
      FROM corp_aircraft
     WHERE route_id = p_route_id;

    IF v_aircraft_count = 0 THEN
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

    -- Competitor seats: every OTHER active route on this lane.
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

    -- ── Pax + revenue ──
    v_price_mult := GREATEST(0, 2 * (1 - v_route.ticket_price / 500.0));
    v_unmet      := GREATEST(0, v_lane_share - v_competitor_seats);
    v_my_demand  := v_unmet * v_price_mult;
    v_pax        := LEAST(GREATEST(0, FLOOR(v_my_demand))::INT, v_my_seats);
    v_revenue    := v_pax * COALESCE(v_route.ticket_price, 0);

    -- ── Maintenance: lump on every-12-tick anniversary ──
    v_is_anniversary := (p_tick - COALESCE(v_route.opened_at_tick, p_tick)) > 0
                    AND ((p_tick - COALESCE(v_route.opened_at_tick, p_tick)) % 12) = 0;
    IF v_is_anniversary THEN
        v_maint_charge := v_aircraft_count * airline_maint_annual(v_route.maintenance_tier);
    END IF;

    v_pair_label := COALESCE(v_origin.name, '?') || ' ↔ ' || COALESCE(v_dest.name, '?');

    -- ── Cash events (revenue → ops → maint) ──
    IF v_revenue > 0 THEN
        PERFORM emit_corp_cash_event(
            v_route.airline_faction_id,
            'revenue_airline',
            v_pair_label || ' · ticket revenue',
            v_revenue,
            p_tick
        );
    END IF;
    IF v_ops_cost > 0 THEN
        PERFORM emit_corp_cash_event(
            v_route.airline_faction_id,
            'fixed_overhead',
            v_pair_label || ' · aircraft ops',
            -v_ops_cost,
            p_tick
        );
    END IF;
    IF v_maint_charge > 0 THEN
        PERFORM emit_corp_cash_event(
            v_route.airline_faction_id,
            'maintenance',
            v_pair_label || ' · ' || v_route.maintenance_tier || ' maintenance (annual)',
            -v_maint_charge,
            p_tick
        );
    END IF;

    -- ── Incident roll ──
    -- Risk per tick: (aircraft × 0.008 × tier_mult) ÷ max(0.1, op_safety/10).
    v_op_safety := COALESCE(v_corp.corp_op_safety, 0);
    v_risk := CASE WHEN v_aircraft_count > 0
                   THEN (v_aircraft_count * 0.008 * airline_maint_risk_mult(v_route.maintenance_tier))
                        / GREATEST(0.1, v_op_safety / 10.0)
                   ELSE 0
              END;
    IF v_risk > 0 AND random() < v_risk THEN
        v_incident := true;
        INSERT INTO event_log (
            nation_id, faction_id,
            event_name, description_used,
            category, trigger_key,
            effects_applied, fired_at_tick
        ) VALUES (
            v_nation.id,
            v_route.airline_faction_id,
            'Aviation Incident — ' || v_pair_label,
            'An aviation incident occurred on the ' || v_pair_label
                || ' route operated by ' || COALESCE(v_corp.faction_name, 'an airline')
                || '. Investigators have arrived on scene; consequences are pending review.',
            'business',
            'aviation_incident',
            jsonb_build_object(
                'route_id',           p_route_id,
                'corp_id',            v_route.airline_faction_id,
                'pair',               v_pair_label,
                'maintenance_tier',   v_route.maintenance_tier,
                'aircraft_count',     v_aircraft_count,
                'risk_pct',           round((v_risk * 100)::NUMERIC, 4),
                'phase',              'phase6_stub'
            ),
            p_tick
        ) RETURNING id INTO v_event_id;
    END IF;

    -- ── Aggregates ──
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
        'route_id',         p_route_id,
        'tick',             p_tick,
        'pax',              v_pax,
        'revenue',          v_revenue,
        'ops_cost',         v_ops_cost,
        'maint_charge',     v_maint_charge,
        'is_anniversary',   v_is_anniversary,
        'risk_pct',         round((v_risk * 100)::NUMERIC, 4),
        'incident',         v_incident,
        'incident_event_id', v_event_id
    );
END;
$$;

-- service_role only — invoked from advance-corp-tick. No grant to authenticated.
REVOKE EXECUTE ON FUNCTION process_airline_route_tick(UUID, INTEGER) FROM PUBLIC;


-- ── 5. process_airline_corp_tick ──
-- Wrapper: process every active route owned by p_corp_id at tick p_tick.
-- Returns aggregate {pax, revenue, spend, incidents, routes} for the
-- summary log.
CREATE OR REPLACE FUNCTION process_airline_corp_tick(p_corp_id UUID, p_tick INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_route        RECORD;
    v_route_result JSONB;
    v_total_pax    BIGINT  := 0;
    v_total_rev    BIGINT  := 0;
    v_total_spend  BIGINT  := 0;
    v_incidents    INTEGER := 0;
    v_routes       INTEGER := 0;
BEGIN
    FOR v_route IN
        SELECT id FROM airline_routes
         WHERE airline_faction_id = p_corp_id
           AND status = 'active'
           AND (last_processed_tick IS NULL OR last_processed_tick < p_tick)
         ORDER BY opened_at_tick
    LOOP
        v_route_result := process_airline_route_tick(v_route.id, p_tick);
        IF NOT COALESCE((v_route_result->>'skipped')::BOOLEAN, false) THEN
            v_routes      := v_routes      + 1;
            v_total_pax   := v_total_pax   + COALESCE((v_route_result->>'pax')::BIGINT, 0);
            v_total_rev   := v_total_rev   + COALESCE((v_route_result->>'revenue')::BIGINT, 0);
            v_total_spend := v_total_spend
                           + COALESCE((v_route_result->>'ops_cost')::BIGINT, 0)
                           + COALESCE((v_route_result->>'maint_charge')::BIGINT, 0);
            IF COALESCE((v_route_result->>'incident')::BOOLEAN, false) THEN
                v_incidents := v_incidents + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'corp_id',   p_corp_id,
        'tick',      p_tick,
        'routes',    v_routes,
        'pax',       v_total_pax,
        'revenue',   v_total_rev,
        'spend',     v_total_spend,
        'incidents', v_incidents
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION process_airline_corp_tick(UUID, INTEGER) FROM PUBLIC;


COMMIT;

NOTIFY pgrst, 'reload schema';
