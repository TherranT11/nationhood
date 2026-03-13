-- Batch insert Part 6: Social (healthcare) policies
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
-- 26. Hospital Construction Program | SOCIAL | healthcare | LEVER
-- Active: Av, SE, Mo
-- Cost: $80M×Population up / $20M×Population/t
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
    'hospital_construction_program_' || to_hex(extract(epoch from now())::int),
    'Hospital Construction Program', 'lever',
    'Large-scale public investment in hospital construction and medical facility expansion, improving healthcare access and long-term health outcomes at significant ongoing fiscal cost.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Healthcare',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    80, 'population',
    20, 'population',
    '[
        {"stat_key":"beds_per_100k",            "direction":"up",  "rate":1,   "delay_ticks":6, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"healthcare_accessibility", "direction":"up",  "rate":0.5, "delay_ticks":8, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"lifespan",                 "direction":"up",  "rate":0.3, "delay_ticks":10,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"death_rate",               "direction":"down","rate":0.3, "delay_ticks":10,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",             "direction":"down","rate":0.3, "delay_ticks":4, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",  "rate":0.3, "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'beds_per_100k', 'UP', 1, 48, 0, 100, 20, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Hospital Construction Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Healthcare', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 27. Palliative Care Program | SOCIAL | healthcare | LEVER
-- Active: Av, Pa
-- Cost: $10M×Population up / $3M×Population/t
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
    'palliative_care_program_' || to_hex(extract(epoch from now())::int),
    'Palliative Care Program', 'lever',
    'Dedicated end-of-life and hospice care infrastructure improving quality and dignity of death, modestly improving lifespan and healthcare quality while consuming bed capacity.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Healthcare',
    'Progress', '["Progress","Equality"]'::jsonb,
    10, 'population',
    3, 'population',
    '[
        {"stat_key":"death_rate",               "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"lifespan",                 "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"happiness",                "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"healthcare_quality",       "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"beds_per_100k",            "direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":12,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'healthcare_quality', 'UP', 0.3, 20, 0, 100, 3, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Palliative Care Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Healthcare', 'active', 0, true, true, 20
FROM unnest(ARRAY[v_av, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 28. Geriatric Care Strategy | SOCIAL | healthcare | STRUCTURAL
-- Active: Av, Mo
-- Cost: $20M×Population up / $8M×Population/t
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
    'geriatric_care_strategy_' || to_hex(extract(epoch from now())::int),
    'Geriatric Care Strategy', 'structural',
    'Comprehensive elder care infrastructure including nursing homes, home care, and geriatric medicine programs, extending lifespan and reducing death rates at significant ongoing fiscal cost.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Healthcare',
    'Tradition', '["Tradition","Collectivism"]'::jsonb,
    20, 'population',
    8, 'population',
    '[
        {"stat_key":"median_age",               "direction":"up",  "rate":0.2, "delay_ticks":8, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"lifespan",                 "direction":"up",  "rate":0.5, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"death_rate",               "direction":"down","rate":0.5, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"happiness",                "direction":"up",  "rate":0.2, "delay_ticks":5, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation","direction":"down","rate":0.2, "delay_ticks":8, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",  "rate":0.2, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'lifespan', 'UP', 0.5, 48, 0, 100, 8, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Geriatric Care Strategy (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Healthcare', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 29. Addiction Treatment Program | SOCIAL | healthcare | LEVER
-- Active: Av, SE, Pa
-- Cost: $20M×Drug Use up / $5M×Drug Use/t
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
    'addiction_treatment_program_' || to_hex(extract(epoch from now())::int),
    'Addiction Treatment Program', 'lever',
    'State-funded rehabilitation centers and treatment programs treating addiction as a public health issue rather than a criminal one, reducing drug use and incarceration over time.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Healthcare',
    'Equality', '["Equality","Progress"]'::jsonb,
    20, 'drug_use',
    5, 'drug_use',
    '[
        {"stat_key":"drug_use",                 "direction":"down","rate":1,   "delay_ticks":3, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"crime_rate",               "direction":"down","rate":0.3, "delay_ticks":5, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"incarceration_rate",       "direction":"down","rate":0.5, "delay_ticks":4, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation","direction":"up",  "rate":0.2, "delay_ticks":8, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"happiness",                "direction":"up",  "rate":0.3, "delay_ticks":6, "duration_ticks":16,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'drug_use', 'DOWN', 1, 20, 0, 100, 5, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Addiction Treatment Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Healthcare', 'active', 0, true, true, 20
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 30. Drug Prevention and Education | SOCIAL | healthcare | STRUCTURAL
-- Active: Av, SE, Mo, Pa
-- Cost: $5M×Population up / $2M×Population/t
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
    'drug_prevention_education_' || to_hex(extract(epoch from now())::int),
    'Drug Prevention and Education', 'structural',
    'School and community-based programs educating citizens about the risks of substance use, reducing drug consumption and downstream crime over time.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Healthcare',
    'Tradition', '["Tradition","Security"]'::jsonb,
    5, 'population',
    2, 'population',
    '[
        {"stat_key":"drug_use",                 "direction":"down","rate":0.5, "delay_ticks":6, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"literacy",                 "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"crime_rate",               "direction":"down","rate":0.2, "delay_ticks":8, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"happiness",                "direction":"up",  "rate":0.2, "delay_ticks":8, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation","direction":"up",  "rate":0.2, "delay_ticks":8, "duration_ticks":16,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'drug_use', 'DOWN', 0.5, 20, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Drug Prevention and Education (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Healthcare', 'active', 0, true, true, 20
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

END $$;
