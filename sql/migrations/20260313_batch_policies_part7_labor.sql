-- Batch insert Part 7: Labor (workers) policies
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
-- 31. National Labor Relations | LABOR | workers | STRUCTURAL
-- Active: Av, SE, Mo, Pa
-- Cost: $3M up / $1M×Population/t
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
    'national_labor_relations_' || to_hex(extract(epoch from now())::int),
    'National Labor Relations', 'structural',
    'Legal framework establishing collective bargaining rights, union recognition, and worker protections, improving wages and equality at modest cost to employment and growth.',
    'LABOR', 'Workers', 'Workers', 'Labor',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    3, NULL,
    1, 'population',
    '[
        {"stat_key":"union_strength",           "direction":"up",  "rate":1,   "delay_ticks":2, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"minimum_wage",             "direction":"up",  "rate":0.3, "delay_ticks":3, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality",        "direction":"down","rate":0.3, "delay_ticks":4, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",             "direction":"up",  "rate":0.2, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",              "direction":"down","rate":0.2, "delay_ticks":5, "duration_ticks":16,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'union_strength', 'UP', 1, 20, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: National Labor Relations (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'LABOR', 'Workers', 'Labor', 'active', 0, true, true, 20
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 32. Right to Work | LABOR | workers | STRUCTURAL
-- Active: Mo, Pa
-- Cost: $2M up (no ongoing)
-- Ideologies: Individualism, Liberty
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
    'right_to_work_' || to_hex(extract(epoch from now())::int),
    'Right to Work', 'structural',
    'Laws prohibiting mandatory union membership as a condition of employment, increasing labor market flexibility and attracting investment while weakening collective bargaining power.',
    'LABOR', 'Workers', 'Workers', 'Labor',
    'Individualism', '["Individualism","Liberty"]'::jsonb,
    2, NULL,
    0, NULL,
    '[
        {"stat_key":"union_strength",           "direction":"down","rate":1,   "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation","direction":"up",  "rate":0.5, "delay_ticks":3, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",       "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",              "direction":"up",  "rate":0.2, "delay_ticks":5, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality",        "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'union_strength', 'DOWN', 1, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Right to Work (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'LABOR', 'Workers', 'Labor', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 33. Minimum Wage Increase | LABOR | workers | LEVER
-- Active: Av, SE, Mo, Pa
-- Cost: $1M up / $5M×Population/t
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
    'minimum_wage_increase_' || to_hex(extract(epoch from now())::int),
    'Minimum Wage Increase', 'lever',
    'A legislated raise to the national wage floor, improving low-income earnings and reducing poverty while introducing modest unemployment and inflation pressure.',
    'LABOR', 'Workers', 'Workers', 'Labor',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    1, NULL,
    5, 'population',
    '[
        {"stat_key":"minimum_wage",             "direction":"up",  "rate":8,   "delay_ticks":6, "duration_ticks":1, "adjust_type":null,"adjust_value":0},
        {"stat_key":"poverty_rate",             "direction":"down","rate":0.5, "delay_ticks":2, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality",        "direction":"down","rate":0.3, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",             "direction":"up",  "rate":0.3, "delay_ticks":2, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"inflation",                "direction":"up",  "rate":0.2, "delay_ticks":2, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"happiness",                "direction":"up",  "rate":0.3, "delay_ticks":2, "duration_ticks":16,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'minimum_wage', 'UP', 8, 16, 0, 100, 5, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Minimum Wage Increase (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'LABOR', 'Workers', 'Labor', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 34. Youth Employment Initiative | LABOR | workers | LEVER
-- Active: Av, SE, Mo, Pa
-- Cost: $8M×Population up / $2M×Population/t
-- Ideologies: Progress, Equality
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
    'youth_employment_initiative_' || to_hex(extract(epoch from now())::int),
    'Youth Employment Initiative', 'lever',
    'Subsidized apprenticeships, vocational training, and employer incentives targeted at young workers, reducing youth unemployment and improving long-term social mobility.',
    'LABOR', 'Workers', 'Workers', 'Labor',
    'Progress', '["Progress","Equality"]'::jsonb,
    8, 'population',
    2, 'population',
    '[
        {"stat_key":"labor_force_participation","direction":"up",  "rate":0.5, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",             "direction":"down","rate":0.5, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"social_mobility",          "direction":"up",  "rate":0.3, "delay_ticks":6, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"poverty_rate",             "direction":"down","rate":0.2, "delay_ticks":5, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"population_growth",        "direction":"up",  "rate":0.2, "delay_ticks":8, "duration_ticks":16,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'labor_force_participation', 'UP', 0.5, 16, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Youth Employment Initiative (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'LABOR', 'Workers', 'Labor', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

END $$;
