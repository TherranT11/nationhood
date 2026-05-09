-- ════════════════════════════════════════════════════════════════
-- Aviation Manufacturing — aircraft design research (Phase F slice 2)
--
-- Extends corp_aircraft_designs to hold aircraft-class designs
-- alongside engine designs. The flow mirrors engines:
--   1. Player picks airframe / engine model / count / mechanicals /
--      offerings in the modal, hits [Begin Design].
--   2. start_aircraft_design_research validates, computes totals,
--      enforces the physics check (total thrust >= total weight),
--      and INSERTs a row with status='researching' and
--      research_ticks_total = airframe.time + engine_count + module_time.
--   3. processAviationDesignResearch (advance-corp-tick) deducts
--      $1M / tick and decrements research_ticks_remaining; on 0 the
--      row flips to status='available'. Cash-broke = paused.
--
-- Hard gates enforced server-side:
--   1. Caller owns the corp.
--   2. Corp's sector is 'Aviation Manufacturing'.
--   3. Corp owns at least one active light_assembly_plant /
--      aircraft_assembly_facility / heavy_manufacturing_plant.
--   4. Engine reference exists in corp_aircraft_designs as
--      design_type='engine' AND status='available' (any corp).
--   5. Engine count is within the airframe's allowed range.
--   6. Total thrust >= total weight (physics).
--   7. Corp has >= $1M cash.
--
-- Airframe / mechanical / offering specs are encoded inline in the
-- RPC body. The client modal mirrors these constants — keep in sync
-- when tuning. Tier 2 widens the CASE ladders later.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── Schema additions for aircraft-class designs ─────────────────
-- Existing columns reused:
--   thrust  → total_thrust (sum across engines)
--   weight  → total_weight (airframe + engines + modules)
--   quality → composite of range/passengers/demand/safety
--   modules → JSONB grab-bag (airframe key + engine_design_id +
--             engine_count + mechanicals[] + offerings[])
ALTER TABLE public.corp_aircraft_designs
    ADD COLUMN IF NOT EXISTS airframe_class    TEXT,
    ADD COLUMN IF NOT EXISTS engine_design_id  UUID REFERENCES public.corp_aircraft_designs(id),
    ADD COLUMN IF NOT EXISTS engine_count      INT,
    ADD COLUMN IF NOT EXISTS passengers        INT,
    ADD COLUMN IF NOT EXISTS range_nm          NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS demand_score      INT,
    ADD COLUMN IF NOT EXISTS safety_score      INT;

CREATE INDEX IF NOT EXISTS idx_corp_aircraft_designs_engine_ref
    ON public.corp_aircraft_designs (engine_design_id)
    WHERE engine_design_id IS NOT NULL;


