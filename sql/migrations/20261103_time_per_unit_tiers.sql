-- ════════════════════════════════════════════════════════════════
-- Production time_per_unit per design class — single source of truth
--
-- The build-ticks-per-cycle table (engine=4, business=6,
-- regional=8, narrowbody=10, widebody=12) lived in two places: a
-- CASE inside queue_production_run AND TIME_PER_UNIT_BY_CLASS in
-- aviation-operations.html. If they drifted, the modal showed the
-- player a tick count that didn't match what the server actually
-- booked.
--
-- This migration consolidates them into one IMMUTABLE SQL function.
-- Same pattern as 20261102_volume_discount_tiers.sql:
--
--   • time_per_unit_tiers()                — JSONB, the SOURCE.
--   • time_per_unit_for(design_type,
--                       airframe_class)    — convenience wrapper
--                                            for SQL callers.
--
-- The JSONB is a flat key→ticks map. Engine and the four airframe
-- classes don't share keys, so flattening is safe and keeps the
-- lookup trivial on both sides.
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.time_per_unit_tiers()
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT '{
        "engine":     4,
        "business":   6,
        "regional":   8,
        "narrowbody": 10,
        "widebody":   12
    }'::JSONB
$$;

GRANT EXECUTE ON FUNCTION public.time_per_unit_tiers() TO authenticated, anon;

COMMENT ON FUNCTION public.time_per_unit_tiers() IS
    'Single source of truth for production-run time-per-unit ticks per design class. Returns a flat JSONB map: engine ticks plus one entry per airframe class. queue_production_run resolves this via time_per_unit_for(); the aviation-operations client fetches it directly to drive the live cost-per-tick + total-ticks preview.';


CREATE OR REPLACE FUNCTION public.time_per_unit_for(
    p_design_type    TEXT,
    p_airframe_class TEXT
) RETURNS INT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT COALESCE(
        CASE
            WHEN p_design_type = 'engine'
                THEN (public.time_per_unit_tiers() ->> 'engine')::INT
            WHEN p_design_type = 'aircraft' AND p_airframe_class IS NOT NULL
                THEN (public.time_per_unit_tiers() ->> p_airframe_class)::INT
            ELSE NULL
        END,
        8
    )
$$;

GRANT EXECUTE ON FUNCTION public.time_per_unit_for(TEXT, TEXT) TO authenticated, anon;

COMMENT ON FUNCTION public.time_per_unit_for(TEXT, TEXT) IS
    'Resolves time_per_unit_tiers() for a (design_type, airframe_class) pair. Falls back to 8 if neither key is found (defensive — every supported class should have an entry).';


