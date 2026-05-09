-- ════════════════════════════════════════════════════════════════
-- Aircraft design specs — single source of truth
--
-- The Tier-1 catalog of airframes, mechanicals, and offerings used
-- to live in two places: CASE ladders inside
-- start_aircraft_design_research, AND constants AIRFRAMES /
-- MECHANICALS / OFFERINGS in aviation-operations.html. The client
-- read from the constants for its live preview (stats / cost /
-- ticks); the server read from its CASE for the persisted row.
-- If they drifted, the modal preview lied to the player.
--
-- Same shape as 20261102 / 20261103: IMMUTABLE SQL functions are
-- the SOURCE; the design RPC reads them directly; the client
-- fetches a combined snapshot once per session and walks locally.
--
--   • aircraft_airframe_specs()   — JSONB keyed by airframe class
--   • aircraft_mechanical_specs() — JSONB keyed by module id
--   • aircraft_offering_specs()   — JSONB keyed by module id
--   • aircraft_design_specs()     — combined snapshot for client
--                                   modal (one round-trip on open)
--
-- The id field is no longer carried inside each spec — it's the
-- key. start_aircraft_design_research re-injects it when building
-- the resolved-modules audit array on the design row, so the
-- corp_aircraft_designs.modules JSONB shape is unchanged.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── Source functions ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.aircraft_airframe_specs()
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT '{
        "business":   {"name":"Business Jet","weight":2, "pax":3, "eng_min":1,"eng_max":2,"range":5, "cost":18000000,"time":6},
        "regional":   {"name":"Regional",    "weight":3, "pax":10,"eng_min":2,"eng_max":2,"range":3, "cost":35000000,"time":8},
        "narrowbody": {"name":"Narrowbody",  "weight":6, "pax":25,"eng_min":2,"eng_max":2,"range":7, "cost":60000000,"time":10},
        "widebody":   {"name":"Widebody",    "weight":10,"pax":60,"eng_min":2,"eng_max":4,"range":10,"cost":75000000,"time":12}
    }'::JSONB
$$;

CREATE OR REPLACE FUNCTION public.aircraft_mechanical_specs()
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT '{
        "hydraulics":         {"name":"Standard Hydraulic Systems","weight":0.5,"safety":1,"cost":1000000},
        "blackbox":           {"name":"Black Box & Flight Recorders","weight":0.3,"safety":2,"cost":1500000},
        "redundant-avionics": {"name":"Redundant Avionics Suite","weight":0.7,"safety":3,"cost":3000000}
    }'::JSONB
$$;

CREATE OR REPLACE FUNCTION public.aircraft_offering_specs()
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT '{
        "ife":              {"name":"In-Flight Entertainment","weight":0.3,"demand":1, "pax":0,"cost":1500000},
        "premium-seating":  {"name":"Premium Seating","weight":0.4,"demand":2, "pax":0,"cost":2000000},
        "high-density":     {"name":"High-Density Configuration","weight":0.2,"demand":-1,"pax":5,"cost":1000000}
    }'::JSONB
$$;

CREATE OR REPLACE FUNCTION public.aircraft_design_specs()
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'airframes',   public.aircraft_airframe_specs(),
        'mechanicals', public.aircraft_mechanical_specs(),
        'offerings',   public.aircraft_offering_specs()
    )
$$;

GRANT EXECUTE ON FUNCTION public.aircraft_airframe_specs()   TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.aircraft_mechanical_specs() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.aircraft_offering_specs()   TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.aircraft_design_specs()     TO authenticated, anon;

COMMENT ON FUNCTION public.aircraft_airframe_specs() IS
    'Single source of truth for Tier-1 airframe specs. Returns a JSONB object keyed by airframe class (business/regional/narrowbody/widebody). start_aircraft_design_research reads this directly; the aviation-operations client reads via aircraft_design_specs().';
COMMENT ON FUNCTION public.aircraft_mechanical_specs() IS
    'Single source of truth for Tier-1 mechanical module specs. Keyed by module id. id is the key (not stored inside each spec); start_aircraft_design_research re-injects it when building the audit modules array on the design row.';
COMMENT ON FUNCTION public.aircraft_offering_specs() IS
    'Single source of truth for Tier-1 offering module specs. Keyed by module id. id is the key (not stored inside each spec).';
COMMENT ON FUNCTION public.aircraft_design_specs() IS
    'Combined snapshot of all three Tier-1 spec catalogs: {airframes, mechanicals, offerings}. Client convenience to fetch in one round-trip when opening the design modal.';


