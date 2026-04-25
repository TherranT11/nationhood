-- ════════════════════════════════════════════════════════════════════════════════
-- Construction Permits — Phase 1B: Specialized (5 new permits + policies)
--
-- 1. coastal_maritime        — Coastal & Maritime
-- 2. renewable_energy        — Renewable Energy Certification
-- 3. telecom_infrastructure  — Telecommunications Infrastructure
-- 4. agri_land_conversion    — Agricultural Land Conversion
-- 5. heritage_preservation   — Heritage & Cultural Preservation
-- ════════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════════
-- PERMITS
-- ════════════════════════════════════════════════════════════════════════════════

INSERT INTO construction_permits
    (permit_key, name, category, description, cost, processing_ticks, duration_ticks, maintenance_per_tick, quality_bonus, speed_penalty, event_modifiers, required_for, difficulty, ministry)
VALUES

    -- ── Coastal & Maritime ─────────────────────────────────────────────────────
    -- Ports, waterfront structures, offshore platforms. Must account for
    -- tidal forces, salt corrosion, storm surge. High quality bonus
    -- reflects specialist engineering standards.
    ('coastal_maritime', 'Coastal & Maritime Construction Permit', 'specialized',
     'Required for construction in coastal zones, ports, and offshore structures. Mandates tidal impact assessment, salt corrosion protection, and storm surge resilience. Reduces storm damage events by 40%. Essential for port expansion and waterfront development.',
     180000, 3, 24, 6000, 3, 0, '{"storm_damage": 0.6}',
     '["civil_engineering", "industrial", "mega_project"]', 'MODERATE', 'infrastructure'),

    -- ── Renewable Energy Certification ─────────────────────────────────────────
    -- Solar, wind, hydroelectric. Certifies grid integration capability
    -- and environmental compliance for energy installations.
    ('renewable_energy', 'Renewable Energy Installation Certificate', 'specialized',
     'Certifies the corporation can design, build, and commission renewable energy installations that safely integrate with the national power grid. Covers solar arrays, wind farms, and small-scale hydroelectric. Required for all green energy construction.',
     150000, 3, 24, 5000, 3, 0, '{}',
     '["civil_engineering", "industrial", "mega_project"]', 'MODERATE', 'energy'),

    -- ── Telecommunications Infrastructure ──────────────────────────────────────
    -- Fiber optic, cell towers, data centers. Requires spectrum compliance
    -- and signal interference assessment.
    ('telecom_infrastructure', 'Telecommunications Infrastructure License', 'specialized',
     'Required for construction of telecommunications infrastructure including fiber optic networks, cell towers, and data centers. Mandates spectrum compliance, signal interference assessment, and electromagnetic safety standards.',
     95000, 2, 24, 4000, 2, 0, '{}',
     '["civil_engineering", "industrial"]', 'EASY', 'infrastructure'),

    -- ── Agricultural Land Conversion ───────────────────────────────────────────
    -- Single-use permit to convert farmland to development. The only permit
    -- that REDUCES arable_land — directly ties into the food sub-sector system.
    -- Expensive and slow to discourage casual conversion.
    ('agri_land_conversion', 'Agricultural Land Conversion Permit', 'specialized',
     'Single-use permit authorizing the conversion of designated agricultural land to commercial or residential development. Requires soil assessment, food security impact review, and alternative farmland identification. The only construction permit that directly reduces the nation''s arable land — every conversion shrinks the food production base.',
     200000, 4, NULL, 0, 1, 0, '{}',
     '["civil_engineering", "industrial"]', 'HARD', 'interior'),

    -- ── Heritage & Cultural Preservation ───────────────────────────────────────
    -- Construction near historical sites. Highest quality bonus of any permit
    -- but significant speed penalty (12%) for careful preservation work.
    ('heritage_preservation', 'Heritage & Cultural Preservation Certificate', 'specialized',
     'Required for construction adjacent to or involving registered heritage sites. Mandates archaeological survey, preservation methodology review, and cultural impact assessment. The highest quality bonus of any permit (+5) but imposes a 12% speed penalty for careful, preservation-grade work.',
     160000, 4, 24, 6000, 5, 0.12, '{"heritage_damage": 0.2}',
     '["civil_engineering", "mega_project"]', 'HARD', 'interior')

