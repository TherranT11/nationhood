-- ════════════════════════════════════════════════════════════════
-- Volume discount tiers — single source of truth
--
-- Production-run volume discounts (1u=100%, 2-4u=95%, 5-9u=90%,
-- 10-19u=85%, 20+u=80%) used to live in two places: a CASE ladder
-- inside queue_production_run, and a copy in JS
-- (aviation-operations.html) for the live modal preview. If they
-- drift, the modal lies to the player about the cost they're about
-- to pay.
--
-- This migration consolidates the source of truth into one
-- IMMUTABLE SQL function. queue_production_run reads it via a
-- helper; the client fetches it once per session and caches.
--
--   • volume_discount_tiers()       — JSONB array, the SOURCE.
--   • volume_discount_for(qty INT)  — convenience wrapper that
--                                     walks the array and returns
--                                     the multiplier for a qty.
--                                     Used inside SQL.
--
-- Both functions are IMMUTABLE so the planner can constant-fold
-- them when called with literals.
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.volume_discount_tiers()
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT '[
        {"min_qty": 1,  "mult": 1.00},
        {"min_qty": 2,  "mult": 0.95},
        {"min_qty": 5,  "mult": 0.90},
        {"min_qty": 10, "mult": 0.85},
        {"min_qty": 20, "mult": 0.80}
    ]'::JSONB
$$;

GRANT EXECUTE ON FUNCTION public.volume_discount_tiers() TO authenticated, anon;

COMMENT ON FUNCTION public.volume_discount_tiers() IS
    'Single source of truth for production-run volume-discount tiers. Returns a JSONB array of {min_qty, mult} sorted by min_qty ASC. queue_production_run uses volume_discount_for() to look up the multiplier; the aviation-operations client fetches this directly to render the schedule and compute live preview.';


CREATE OR REPLACE FUNCTION public.volume_discount_for(p_qty INT)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT COALESCE((
        SELECT (tier->>'mult')::NUMERIC
          FROM jsonb_array_elements(public.volume_discount_tiers()) tier
         WHERE p_qty >= (tier->>'min_qty')::INT
         ORDER BY (tier->>'min_qty')::INT DESC
         LIMIT 1
    ), 1.00)
$$;

GRANT EXECUTE ON FUNCTION public.volume_discount_for(INT) TO authenticated, anon;

COMMENT ON FUNCTION public.volume_discount_for(INT) IS
    'Walks volume_discount_tiers() and returns the multiplier for a given quantity. Falls back to 1.00 if qty is below every tier (defensive — the lowest tier should always be min_qty=1).';


-- Replace queue_production_run so its discount calc reads from the
-- same source. Body is otherwise identical to 20261030.
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

    -- Volume discount: single source via volume_discount_for().
    v_discount := volume_discount_for(p_quantity);
    v_per_unit_cost := ROUND(v_per_unit_cost * v_discount)::BIGINT;
    v_total_cost := v_per_unit_cost * p_quantity;

    v_time_per_unit := CASE v_design.design_type
        WHEN 'engine' THEN 4
        ELSE CASE v_design.airframe_class
            WHEN 'business'   THEN 6
            WHEN 'regional'   THEN 8
            WHEN 'narrowbody' THEN 10
            WHEN 'widebody'   THEN 12
            ELSE 8
        END
    END;
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