-- ── Replace start_aircraft_design_research ─────────────────────
-- Body identical to 20261028 except the airframe / mechanical /
-- offering lookups now read from the source functions.
CREATE OR REPLACE FUNCTION start_aircraft_design_research(
    p_corp_id          UUID,
    p_name             TEXT,
    p_airframe         TEXT,
    p_engine_design_id UUID,
    p_engine_count     INT,
    p_mechanicals      TEXT[],
    p_offerings        TEXT[]
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_corp factions%ROWTYPE;
    v_engine corp_aircraft_designs%ROWTYPE;
    v_clean_name TEXT;
    v_has_facility BOOLEAN;
    v_airframe JSONB;
    v_mech_count INT := 0;
    v_off_count  INT := 0;
    v_mech_weight NUMERIC := 0;
    v_off_weight  NUMERIC := 0;
    v_mech_safety INT := 0;
    v_off_demand  INT := 0;
    v_off_pax     INT := 0;
    v_mech_cost BIGINT := 0;
    v_off_cost  BIGINT := 0;
    v_mech_resolved JSONB := '[]'::JSONB;
    v_off_resolved  JSONB := '[]'::JSONB;
    v_mech_id TEXT;
    v_off_id  TEXT;
    v_mech_spec JSONB;
    v_off_spec  JSONB;
    v_engine_total_weight NUMERIC;
    v_total_thrust NUMERIC;
    v_total_weight NUMERIC;
    v_ratio NUMERIC;
    v_range NUMERIC;
    v_passengers INT;
    v_base_demand INT := 5;
    v_demand_score INT;
    v_base_safety INT := 5;
    v_engine_safety_mod INT;
    v_safety_score INT;
    v_engine_cost BIGINT;
    v_total_cost BIGINT;
    v_engine_time INT;
    v_module_time INT;
    v_design_ticks INT;
    v_quality NUMERIC;
    v_tick INT;
    v_design_id UUID;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Corporation not found');
    END IF;
    IF v_corp.id <> v_user
       AND COALESCE(v_corp.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    IF v_corp.faction_type <> 'corporation'
       OR v_corp.corp_sector IS DISTINCT FROM 'Aviation Manufacturing' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only Aviation Manufacturing corporations can design aircraft');
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM corp_properties
         WHERE faction_id = p_corp_id
           AND type IN ('light_assembly_plant', 'aircraft_assembly_facility', 'heavy_manufacturing_plant')
           AND is_active = TRUE
    ) INTO v_has_facility;
    IF NOT v_has_facility THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Requires a Light Assembly Plant, Aircraft Assembly Facility, or Heavy Manufacturing Plant. Build one from the Expansion tab first.');
    END IF;

    v_clean_name := NULLIF(TRIM(SUBSTRING(COALESCE(p_name, ''), 1, 60)), '');
    IF v_clean_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Aircraft name required');
    END IF;

    -- Airframe lookup from the single source.
    v_airframe := aircraft_airframe_specs() -> p_airframe;
    IF v_airframe IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid airframe class');
    END IF;

    SELECT * INTO v_engine FROM corp_aircraft_designs
     WHERE id = p_engine_design_id
       AND design_type = 'engine'
       AND status = 'available'
       AND is_active = TRUE;
    IF v_engine.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Selected engine is not available for use');
    END IF;

    IF p_engine_count IS NULL
       OR p_engine_count < (v_airframe->>'eng_min')::INT
       OR p_engine_count > (v_airframe->>'eng_max')::INT THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Engine count %s invalid for %s (allowed: %s–%s)',
                COALESCE(p_engine_count::TEXT, 'NULL'),
                v_airframe->>'name',
                v_airframe->>'eng_min',
                v_airframe->>'eng_max'));
    END IF;

    -- Mechanicals (multi-select) — lookup from single source.
    IF p_mechanicals IS NOT NULL THEN
        FOREACH v_mech_id IN ARRAY p_mechanicals LOOP
            v_mech_spec := aircraft_mechanical_specs() -> v_mech_id;
            IF v_mech_spec IS NULL THEN
                RETURN jsonb_build_object('success', false, 'error', 'Unknown mechanical module: ' || v_mech_id);
            END IF;
            v_mech_count := v_mech_count + 1;
            v_mech_weight := v_mech_weight + (v_mech_spec->>'weight')::NUMERIC;
            v_mech_safety := v_mech_safety + (v_mech_spec->>'safety')::INT;
            v_mech_cost := v_mech_cost + (v_mech_spec->>'cost')::BIGINT;
            -- Re-inject the id so the audit array preserves which
            -- module was selected (the source JSONB doesn't carry id
            -- inside each spec — the key is the id).
            v_mech_resolved := v_mech_resolved || jsonb_build_array(
                v_mech_spec || jsonb_build_object('id', v_mech_id)
            );
        END LOOP;
    END IF;

    -- Offerings (multi-select) — lookup from single source.
    IF p_offerings IS NOT NULL THEN
        FOREACH v_off_id IN ARRAY p_offerings LOOP
            v_off_spec := aircraft_offering_specs() -> v_off_id;
            IF v_off_spec IS NULL THEN
                RETURN jsonb_build_object('success', false, 'error', 'Unknown offering module: ' || v_off_id);
            END IF;
            v_off_count := v_off_count + 1;
            v_off_weight := v_off_weight + (v_off_spec->>'weight')::NUMERIC;
            v_off_demand := v_off_demand + (v_off_spec->>'demand')::INT;
            v_off_pax    := v_off_pax    + (v_off_spec->>'pax')::INT;
            v_off_cost   := v_off_cost   + (v_off_spec->>'cost')::BIGINT;
            v_off_resolved := v_off_resolved || jsonb_build_array(
                v_off_spec || jsonb_build_object('id', v_off_id)
            );
        END LOOP;
    END IF;

    v_total_thrust := COALESCE(v_engine.thrust, 0) * p_engine_count;
    v_engine_total_weight := COALESCE(v_engine.weight, 0) * p_engine_count;
    v_total_weight := (v_airframe->>'weight')::NUMERIC + v_engine_total_weight + v_mech_weight + v_off_weight;

    IF v_total_weight <= 0 OR v_total_thrust < v_total_weight THEN
        v_ratio := CASE WHEN v_total_weight > 0 THEN v_total_thrust / v_total_weight ELSE 0 END;
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient thrust. Total thrust %.1f vs weight %.1f (ratio %.2f). Add engines, pick a stronger engine, or drop modules.',
                v_total_thrust, v_total_weight, v_ratio));
    END IF;

    v_ratio := v_total_thrust / v_total_weight;
    v_range := LEAST(10, GREATEST(0, (v_airframe->>'range')::NUMERIC * v_ratio));
    v_passengers := (v_airframe->>'pax')::INT + v_off_pax;

    v_demand_score := LEAST(10, GREATEST(0,
        v_base_demand + v_off_demand
        + CASE WHEN COALESCE(v_engine.reliability, 0) >= 70 THEN 1 ELSE 0 END
    ));

    v_engine_safety_mod := FLOOR((COALESCE(v_engine.reliability, 50) - 50) / 25.0)::INT;
    v_safety_score := LEAST(10, GREATEST(0,
        v_base_safety + v_mech_safety + v_engine_safety_mod
    ));

    v_engine_cost := COALESCE(v_engine.cost_per_unit, 0) * p_engine_count;
    v_total_cost := (v_airframe->>'cost')::BIGINT + v_engine_cost + v_mech_cost + v_off_cost;

    v_engine_time := p_engine_count;
    v_module_time := CASE WHEN (v_mech_count + v_off_count) >= 2 THEN 2 ELSE 1 END;
    v_design_ticks := (v_airframe->>'time')::INT + v_engine_time + v_module_time;

    v_quality := ROUND((
        v_range
        + LEAST(10, v_passengers / 6.0)
        + v_demand_score
        + v_safety_score
    )::NUMERIC / 4.0, 2);

    IF COALESCE(v_corp.corp_cash_reserves, 0) < 1000000 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Insufficient cash. Design costs $1M per tick; need at least $1M to begin.');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO corp_aircraft_designs (
        corp_id, design_type, name, modules,
        thrust, weight, efficiency, reliability, quality, cost_per_unit,
        inventory_on_hand,
        status, research_ticks_total, research_ticks_remaining, research_cost_per_tick,
        airframe_class, engine_design_id, engine_count, passengers, range_nm, demand_score, safety_score,
        created_at_tick
    ) VALUES (
        p_corp_id, 'aircraft', v_clean_name,
        jsonb_build_object(
            'airframe',     p_airframe,
            'engine_id',    p_engine_design_id,
            'engine_count', p_engine_count,
            'mechanicals',  v_mech_resolved,
            'offerings',    v_off_resolved
        ),
        v_total_thrust, v_total_weight, COALESCE(v_engine.efficiency, 0), COALESCE(v_engine.reliability, 0), v_quality, v_total_cost,
        0,
        'researching', v_design_ticks, v_design_ticks, 1000000,
        p_airframe, p_engine_design_id, p_engine_count, v_passengers, v_range, v_demand_score, v_safety_score,
        v_tick
    ) RETURNING id INTO v_design_id;

    RETURN jsonb_build_object(
        'success',              true,
        'design_id',            v_design_id,
        'name',                 v_clean_name,
        'airframe',             p_airframe,
        'engine_count',         p_engine_count,
        'thrust',               v_total_thrust,
        'weight',               v_total_weight,
        'thrust_weight_ratio',  ROUND(v_ratio, 2),
        'range',                v_range,
        'passengers',           v_passengers,
        'demand',               v_demand_score,
        'safety',               v_safety_score,
        'quality',              v_quality,
        'cost_per_unit',        v_total_cost,
        'research_ticks_total', v_design_ticks
    );
END;
$$;

GRANT EXECUTE ON FUNCTION start_aircraft_design_research(UUID, TEXT, TEXT, UUID, INT, TEXT[], TEXT[]) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