ON CONFLICT (permit_key) DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════════
-- POLICIES
-- ════════════════════════════════════════════════════════════════════════════════

-- ── Coastal Construction Safety Act ───────────────────────────────────────────
INSERT INTO policies (
    policy_key, policy_name, policy_type, description,
    major_sector, minor_sector, law_category, fiscal_category,
    ideology, ideologies,
    upfront_cost, upfront_scaling_stat,
    ongoing_base_cost, ongoing_scaling_stat,
    stat_effects,
    target_stat, stat_direction, stat_change_per_tick, duration_months,
    stat_floor, stat_ceiling, ongoing_cost_per_tick, is_active,
    permit_key
) VALUES (
    'permit_coastal_maritime_' || to_hex(extract(epoch from now())::int),
    'Coastal Construction Safety Act',
    'structural',
    'Requires a Coastal & Maritime Construction Permit ($180K, 3 ticks) for all projects in coastal zones, ports, and offshore structures. Mandates tidal impact assessment and storm surge resilience standards. Protects critical trade infrastructure from environmental damage.',
    'PERMITS', 'Specialized', 'Safety', 'Transportation',
    'Security', '["Security","Progress"]'::jsonb,
    2, 'population',
    0.5, 'population',
    '[
        {"stat_key":"trade_balance",            "direction":"up",  "rate":0.04, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"physical_infrastructure",  "direction":"up",  "rate":0.03, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"gdp_growth",               "direction":"down","rate":0.03, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'physical_infrastructure', 'UP', 0.03, 48, 0, 100, 0.5, true,
    'coastal_maritime'
);

-- ── National Renewable Energy Standards Act ───────────────────────────────────
INSERT INTO policies (
    policy_key, policy_name, policy_type, description,
    major_sector, minor_sector, law_category, fiscal_category,
    ideology, ideologies,
    upfront_cost, upfront_scaling_stat,
    ongoing_base_cost, ongoing_scaling_stat,
    stat_effects,
    target_stat, stat_direction, stat_change_per_tick, duration_months,
    stat_floor, stat_ceiling, ongoing_cost_per_tick, is_active,
    permit_key
) VALUES (
    'permit_renewable_energy_' || to_hex(extract(epoch from now())::int),
    'National Renewable Energy Standards Act',
    'structural',
    'Requires a Renewable Energy Installation Certificate ($150K, 3 ticks) for all solar, wind, and hydroelectric projects. Ensures grid integration safety and environmental compliance. Accelerates the transition to clean energy while maintaining construction standards.',
    'PERMITS', 'Specialized', 'Environmental', 'Energy',
    'Progress', '["Progress","Equality"]'::jsonb,
    3, 'population',
    0.8, 'population',
    '[
        {"stat_key":"renewable_energy_percentage","direction":"up",  "rate":0.1,  "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"carbon_emissions",           "direction":"down","rate":0.06, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"energy_generation",          "direction":"up",  "rate":0.04, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"gdp_growth",                 "direction":"down","rate":0.03, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'renewable_energy_percentage', 'UP', 0.1, 48, 0, 100, 0.8, true,
    'renewable_energy'
);

-- ── Telecommunications Infrastructure Standards Act ───────────────────────────
INSERT INTO policies (
    policy_key, policy_name, policy_type, description,
    major_sector, minor_sector, law_category, fiscal_category,
    ideology, ideologies,
    upfront_cost, upfront_scaling_stat,
    ongoing_base_cost, ongoing_scaling_stat,
    stat_effects,
    target_stat, stat_direction, stat_change_per_tick, duration_months,
    stat_floor, stat_ceiling, ongoing_cost_per_tick, is_active,
    permit_key
) VALUES (
    'permit_telecom_infrastructure_' || to_hex(extract(epoch from now())::int),
    'Telecommunications Infrastructure Standards Act',
    'structural',
    'Requires a Telecommunications Infrastructure License ($95K, 2 ticks) for fiber optic, cell tower, and data center construction. Ensures spectrum compliance and signal safety. The cheapest specialized permit — designed to enable digital growth while maintaining basic standards.',
    'PERMITS', 'Specialized', 'Infrastructure', 'Transportation',
    'Progress', '["Progress","Liberty"]'::jsonb,
    1, 'population',
    0.3, 'population',
    '[
        {"stat_key":"digital_infrastructure",  "direction":"up",  "rate":0.08, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"service_output",          "direction":"up",  "rate":0.04, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'digital_infrastructure', 'UP', 0.08, 48, 0, 100, 0.3, true,
    'telecom_infrastructure'
);

-- ── Agricultural Land Preservation Act ────────────────────────────────────────
INSERT INTO policies (
    policy_key, policy_name, policy_type, description,
    major_sector, minor_sector, law_category, fiscal_category,
    ideology, ideologies,
    upfront_cost, upfront_scaling_stat,
    ongoing_base_cost, ongoing_scaling_stat,
    stat_effects,
    target_stat, stat_direction, stat_change_per_tick, duration_months,
    stat_floor, stat_ceiling, ongoing_cost_per_tick, is_active,
    permit_key
) VALUES (
    'permit_agri_land_conversion_' || to_hex(extract(epoch from now())::int),
    'Agricultural Land Preservation Act',
    'structural',
    'Requires an Agricultural Land Conversion Permit ($200K, 4 ticks, single-use) before any farmland can be rezoned for development. Each conversion permanently reduces the nation''s arable land, shrinking food production. Without this law, developers can freely pave over farms — with it, every acre lost requires a food security impact review.',
    'PERMITS', 'Specialized', 'Environmental', 'Interior',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    2, 'population',
    0.4, 'population',
    '[
        {"stat_key":"arable_land",      "direction":"up",  "rate":0.05, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"urbanization",     "direction":"down","rate":0.03, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"gdp_growth",       "direction":"down","rate":0.05, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'arable_land', 'UP', 0.05, 48, 0, 100, 0.4, true,
    'agri_land_conversion'
);

-- ── National Heritage Protection Act ──────────────────────────────────────────
INSERT INTO policies (
    policy_key, policy_name, policy_type, description,
    major_sector, minor_sector, law_category, fiscal_category,
    ideology, ideologies,
    upfront_cost, upfront_scaling_stat,
    ongoing_base_cost, ongoing_scaling_stat,
    stat_effects,
    target_stat, stat_direction, stat_change_per_tick, duration_months,
    stat_floor, stat_ceiling, ongoing_cost_per_tick, is_active,
    permit_key
) VALUES (
    'permit_heritage_preservation_' || to_hex(extract(epoch from now())::int),
    'National Heritage Protection Act',
    'structural',
    'Requires a Heritage & Cultural Preservation Certificate ($160K, 4 ticks) for construction near registered historical sites. Mandates archaeological survey and preservation-grade techniques. Provides the highest quality bonus (+5) of any permit but slows construction by 12%. Popular with voters and the international community — repeal risks cultural destruction.',
    'PERMITS', 'Specialized', 'Safety', 'Interior',
    'Tradition', '["Tradition","Collectivism"]'::jsonb,
    2, 'population',
    0.5, 'population',
    '[
        {"stat_key":"happiness",                 "direction":"up",  "rate":0.06, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"up",  "rate":0.05, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"gdp_growth",                "direction":"down","rate":0.04, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'happiness', 'UP', 0.06, 48, 0, 100, 0.5, true,
    'heritage_preservation'
);

COMMIT;
