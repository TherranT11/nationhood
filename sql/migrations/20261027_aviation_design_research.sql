-- ════════════════════════════════════════════════════════════════
-- Aviation Manufacturing — engine + airframe design research
--
-- Player-facing Phase F slice 1: design engines. Click the
-- "+ Design Engine" button on aviation-operations, pick three Tier 1
-- modules (combustion / frame / control), name the engine, hit
-- "Begin Research". The engine spends 7 + 1d6 ticks (8-13) in R&D at
-- $1M / tick before graduating to Current Designs as an inventory-on-
-- hand product the corp can later produce + sell to airlines.
--
-- Hard gates enforced server-side by start_engine_design_research:
--   1. Caller must own the corp.
--   2. Corp's sector must be 'Aviation Manufacturing'.
--   3. Corp must own at least one active light_industrial_facility OR
--      engine_assembly_plant — gating on engine_assembly_plant per the
--      design call (you can only PRODUCE engines if you have an Engine
--      Assembly Plant; designing without the plant is meaningless).
--   4. Corp needs >= $1M cash to start a research project.
--
-- Module specs are encoded inline in the RPC body (Tier 1 only).
-- When Tier 2 unlocks land we'll either widen the CASE ladder or
-- promote it to a config table; today's three-options-per-module
-- surface keeps the inline form readable.
--
-- Research progress is advanced by processAviationDesignResearch in
-- advance-corp-tick: deduct $1M, decrement research_ticks_remaining;
-- on 0, flip status to 'available' and stamp completed_at_tick. If
-- the corp goes broke mid-research the project pauses (no progress,
-- no charge) until cash returns.
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.corp_aircraft_designs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id      UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    design_type  TEXT NOT NULL CHECK (design_type IN ('engine', 'aircraft')),
    name         TEXT NOT NULL,
    modules      JSONB NOT NULL,

    thrust         NUMERIC(5,2),
    weight         NUMERIC(5,2),
    efficiency     INT,
    reliability    INT,
    quality        NUMERIC(4,2),
    cost_per_unit  BIGINT,

    inventory_on_hand INT NOT NULL DEFAULT 0 CHECK (inventory_on_hand >= 0),

    status                    TEXT   NOT NULL DEFAULT 'researching'
        CHECK (status IN ('researching', 'available', 'cancelled')),
    research_ticks_total      INT    NOT NULL,
    research_ticks_remaining  INT    NOT NULL,
    research_cost_per_tick    BIGINT NOT NULL DEFAULT 1000000,

    created_at_tick   INT,
    completed_at_tick INT,
    is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corp_aircraft_designs_corp
    ON public.corp_aircraft_designs (corp_id);
CREATE INDEX IF NOT EXISTS idx_corp_aircraft_designs_research
    ON public.corp_aircraft_designs (corp_id, status)
    WHERE status = 'researching';

ALTER TABLE public.corp_aircraft_designs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "corp_aircraft_designs_read_all" ON public.corp_aircraft_designs;
CREATE POLICY "corp_aircraft_designs_read_all"
    ON public.corp_aircraft_designs FOR SELECT USING (true);

COMMENT ON TABLE public.corp_aircraft_designs IS
    'Aviation Manufacturing engine + airframe designs. Created via start_engine_design_research / start_aircraft_design_research RPCs. Research advances per-tick in advance-corp-tick (processAviationDesignResearch). Once complete, inventory_on_hand is incremented by the production loop (Phase F follow-up).';


