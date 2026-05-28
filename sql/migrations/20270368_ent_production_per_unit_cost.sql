-- ═══════════════════════════════════════════════════════════════════════════════
-- ENT PRODUCTION RUNS — plumb per_unit_cost through ent_queue_production_run
-- ═══════════════════════════════════════════════════════════════════════════════
-- Symptom: Begin Production fails with
--   "null value in column 'per_unit_cost' of relation 'ent_production_runs'
--    violates not-null constraint"
--
-- Root cause: at least one deployed database has a per_unit_cost column on
-- ent_production_runs that's NOT NULL (a column the in-tree migrations 20270234
-- + 20270235 don't declare — it matches the schema of the older
-- corp_production_runs table from 20261030 and looks to have been added
-- outside the migration set). The active ent_queue_production_run RPC (last
-- replaced in 20270235) doesn't write to that column, so the INSERT trips
-- the NOT NULL constraint and the run never starts.
--
-- Fix: write per_unit_cost on every new run. v_per_unit is already computed
-- inside the RPC (base design cost, minus the engine portion for foreign-engine
-- aircraft), so the change is just one column in the INSERT.
--
-- This migration is defensive on both axes:
--   • Schema — ADD COLUMN IF NOT EXISTS so it's a no-op on DBs that already
--     have per_unit_cost, and a safe add (nullable) on DBs that don't. A
--     follow-up backfill seeds any existing NULL rows from the existing
--     cost_per_tick × total_ticks / quantity equivalence so a downstream
--     NOT NULL re-enforce won't break.
--   • RPC — CREATE OR REPLACE of the same signature ent_queue_production_run
--     last shipped in 20270235; only the INSERT column list / VALUES list and
--     the in-line comment change. All other behavior (engine consumption,
--     plant compatibility, design / owner / industry gating) is identical.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Part 1: Defensive schema add + backfill.
ALTER TABLE public.ent_production_runs
    ADD COLUMN IF NOT EXISTS per_unit_cost bigint;

UPDATE public.ent_production_runs
   SET per_unit_cost = (cost_per_tick * total_ticks) / GREATEST(quantity, 1)
 WHERE per_unit_cost IS NULL;

COMMENT ON COLUMN public.ent_production_runs.per_unit_cost IS
    'Snapshot of the per-unit build cost at queue time (after foreign-engine discount). Set by ent_queue_production_run; never re-read by the per-tick processor today (cost_per_tick × total_ticks is the truth there). Reserved for the future cancellation/refund flow + audit trail.';

-- Part 2: Re-issue ent_queue_production_run with per_unit_cost in the INSERT.
-- Body is the 20270235 version verbatim except for the two added tokens in
-- the INSERT — DO NOT diverge other logic here.
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
    v_tick         int;
    v_run_id       uuid;
    v_foreign      boolean := false;
    v_eng_needed   int := 0;
    v_have         int := 0;
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
    IF v_design.design_type <> 'aircraft' OR v_design.status <> 'available' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_not_available');
    END IF;

    v_compat := CASE v_design.airframe_class
        WHEN 'business'   THEN ARRAY['light_assembly_plant']
        WHEN 'regional'   THEN ARRAY['light_assembly_plant', 'aircraft_assembly_facility']
        WHEN 'narrowbody' THEN ARRAY['aircraft_assembly_facility']
        WHEN 'widebody'   THEN ARRAY['heavy_manufacturing_plant']
        ELSE ARRAY[]::text[]
    END;

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

    v_per_unit := GREATEST(0, COALESCE(v_design.cost_per_unit, 0));

    IF v_design.engine_design_id IS NOT NULL THEN
        SELECT * INTO v_engine FROM ent_aircraft_designs WHERE id = v_design.engine_design_id;
        IF v_engine.id IS NOT NULL AND v_engine.entrepreneur_corp_id <> p_corp_id THEN
            v_foreign := true;
            v_eng_needed := COALESCE(v_design.engine_count, 0) * p_quantity;
            SELECT COALESCE(quantity, 0) INTO v_have FROM ent_engine_inventory
             WHERE entrepreneur_corp_id = p_corp_id AND engine_design_id = v_engine.id;
            IF COALESCE(v_have, 0) < v_eng_needed THEN
                RETURN jsonb_build_object('success', false, 'reason', 'insufficient_engines',
                    'engine', v_engine.name, 'need', v_eng_needed, 'have', COALESCE(v_have, 0));
            END IF;
            v_per_unit := GREATEST(0, v_per_unit
                - COALESCE(v_engine.cost_per_unit, 0) * COALESCE(v_design.engine_count, 0));
        END IF;
    END IF;

    v_tpu        := CASE v_design.airframe_class
                        WHEN 'business' THEN 1 WHEN 'regional' THEN 2
                        WHEN 'narrowbody' THEN 3 WHEN 'widebody' THEN 4 ELSE 2 END;
    v_total_ticks := v_tpu * p_quantity;
    v_total_cost  := v_per_unit * p_quantity;
    v_cost_tick   := GREATEST(1, (v_total_cost / v_total_ticks))::bigint;

    IF COALESCE(v_corp.treasury_cash, 0) < v_cost_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_cash',
            'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint, 'need', v_cost_tick);
    END IF;

    IF v_foreign AND v_eng_needed > 0 THEN
        UPDATE ent_engine_inventory SET quantity = quantity - v_eng_needed
         WHERE entrepreneur_corp_id = p_corp_id AND engine_design_id = v_engine.id
           AND quantity >= v_eng_needed;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_engines',
                'engine', v_engine.name, 'need', v_eng_needed, 'have', COALESCE(v_have, 0));
        END IF;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- per_unit_cost added 20270368 so the INSERT no longer trips a NOT NULL
    -- constraint on databases where the column was added out of band.
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
        'total_ticks', v_total_ticks, 'engines_consumed', CASE WHEN v_foreign THEN v_eng_needed ELSE 0 END);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ent_queue_production_run(uuid, uuid, uuid, int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
