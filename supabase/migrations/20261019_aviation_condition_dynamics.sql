-- ════════════════════════════════════════════════════════════════
-- Aviation: condition decay, condition→risk wiring, overhaul RPC.
--
-- Before this migration condition was a cosmetic number on
-- corp_aircraft — it never decayed and didn't influence anything.
-- Maintenance tier mattered only for incident risk, not for fleet
-- wear, so basic vs premium tier was a flat probabilistic shift the
-- player couldn't engage with beyond the initial route-setup choice.
--
-- New loop:
--   1. Each tick, every assigned (non-overhauling) aircraft on a
--      route loses condition by airline_condition_decay(tier):
--          basic = 6 / standard = 4 / premium = 2.5 per tick.
--   2. Lower condition raises that aircraft's incident odds via a
--      flat-then-accelerating curve (airline_condition_risk_mult):
--          100% → 1.0×, 90% → 1.09×, 70% → 1.81×,
--          50% → 3.25×, 30% → 5.41×, 0% → 10×.
--      Per-aircraft risk replaces the old aggregate
--      (count × 0.008 × tier_mult); each plane contributes its own.
--   3. The player calls overhaul_aircraft(p_aircraft_id) to send
--      one plane to MRO. Cost is class-scaled
--          regional = $40k / narrowbody = $120k / widebody = $300k
--      and the plane sits out exactly the next tick. Condition
--      resets to (100 - overhaul_count)%, so the cap shrinks 1pp
--      per cycle and the aircraft is a finite-life asset.
--
-- The overhaul_count cap PERSISTS for the life of the aircraft —
-- selling/retiring removes the row entirely. There's no reset.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS for the two new columns;
-- CREATE OR REPLACE on every function.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: track overhaul state per aircraft ────────────────
ALTER TABLE public.corp_aircraft
    ADD COLUMN IF NOT EXISTS overhaul_count INT     NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_overhauling BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.corp_aircraft.overhaul_count IS
    'Number of overhauls this aircraft has undergone. Each overhaul lowers the achievable maximum condition by 1pp (cycle N caps at 100-N %). Persists for the life of the aircraft; never reset.';
COMMENT ON COLUMN public.corp_aircraft.is_overhauling IS
    'TRUE if the aircraft is currently in MRO. process_airline_route_tick skips it from seat/ops/risk aggregation for one tick, then clears the flag at end-of-tick so the plane returns to service.';


-- ── 2. Helpers ──────────────────────────────────────────────────

-- Per-tick condition decay by maintenance tier.
-- basic 6 / standard 4 / premium 2.5 — a basic-tier plane runs
-- ~1.5 game-years between full-service overhauls; premium ~3.5.
CREATE OR REPLACE FUNCTION airline_condition_decay(p_tier TEXT)
RETURNS NUMERIC
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_tier
        WHEN 'basic'    THEN 6.0
        WHEN 'standard' THEN 4.0
        WHEN 'premium'  THEN 2.5
        ELSE 4.0
    END;
$$;

-- Condition → incident-risk multiplier.
-- Quadratic curve: flat at the top, accelerates as condition drops.
-- 100% → 1.0×, 90% → 1.09×, 70% → 1.81×, 50% → 3.25×,
-- 30% → 5.41×, 0% → 10×. Clamped to ≥1 so >100% inputs (shouldn't
-- happen, but defensive) don't flip the multiplier negative.
CREATE OR REPLACE FUNCTION airline_condition_risk_mult(p_condition NUMERIC)
RETURNS NUMERIC
LANGUAGE sql IMMUTABLE
AS $$
    SELECT GREATEST(1.0,
        1.0 + POWER((100.0 - LEAST(100.0, COALESCE(p_condition, 100.0))) / 100.0, 2) * 9.0
    );
$$;


-- ── 3. process_airline_route_tick ───────────────────────────────
-- Replaces the Phase 7 body with three changes:
--   (a) seat/ops/aircraft_count exclude is_overhauling=TRUE planes;
--   (b) incident risk is now a per-aircraft sum weighted by each
--       plane's condition, not a flat count × tier_mult aggregate;
--   (c) at end of tick, decay condition on flying aircraft and
--       clear is_overhauling on the rest so they re-enter service.
-- Legacy fallback (route denorm columns) preserved for routes that
-- predate corp_aircraft.route_id wiring — those use a flat 1.0×
-- condition multiplier since there are no aircraft rows to inspect.
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

    v_lane_share := CASE WHEN v_total_weight > 0
                         THEN v_demand_pool * (v_my_weight / v_total_weight)
                         ELSE 0
                    END;

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


