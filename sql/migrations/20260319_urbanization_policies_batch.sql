-- Batch insert: Urbanization policies (5 policies)
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

END $$;
