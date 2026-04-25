-- ════════════════════════════════════════════════════════════════════════════════
-- Construction Permits System — Phase 1: Schema + Seed Data
--
-- Permits exist because POLICIES exist. When a nation enacts a policy with a
-- permit_key, that permit becomes required for construction corps in that nation.
-- Repealing the policy removes the requirement.
--
-- 12 core permits across 6 categories for alpha launch.
-- ════════════════════════════════════════════════════════════════════════════════

-- ── 1. Reference table: all possible construction permits ──────────────────

CREATE TABLE IF NOT EXISTS construction_permits (
    permit_key          TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    category            TEXT NOT NULL,  -- zoning, safety, environmental, labor, specialized, financial
    description         TEXT,
    cost                BIGINT NOT NULL DEFAULT 0,          -- one-time application fee in dollars
    cost_is_percentage  BOOLEAN NOT NULL DEFAULT false,     -- true = cost is % of project value (e.g. P28)
    cost_percentage     NUMERIC(5,2) DEFAULT 0,             -- e.g. 3.0 for 3%
    processing_ticks    INT NOT NULL DEFAULT 2,             -- ticks to receive after applying (max 6)
    duration_ticks      INT,                                -- NULL = single-use, else how long it stays valid
    maintenance_per_tick BIGINT NOT NULL DEFAULT 0,         -- recurring cost per tick while active
    quality_bonus       INT NOT NULL DEFAULT 0,             -- inspection quality score bonus
    speed_penalty       NUMERIC(4,2) NOT NULL DEFAULT 0,    -- e.g. 0.05 = 5% slower construction
    event_modifiers     JSONB NOT NULL DEFAULT '{}',        -- { event_key: probability_multiplier } e.g. {"worker_safety_incident": 0.5}
    required_for        JSONB NOT NULL DEFAULT '[]',        -- ["civil_engineering", "industrial", "mega_project"]
    difficulty          TEXT NOT NULL DEFAULT 'EASY' CHECK (difficulty IN ('EASY', 'MODERATE', 'HARD', 'COMPLEX')),
    ministry            TEXT NOT NULL DEFAULT 'interior',    -- which ministry controls this
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Per-corporation permit holdings ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS corp_permits (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id          UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id           UUID NOT NULL REFERENCES nations(id),
    permit_key          TEXT NOT NULL REFERENCES construction_permits(permit_key),

    status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
    applied_at_tick     INT NOT NULL,
    granted_at_tick     INT,                    -- NULL while pending
    expires_at_tick     INT,                    -- NULL for single-use (expires on project completion)
    cost_paid           BIGINT NOT NULL DEFAULT 0,
    linked_contract_id  UUID REFERENCES construction_contracts(id) ON DELETE SET NULL,  -- for single-use permits

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One active/pending permit of each type per corp per nation
    UNIQUE(faction_id, nation_id, permit_key, status)
);

CREATE INDEX IF NOT EXISTS idx_corp_permits_faction ON corp_permits(faction_id);
CREATE INDEX IF NOT EXISTS idx_corp_permits_nation ON corp_permits(nation_id);
CREATE INDEX IF NOT EXISTS idx_corp_permits_status ON corp_permits(status) WHERE status IN ('pending', 'active');

-- RLS
ALTER TABLE construction_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE corp_permits ENABLE ROW LEVEL SECURITY;

-- Reference data readable by all
CREATE POLICY "permits_ref_select" ON construction_permits
    FOR SELECT TO authenticated USING (true);

-- Corp permits: readable by all, manageable by owner
CREATE POLICY "corp_permits_select" ON corp_permits
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "corp_permits_insert" ON corp_permits
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "corp_permits_update" ON corp_permits
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "corp_permits_delete" ON corp_permits
    FOR DELETE TO authenticated USING (true);


-- ── 3. Link policies to permits ────────────────────────────────────────────

ALTER TABLE policies
    ADD COLUMN IF NOT EXISTS permit_key TEXT REFERENCES construction_permits(permit_key);

COMMENT ON COLUMN policies.permit_key IS
    'If set, enacting this policy makes the referenced permit required for construction corps in the nation. Repealing removes the requirement.';


-- ── 4. Seed 12 core permits ────────────────────────────────────────────────

INSERT INTO construction_permits
    (permit_key, name, category, description, cost, processing_ticks, duration_ticks, maintenance_per_tick, quality_bonus, speed_penalty, event_modifiers, required_for, difficulty, ministry)
VALUES
    -- ZONING & LAND USE
    ('municipal_zoning', 'Municipal Zoning Approval', 'zoning',
     'Allows construction within municipal boundaries. The most basic permit — without it you cannot bid on any project in a city.',
     120000, 2, 24, 0, 0, 0, '{}',
     '["civil_engineering", "industrial", "mega_project"]', 'EASY', 'interior'),

    -- STRUCTURAL & SAFETY
    ('structural_engineering', 'Structural Engineering Certification', 'safety',
     'Certifies the corporation employs qualified structural engineers. Without it, inspection applies a -10 quality penalty on structural category.',
     85000, 2, 24, 0, 5, 0, '{}',
     '["civil_engineering", "industrial", "mega_project"]', 'EASY', 'infrastructure'),

    ('fire_safety', 'Fire Safety Compliance Certificate', 'safety',
     'Requires fire suppression systems, emergency exits, and fire-resistant materials. Adds ~3% to material costs but provides +2 quality bonus at inspection.',
     65000, 2, 24, 0, 2, 0, '{}',
     '["civil_engineering"]', 'EASY', 'interior'),

    -- ENVIRONMENTAL
    ('environmental_impact', 'Environmental Impact Assessment Certificate', 'environmental',
     'Full environmental survey before work begins. 6-tick processing includes public comment, ecological survey, and regulatory review. Dramatically reduces contamination discovery events.',
     340000, 6, 36, 10000, 3, 0, '{"environmental_contamination": 0.1}',
     '["industrial", "mega_project"]', 'COMPLEX', 'environment'),

    ('air_quality', 'Air Quality & Dust Control Certificate', 'environmental',
     'Requires dust suppression and particulate monitoring during construction. Reduces community opposition events.',
     55000, 1, 24, 2000, 0, 0, '{"local_community_opposition": 0.7}',
     '["civil_engineering", "industrial"]', 'EASY', 'environment'),

    ('waste_management', 'Waste Management & Disposal License', 'environmental',
     'Requires proper sorting, recycling, and disposal of construction waste. Provides +1 quality at inspection for clean site operations.',
     110000, 2, 24, 4000, 1, 0, '{}',
     '["civil_engineering", "industrial", "mega_project"]', 'EASY', 'environment'),

    -- LABOR & WORKFORCE
    ('ohs_compliance', 'Occupational Health & Safety Certificate', 'labor',
     'Requires safety officers, PPE, training programs, and incident reporting. Reduces worker safety incident probability by 50%.',
     150000, 3, 24, 6000, 2, 0, '{"worker_safety_incident": 0.5}',
     '["civil_engineering", "industrial", "mega_project"]', 'MODERATE', 'labor'),

    ('working_hours', 'Working Hours Compliance Certificate', 'labor',
     'Limits working hours to 10/day with overtime pay. Reduces speed by 8% but fewer safety incidents (-20%) and better quality (+1).',
     60000, 1, 24, 2000, 1, 0.08, '{"worker_safety_incident": 0.8}',
     '["civil_engineering", "industrial", "mega_project"]', 'EASY', 'labor'),

    ('union_representation', 'Union Representation Compliance', 'labor',
     'Requires allowing union representatives on-site. Increases wages ~5% but reduces strike probability by 70%.',
     45000, 1, 24, 0, 0, 0, '{"union_strike": 0.3}',
     '["civil_engineering", "industrial", "mega_project"]', 'EASY', 'labor'),

    -- SPECIALIZED & TECHNICAL
    ('heavy_transport', 'Heavy Transport Corridor Access', 'specialized',
     'Required for moving heavy equipment on national roads. Without it, Tier 2+ equipment cannot be transported to site.',
     60000, 1, 12, 0, 0, 0, '{}',
     '["industrial", "mega_project"]', 'EASY', 'infrastructure'),

    -- FINANCIAL & INSURANCE
    ('performance_bond', 'Performance Bond Certificate', 'financial',
     'Requires posting a bond guaranteeing project completion. Protects the client if the corp goes bankrupt mid-build. Cost is 3% of project value.',
     0, 2, NULL, 0, 0, 0, '{}',
     '["civil_engineering", "industrial", "mega_project"]', 'MODERATE', 'finance'),

    ('tax_compliance', 'Tax Compliance Clearance', 'financial',
     'Confirms the corporation has paid all taxes. Cheapest permit but must be renewed annually. Required for government contracts.',
     35000, 2, 12, 0, 0, 0, '{}',
     '["civil_engineering", "industrial", "mega_project"]', 'EASY', 'finance')

ON CONFLICT (permit_key) DO NOTHING;

-- Set P28 (Performance Bond) as percentage-based
UPDATE construction_permits
SET cost_is_percentage = true, cost_percentage = 3.0
WHERE permit_key = 'performance_bond';


-- ════════════════════════════════════════════════════════════════════════════════
-- RPC: apply_for_permit
--
-- Corporation applies for a permit. Validates nation requires it (via active
-- laws with permit_key), deducts application fee from corp cash, creates
-- pending record. Tick processor advances processing counter.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION apply_for_permit(
    p_faction_id UUID,
    p_nation_id UUID,
    p_permit_key TEXT,
    p_current_tick INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_permit construction_permits%ROWTYPE;
    v_cash BIGINT;
    v_cost BIGINT;
    v_existing_count INT;
BEGIN
    -- 1. Validate permit exists
    SELECT * INTO v_permit FROM construction_permits WHERE permit_key = p_permit_key;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unknown permit: ' || p_permit_key);
    END IF;

    -- 2. Check if corp already has this permit active or pending
    SELECT COUNT(*) INTO v_existing_count
    FROM corp_permits
    WHERE faction_id = p_faction_id
      AND nation_id = p_nation_id
      AND permit_key = p_permit_key
      AND status IN ('pending', 'active');

    IF v_existing_count > 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'You already have this permit (active or pending)');
    END IF;

    -- 3. Check corp has enough cash
    SELECT corp_cash_reserves INTO v_cash
    FROM factions WHERE id = p_faction_id
    FOR UPDATE;

    v_cost := v_permit.cost;
    -- For percentage-based permits, use a flat $150K placeholder (actual % calculated at bid time)
    IF v_permit.cost_is_percentage THEN
        v_cost := 150000;
    END IF;

    IF v_cash IS NULL OR v_cash < v_cost THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds (need $' || (v_cost / 1000) || 'K, have $' || COALESCE(v_cash / 1000, 0) || 'K)');
    END IF;

    -- 4. Deduct cost
    UPDATE factions
    SET corp_cash_reserves = corp_cash_reserves - v_cost
    WHERE id = p_faction_id;

    -- 5. Create pending permit
    INSERT INTO corp_permits (faction_id, nation_id, permit_key, status, applied_at_tick, cost_paid)
    VALUES (p_faction_id, p_nation_id, p_permit_key, 'pending', p_current_tick, v_cost);

    RETURN jsonb_build_object(
        'success', true,
        'permit', p_permit_key,
        'cost_paid', v_cost,
        'processing_ticks', v_permit.processing_ticks,
        'granted_at_tick', p_current_tick + v_permit.processing_ticks
    );
END;
$$;

ALTER FUNCTION apply_for_permit(UUID, UUID, TEXT, INT) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION apply_for_permit(UUID, UUID, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_for_permit(UUID, UUID, TEXT, INT) TO service_role;
