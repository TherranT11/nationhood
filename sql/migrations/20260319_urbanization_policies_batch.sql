-- Batch insert: Urbanization policies (15 policies)
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
-- 1. New City Development Program | ECONOMICS | Infrastructure | LEVER
-- Active: Sa, Mo, SE
-- Ideologies: Progress, Nationalism
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
    'new_city_development_program_' || to_hex(extract(epoch from now())::int),
    'New City Development Program', 'lever',
    'A state-directed initiative constructing entirely new planned cities in underpopulated regions to redistribute population pressure from overcrowded urban centers and open strategic territories.',
    'ECONOMICS', 'Infrastructure', 'Infrastructure', 'Interior',
    'Progress', '["Progress","Nationalism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization",            "direction":"up",  "rate":0.8, "delay_ticks":8,  "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"physical_infrastructure",  "direction":"up",  "rate":0.3, "delay_ticks":8,  "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"housing_affordability",    "direction":"up",  "rate":0.2, "delay_ticks":10, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"population_growth",        "direction":"up",  "rate":0.2, "delay_ticks":10, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",  "rate":0.8, "delay_ticks":1,  "duration_ticks":12, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'UP', 0.8, 20, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: New City Development Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Infrastructure', 'Interior', 'active', 0, true, true, 28
FROM unnest(ARRAY[v_sa, v_mo, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 2. Urban Enterprise Zone Act | ECONOMICS | Regulatory | STRUCTURAL
-- Active: Sa, SE, Pa
-- Ideologies: Individualism, Progress
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
    'urban_enterprise_zone_act_' || to_hex(extract(epoch from now())::int),
    'Urban Enterprise Zone Act', 'structural',
    'Designated tax-free economic zones within or adjacent to cities offering reduced corporate tax, streamlined regulation, and subsidized land to attract business investment and concentrate employment.',
    'ECONOMICS', 'Regulatory', 'Regulatory', 'Interior',
    'Individualism', '["Individualism","Progress"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization",         "direction":"up",  "rate":0.2, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"manufacturing_output", "direction":"up",  "rate":0.2, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"service_output",       "direction":"up",  "rate":0.2, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"foreign_investment",   "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"income_inequality",    "direction":"up",  "rate":0.1, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'UP', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Urban Enterprise Zone Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Regulatory', 'Interior', 'active', 0, true, true, 53
FROM unnest(ARRAY[v_sa, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 3. Agricultural Mechanization Fund | ECONOMICS | Agriculture | LEVER
-- Active: Mo, Sa, Me
-- Ideologies: Progress, Individualism
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
    'agricultural_mechanization_fund_' || to_hex(extract(epoch from now())::int),
    'Agricultural Mechanization Fund', 'lever',
    'Government grants for farm machinery and automation technology, reducing the agricultural labor force needed and freeing rural workers to migrate to cities for industrial and service employment.',
    'ECONOMICS', 'Agriculture', 'Agriculture', 'Interior',
    'Progress', '["Progress","Individualism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization",                "direction":"up",   "rate":0.3, "delay_ticks":4, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"arable_land",                 "direction":"up",   "rate":0.1, "delay_ticks":5, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"unemployment",                "direction":"up",   "rate":0.2, "delay_ticks":3, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"labor_force_participation",   "direction":"down", "rate":0.1, "delay_ticks":4, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",                 "direction":"up",   "rate":0.2, "delay_ticks":1, "duration_ticks":12, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'UP', 0.3, 20, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Agricultural Mechanization Fund (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Agriculture', 'Interior', 'active', 0, true, true, 24
FROM unnest(ARRAY[v_mo, v_sa, v_me]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 4. Urban Housing Subsidy Program | SOCIAL | Welfare | STRUCTURAL
-- Active: Me, SE, Pa
-- Ideologies: Equality, Collectivism
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
    'urban_housing_subsidy_program_' || to_hex(extract(epoch from now())::int),
    'Urban Housing Subsidy Program', 'structural',
    'Subsidized rental housing for low-income rural migrants settling in cities, reducing the financial barrier to urban relocation and formalizing what would otherwise become informal settlement.',
    'SOCIAL', 'Welfare', 'Welfare', 'Interior',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization",          "direction":"up",   "rate":0.2, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"housing_affordability", "direction":"up",   "rate":0.1, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"poverty_rate",          "direction":"down", "rate":0.1, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",           "direction":"up",   "rate":0.2, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'UP', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Urban Housing Subsidy Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Welfare', 'Interior', 'active', 0, true, true, 54
FROM unnest(ARRAY[v_me, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 5. Metropolitan Transit Expansion | ECONOMICS | Infrastructure | LEVER
-- Active: Av, SE, Pa
-- Ideologies: Progress, Collectivism
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
    'metropolitan_transit_expansion_' || to_hex(extract(epoch from now())::int),
    'Metropolitan Transit Expansion', 'lever',
    'Rapid expansion of urban metro, tram, and bus rapid transit networks making large cities more livable, reducing commute costs, and removing a key deterrent to urban settlement.',
    'ECONOMICS', 'Infrastructure', 'Infrastructure', 'Transportation',
    'Progress', '["Progress","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization",  "direction":"up",   "rate":0.3, "delay_ticks":6, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"rail_network",  "direction":"up",   "rate":0.3, "delay_ticks":6, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"cost_of_living","direction":"down", "rate":0.1, "delay_ticks":6, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"pollution",     "direction":"down", "rate":0.1, "delay_ticks":8, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",   "direction":"up",   "rate":0.4, "delay_ticks":1, "duration_ticks":12, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'UP', 0.3, 20, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Metropolitan Transit Expansion (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Infrastructure', 'Transportation', 'active', 0, true, true, 28
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 6. Urban Migrant Employment Program | LABOR | Workers | STRUCTURAL
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
    'LABOR', 'Workers', 'Workers', 'Interior',
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
SELECT nid, v_policy_id, 'LABOR', 'Workers', 'Interior', 'active', 0, true, true, 52
FROM unnest(ARRAY[v_me, v_se, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 7. Informal Settlement Regularization Program | SOCIAL | Civil Rights | LEVER
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
-- 8. Rural Revitalization Investment Act | ECONOMICS | Agriculture | STRUCTURAL
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
        {"stat_key":"urbanization",        "direction":"down", "rate":0.2, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"arable_land",         "direction":"up",   "rate":0.1, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"standard_of_living",  "direction":"up",   "rate":0.1, "delay_ticks":8, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"poverty_rate",        "direction":"down", "rate":0.1, "delay_ticks":8, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",         "direction":"up",   "rate":0.2, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'DOWN', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Rural Revitalization Investment Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Agriculture', 'Interior', 'active', 0, true, true, 56
FROM unnest(ARRAY[v_me, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 9. Green Belt and Urban Growth Boundary Act | GOVERNANCE | Regulatory | STRUCTURAL
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
-- 10. Agricultural Land Protection Act | GOVERNANCE | Regulatory | STRUCTURAL
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
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Interior', 'active', 0, true, true, 52
FROM unnest(ARRAY[v_mo, v_av, v_sa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 11. Government Services Decentralization Act | GOVERNANCE | Regulatory | STRUCTURAL
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

-- ============================================================
-- 12. Rural University and Research Hub Program | EDUCATION | Education | LEVER
-- Active: Mo, Av, SE
-- Ideologies: Tradition, Collectivism
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
    'rural_university_research_hub_program_' || to_hex(extract(epoch from now())::int),
    'Rural University and Research Hub Program', 'lever',
    'Construction of universities, technical colleges, and research facilities in rural towns, anchoring young educated populations outside major cities and seeding local knowledge economies.',
    'EDUCATION', 'Education', 'Education', 'Education',
    'Tradition', '["Tradition","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization",         "direction":"down", "rate":0.2, "delay_ticks":6, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"higher_education",     "direction":"up",   "rate":0.2, "delay_ticks":6, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"academic_immigration", "direction":"up",   "rate":0.1, "delay_ticks":6, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"poverty_rate",         "direction":"down", "rate":0.1, "delay_ticks":8, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",          "direction":"up",   "rate":0.3, "delay_ticks":1, "duration_ticks":12, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'DOWN', 0.2, 20, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Rural University and Research Hub Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'EDUCATION', 'Education', 'Education', 'active', 0, true, true, 26
FROM unnest(ARRAY[v_mo, v_av, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 13. Remote Work Infrastructure Program | ECONOMICS | Infrastructure | STRUCTURAL
-- Active: Av, SE, Pa
-- Ideologies: Progress, Individualism
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
    'remote_work_infrastructure_program_' || to_hex(extract(epoch from now())::int),
    'Remote Work Infrastructure Program', 'structural',
    'Nationwide broadband, co-working hub, and digital tool investment enabling knowledge workers to remain in rural and regional areas rather than relocating to cities for office employment.',
    'ECONOMICS', 'Infrastructure', 'Infrastructure', 'Transportation',
    'Progress', '["Progress","Individualism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization",          "direction":"down", "rate":0.15, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"digital_infrastructure","direction":"up",   "rate":0.2,  "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"service_output",        "direction":"up",   "rate":0.1,  "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"happiness",             "direction":"up",   "rate":0.1,  "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'DOWN', 0.15, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Remote Work Infrastructure Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Infrastructure', 'Transportation', 'active', 0, true, true, 53
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 14. Urban Density Incentive Tax | ECONOMICS | Fiscal Policy | STRUCTURAL
-- Active: Av, SE, Pa
-- Ideologies: Equality, Collectivism
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
    'urban_density_incentive_tax_' || to_hex(extract(epoch from now())::int),
    'Urban Density Incentive Tax', 'structural',
    'Progressive levies on underutilized urban land and low-density commercial properties, penalizing land banking and incentivizing infill development to increase the efficiency of existing urban space.',
    'ECONOMICS', 'Fiscal Policy', 'Fiscal Policy', 'Finance',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization",          "direction":"down", "rate":0.1, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"housing_affordability", "direction":"up",   "rate":0.1, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"income_inequality",     "direction":"down", "rate":0.1, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"gdp_growth",            "direction":"down", "rate":0.1, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'DOWN', 0.1, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Urban Density Incentive Tax (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Fiscal Policy', 'Finance', 'active', 0, true, true, 53
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 15. Industrial Relocation to Urban Zones | ECONOMICS | Structural Reform | STRUCTURAL
-- Active: Me, Sa, Mo
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
    'industrial_relocation_to_urban_zones_' || to_hex(extract(epoch from now())::int),
    'Industrial Relocation to Urban Zones', 'structural',
    'Government incentives and zoning requirements relocating industrial facilities from dispersed rural locations to designated urban industrial zones, concentrating employment and improving logistics efficiency.',
    'ECONOMICS', 'Structural Reform', 'Structural Reform', 'Interior',
    'Nationalism', '["Nationalism","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization",        "direction":"up",   "rate":0.2,  "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"manufacturing_output","direction":"up",   "rate":0.15, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"pollution",           "direction":"up",   "rate":0.2,  "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"arable_land",         "direction":"up",   "rate":0.1,  "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"foreign_investment",  "direction":"down", "rate":0.1,  "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'UP', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Industrial Relocation to Urban Zones (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Structural Reform', 'Interior', 'active', 0, true, true, 53
FROM unnest(ARRAY[v_me, v_sa, v_mo]) AS nid WHERE nid IS NOT NULL;

END $$;
