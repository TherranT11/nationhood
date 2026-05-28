-- ════════════════════════════════════════════════════════════════════
-- ENGINE PRODUCTION — extend ent_queue_production_run to engines too
-- ════════════════════════════════════════════════════════════════════
-- The aircraft production pipeline (20270234) already covers half of what we
-- need: ent_production_runs is design-agnostic and process_ent_production_runs
-- happily advances any active row and delivers units into the row's design
-- inventory_on_hand. Only the QUEUE rpc was hard-gated to design_type='aircraft'.
--
-- Extend ent_queue_production_run to accept engine designs too:
--   * design_type='engine'  → plant must be engine_assembly_plant, 1 tick/unit
--   * design_type='aircraft' → existing per-airframe compat + ticks/unit
--
-- Same one-active-run-per-plant rule, same cost model (design.cost_per_unit),
-- same per-tick treasury charge, same delivery into ent_aircraft_designs
-- .inventory_on_hand. No new table, no new processor — engines stockpile in
-- the same column aircraft do, just on engine-design rows.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.ent_queue_production_run(
    p_corp_id  uuid,
    p_design_id uuid,
    p_plant_building_id uuid,
    p_quantity int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_corp         entrepreneur_corps%ROWTYPE;
    v_design       ent_aircraft_designs%ROWTYPE;
    v_plant        corp_buildings%ROWTYPE;
    v_compat       text[];
    v_tpu          int;
    v_per_unit     bigint;
    v_total_cost   bigint;
    v_total_ticks  int;
    v_cost_tick    bigint;
    v_tick         int;
    v_run_id       uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 100 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_corp.industry <> 'aviation_manufacturing' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_manufacturer');
    END IF;

    -- Design: this corp's own, available, engine OR aircraft.
    SELECT * INTO v_design FROM ent_aircraft_designs WHERE id = p_design_id;
    IF v_design.id IS NULL OR v_design.entrepreneur_corp_id <> p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_not_found');
    END IF;
    IF v_design.status <> 'available' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_not_available');
    END IF;

    -- Plant compatibility + ticks-per-unit, branched on design type. Engines
    -- assemble at engine_assembly_plant (where they were designed) at 1
    -- tick/unit; aircraft use the existing per-airframe map.
    IF v_design.design_type = 'engine' THEN
        v_compat := ARRAY['engine_assembly_plant'];
        v_tpu    := 1;
    ELSIF v_design.design_type = 'aircraft' THEN
        v_compat := CASE v_design.airframe_class
            WHEN 'business'   THEN ARRAY['light_assembly_plant']
            WHEN 'regional'   THEN ARRAY['light_assembly_plant', 'aircraft_assembly_facility']
            WHEN 'narrowbody' THEN ARRAY['aircraft_assembly_facility']
            WHEN 'widebody'   THEN ARRAY['heavy_manufacturing_plant']
            ELSE ARRAY[]::text[]
        END;
        v_tpu := CASE v_design.airframe_class
                     WHEN 'business' THEN 1 WHEN 'regional' THEN 2
                     WHEN 'narrowbody' THEN 3 WHEN 'widebody' THEN 4 ELSE 2 END;
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'design_type_invalid');
    END IF;

    SELECT * INTO v_plant FROM corp_buildings WHERE id = p_plant_building_id;
    IF v_plant.id IS NULL OR v_plant.owner_corp_id <> p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plant_not_found');
    END IF;
    IF v_plant.status <> 'completed' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plant_not_ready');
    END IF;
    IF NOT (v_plant.building_type = ANY (v_compat)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plant_incompatible',
            'allowed', v_compat);
    END IF;
    -- One active run per plant.
    IF EXISTS (SELECT 1 FROM ent_production_runs
                WHERE plant_building_id = p_plant_building_id AND status = 'active') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plant_busy');
    END IF;

    -- Cost + timeline. cost_per_unit already bundles modules.
    v_per_unit    := GREATEST(0, COALESCE(v_design.cost_per_unit, 0));
    v_total_ticks := v_tpu * p_quantity;
    v_total_cost  := v_per_unit * p_quantity;
    v_cost_tick   := GREATEST(1, (v_total_cost / v_total_ticks))::bigint;

    IF COALESCE(v_corp.treasury_cash, 0) < v_cost_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_cash',
            'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint, 'need', v_cost_tick);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO ent_production_runs (
        entrepreneur_corp_id, design_id, plant_building_id, quantity,
        cost_per_tick, ticks_per_unit, total_ticks,
        status, last_processed_tick
    ) VALUES (
        p_corp_id, p_design_id, p_plant_building_id, p_quantity,
        v_cost_tick, v_tpu, v_total_ticks,
        'active', v_tick
    ) RETURNING id INTO v_run_id;

    RETURN jsonb_build_object('success', true, 'run_id', v_run_id,
        'quantity', p_quantity, 'per_unit_cost', v_per_unit,
        'total_cost', v_total_cost, 'cost_per_tick', v_cost_tick,
        'total_ticks', v_total_ticks);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ent_queue_production_run(uuid, uuid, uuid, int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