-- Replace queue_production_run so its time_per_unit calc reads
-- from the same source. Body otherwise identical to 20261102.
CREATE OR REPLACE FUNCTION queue_production_run(
    p_corp_id            UUID,
    p_design_id          UUID,
    p_engine_design_id   UUID,
    p_quantity           INT,
    p_plant_property_ids UUID[]
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_corp factions%ROWTYPE;
    v_design corp_aircraft_designs%ROWTYPE;
    v_engine corp_aircraft_designs%ROWTYPE;
    v_plant corp_properties%ROWTYPE;
    v_plant_id UUID;
    v_plant_capacity INT;
    v_plant_in_use INT;
    v_parallel_capacity INT := 0;
    v_engines_per_unit INT := 0;
    v_engines_total_needed INT := 0;
    v_per_unit_cost BIGINT;
    v_discount NUMERIC;
    v_total_cost BIGINT;
    v_time_per_unit INT;
    v_total_ticks INT;
    v_cost_per_tick BIGINT;
    v_tick INT;
    v_run_id UUID;
    v_kind_compat TEXT[];
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
        RETURN jsonb_build_object('success', false, 'error', 'Only Aviation Manufacturing corporations can queue production');
    END IF;

    SELECT * INTO v_design FROM corp_aircraft_designs
     WHERE id = p_design_id AND is_active = TRUE FOR UPDATE;
    IF v_design.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Design not found');
    END IF;
    IF v_design.corp_id <> p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You can only produce designs that belong to your corporation');
    END IF;
    IF v_design.status <> 'available' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Design must be Available (R&D complete) before production');
    END IF;

    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Quantity must be between 1 and 100');
    END IF;

    IF v_design.design_type = 'engine' THEN
        v_kind_compat := ARRAY['engine_assembly_plant'];
    ELSIF v_design.design_type = 'aircraft' THEN
        v_kind_compat := CASE v_design.airframe_class
            WHEN 'business'   THEN ARRAY['light_assembly_plant']
            WHEN 'regional'   THEN ARRAY['light_assembly_plant', 'aircraft_assembly_facility']
            WHEN 'narrowbody' THEN ARRAY['aircraft_assembly_facility']
            WHEN 'widebody'   THEN ARRAY['heavy_manufacturing_plant']
            ELSE ARRAY[]::TEXT[]
        END;
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Unknown design type');
    END IF;

    IF p_plant_property_ids IS NULL OR cardinality(p_plant_property_ids) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'At least one plant must be assigned');
    END IF;

    FOREACH v_plant_id IN ARRAY p_plant_property_ids LOOP
        SELECT * INTO v_plant FROM corp_properties
         WHERE id = v_plant_id AND is_active = TRUE FOR UPDATE;
        IF v_plant.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Plant not found or inactive: ' || v_plant_id::TEXT);
        END IF;
        IF v_plant.faction_id <> p_corp_id THEN
            RETURN jsonb_build_object('success', false, 'error', 'Plant does not belong to your corporation: ' || v_plant.name);
        END IF;
        IF NOT (v_plant.type = ANY(v_kind_compat)) THEN
            RETURN jsonb_build_object('success', false,
                'error', format('%s (type %s) is not compatible with %s designs',
                    v_plant.name, v_plant.type, v_design.design_type));
        END IF;

        v_plant_capacity := CASE v_plant.type
            WHEN 'engine_assembly_plant' THEN 2
            ELSE 1
        END;
        SELECT COUNT(*) INTO v_plant_in_use
          FROM corp_production_run_plants pp
          JOIN corp_production_runs pr ON pr.id = pp.production_run_id
         WHERE pp.property_id = v_plant_id
           AND pr.status = 'active';
        IF v_plant_in_use >= v_plant_capacity THEN
            RETURN jsonb_build_object('success', false,
                'error', format('%s is at capacity (%s/%s slots used)',
                    v_plant.name, v_plant_in_use, v_plant_capacity));
        END IF;

        v_parallel_capacity := v_parallel_capacity + 1;
    END LOOP;

    IF v_design.design_type = 'aircraft' THEN
        v_engines_per_unit := COALESCE(v_design.engine_count, 0);
        IF v_engines_per_unit < 1 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Aircraft design has no engine slots configured');
        END IF;
        IF p_engine_design_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Aircraft production requires an engine selection');
        END IF;
        SELECT * INTO v_engine FROM corp_aircraft_designs
         WHERE id = p_engine_design_id AND design_type = 'engine'
           AND is_active = TRUE AND status = 'available'
         FOR UPDATE;
        IF v_engine.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Selected engine is not available for production');
        END IF;
        IF v_engine.corp_id <> p_corp_id THEN
            RETURN jsonb_build_object('success', false,
                'error', 'Engine must be your corporation''s design (cross-corp engine sourcing not yet supported)');
        END IF;

        v_engines_total_needed := p_quantity * v_engines_per_unit;
        IF COALESCE(v_engine.inventory_on_hand, 0) < v_engines_total_needed THEN
            RETURN jsonb_build_object('success', false,
                'error', format('Insufficient engine inventory — need %s %s engines, have %s',
                    v_engines_total_needed, v_engine.name, COALESCE(v_engine.inventory_on_hand, 0)));
        END IF;
    END IF;

    IF v_design.design_type = 'aircraft' THEN
        v_per_unit_cost := COALESCE(v_design.cost_per_unit, 0)
                         - (v_engines_per_unit * COALESCE(v_engine.cost_per_unit, 0));
        IF v_per_unit_cost < 0 THEN v_per_unit_cost := 0; END IF;
    ELSE
        v_per_unit_cost := COALESCE(v_design.cost_per_unit, 0);
    END IF;

    v_discount := volume_discount_for(p_quantity);
    v_per_unit_cost := ROUND(v_per_unit_cost * v_discount)::BIGINT;
    v_total_cost := v_per_unit_cost * p_quantity;

    -- time_per_unit: single source via time_per_unit_for().
    v_time_per_unit := time_per_unit_for(v_design.design_type, v_design.airframe_class);
    v_total_ticks := CEIL(p_quantity::NUMERIC / v_parallel_capacity)::INT * v_time_per_unit;

    v_cost_per_tick := CASE WHEN v_total_ticks > 0
        THEN ROUND(v_total_cost::NUMERIC / v_total_ticks)::BIGINT
        ELSE 0 END;

    IF COALESCE(v_corp.corp_cash_reserves, 0) < v_cost_per_tick THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient cash — production needs $%s/tick; you have $%s',
                to_char(v_cost_per_tick, 'FM999,999,999'),
                to_char(COALESCE(v_corp.corp_cash_reserves, 0), 'FM999,999,999')));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_design.design_type = 'aircraft' THEN
        UPDATE corp_aircraft_designs
           SET inventory_on_hand = inventory_on_hand - v_engines_total_needed
         WHERE id = p_engine_design_id;
    END IF;

    INSERT INTO corp_production_runs (
        corp_id, design_id, design_type,
        quantity, completed_quantity,
        per_unit_cost, total_cost, cost_per_tick,
        time_per_unit, parallel_capacity, total_ticks, ticks_remaining,
        engine_design_id, engines_per_unit,
        status, created_at_tick
    ) VALUES (
        p_corp_id, p_design_id, v_design.design_type,
        p_quantity, 0,
        v_per_unit_cost, v_total_cost, v_cost_per_tick,
        v_time_per_unit,
        v_parallel_capacity, v_total_ticks, v_total_ticks,
        CASE WHEN v_design.design_type = 'aircraft' THEN p_engine_design_id ELSE NULL END,
        CASE WHEN v_design.design_type = 'aircraft' THEN v_engines_per_unit ELSE NULL END,
        'active', v_tick
    ) RETURNING id INTO v_run_id;

    FOREACH v_plant_id IN ARRAY p_plant_property_ids LOOP
        INSERT INTO corp_production_run_plants (production_run_id, property_id)
        VALUES (v_run_id, v_plant_id);
    END LOOP;

    RETURN jsonb_build_object(
        'success',           true,
        'run_id',            v_run_id,
        'quantity',          p_quantity,
        'per_unit_cost',     v_per_unit_cost,
        'total_cost',        v_total_cost,
        'cost_per_tick',     v_cost_per_tick,
        'total_ticks',       v_total_ticks,
        'parallel_capacity', v_parallel_capacity,
        'engines_reserved',  v_engines_total_needed
    );
END;
$$;

GRANT EXECUTE ON FUNCTION queue_production_run(UUID, UUID, UUID, INT, UUID[]) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
