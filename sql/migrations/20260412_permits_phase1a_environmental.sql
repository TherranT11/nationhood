-- ════════════════════════════════════════════════════════════════════════════════
-- Construction Permits — Phase 1A: Environmental (3 new permits + policies)
--
-- 1. noise_vibration       — Noise & Vibration Control
-- 2. hazmat_handling       — Hazardous Materials Handling
-- 3. water_resource        — Water Resource Management
-- ════════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════════
-- PERMITS
-- ════════════════════════════════════════════════════════════════════════════════

INSERT INTO construction_permits
    (permit_key, name, category, description, cost, processing_ticks, duration_ticks, maintenance_per_tick, quality_bonus, speed_penalty, event_modifiers, required_for, difficulty, ministry)
VALUES

    -- ── Noise & Vibration Control ──────────────────────────────────────────────
    -- Urban construction near residential areas must limit noise and vibration.
    -- Reduces community opposition but slows work (noise-limited hours).
    ('noise_vibration', 'Noise & Vibration Control Certificate', 'environmental',
     'Requires noise monitoring, vibration dampening, and restricted work hours near residential areas. Reduces community opposition events by 60% but slows construction by 5%. Essential for urban and residential-adjacent projects.',
     75000, 2, 24, 3000, 1, 0.05, '{"community_opposition": 0.4}',
     '["civil_engineering"]', 'EASY', 'interior'),

    -- ── Hazardous Materials Handling ───────────────────────────────────────────
    -- Chemical sites, refineries, brownfield remediation — anything with toxic risk.
    -- High cost, long processing. Dramatically reduces contamination events.
    ('hazmat_handling', 'Hazardous Materials Handling License', 'environmental',
     'Certifies the corporation can safely handle, store, transport, and dispose of hazardous materials including chemicals, fuels, asbestos, and industrial waste. Dramatically reduces environmental contamination events. Required for industrial chemical sites and brownfield remediation.',
     220000, 4, 24, 8000, 3, 0, '{"environmental_contamination": 0.3}',
     '["industrial", "mega_project"]', 'HARD', 'environment'),

    -- ── Water Resource Management ─────────────────────────────────────────────
    -- Projects near waterways, aquifers, or with heavy water usage.
    -- Protects water table, reduces flooding damage.
    ('water_resource', 'Water Resource Management Permit', 'environmental',
     'Requires water table impact assessment, runoff management, and aquifer protection measures for construction near waterways or projects with significant water usage. Reduces flooding damage events by 50%. Critical for waterfront and flood plain projects.',
     130000, 3, 24, 5000, 2, 0, '{"flooding_damage": 0.5}',
     '["civil_engineering", "industrial", "mega_project"]', 'MODERATE', 'environment')

ON CONFLICT (permit_key) DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════════
-- POLICIES (one per permit — enacting the policy makes the permit required)
-- ════════════════════════════════════════════════════════════════════════════════

-- ── Noise & Vibration Control Act ─────────────────────────────────────────────
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
    'permit_noise_vibration_' || to_hex(extract(epoch from now())::int),
    'Construction Noise & Vibration Control Act',
    'structural',
    'Requires all construction sites near residential areas to obtain a Noise & Vibration Control Certificate ($75K, 2 ticks). Mandates noise monitoring, restricted work hours, and vibration dampening. Slows urban construction by 5% but dramatically reduces community disruption and opposition.',
    'PERMITS', 'Environmental', 'Environmental', 'Interior',
    'Equality', '["Equality","Security"]'::jsonb,
    1, 'population',
    0.3, 'population',
    '[
        {"stat_key":"happiness",      "direction":"up",  "rate":0.05, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"civil_unrest",   "direction":"down","rate":0.02, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"cost_of_living", "direction":"up",  "rate":0.03, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'happiness', 'UP', 0.05, 48, 0, 100, 0.3, true,
    'noise_vibration'
);

-- ── Hazardous Materials Safety Act ────────────────────────────────────────────
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
    'permit_hazmat_handling_' || to_hex(extract(epoch from now())::int),
    'Hazardous Materials Safety Act',
    'structural',
    'Mandates a Hazardous Materials Handling License ($220K, 4 ticks) for any construction involving chemicals, fuels, asbestos, or industrial waste. The most expensive environmental permit — corporations must prove they can safely handle toxic materials before breaking ground on chemical or industrial sites.',
    'PERMITS', 'Environmental', 'Environmental', 'Energy',
    'Security', '["Security","Equality"]'::jsonb,
    3, 'population',
    1.0, 'population',
    '[
        {"stat_key":"pollution",             "direction":"down","rate":0.15, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_quality",    "direction":"up",  "rate":0.05, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"gdp_growth",            "direction":"down","rate":0.05, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"manufacturing_output",  "direction":"down","rate":0.05, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'pollution', 'DOWN', 0.15, 48, 0, 100, 1.0, true,
    'hazmat_handling'
);

-- ── Water Resource Protection Act ─────────────────────────────────────────────
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
    'permit_water_resource_' || to_hex(extract(epoch from now())::int),
    'Water Resource Protection Act',
    'structural',
    'Requires a Water Resource Management Permit ($130K, 3 ticks) for construction near waterways, flood plains, or projects with significant water usage. Protects groundwater, mandates runoff management, and requires aquifer impact assessments. Reduces flooding damage risk by 50%.',
    'PERMITS', 'Environmental', 'Environmental', 'Energy',
    'Equality', '["Equality"]'::jsonb,
    2, 'population',
    0.5, 'population',
    '[
        {"stat_key":"pollution",       "direction":"down","rate":0.1,  "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"arable_land",     "direction":"up",  "rate":0.03, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_accessibility","direction":"up","rate":0.03,"delay_ticks":5,"duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'pollution', 'DOWN', 0.1, 48, 0, 100, 0.5, true,
    'water_resource'
);

COMMIT;
