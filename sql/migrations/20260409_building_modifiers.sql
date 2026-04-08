-- ════════════════════════════════════════════════════════════════════════════════
-- Building Modifiers — Phase 1: Schema + Seed + Contract Integration
--
-- Building modifiers describe site/project characteristics that determine
-- which permits are required, affect costs, and influence reputation.
-- Auto-generated contracts get 0-3 modifiers rolled based on nation stats.
-- ════════════════════════════════════════════════════════════════════════════════

-- ── 1. Reference table: all possible building modifiers ────────────────────

CREATE TABLE IF NOT EXISTS building_modifiers (
    modifier_key        TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    category            TEXT NOT NULL,          -- site, nation, player_choice
    description         TEXT,
    cost_multiplier     NUMERIC(4,2) NOT NULL DEFAULT 1.0,   -- e.g. 1.15 = +15% cost
    reputation_bonus    INT NOT NULL DEFAULT 0,               -- rep change at delivery
    required_permits    JSONB NOT NULL DEFAULT '[]',          -- ["fire_safety", "structural_engineering"]
    probability_stat    TEXT,                                  -- nation stat that drives auto-roll probability
    probability_threshold INT DEFAULT 50,                     -- stat must be above this to roll
    probability_base    NUMERIC(4,2) DEFAULT 0.15,            -- base chance when stat threshold met
    applies_to          JSONB NOT NULL DEFAULT '["civil_engineering","industrial","mega_project"]',
    icon                TEXT DEFAULT '📍',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE building_modifiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "building_modifiers_select" ON building_modifiers
    FOR SELECT TO authenticated USING (true);

-- ── 2. Add modifiers column to construction_contracts ──────────────────────

ALTER TABLE construction_contracts
    ADD COLUMN IF NOT EXISTS modifiers JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN construction_contracts.modifiers IS
    'Array of modifier_key strings assigned to this contract. Determines extra permit requirements, cost multipliers, and reputation bonuses.';

-- ── 3. Seed 12 modifiers ───────────────────────────────────────────────────

INSERT INTO building_modifiers
    (modifier_key, name, category, description, cost_multiplier, reputation_bonus, required_permits, probability_stat, probability_threshold, probability_base, applies_to, icon)
VALUES
    -- SITE CHARACTERISTICS (auto-rolled based on nation stats)
    ('waterfront', 'Waterfront Property', 'site',
     'Construction on or adjacent to coastline. Requires coastal permits and marine-grade materials. Premium location commands higher reputation.',
     1.15, 4, '["municipal_zoning"]'::jsonb,
     'urbanization', 60, 0.12,
     '["civil_engineering"]'::jsonb, '🌊'),

    ('heritage_adjacent', 'Heritage-Adjacent Site', 'site',
     'Construction near designated heritage or cultural sites. Requires archaeological survey and preservation compliance. Prestigious but slow and expensive.',
     1.20, 5, '["municipal_zoning","environmental_impact"]'::jsonb,
     'stability', 60, 0.08,
     '["civil_engineering"]'::jsonb, '🏛️'),

    ('high_density_urban', 'High-Density Urban Zone', 'site',
     'Construction in a dense urban area with strict environmental and noise regulations. Higher costs but demonstrates urban development capability.',
     1.10, 1, '["air_quality","municipal_zoning"]'::jsonb,
     'urbanization', 70, 0.20,
     '["civil_engineering","industrial"]'::jsonb, '🏙️'),

    ('greenfield_rural', 'Greenfield Rural Site', 'site',
     'Construction on undeveloped rural land. Lower costs but limited infrastructure access. No special reputation benefit.',
     0.90, 0, '["municipal_zoning"]'::jsonb,
     'arable_land', 50, 0.15,
     '["civil_engineering","industrial"]'::jsonb, '🌾'),

    ('brownfield_redevelopment', 'Brownfield Redevelopment', 'site',
     'Rebuilding on a previously developed and potentially contaminated site. Expensive remediation but urban regeneration earns reputation.',
     1.25, 3, '["environmental_impact","waste_management"]'::jsonb,
     'urbanization', 60, 0.10,
     '["civil_engineering","industrial"]'::jsonb, '🏚️'),

    ('seismic_zone', 'Seismic Risk Zone', 'site',
     'Construction in an area with earthquake risk. Requires reinforced structural design and seismic-rated materials.',
     1.08, 2, '["structural_engineering"]'::jsonb,
     'stability', 30, 0.10,
     '["civil_engineering","industrial","mega_project"]'::jsonb, '🔶'),

    ('high_rise', 'High-Rise Development', 'site',
     'Building above 10 stories. Requires advanced structural and fire safety certification. Wind-load analysis and aviation clearance needed.',
     1.20, 3, '["structural_engineering","fire_safety"]'::jsonb,
     'urbanization', 80, 0.12,
     '["civil_engineering"]'::jsonb, '🏗️'),

    ('underground', 'Underground Construction', 'site',
     'Sub-grade construction below 10m depth. Requires geotechnical survey, utility mapping, and groundwater management. The most complex site modifier.',
     1.30, 4, '["structural_engineering","environmental_impact"]'::jsonb,
     NULL, 0, 0.05,
     '["mega_project"]'::jsonb, '⛏️'),

    -- NATION-SPECIFIC (auto-rolled)
    ('near_nuclear', 'Nuclear Proximity Zone', 'nation',
     'Construction within 30km of a nuclear facility. Requires radiation baseline survey and structural hardening.',
     1.15, 2, '["structural_engineering"]'::jsonb,
     'energy_generation', 70, 0.06,
     '["civil_engineering","industrial"]'::jsonb, '☢️'),

    -- PLAYER CHOICES (selectable at bid time)
    ('standard', 'Standard Build', 'player_choice',
     'No special site characteristics. Standard permits apply based on national law. The default option.',
     1.00, 0, '[]'::jsonb,
     NULL, 0, 0,
     '["civil_engineering","industrial","mega_project"]'::jsonb, '📋'),

    ('expedited', 'Expedited Construction', 'player_choice',
     'Fast-tracked permitting and accelerated schedule. Higher costs and reduced quality perception. All required permits still needed but processing time halved.',
     1.10, -2, '[]'::jsonb,
     NULL, 0, 0,
     '["civil_engineering","industrial"]'::jsonb, '⚡'),

    ('no_modifiers', 'Budget Build', 'player_choice',
     'Minimal site preparation and no special considerations. Cheapest option but signals cost-cutting to clients. Reputation penalty at delivery.',
     0.95, -3, '[]'::jsonb,
     NULL, 0, 0,
     '["civil_engineering","industrial"]'::jsonb, '💸')

ON CONFLICT (modifier_key) DO NOTHING;
