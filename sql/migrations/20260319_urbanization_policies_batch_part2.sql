-- Batch insert: Urbanization policies part 2 (6 policies)
-- Nation key: Av=Avelia, Sa=Sangreza, SE=San Estrella, Mo=Montequilla, Me=Melizea, Pa=Palvera

DO $$
DECLARE
    v_policy_id uuid;
    v_av uuid;
    v_sa uuid;
    v_se uuid;
    v_mo uuid;
    v_me uuid;
    v_pa uuid;
BEGIN

-- Resolve nation IDs
SELECT id INTO v_av FROM nations WHERE LOWER(name) = 'avelia';
SELECT id INTO v_sa FROM nations WHERE LOWER(name) = 'sangreza';
SELECT id INTO v_se FROM nations WHERE LOWER(name) = 'san estrella';
SELECT id INTO v_mo FROM nations WHERE LOWER(name) = 'montequilla';
SELECT id INTO v_me FROM nations WHERE LOWER(name) = 'melizea';
SELECT id INTO v_pa FROM nations WHERE LOWER(name) = 'palvera';

-- ============================================================
-- 1. Urban Migrant Employment Program | LABOR | Workers | STRUCTURAL
-- Active: Me, SE, Mo
-- Ideologies: Equality, Progress
-- ============================================================
INSERT INTO policies (
    policy_key, policy_name, policy_type, description,
    major_sector, minor_sector, law_category, fiscal_category,
    ideology, ideologies,
    upfront_cost, upfront_scaling_stat,
    ongoing_base_cost, ongoing_scaling_stat,
    stat_effects, opposed_policy_ids, requires_policy_id,
    target_stat, stat_direction, stat_change_per_tick, duration_months,
    stat_floor, stat_ceiling, ongoing_cost_per_tick, is_active
) VALUES (
    'urban_migrant_employment_program_' || to_hex(extract(epoch from now())::int),
    'Urban Migrant Employment Program', 'structural',
    'Job placement services, vocational retraining, and employment hubs specifically targeting rural-to-urban migrants, easing their transition into the formal urban economy.',
    'LABOR', 'Workers', 'Workers', 'Labor',
    'Equality', '["Equality","Progress"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization",              "direction":"up",   "rate":0.15, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"unemployment",              "direction":"down", "rate":0.2,  "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"labor_force_participation", "direction":"up",   "rate":0.2,  "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"social_mobility",           "direction":"up",   "rate":0.1,  "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",               "direction":"up",   "rate":0.1,  "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'UP', 0.15, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Urban Migrant Employment Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'LABOR', 'Workers', 'Labor', 'active', 0, true, true, 54
FROM unnest(ARRAY[v_me, v_se, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 2. Informal Settlement Regularization Program | SOCIAL | Civil Rights | LEVER
-- Active: Me, Mo, Pa
-- Ideologies: Equality, Progress
-- ============================================================
INSERT INTO policies (
    policy_key, policy_name, policy_type, description,
    major_sector, minor_sector, law_category, fiscal_category,
    ideology, ideologies,
    upfront_cost, upfront_scaling_stat,
    ongoing_base_cost, ongoing_scaling_stat,
    stat_effects, opposed_policy_ids, requires_policy_id,
    target_stat, stat_direction, stat_change_per_tick, duration_months,
    stat_floor, stat_ceiling, ongoing_cost_per_tick, is_active
) VALUES (
    'informal_settlement_regularization_program_' || to_hex(extract(epoch from now())::int),
    'Informal Settlement Regularization Program', 'lever',
    'Legal land titling, infrastructure provision, and public service extension to informal urban settlements, bringing existing unrecorded residents into formal urban systems without displacement.',
    'SOCIAL', 'Civil Rights', 'Civil Rights', 'Interior',
    'Equality', '["Equality","Progress"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization",          "direction":"up",   "rate":0.2, "delay_ticks":4, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"housing_affordability", "direction":"up",   "rate":0.3, "delay_ticks":4, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"standard_of_living",    "direction":"up",   "rate":0.2, "delay_ticks":5, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"legitimacy",            "direction":"up",   "rate":0.2, "delay_ticks":4, "duration_ticks":12, "adjust_type":null, "adjust_value":0},
        {"stat_key":"corruption",            "direction":"down", "rate":0.1, "delay_ticks":5, "duration_ticks":12, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",           "direction":"up",   "rate":0.3, "delay_ticks":1, "duration_ticks":12, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'UP', 0.2, 16, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Informal Settlement Regularization Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Civil Rights', 'Interior', 'active', 0, true, true, 21
FROM unnest(ARRAY[v_me, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 3. Rural Revitalization Investment Act | ECONOMICS | Agriculture | STRUCTURAL
-- Active: Me, Mo, Pa
-- Ideologies: Tradition, Nationalism
-- ============================================================
INSERT INTO policies (
    policy_key, policy_name, policy_type, description,
    major_sector, minor_sector, law_category, fiscal_category,
    ideology, ideologies,
    upfront_cost, upfront_scaling_stat,
    ongoing_base_cost, ongoing_scaling_stat,
    stat_effects, opposed_policy_ids, requires_policy_id,
    target_stat, stat_direction, stat_change_per_tick, duration_months,
    stat_floor, stat_ceiling, ongoing_cost_per_tick, is_active
) VALUES (
    'rural_revitalization_investment_act_' || to_hex(extract(epoch from now())::int),
    'Rural Revitalization Investment Act', 'structural',
    'Comprehensive investment package for rural communities including schools, clinics, broadband, and road upgrades, narrowing the urban-rural quality of life gap that drives outward migration.',
    'ECONOMICS', 'Agriculture', 'Agriculture', 'Interior',
    'Tradition', '["Tradition","Nationalism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization",       "direction":"down", "rate":0.2, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"arable_land",        "direction":"up",   "rate":0.1, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"standard_of_living", "direction":"up",   "rate":0.1, "delay_ticks":8, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"poverty_rate",       "direction":"down", "rate":0.1, "delay_ticks":8, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",        "direction":"up",   "rate":0.2, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'DOWN', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Rural Revitalization Investment Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Agriculture', 'Interior', 'active', 0, true, true, 56
FROM unnest(ARRAY[v_me, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 4. Green Belt and Urban Growth Boundary Act | GOVERNANCE | Regulatory | STRUCTURAL
-- Active: Av, Mo, Pa
-- Ideologies: Security, Tradition
-- ============================================================
INSERT INTO policies (
    policy_key, policy_name, policy_type, description,
    major_sector, minor_sector, law_category, fiscal_category,
    ideology, ideologies,
    upfront_cost, upfront_scaling_stat,
    ongoing_base_cost, ongoing_scaling_stat,
    stat_effects, opposed_policy_ids, requires_policy_id,
    target_stat, stat_direction, stat_change_per_tick, duration_months,
    stat_floor, stat_ceiling, ongoing_cost_per_tick, is_active
) VALUES (
    'green_belt_urban_growth_boundary_act_' || to_hex(extract(epoch from now())::int),
    'Green Belt and Urban Growth Boundary Act', 'structural',
    'Legally enforced boundaries restricting urban expansion beyond defined perimeters, protecting agricultural land and natural areas from development while encouraging densification within existing cities.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Interior',
    'Security', '["Security","Tradition"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization",          "direction":"down", "rate":0.1, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"arable_land",           "direction":"up",   "rate":0.1, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"pollution",             "direction":"down", "rate":0.1, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"housing_affordability", "direction":"down", "rate":0.1, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'DOWN', 0.1, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Green Belt and Urban Growth Boundary Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Interior', 'active', 0, true, true, 53
FROM unnest(ARRAY[v_av, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 5. Agricultural Land Protection Act | GOVERNANCE | Regulatory | STRUCTURAL
-- Active: Mo, Av, Sa
-- Ideologies: Tradition, Security
-- ============================================================
INSERT INTO policies (
    policy_key, policy_name, policy_type, description,
    major_sector, minor_sector, law_category, fiscal_category,
    ideology, ideologies,
    upfront_cost, upfront_scaling_stat,
    ongoing_base_cost, ongoing_scaling_stat,
    stat_effects, opposed_policy_ids, requires_policy_id,
    target_stat, stat_direction, stat_change_per_tick, duration_months,
    stat_floor, stat_ceiling, ongoing_cost_per_tick, is_active
) VALUES (
    'agricultural_land_protection_act_' || to_hex(extract(epoch from now())::int),
    'Agricultural Land Protection Act', 'structural',
    'Legal designations preventing conversion of agricultural land to residential or commercial development, halting urban sprawl into farmland and protecting food production capacity.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Interior',
    'Tradition', '["Tradition","Security"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization",          "direction":"down", "rate":0.15, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"arable_land",           "direction":"up",   "rate":0.2,  "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"housing_affordability", "direction":"down", "rate":0.1,  "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"foreign_investment",    "direction":"down", "rate":0.1,  "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'DOWN', 0.15, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Agricultural Land Protection Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Interior', 'active', 0, true, true, 51
FROM unnest(ARRAY[v_mo, v_av, v_sa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 6. Government Services Decentralization Act | GOVERNANCE | Regulatory | STRUCTURAL
-- Active: Mo, SE, Me
-- Ideologies: Nationalism, Collectivism
-- ============================================================
INSERT INTO policies (
    policy_key, policy_name, policy_type, description,
    major_sector, minor_sector, law_category, fiscal_category,
    ideology, ideologies,
    upfront_cost, upfront_scaling_stat,
    ongoing_base_cost, ongoing_scaling_stat,
    stat_effects, opposed_policy_ids, requires_policy_id,
    target_stat, stat_direction, stat_change_per_tick, duration_months,
    stat_floor, stat_ceiling, ongoing_cost_per_tick, is_active
) VALUES (
    'government_services_decentralization_act_' || to_hex(extract(epoch from now())::int),
    'Government Services Decentralization Act', 'structural',
    'Deliberate relocation of government ministries, courts, universities, and public agencies from overcrowded capital cities to regional centers, creating employment anchors outside the major metropolis.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Interior',
    'Nationalism', '["Nationalism","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization", "direction":"down", "rate":0.1, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"stability",    "direction":"up",   "rate":0.1, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"efficiency",   "direction":"down", "rate":0.1, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",  "direction":"up",   "rate":0.1, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'DOWN', 0.1, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Government Services Decentralization Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Interior', 'active', 0, true, true, 54
FROM unnest(ARRAY[v_mo, v_se, v_me]) AS nid WHERE nid IS NOT NULL;

END $$;
