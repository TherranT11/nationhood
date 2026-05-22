-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR AVIATION MANUFACTURING — Phase 1: Design + Research
-- ════════════════════════════════════════════════════════════════════
-- Entrepreneur-native port of the legacy corp design system (20261027 /
-- 20261028). An aviation_manufacturing entrepreneur corp designs ENGINES
-- (pick 3 modules) and AIRCRAFT (airframe + an available engine + count +
-- mechanicals/offerings); each spends 7+1d6-style ticks in R&D at $1M/tick
-- before flipping to 'available'. Production + selling are later phases.
--
-- Differences from legacy (clean entrepreneur-native, not the dying
-- faction-corp tables):
--   • ent_aircraft_designs keyed on entrepreneur_corp_id (not corp_id→factions)
--   • research paid from entrepreneur_corps.treasury_cash (not corp cash)
--   • plant gate reads corp_buildings (owner_corp_id, status='completed'):
--       engine design  → engine_assembly_plant
--       aircraft design → light_assembly_plant
--     (the two plant types an entrepreneur corp can hold; founding grants one)
--   • aircraft may reference ANY available entrepreneur engine design (a
--     light-plant corp buys into another corp's engine, matching legacy)
--
-- Module specs + all stat/cost/research-tick formulas are ported verbatim
-- from the legacy RPCs so balance is identical (one set of numbers).
--
-- Per-tick research advances in process_ent_aircraft_designs (wired into
-- the entrepreneur tick alongside process_corp_loans). Idempotent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.ent_aircraft_designs (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entrepreneur_corp_id uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    design_type          text NOT NULL CHECK (design_type IN ('engine', 'aircraft')),
    name                 text NOT NULL,
    modules              jsonb NOT NULL,

    thrust         numeric(5,2),
    weight         numeric(5,2),
    efficiency     int,
    reliability    int,
    quality        numeric(4,2),
    cost_per_unit  bigint,

    -- aircraft-only
    airframe_class   text,
    engine_design_id uuid REFERENCES public.ent_aircraft_designs(id),
    engine_count     int,
    passengers       int,
    range_nm         numeric(5,2),
    demand_score     int,
    safety_score     int,

    inventory_on_hand int NOT NULL DEFAULT 0 CHECK (inventory_on_hand >= 0),   -- Phase 2 (production)

    status                   text   NOT NULL DEFAULT 'researching'
        CHECK (status IN ('researching', 'available', 'cancelled')),
    research_ticks_total     int    NOT NULL,
    research_ticks_remaining int    NOT NULL,
    research_cost_per_tick   bigint NOT NULL DEFAULT 1000000,

    created_at_tick   int,
    completed_at_tick int,
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ent_aircraft_designs_corp
    ON public.ent_aircraft_designs (entrepreneur_corp_id);
CREATE INDEX IF NOT EXISTS idx_ent_aircraft_designs_research
    ON public.ent_aircraft_designs (status) WHERE status = 'researching';
CREATE INDEX IF NOT EXISTS idx_ent_aircraft_designs_engine_avail
    ON public.ent_aircraft_designs (design_type, status) WHERE design_type = 'engine';

COMMENT ON TABLE public.ent_aircraft_designs IS
    'Entrepreneur aviation-manufacturing engine + aircraft designs. Created via ent_design_engine / ent_design_aircraft; research advances per tick in process_ent_aircraft_designs ($1M/tick from treasury_cash) until status=available. RPC-write-only.';

ALTER TABLE public.ent_aircraft_designs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ent_aircraft_designs_read_all" ON public.ent_aircraft_designs;
CREATE POLICY "ent_aircraft_designs_read_all" ON public.ent_aircraft_designs FOR SELECT USING (true);
-- No write policy: RPC-only (SECURITY DEFINER).

-- ── Shared owner+industry gate helper (inlined per RPC; kept as a note) ──
-- Both RPCs resolve the caller's entrepreneur faction and require it to
-- own p_corp_id, and the corp's industry to be 'aviation_manufacturing'.

-- ════════════════════════════════════════════════════════════════
-- ent_design_engine — pick 3 modules → researching engine design
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.ent_design_engine(
    p_corp_id    uuid,
    p_name       text,
    p_combustion text,
    p_frame      text,
    p_control    text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_fac         factions%ROWTYPE;
    v_corp        entrepreneur_corps%ROWTYPE;
    v_combustion  jsonb;
    v_frame       jsonb;
    v_control     jsonb;
    v_thrust      numeric := 0;
    v_weight      numeric := 0;
    v_efficiency  int := 0;
    v_reliability int := 0;
    v_quality     numeric := 0;
    v_cost        bigint := 0;
    v_ticks       int;
    v_tick        int;
    v_id          uuid;
    v_clean_name  text;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF v_corp.industry <> 'aviation_manufacturing' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_aviation_manufacturing'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner'); END IF;

    IF NOT EXISTS (SELECT 1 FROM corp_buildings
                    WHERE owner_corp_id = p_corp_id
                      AND building_type = 'engine_assembly_plant'
                      AND status = 'completed') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'needs_engine_assembly_plant'); END IF;

    v_clean_name := NULLIF(btrim(substring(COALESCE(p_name, ''), 1, 60)), '');
    IF v_clean_name IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_name'); END IF;

    -- Tier 1 module specs (verbatim from 20261027).
    v_combustion := CASE p_combustion
        WHEN 'single-stage'  THEN jsonb_build_object('name','Single-Stage Compressor', 'thrust',2,   'weight',0.5, 'eff',30, 'rel',0,  'cost',1500000)
        WHEN 'twin-spool'    THEN jsonb_build_object('name','Twin-Spool Configuration','thrust',3,   'weight',0.8, 'eff',40, 'rel',0,  'cost',2500000)
        WHEN 'high-pressure' THEN jsonb_build_object('name','High-Pressure Core',      'thrust',4,   'weight',1.2, 'eff',25, 'rel',-5, 'cost',4000000)
        ELSE NULL END;
    v_frame := CASE p_frame
        WHEN 'steel-casting'       THEN jsonb_build_object('name','Steel Casting',       'thrust',0,   'weight',1.5, 'eff',0,  'rel',20, 'cost',1000000)
        WHEN 'aluminum-alloy'      THEN jsonb_build_object('name','Aluminum Alloy Frame','thrust',0,   'weight',0.8, 'eff',5,  'rel',15, 'cost',1800000)
        WHEN 'magnesium-composite' THEN jsonb_build_object('name','Magnesium Composite', 'thrust',0.5, 'weight',0.4, 'eff',10, 'rel',10, 'cost',3000000)
        ELSE NULL END;
    v_control := CASE p_control
        WHEN 'mechanical-governor' THEN jsonb_build_object('name','Mechanical Governor',     'thrust',0,   'weight',0.2, 'eff',10, 'rel',25, 'cost',800000)
        WHEN 'hydraulic-control'   THEN jsonb_build_object('name','Hydraulic Control Unit',  'thrust',0.5, 'weight',0.4, 'eff',20, 'rel',30, 'cost',1500000)
        WHEN 'early-electronic'    THEN jsonb_build_object('name','Early Electronic Controls','thrust',1,  'weight',0.3, 'eff',30, 'rel',35, 'cost',2500000)
        ELSE NULL END;
    IF v_combustion IS NULL OR v_frame IS NULL OR v_control IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_module'); END IF;

    v_thrust := (v_combustion->>'thrust')::numeric + (v_frame->>'thrust')::numeric + (v_control->>'thrust')::numeric;
    v_weight := (v_combustion->>'weight')::numeric + (v_frame->>'weight')::numeric + (v_control->>'weight')::numeric;
    v_efficiency  := LEAST(100, GREATEST(0, ((v_combustion->>'eff')::int + (v_frame->>'eff')::int + (v_control->>'eff')::int)));
    v_reliability := LEAST(100, GREATEST(0, ((v_combustion->>'rel')::int + (v_frame->>'rel')::int + (v_control->>'rel')::int)));
    v_quality := ROUND((
        (LEAST(100, v_thrust * 10) + GREATEST(0, (10 - v_weight) * 10) + v_efficiency + v_reliability) / 4 / 10
    )::numeric, 2);
    v_cost := (v_combustion->>'cost')::bigint + (v_frame->>'cost')::bigint + (v_control->>'cost')::bigint + 1000000;
    v_ticks := 7 + (floor(random() * 6)::int + 1);

    IF COALESCE(v_corp.treasury_cash, 0) < 1000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury', 'need', 1000000); END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO ent_aircraft_designs (
        entrepreneur_corp_id, design_type, name, modules,
        thrust, weight, efficiency, reliability, quality, cost_per_unit,
        status, research_ticks_total, research_ticks_remaining, research_cost_per_tick, created_at_tick
    ) VALUES (
        p_corp_id, 'engine', v_clean_name,
        jsonb_build_object('combustion', p_combustion, 'frame', p_frame, 'control', p_control),
        v_thrust, v_weight, v_efficiency, v_reliability, v_quality, v_cost,
        'researching', v_ticks, v_ticks, 1000000, v_tick
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'design_id', v_id, 'name', v_clean_name,
        'thrust', v_thrust, 'weight', v_weight, 'efficiency', v_efficiency,
        'reliability', v_reliability, 'quality', v_quality, 'cost_per_unit', v_cost,
        'research_ticks_total', v_ticks);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_design_engine(uuid,text,text,text,text) TO authenticated;

