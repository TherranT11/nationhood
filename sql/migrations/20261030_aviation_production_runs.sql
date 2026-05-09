-- ════════════════════════════════════════════════════════════════
-- Aviation Manufacturing — production runs (Phase F slice 3)
--
-- Bridges design → inventory. A corp queues a production run for one
-- of its Available designs, allocates one or more eligible plants,
-- picks a quantity (with volume discount tiers), and the run advances
-- per-tick at a fixed cost-per-tick burn. Each completed cycle
-- delivers up to parallel_capacity units into the design's
-- inventory_on_hand.
--
-- Design choices made up front (player Q&A in chat):
--   • Engine reservation: EAGER. When an aircraft run is queued,
--     qty × engines_per_unit are immediately subtracted from the
--     engine design's inventory_on_hand. No "reserved_other" fan-in.
--   • Plant occupancy: CAPACITY-BASED. Plants have simultaneous_builds
--     slots (1 for light/aircraft/heavy, 2 for engine plants); an
--     active run uses 1 slot per assigned plant. A plant is "full"
--     when the count of active production_run_plants rows for that
--     plant equals simultaneous_builds.
--   • Cost cadence: PER-TICK FIXED. cost_per_tick = total_cost /
--     total_ticks, deducted via emit_corp_cash_event each tick.
--     Cash-broke pauses (no progress, no charge) until cash returns.
--   • Cancellation: NONE. Once queued, the run rides it out.
--
-- Volume discount tiers (1 unit = 100%, 2-4 = 95%, 5-9 = 90%,
-- 10-19 = 85%, 20+ = 80% of per-unit cost) are encoded inline in
-- queue_production_run.
--
-- Plant compatibility:
--   light_assembly_plant      → business + regional aircraft
--   aircraft_assembly_facility→ regional + narrowbody
--   heavy_manufacturing_plant → widebody
--   engine_assembly_plant     → engine designs
--
-- Per-tick processor (processProductionRuns in advance-corp-tick)
-- handles cash deduction, cycle-boundary deliveries, and run
-- completion.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── corp_production_runs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.corp_production_runs (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id            UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    design_id          UUID NOT NULL REFERENCES public.corp_aircraft_designs(id),
    design_type        TEXT NOT NULL CHECK (design_type IN ('engine', 'aircraft')),

    quantity           INT  NOT NULL CHECK (quantity > 0),
    completed_quantity INT  NOT NULL DEFAULT 0 CHECK (completed_quantity >= 0),

    per_unit_cost      BIGINT NOT NULL CHECK (per_unit_cost >= 0),
    total_cost         BIGINT NOT NULL CHECK (total_cost >= 0),
    cost_per_tick      BIGINT NOT NULL CHECK (cost_per_tick >= 0),

    time_per_unit      INT  NOT NULL CHECK (time_per_unit > 0),
    parallel_capacity  INT  NOT NULL CHECK (parallel_capacity > 0),
    total_ticks        INT  NOT NULL CHECK (total_ticks > 0),
    ticks_remaining    INT  NOT NULL CHECK (ticks_remaining >= 0),

    -- Aircraft-only: snapshot of which engine the run is consuming.
    engine_design_id   UUID REFERENCES public.corp_aircraft_designs(id),
    engines_per_unit   INT,

    status             TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed')),

    created_at_tick    INT,
    completed_at_tick  INT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corp_production_runs_corp_active
    ON public.corp_production_runs (corp_id)
    WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_corp_production_runs_active_global
    ON public.corp_production_runs (status)
    WHERE status = 'active';

ALTER TABLE public.corp_production_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "corp_production_runs_read_all" ON public.corp_production_runs;
CREATE POLICY "corp_production_runs_read_all"
    ON public.corp_production_runs FOR SELECT USING (true);

COMMENT ON TABLE public.corp_production_runs IS
    'Aviation Manufacturing production runs. Inserted via queue_production_run RPC. Per-tick processor in advance-corp-tick (processProductionRuns) deducts cost_per_tick, decrements ticks_remaining, and at each cycle boundary delivers up to parallel_capacity units into the design''s inventory_on_hand. No cancellation; once queued, the run runs to completion.';

COMMENT ON COLUMN public.corp_production_runs.engine_design_id IS
    'For aircraft runs: snapshot of which engine design the run is consuming. Set at queue time, never re-read by the live tick processor today (engines are eagerly subtracted at queue time, not consumed per cycle). Reserved for the future cancellation/refund flow + audit trail.';
COMMENT ON COLUMN public.corp_production_runs.engines_per_unit IS
    'For aircraft runs: snapshot of design.engine_count at queue time. Currently only used by the queue RPC for the eager engine reservation; the live processor doesn''t reference it. Reserved for future refund logic.';


-- ── corp_production_run_plants (assignment join) ────────────────
CREATE TABLE IF NOT EXISTS public.corp_production_run_plants (
    production_run_id UUID NOT NULL REFERENCES public.corp_production_runs(id) ON DELETE CASCADE,
    property_id       UUID NOT NULL REFERENCES public.corp_properties(id) ON DELETE RESTRICT,
    PRIMARY KEY (production_run_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_corp_production_run_plants_property
    ON public.corp_production_run_plants (property_id);

ALTER TABLE public.corp_production_run_plants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "corp_production_run_plants_read_all" ON public.corp_production_run_plants;
CREATE POLICY "corp_production_run_plants_read_all"
    ON public.corp_production_run_plants FOR SELECT USING (true);

COMMENT ON TABLE public.corp_production_run_plants IS
    'Junction between corp_production_runs and corp_properties (industrial facilities). One row per plant assignment. A plant''s remaining slot capacity = its simultaneous_builds (1 for light/aircraft/heavy, 2 for engine) minus the count of rows here on active runs.';


-- ── queue_production_run RPC ────────────────────────────────────
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
    v_kind_compat TEXT[];  -- valid plant types for this design class
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Lock the corp row so two parallel queue calls can't both pass
    -- the cash check / engine-inventory check before either commits.
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

    -- Design must exist, be available, and belong to this corp.
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

    -- Plant compatibility for this design.
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

    -- Validate every plant: ownership, type compatibility, capacity.
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

        -- simultaneous_builds: 2 for engine plants, 1 for the rest.
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

    -- Aircraft path: validate engine source + reserve eagerly.
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

    -- Per-unit cost. For aircraft this is the design's stored
    -- cost_per_unit (airframe + engines + modules), but engines are
    -- pulled from inventory not paid for again — so we subtract
    -- engine_count × engine.cost_per_unit. For engine production, just
    -- the engine's cost_per_unit.
    IF v_design.design_type = 'aircraft' THEN
        v_per_unit_cost := COALESCE(v_design.cost_per_unit, 0)
                         - (v_engines_per_unit * COALESCE(v_engine.cost_per_unit, 0));
        IF v_per_unit_cost < 0 THEN v_per_unit_cost := 0; END IF;
    ELSE
        v_per_unit_cost := COALESCE(v_design.cost_per_unit, 0);
    END IF;

    -- Volume discount.
    v_discount := CASE
        WHEN p_quantity >= 20 THEN 0.80
        WHEN p_quantity >= 10 THEN 0.85
        WHEN p_quantity >= 5  THEN 0.90
        WHEN p_quantity >= 2  THEN 0.95
        ELSE 1.00
    END;
    v_per_unit_cost := ROUND(v_per_unit_cost * v_discount)::BIGINT;
    v_total_cost := v_per_unit_cost * p_quantity;

    -- Cycle math. Each cycle = time_per_unit ticks delivers
    -- parallel_capacity units. time_per_unit varies by class:
    --   business / engine = 6 / 4 ticks ; regional = 8 ; narrowbody
    --   = 10 ; widebody = 12. Mirrors the airframe construction
    --   phase from the design modal; engines flat 4 (no airframe).
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

    -- Cash check: need at least one tick of operating cost on hand.
    IF COALESCE(v_corp.corp_cash_reserves, 0) < v_cost_per_tick THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient cash — production needs $%s/tick; you have $%s',
                to_char(v_cost_per_tick, 'FM999,999,999'),
                to_char(COALESCE(v_corp.corp_cash_reserves, 0), 'FM999,999,999')));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Eager engine reservation.
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

    -- Plant assignments.
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

COMMENT ON FUNCTION queue_production_run(UUID, UUID, UUID, INT, UUID[]) IS
    'Aviation Manufacturing production queue. Validates ownership, design availability, plant compatibility + capacity, engine inventory, cash. Eagerly subtracts qty×engines_per_unit engines from the engine design''s inventory_on_hand. Inserts corp_production_runs row with frozen cost/time snapshots and N rows in corp_production_run_plants. Per-tick advancement happens in advance-corp-tick / processProductionRuns.';

NOTIFY pgrst, 'reload schema';

COMMIT;
