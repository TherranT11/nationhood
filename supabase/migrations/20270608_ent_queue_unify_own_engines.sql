-- ════════════════════════════════════════════════════════════════════
-- 20270608 — Fix ent_queue_production_run: own engines double-billed
--
-- Bug: aviation-manufacturing corps were being charged for their own
-- engines twice on aircraft production.
--
--   • Produce an engine run → treasury debited engine.cost_per_unit per
--     unit; engines land in ent_engine_inventory. (first charge — correct)
--   • Produce an aircraft run that uses the same own-designed engine →
--     treasury debited the FULL design.cost_per_unit per unit, which by
--     ent_design_aircraft (20270221) already bundles
--     airframe + engines×count + mechanicals + offerings. AND the
--     engines just sit in ent_engine_inventory, never consumed.
--     (second charge — wrong)
--
-- Root cause: 20270356 unified engine handling: aircraft production
-- always consumes engine_count×qty from ent_engine_inventory and always
-- drops the engine portion from cost_per_unit, regardless of who
-- designed the engine. Comment was explicit:
--   "no own-vs-foreign branch. If you don't have the engines on hand,
--    you can't build the aircraft — go produce or buy them first."
--
-- 20270363 re-issued the function to plumb per_unit_cost into the
-- INSERT and KEPT the unified pattern.
--
-- 20270368 also plumbed per_unit_cost, but its header explicitly says
-- "Body is the 20270235 version verbatim except for the two added
-- tokens in the INSERT". 20270235 was the OLD foreign-only-branch
-- version (predates the 20270356 unification). So 20270368 silently
-- reverted the unification fix — for own-engine designs, v_foreign
-- stays false, the inventory check + cost subtraction are skipped,
-- and the manufacturer pays the engine portion of cost_per_unit a
-- second time.
--
-- 20270586 (BTO settle-at-delivery for ent_accept_aircraft_order)
-- uses the unified pattern correctly, so foreign-corp aircraft orders
-- aren't affected — only DIY runs through ent_queue_production_run.
--
-- Fix: re-issue ent_queue_production_run with the unified body. The
-- shape is functionally 20270363 — handles design_type='engine' for
-- engine runs, treats every engine (own or foreign) the same, writes
-- per_unit_cost to the INSERT so the NOT NULL constraint that
-- 20270363 / 20270368 were both trying to satisfy stays satisfied.
--
-- Existing in-flight or completed runs are NOT retro-fixed: their
-- cost_per_tick was stamped at queue time and the per-tick processor
-- reads from the row. New runs queued after this migration land at
-- the correct (engine-excluded) charge. Any owed cash restitution
-- for engines double-billed before this fix is a separate one-shot
-- SQL operation, scoped per-corp.
--
-- Apply after 20270607.
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
    v_engine       ent_aircraft_designs%ROWTYPE;
    v_plant        corp_buildings%ROWTYPE;
    v_compat       text[];
    v_tpu          int;
    v_per_unit     bigint;
    v_total_cost   bigint;
    v_total_ticks  int;
    v_cost_tick    bigint;
    v_eng_count    int;
    v_eng_need     int := 0;
    v_eng_have     int;
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

    SELECT * INTO v_design FROM ent_aircraft_designs WHERE id = p_design_id;
    IF v_design.id IS NULL OR v_design.entrepreneur_corp_id <> p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_not_found');
    END IF;
    IF v_design.status <> 'available' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_not_available');
    END IF;

    -- Plant compatibility + ticks-per-unit, branched on design type.
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
    IF EXISTS (SELECT 1 FROM ent_production_runs
                WHERE plant_building_id = p_plant_building_id AND status = 'active') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plant_busy');
    END IF;

    -- Base cost from the design. For aircraft, the engine portion of
    -- cost_per_unit is dropped because engines come from inventory —
    -- ALWAYS, regardless of whether this corp also designed the engine
    -- (the 20270356 unification; 20270368 had reverted this and was
    -- silently double-billing own-engine designs).
    v_per_unit := GREATEST(0, COALESCE(v_design.cost_per_unit, 0));

    IF v_design.design_type = 'aircraft' AND v_design.engine_design_id IS NOT NULL THEN
        SELECT * INTO v_engine FROM ent_aircraft_designs WHERE id = v_design.engine_design_id;
        IF v_engine.id IS NULL OR v_engine.design_type <> 'engine' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'engine_design_missing');
        END IF;
        v_eng_count := COALESCE(v_design.engine_count, 0);
        v_eng_need  := v_eng_count * p_quantity;

        -- Inventory check (any engine — own or foreign — same rule).
        SELECT COALESCE(quantity, 0) INTO v_eng_have FROM ent_engine_inventory
         WHERE entrepreneur_corp_id = p_corp_id AND engine_design_id = v_engine.id;
        IF COALESCE(v_eng_have, 0) < v_eng_need THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_engines',
                'engine', v_engine.name, 'need', v_eng_need, 'have', COALESCE(v_eng_have, 0));
        END IF;

        v_per_unit := GREATEST(0, v_per_unit - COALESCE(v_engine.cost_per_unit, 0) * v_eng_count);
    END IF;

    v_total_ticks := v_tpu * p_quantity;
    v_total_cost  := v_per_unit * p_quantity;
    v_cost_tick   := GREATEST(1, (v_total_cost / v_total_ticks))::bigint;

    IF COALESCE(v_corp.treasury_cash, 0) < v_cost_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_cash',
            'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint, 'need', v_cost_tick);
    END IF;

    -- Consume engines now (eager, guarded against a concurrent draw-down).
    IF v_design.design_type = 'aircraft' AND v_eng_need > 0 THEN
        UPDATE ent_engine_inventory SET quantity = quantity - v_eng_need
         WHERE entrepreneur_corp_id = p_corp_id AND engine_design_id = v_engine.id
           AND quantity >= v_eng_need;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_engines',
                'engine', v_engine.name, 'need', v_eng_need, 'have', COALESCE(v_eng_have, 0));
        END IF;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO ent_production_runs (
        entrepreneur_corp_id, design_id, plant_building_id, quantity,
        cost_per_tick, ticks_per_unit, total_ticks, per_unit_cost,
        status, last_processed_tick
    ) VALUES (
        p_corp_id, p_design_id, p_plant_building_id, p_quantity,
        v_cost_tick, v_tpu, v_total_ticks, v_per_unit,
        'active', v_tick
    ) RETURNING id INTO v_run_id;

    RETURN jsonb_build_object('success', true, 'run_id', v_run_id,
        'quantity', p_quantity, 'per_unit_cost', v_per_unit,
        'total_cost', v_total_cost, 'cost_per_tick', v_cost_tick,
        'total_ticks', v_total_ticks, 'engines_consumed', v_eng_need);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ent_queue_production_run(uuid, uuid, uuid, int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