-- ════════════════════════════════════════════════════════════════
-- ent_design_aircraft — airframe + engine + modules → researching design
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.ent_design_aircraft(
    p_corp_id          uuid,
    p_name             text,
    p_airframe         text,
    p_engine_design_id uuid,
    p_engine_count     int,
    p_mechanicals      text[],
    p_offerings        text[]
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_engine  ent_aircraft_designs%ROWTYPE;
    v_clean_name text;
    v_airframe jsonb;
    v_mech_count int := 0; v_off_count int := 0;
    v_mech_weight numeric := 0; v_off_weight numeric := 0;
    v_mech_safety int := 0; v_off_demand int := 0; v_off_pax int := 0;
    v_mech_cost bigint := 0; v_off_cost bigint := 0;
    v_mech_resolved jsonb := '[]'::jsonb; v_off_resolved jsonb := '[]'::jsonb;
    v_mech_id text; v_off_id text; v_mech_spec jsonb; v_off_spec jsonb;
    v_total_thrust numeric; v_total_weight numeric; v_ratio numeric;
    v_range numeric; v_passengers int;
    v_demand_score int; v_safety_score int; v_engine_safety_mod int;
    v_total_cost bigint; v_design_ticks int; v_module_time int; v_quality numeric;
    v_tick int; v_id uuid;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF v_corp.industry <> 'aviation_manufacturing' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_aviation_manufacturing'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner'); END IF;

    IF NOT EXISTS (SELECT 1 FROM corp_buildings
                    WHERE owner_corp_id = p_corp_id
                      AND building_type = 'light_assembly_plant'
                      AND status = 'completed') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'needs_assembly_plant'); END IF;

    v_clean_name := NULLIF(btrim(substring(COALESCE(p_name, ''), 1, 60)), '');
    IF v_clean_name IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_name'); END IF;

    -- Tier 1 airframe specs (verbatim from 20261028).
    v_airframe := CASE p_airframe
        WHEN 'business'   THEN jsonb_build_object('name','Business Jet','weight',2,  'pax',3,  'eng_min',1, 'eng_max',2, 'range',5,  'cost',18000000, 'time',6)
        WHEN 'regional'   THEN jsonb_build_object('name','Regional',    'weight',3,  'pax',10, 'eng_min',2, 'eng_max',2, 'range',3,  'cost',35000000, 'time',8)
        WHEN 'narrowbody' THEN jsonb_build_object('name','Narrowbody',  'weight',6,  'pax',25, 'eng_min',2, 'eng_max',2, 'range',7,  'cost',60000000, 'time',10)
        WHEN 'widebody'   THEN jsonb_build_object('name','Widebody',    'weight',10, 'pax',60, 'eng_min',2, 'eng_max',4, 'range',10, 'cost',75000000, 'time',12)
        ELSE NULL END;
    IF v_airframe IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_airframe'); END IF;

    -- Engine must be an available entrepreneur engine design (any corp).
    SELECT * INTO v_engine FROM ent_aircraft_designs
     WHERE id = p_engine_design_id AND design_type = 'engine' AND status = 'available';
    IF v_engine.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'engine_not_available'); END IF;

    IF p_engine_count IS NULL
       OR p_engine_count < (v_airframe->>'eng_min')::int
       OR p_engine_count > (v_airframe->>'eng_max')::int THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_engine_count',
            'allowed_min', (v_airframe->>'eng_min')::int, 'allowed_max', (v_airframe->>'eng_max')::int); END IF;

    IF p_mechanicals IS NOT NULL THEN
        FOREACH v_mech_id IN ARRAY p_mechanicals LOOP
            v_mech_spec := CASE v_mech_id
                WHEN 'hydraulics'         THEN jsonb_build_object('id','hydraulics',        'name','Standard Hydraulic Systems','weight',0.5, 'safety',1, 'cost',1000000)
                WHEN 'blackbox'           THEN jsonb_build_object('id','blackbox',          'name','Black Box & Flight Recorders','weight',0.3, 'safety',2, 'cost',1500000)
                WHEN 'redundant-avionics' THEN jsonb_build_object('id','redundant-avionics','name','Redundant Avionics Suite','weight',0.7, 'safety',3, 'cost',3000000)
                ELSE NULL END;
            IF v_mech_spec IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'unknown_mechanical', 'value', v_mech_id); END IF;
            v_mech_count := v_mech_count + 1;
            v_mech_weight := v_mech_weight + (v_mech_spec->>'weight')::numeric;
            v_mech_safety := v_mech_safety + (v_mech_spec->>'safety')::int;
            v_mech_cost := v_mech_cost + (v_mech_spec->>'cost')::bigint;
            v_mech_resolved := v_mech_resolved || jsonb_build_array(v_mech_spec);
        END LOOP;
    END IF;

    IF p_offerings IS NOT NULL THEN
        FOREACH v_off_id IN ARRAY p_offerings LOOP
            v_off_spec := CASE v_off_id
                WHEN 'ife'             THEN jsonb_build_object('id','ife',            'name','In-Flight Entertainment','weight',0.3, 'demand',1,  'pax',0, 'cost',1500000)
                WHEN 'premium-seating' THEN jsonb_build_object('id','premium-seating','name','Premium Seating','weight',0.4, 'demand',2,  'pax',0, 'cost',2000000)
                WHEN 'high-density'    THEN jsonb_build_object('id','high-density',   'name','High-Density Configuration','weight',0.2, 'demand',-1, 'pax',5, 'cost',1000000)
                ELSE NULL END;
            IF v_off_spec IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'unknown_offering', 'value', v_off_id); END IF;
            v_off_count := v_off_count + 1;
            v_off_weight := v_off_weight + (v_off_spec->>'weight')::numeric;
            v_off_demand := v_off_demand + (v_off_spec->>'demand')::int;
            v_off_pax    := v_off_pax    + (v_off_spec->>'pax')::int;
            v_off_cost   := v_off_cost   + (v_off_spec->>'cost')::bigint;
            v_off_resolved := v_off_resolved || jsonb_build_array(v_off_spec);
        END LOOP;
    END IF;

    v_total_thrust := COALESCE(v_engine.thrust, 0) * p_engine_count;
    v_total_weight := (v_airframe->>'weight')::numeric + COALESCE(v_engine.weight, 0) * p_engine_count + v_mech_weight + v_off_weight;

    IF v_total_weight <= 0 OR v_total_thrust < v_total_weight THEN
        v_ratio := CASE WHEN v_total_weight > 0 THEN v_total_thrust / v_total_weight ELSE 0 END;
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_thrust',
            'thrust', v_total_thrust, 'weight', v_total_weight, 'ratio', ROUND(v_ratio, 2)); END IF;

    v_ratio := v_total_thrust / v_total_weight;
    v_range := LEAST(10, GREATEST(0, (v_airframe->>'range')::numeric * v_ratio));
    v_passengers := (v_airframe->>'pax')::int + v_off_pax;
    v_demand_score := LEAST(10, GREATEST(0,
        5 + v_off_demand + CASE WHEN COALESCE(v_engine.reliability, 0) >= 70 THEN 1 ELSE 0 END));
    v_engine_safety_mod := floor((COALESCE(v_engine.reliability, 50) - 50) / 25.0)::int;
    v_safety_score := LEAST(10, GREATEST(0, 5 + v_mech_safety + v_engine_safety_mod));
    v_total_cost := (v_airframe->>'cost')::bigint + COALESCE(v_engine.cost_per_unit, 0) * p_engine_count + v_mech_cost + v_off_cost;
    v_module_time := CASE WHEN (v_mech_count + v_off_count) >= 2 THEN 2 ELSE 1 END;
    v_design_ticks := (v_airframe->>'time')::int + p_engine_count + v_module_time;
    v_quality := ROUND((v_range + LEAST(10, v_passengers / 6.0) + v_demand_score + v_safety_score)::numeric / 4.0, 2);

    IF COALESCE(v_corp.treasury_cash, 0) < 1000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury', 'need', 1000000); END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO ent_aircraft_designs (
        entrepreneur_corp_id, design_type, name, modules,
        thrust, weight, efficiency, reliability, quality, cost_per_unit,
        airframe_class, engine_design_id, engine_count, passengers, range_nm, demand_score, safety_score,
        status, research_ticks_total, research_ticks_remaining, research_cost_per_tick, created_at_tick
    ) VALUES (
        p_corp_id, 'aircraft', v_clean_name,
        jsonb_build_object('airframe', p_airframe, 'engine_id', p_engine_design_id,
            'engine_count', p_engine_count, 'mechanicals', v_mech_resolved, 'offerings', v_off_resolved),
        v_total_thrust, v_total_weight, COALESCE(v_engine.efficiency, 0), COALESCE(v_engine.reliability, 0), v_quality, v_total_cost,
        p_airframe, p_engine_design_id, p_engine_count, v_passengers, v_range, v_demand_score, v_safety_score,
        'researching', v_design_ticks, v_design_ticks, 1000000, v_tick
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'design_id', v_id, 'name', v_clean_name,
        'airframe', p_airframe, 'engine_count', p_engine_count,
        'thrust', v_total_thrust, 'weight', v_total_weight, 'thrust_weight_ratio', ROUND(v_ratio, 2),
        'range', v_range, 'passengers', v_passengers, 'demand', v_demand_score, 'safety', v_safety_score,
        'quality', v_quality, 'cost_per_unit', v_total_cost, 'research_ticks_total', v_design_ticks);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_design_aircraft(uuid,text,text,uuid,int,text[],text[]) TO authenticated;

