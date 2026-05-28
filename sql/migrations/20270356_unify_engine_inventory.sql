-- ════════════════════════════════════════════════════════════════════
-- ENGINE INVENTORY — one location, one consumption rule
-- ════════════════════════════════════════════════════════════════════
-- Until now engines lived in TWO places:
--   * ent_engine_inventory   — engines bought from another corp
--   * ent_aircraft_designs.inventory_on_hand — engines produced in-house
--     (after 20270355 extended produce-into-stock to engines)
-- and aircraft production had two branches:
--   * foreign engine  → draw from ent_engine_inventory + subtract engine cost
--   * own engine      → bundled inline into cost_per_unit, no inventory draw
-- so own-produced engine stockpiles fed nothing — they just sat there.
--
-- Collapse to a single source of truth:
--   * ent_engine_inventory holds ALL engines a corp owns, regardless of
--     who designed them. Production lands here. Orders land here.
--   * ent_queue_production_run aircraft branch ALWAYS draws engines from
--     ent_engine_inventory and ALWAYS subtracts engine cost from
--     cost_per_unit (no own-vs-foreign branch). If you don't have the
--     engines on hand, you can't build the aircraft — go produce or buy
--     them first.
--   * Engine production runs deliver into ent_engine_inventory (not the
--     design's inventory_on_hand, which stays an aircraft-only column).
--
-- Backfill: any engines already produced into the design's inventory_on_hand
-- (from 20270355) get moved into ent_engine_inventory and that column is
-- zeroed on engine designs. Safe no-op if none yet.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Backfill: move any engine stock parked on the design row into the
--    single inventory table. Idempotent: zeroes the column afterward.
INSERT INTO public.ent_engine_inventory (entrepreneur_corp_id, engine_design_id, quantity)
SELECT entrepreneur_corp_id, id, inventory_on_hand
  FROM public.ent_aircraft_designs
 WHERE design_type = 'engine' AND COALESCE(inventory_on_hand, 0) > 0
ON CONFLICT (entrepreneur_corp_id, engine_design_id)
DO UPDATE SET quantity = ent_engine_inventory.quantity + EXCLUDED.quantity;

UPDATE public.ent_aircraft_designs
   SET inventory_on_hand = 0
 WHERE design_type = 'engine' AND COALESCE(inventory_on_hand, 0) > 0;


-- ── process_ent_production_runs: deliver engines into ent_engine_inventory,
--    aircraft into the design's inventory_on_hand (unchanged). Body reproduced
--    from 20270234 with a single design_type branch around the inventory write.
CREATE OR REPLACE FUNCTION public.process_ent_production_runs(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick      int;
    r           RECORD;
    v_dtype     text;
    v_new       int;
    v_target    int;
    v_delta     int;
    v_advanced  int := 0;
    v_delivered int := 0;
    v_completed int := 0;
    v_paused    int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, p_tick, 0);

    FOR r IN
        SELECT * FROM ent_production_runs
         WHERE status = 'active'
           AND (last_processed_tick IS NULL OR last_processed_tick <> v_tick)
         FOR UPDATE
    LOOP
        -- Charge this tick; pause (no progress) if the treasury can't cover.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) - r.cost_per_tick, updated_at = now()
         WHERE id = r.entrepreneur_corp_id
           AND COALESCE(treasury_cash, 0) >= r.cost_per_tick;
        IF NOT FOUND THEN
            UPDATE ent_production_runs SET last_processed_tick = v_tick WHERE id = r.id;
            v_paused := v_paused + 1;
            CONTINUE;
        END IF;

        SELECT design_type INTO v_dtype FROM ent_aircraft_designs WHERE id = r.design_id;

        v_new    := r.ticks_elapsed + 1;
        v_target := LEAST(r.quantity, v_new / r.ticks_per_unit);
        v_delta  := v_target - r.units_delivered;

        IF v_new >= r.total_ticks THEN
            v_delta := r.quantity - r.units_delivered;
            IF v_delta > 0 THEN
                IF v_dtype = 'engine' THEN
                    INSERT INTO ent_engine_inventory (entrepreneur_corp_id, engine_design_id, quantity)
                    VALUES (r.entrepreneur_corp_id, r.design_id, v_delta)
                    ON CONFLICT (entrepreneur_corp_id, engine_design_id)
                    DO UPDATE SET quantity = ent_engine_inventory.quantity + EXCLUDED.quantity;
                ELSE
                    UPDATE ent_aircraft_designs
                       SET inventory_on_hand = inventory_on_hand + v_delta WHERE id = r.design_id;
                END IF;
                v_delivered := v_delivered + v_delta;
            END IF;
            UPDATE ent_production_runs
               SET ticks_elapsed = v_new, units_delivered = r.quantity,
                   status = 'completed', last_processed_tick = v_tick
             WHERE id = r.id;
            v_completed := v_completed + 1;
        ELSE
            IF v_delta > 0 THEN
                IF v_dtype = 'engine' THEN
                    INSERT INTO ent_engine_inventory (entrepreneur_corp_id, engine_design_id, quantity)
                    VALUES (r.entrepreneur_corp_id, r.design_id, v_delta)
                    ON CONFLICT (entrepreneur_corp_id, engine_design_id)
                    DO UPDATE SET quantity = ent_engine_inventory.quantity + EXCLUDED.quantity;
                ELSE
                    UPDATE ent_aircraft_designs
                       SET inventory_on_hand = inventory_on_hand + v_delta WHERE id = r.design_id;
                END IF;
                v_delivered := v_delivered + v_delta;
            END IF;
            UPDATE ent_production_runs
               SET ticks_elapsed = v_new, units_delivered = v_target, last_processed_tick = v_tick
             WHERE id = r.id;
            v_advanced := v_advanced + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick,
        'advanced', v_advanced, 'delivered', v_delivered,
        'completed', v_completed, 'paused', v_paused);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_ent_production_runs(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_ent_production_runs(int) TO service_role;


-- ── ent_queue_production_run: unified engine consumption. Engines never bake
--    inline; aircraft always draw their engine_count × quantity from
--    ent_engine_inventory and the engine portion is dropped from cost_per_unit.
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
    v_eng_need     int;
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
    -- cost_per_unit is dropped because engines come from inventory.
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