-- ── start_engine_design_research RPC ────────────────────────────
CREATE OR REPLACE FUNCTION start_engine_design_research(
    p_corp_id    UUID,
    p_name       TEXT,
    p_combustion TEXT,
    p_frame      TEXT,
    p_control    TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_corp factions%ROWTYPE;
    v_combustion JSONB;
    v_frame JSONB;
    v_control JSONB;
    v_thrust NUMERIC := 0;
    v_weight NUMERIC := 0;
    v_efficiency INT  := 0;
    v_reliability INT := 0;
    v_quality NUMERIC := 0;
    v_cost_per_unit BIGINT := 0;
    v_research_ticks INT;
    v_tick INT;
    v_design_id UUID;
    v_has_plant BOOLEAN;
    v_clean_name TEXT;
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
        RETURN jsonb_build_object('success', false, 'error', 'Only Aviation Manufacturing corporations can design engines');
    END IF;

    -- Engine Assembly Plant gate (option A from the design discussion).
    SELECT EXISTS (
        SELECT 1 FROM corp_properties
         WHERE faction_id = p_corp_id
           AND type = 'engine_assembly_plant'
           AND is_active = TRUE
    ) INTO v_has_plant;
    IF NOT v_has_plant THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Requires an Engine Assembly Plant. Build one from the Expansion tab first.');
    END IF;

    v_clean_name := NULLIF(TRIM(SUBSTRING(COALESCE(p_name, ''), 1, 60)), '');
    IF v_clean_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Engine name required');
    END IF;

    -- Tier 1 module specs (inline; Tier 2 widens this CASE later).
    v_combustion := CASE p_combustion
        WHEN 'single-stage'  THEN jsonb_build_object('name','Single-Stage Compressor', 'thrust',2,   'weight',0.5, 'eff',30, 'rel',0,  'cost',1500000)
        WHEN 'twin-spool'    THEN jsonb_build_object('name','Twin-Spool Configuration','thrust',3,   'weight',0.8, 'eff',40, 'rel',0,  'cost',2500000)
        WHEN 'high-pressure' THEN jsonb_build_object('name','High-Pressure Core',      'thrust',4,   'weight',1.2, 'eff',25, 'rel',-5, 'cost',4000000)
        ELSE NULL
    END;
    v_frame := CASE p_frame
        WHEN 'steel-casting'       THEN jsonb_build_object('name','Steel Casting',       'thrust',0,   'weight',1.5, 'eff',0,  'rel',20, 'cost',1000000)
        WHEN 'aluminum-alloy'      THEN jsonb_build_object('name','Aluminum Alloy Frame','thrust',0,   'weight',0.8, 'eff',5,  'rel',15, 'cost',1800000)
        WHEN 'magnesium-composite' THEN jsonb_build_object('name','Magnesium Composite', 'thrust',0.5, 'weight',0.4, 'eff',10, 'rel',10, 'cost',3000000)
        ELSE NULL
    END;
    v_control := CASE p_control
        WHEN 'mechanical-governor' THEN jsonb_build_object('name','Mechanical Governor',     'thrust',0,   'weight',0.2, 'eff',10, 'rel',25, 'cost',800000)
        WHEN 'hydraulic-control'   THEN jsonb_build_object('name','Hydraulic Control Unit',  'thrust',0.5, 'weight',0.4, 'eff',20, 'rel',30, 'cost',1500000)
        WHEN 'early-electronic'    THEN jsonb_build_object('name','Early Electronic Controls','thrust',1,  'weight',0.3, 'eff',30, 'rel',35, 'cost',2500000)
        ELSE NULL
    END;
    IF v_combustion IS NULL OR v_frame IS NULL OR v_control IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid module selection');
    END IF;

    v_thrust := (v_combustion->>'thrust')::NUMERIC + (v_frame->>'thrust')::NUMERIC + (v_control->>'thrust')::NUMERIC;
    v_weight := (v_combustion->>'weight')::NUMERIC + (v_frame->>'weight')::NUMERIC + (v_control->>'weight')::NUMERIC;
    v_efficiency  := LEAST(100, GREATEST(0, ((v_combustion->>'eff')::INT + (v_frame->>'eff')::INT + (v_control->>'eff')::INT)));
    v_reliability := LEAST(100, GREATEST(0, ((v_combustion->>'rel')::INT + (v_frame->>'rel')::INT + (v_control->>'rel')::INT)));

    -- Quality: average of normalized 0-100 stats, then /10. Mirrors the
    -- modal's live-recalc formula so the value persisted matches what
    -- the player saw on the Begin Research button.
    v_quality := ROUND((
        (LEAST(100, v_thrust * 10)
        + GREATEST(0, (10 - v_weight) * 10)
        + v_efficiency
        + v_reliability) / 4 / 10
    )::NUMERIC, 2);

    v_cost_per_unit := (v_combustion->>'cost')::BIGINT
                     + (v_frame->>'cost')::BIGINT
                     + (v_control->>'cost')::BIGINT
                     + 1000000;

    -- Research duration: 7 + 1d6 = 8-13 ticks.
    v_research_ticks := 7 + (FLOOR(random() * 6)::INT + 1);

    IF COALESCE(v_corp.corp_cash_reserves, 0) < 1000000 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Insufficient cash. Research costs $1M per tick; need at least $1M to begin.');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO corp_aircraft_designs (
        corp_id, design_type, name, modules,
        thrust, weight, efficiency, reliability, quality, cost_per_unit,
        inventory_on_hand,
        status, research_ticks_total, research_ticks_remaining, research_cost_per_tick,
        created_at_tick
    ) VALUES (
        p_corp_id, 'engine', v_clean_name,
        jsonb_build_object('combustion', p_combustion, 'frame', p_frame, 'control', p_control),
        v_thrust, v_weight, v_efficiency, v_reliability, v_quality, v_cost_per_unit,
        0,
        'researching', v_research_ticks, v_research_ticks, 1000000,
        v_tick
    ) RETURNING id INTO v_design_id;

    RETURN jsonb_build_object(
        'success',              true,
        'design_id',            v_design_id,
        'name',                 v_clean_name,
        'thrust',               v_thrust,
        'weight',               v_weight,
        'efficiency',           v_efficiency,
        'reliability',          v_reliability,
        'quality',              v_quality,
        'cost_per_unit',        v_cost_per_unit,
        'research_ticks_total', v_research_ticks
    );
END;
$$;

GRANT EXECUTE ON FUNCTION start_engine_design_research(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION start_engine_design_research(UUID, TEXT, TEXT, TEXT, TEXT) IS
    'Kicks off engine design research. Validates ownership + Aviation Manufacturing sector + Engine Assembly Plant ownership + cash, computes engine stats from Tier 1 module choices, rolls 7+1d6 research ticks, INSERTs a corp_aircraft_designs row with status=researching. Per-tick processor in advance-corp-tick deducts $1M / tick and advances research_ticks_remaining; flips status to available on completion.';

NOTIFY pgrst, 'reload schema';

COMMIT;