-- ── start_aircraft_design_research RPC ──────────────────────────
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

    -- Assembly-facility gate: any of the three industrial facility
    -- types qualifies. The engine gate is stricter; aircraft are not.
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

    -- Tier 1 airframe specs.
    v_airframe := CASE p_airframe
        WHEN 'business'   THEN jsonb_build_object('name','Business Jet','weight',2,  'pax',3,  'eng_min',1, 'eng_max',2, 'range',5,  'cost',18000000, 'time',6)
        WHEN 'regional'   THEN jsonb_build_object('name','Regional',    'weight',3,  'pax',10, 'eng_min',2, 'eng_max',2, 'range',3,  'cost',35000000, 'time',8)
        WHEN 'narrowbody' THEN jsonb_build_object('name','Narrowbody',  'weight',6,  'pax',25, 'eng_min',2, 'eng_max',2, 'range',7,  'cost',60000000, 'time',10)
        WHEN 'widebody'   THEN jsonb_build_object('name','Widebody',    'weight',10, 'pax',60, 'eng_min',2, 'eng_max',4, 'range',10, 'cost',75000000, 'time',12)
        ELSE NULL
    END;
    IF v_airframe IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid airframe class');
    END IF;

    -- Engine reference: must be an Available engine design (any corp).
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

    -- Resolve mechanicals (multi-select).
    IF p_mechanicals IS NOT NULL THEN
        FOREACH v_mech_id IN ARRAY p_mechanicals LOOP
            v_mech_spec := CASE v_mech_id
                WHEN 'hydraulics'           THEN jsonb_build_object('id','hydraulics',          'name','Standard Hydraulic Systems','weight',0.5, 'safety',1, 'cost',1000000)
                WHEN 'blackbox'             THEN jsonb_build_object('id','blackbox',            'name','Black Box & Flight Recorders','weight',0.3, 'safety',2, 'cost',1500000)
                WHEN 'redundant-avionics'   THEN jsonb_build_object('id','redundant-avionics',  'name','Redundant Avionics Suite','weight',0.7, 'safety',3, 'cost',3000000)
                ELSE NULL
            END;
            IF v_mech_spec IS NULL THEN
                RETURN jsonb_build_object('success', false, 'error', 'Unknown mechanical module: ' || v_mech_id);
            END IF;
            v_mech_count := v_mech_count + 1;
            v_mech_weight := v_mech_weight + (v_mech_spec->>'weight')::NUMERIC;
            v_mech_safety := v_mech_safety + (v_mech_spec->>'safety')::INT;
            v_mech_cost := v_mech_cost + (v_mech_spec->>'cost')::BIGINT;
            v_mech_resolved := v_mech_resolved || jsonb_build_array(v_mech_spec);
        END LOOP;
    END IF;

    -- Resolve offerings (multi-select).
    IF p_offerings IS NOT NULL THEN
        FOREACH v_off_id IN ARRAY p_offerings LOOP
            v_off_spec := CASE v_off_id
                WHEN 'ife'              THEN jsonb_build_object('id','ife',             'name','In-Flight Entertainment','weight',0.3, 'demand',1,  'pax',0, 'cost',1500000)
                WHEN 'premium-seating'  THEN jsonb_build_object('id','premium-seating', 'name','Premium Seating','weight',0.4, 'demand',2,  'pax',0, 'cost',2000000)
                WHEN 'high-density'     THEN jsonb_build_object('id','high-density',    'name','High-Density Configuration','weight',0.2, 'demand',-1, 'pax',5, 'cost',1000000)
                ELSE NULL
            END;
            IF v_off_spec IS NULL THEN
                RETURN jsonb_build_object('success', false, 'error', 'Unknown offering module: ' || v_off_id);
            END IF;
            v_off_count := v_off_count + 1;
            v_off_weight := v_off_weight + (v_off_spec->>'weight')::NUMERIC;
            v_off_demand := v_off_demand + (v_off_spec->>'demand')::INT;
            v_off_pax    := v_off_pax    + (v_off_spec->>'pax')::INT;
            v_off_cost   := v_off_cost   + (v_off_spec->>'cost')::BIGINT;
            v_off_resolved := v_off_resolved || jsonb_build_array(v_off_spec);
        END LOOP;
    END IF;

    -- Totals.
    v_total_thrust := COALESCE(v_engine.thrust, 0) * p_engine_count;
    v_engine_total_weight := COALESCE(v_engine.weight, 0) * p_engine_count;
    v_total_weight := (v_airframe->>'weight')::NUMERIC + v_engine_total_weight + v_mech_weight + v_off_weight;

    -- Physics check: thrust must meet or exceed weight.
    IF v_total_weight <= 0 OR v_total_thrust < v_total_weight THEN
        v_ratio := CASE WHEN v_total_weight > 0 THEN v_total_thrust / v_total_weight ELSE 0 END;
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient thrust. Total thrust %.1f vs weight %.1f (ratio %.2f). Add engines, pick a stronger engine, or drop modules.',
                v_total_thrust, v_total_weight, v_ratio));
    END IF;

    v_ratio := v_total_thrust / v_total_weight;

    -- Range scales linearly with thrust:weight ratio, capped 0–10.
    v_range := LEAST(10, GREATEST(0, (v_airframe->>'range')::NUMERIC * v_ratio));

    v_passengers := (v_airframe->>'pax')::INT + v_off_pax;

    -- Demand: base 5 + offerings + reliability bonus (if engine.rel >= 70).
    v_demand_score := LEAST(10, GREATEST(0,
        v_base_demand + v_off_demand
        + CASE WHEN COALESCE(v_engine.reliability, 0) >= 70 THEN 1 ELSE 0 END
    ));

    -- Safety: base 5 + mechanicals + engine reliability mod (-2..+2).
    v_engine_safety_mod := FLOOR((COALESCE(v_engine.reliability, 50) - 50) / 25.0)::INT;
    v_safety_score := LEAST(10, GREATEST(0,
        v_base_safety + v_mech_safety + v_engine_safety_mod
    ));

    -- Cost.
    v_engine_cost := COALESCE(v_engine.cost_per_unit, 0) * p_engine_count;
    v_total_cost := (v_airframe->>'cost')::BIGINT + v_engine_cost + v_mech_cost + v_off_cost;

    -- Design ticks: airframe construction + 1 per engine + module integration.
    v_engine_time := p_engine_count;
    v_module_time := CASE WHEN (v_mech_count + v_off_count) >= 2 THEN 2 ELSE 1 END;
    v_design_ticks := (v_airframe->>'time')::INT + v_engine_time + v_module_time;

    -- Composite quality (normalized 0-10 across the four player-facing
    -- aircraft stats; passengers normalized to 60 = 10).
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

COMMENT ON FUNCTION start_aircraft_design_research(UUID, TEXT, TEXT, UUID, INT, TEXT[], TEXT[]) IS
    'Kicks off aircraft design research. Validates ownership, sector, assembly-facility gate, engine reference, engine-count bounds, physics (thrust >= weight), and cash. Computes range/passengers/demand/safety/cost from airframe + engine + mechanicals + offerings. INSERTs a corp_aircraft_designs row with design_type=aircraft and status=researching; processAviationDesignResearch in advance-corp-tick deducts $1M/tick until status flips to available.';

NOTIFY pgrst, 'reload schema';

COMMIT;