-- ── 4. overhaul_aircraft RPC ────────────────────────────────────
-- Player-facing. Charges class-scaled cash, marks the aircraft as
-- in-overhaul (skipped from next tick's aggregation), and resets
-- condition to (100 - new_overhaul_count)%. Cap shrinks 1pp per
-- cycle and never resets — eventually the plane is uneconomic and
-- the player retires it.
CREATE OR REPLACE FUNCTION overhaul_aircraft(p_aircraft_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user      UUID := auth.uid();
    v_ac        corp_aircraft%ROWTYPE;
    v_corp      factions%ROWTYPE;
    v_cost      INT;
    v_new_count INT;
    v_new_cond  NUMERIC;
    v_tick      INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_ac FROM corp_aircraft WHERE id = p_aircraft_id FOR UPDATE;
    IF v_ac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Aircraft not found');
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = v_ac.corp_id;
    IF v_corp.id <> v_user
       AND COALESCE(v_corp.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this aircraft');
    END IF;

    IF COALESCE(v_ac.is_overhauling, FALSE) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Aircraft is already in overhaul');
    END IF;

    IF v_ac.condition >= 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Aircraft is already at full condition');
    END IF;

    v_cost := CASE v_ac.aircraft_class
        WHEN 'regional'   THEN 40000
        WHEN 'narrowbody' THEN 120000
        WHEN 'widebody'   THEN 300000
        ELSE 0
    END;

    IF COALESCE(v_corp.corp_cash_reserves, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Insufficient cash. Overhaul cost: $' || v_cost::TEXT);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    v_new_count := COALESCE(v_ac.overhaul_count, 0) + 1;
    v_new_cond  := GREATEST(0, 100 - v_new_count);

    UPDATE corp_aircraft
       SET is_overhauling = TRUE,
           overhaul_count = v_new_count,
           condition      = v_new_cond
     WHERE id = p_aircraft_id;

    PERFORM emit_corp_cash_event(
        v_corp.id,
        'maintenance',
        'Aircraft overhaul · ' || v_ac.aircraft_class
            || COALESCE(' (' || v_ac.tail_number || ')', '')
            || ' · cycle #' || v_new_count::TEXT,
        -v_cost::NUMERIC,
        v_tick,
        NULL
    );

    RETURN jsonb_build_object(
        'success',        true,
        'aircraft_id',    p_aircraft_id,
        'overhaul_count', v_new_count,
        'condition',      v_new_cond,
        'cost',           v_cost
    );
END;
$$;

GRANT EXECUTE ON FUNCTION overhaul_aircraft(UUID) TO authenticated;

COMMENT ON FUNCTION overhaul_aircraft(UUID) IS
    'Player-facing aircraft overhaul. Validates ownership, charges class-scaled cash ($40k/$120k/$300k regional/narrowbody/widebody), increments overhaul_count, sets condition = 100 - count, and marks is_overhauling=TRUE so process_airline_route_tick skips it next tick. Cap persists per aircraft for life.';


-- ── 5. close_airline_route: clear is_overhauling on release ────
-- Edge case: player overhauls an aircraft, then closes its route
-- before the next tick processes. The per-route flag-clear inside
-- process_airline_route_tick keys off route_id and would orphan
-- the flag on the now-detached aircraft, leaving it permanently
-- "in overhaul" with no tick ever firing to release it. Adding
-- is_overhauling = FALSE to the release UPDATE keeps closure
-- behaving like "release fleet to idle pool" — the player has
-- already paid the overhaul cost and lost the tick they'd have
-- flown, so the right outcome is a fully-released aircraft.
CREATE OR REPLACE FUNCTION close_airline_route(p_route_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user  UUID := auth.uid();
    v_route airline_routes%ROWTYPE;
    v_corp  factions%ROWTYPE;
    v_tick  INTEGER;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_route FROM airline_routes
     WHERE id = p_route_id
     FOR UPDATE;
    IF v_route.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Route not found');
    END IF;
    IF v_route.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Route is not active');
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = v_route.airline_faction_id;
    IF v_corp.id <> v_user
       AND COALESCE(v_corp.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this airline');
    END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE airline_routes
       SET status         = 'closed',
           closed_at_tick = v_tick
     WHERE id = p_route_id;

    UPDATE corp_aircraft
       SET route_id       = NULL,
           is_overhauling = FALSE
     WHERE route_id = p_route_id;

    RETURN jsonb_build_object('success', true, 'route_id', p_route_id);
END;
$$;

GRANT EXECUTE ON FUNCTION close_airline_route(UUID) TO authenticated;


NOTIFY pgrst, 'reload schema';

COMMIT;