-- ════════════════════════════════════════════════════════════════
-- process_ent_aircraft_designs — per-tick research advance ($1M/tick)
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.process_ent_aircraft_designs(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    d            RECORD;
    v_tick       int;
    v_advanced   int := 0;
    v_completed  int := 0;
    v_paused     int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, p_tick, 0);

    FOR d IN
        SELECT id, entrepreneur_corp_id, research_cost_per_tick, research_ticks_remaining
          FROM ent_aircraft_designs
         WHERE status = 'researching'
         FOR UPDATE
    LOOP
        -- Pay this tick's research from the corp treasury; pause if broke.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) - d.research_cost_per_tick
         WHERE id = d.entrepreneur_corp_id
           AND COALESCE(treasury_cash, 0) >= d.research_cost_per_tick;
        IF NOT FOUND THEN
            v_paused := v_paused + 1;
            CONTINUE;
        END IF;

        IF d.research_ticks_remaining - 1 <= 0 THEN
            UPDATE ent_aircraft_designs
               SET research_ticks_remaining = 0, status = 'available', completed_at_tick = v_tick
             WHERE id = d.id;
            v_completed := v_completed + 1;
        ELSE
            UPDATE ent_aircraft_designs
               SET research_ticks_remaining = research_ticks_remaining - 1
             WHERE id = d.id;
            v_advanced := v_advanced + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick,
        'advanced', v_advanced, 'completed', v_completed, 'paused', v_paused);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.process_ent_aircraft_designs(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_ent_aircraft_designs(int) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
