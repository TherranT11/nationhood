-- Batch insert Part 5: Immigration + Education policies
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
-- 20. Open Borders | IMMIGRATION | immigration | STRUCTURAL
-- Active: Av, Pa
-- Cost: $5M×Population up (no ongoing)
-- Ideologies: Globalism, Liberty
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
    'open_borders_' || to_hex(extract(epoch from now())::int),
    'Open Borders', 'structural',
    'Removal of formal immigration controls allowing free movement of people across borders, boosting labor supply and GDP while generating cultural tension and political backlash.',
    'IMMIGRATION', 'Immigration', 'Immigration', 'Interior',
    'Globalism', '["Globalism","Liberty"]'::jsonb,
    5, 'population',
    0, NULL,
    '[
        {"stat_key":"immigration",              "direction":"up",  "rate":1,   "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation","direction":"up",  "rate":0.5, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"ethnic_diversity",         "direction":"up",  "rate":0.5, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",              "direction":"up",  "rate":0.3, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"illegal_immigration",     "direction":"down","rate":0.5, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",            "direction":"up",  "rate":0.5, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"civil_unrest",            "direction":"up",  "rate":0.3, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'UP', 1, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Open Borders (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Immigration', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 21. Immigration Integration Program | IMMIGRATION | immigration | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $10M×Population up / $3M×Population/t
-- Ideologies: Globalism, Equality
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
    'immigration_integration_program_' || to_hex(extract(epoch from now())::int),
    'Immigration Integration Program', 'structural',
    'Structured language, civics, employment, and housing support helping immigrants integrate economically and socially, improving labor participation and mobility at the cost of some cultural tension.',
    'IMMIGRATION', 'Immigration', 'Immigration', 'Interior',
    'Globalism', '["Globalism","Equality"]'::jsonb,
    10, 'population',
    3, 'population',
    '[
        {"stat_key":"ethnic_diversity",         "direction":"up",  "rate":0.5, "delay_ticks":4, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"social_mobility",          "direction":"up",  "rate":0.3, "delay_ticks":6, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation","direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",            "direction":"up",  "rate":0.3, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",              "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":16,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'ethnic_diversity', 'UP', 0.5, 20, 0, 100, 3, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Immigration Integration Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Immigration', 'Interior', 'active', 0, true, true, 20
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 22. Emigration Restrictions | IMMIGRATION | border_enforcement | STRUCTURAL
-- Active: Me, Sa
-- Cost: $5M×Population up / $1M×Population/t
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
    'emigration_restrictions_' || to_hex(extract(epoch from now())::int),
    'Emigration Restrictions', 'structural',
    'Exit visa requirements and asset restrictions preventing citizens from freely leaving the country, retaining labor at the cost of freedom and international standing.',
    'IMMIGRATION', 'Border Enforcement', 'Border Enforcement', 'Interior',
    'Nationalism', '["Nationalism","Collectivism"]'::jsonb,
    5, 'population',
    1, 'population',
    '[
        {"stat_key":"emigration",               "direction":"down","rate":1,   "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation","direction":"up",  "rate":0.3, "delay_ticks":2, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":0.5, "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation", "direction":"down","rate":0.5, "delay_ticks":1, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",            "direction":"up",  "rate":0.3, "delay_ticks":3, "duration_ticks":20,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'emigration', 'DOWN', 1, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Emigration Restrictions (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Border Enforcement', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_me, v_sa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 23. Illegal Immigration Crackdown | IMMIGRATION | border_enforcement | STRUCTURAL
-- Active: Sa, SE, Mo
-- Cost: $8M×Population up / $3M×Population/t
-- Ideologies: Nationalism, Security
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
    'illegal_immigration_crackdown_' || to_hex(extract(epoch from now())::int),
    'Illegal Immigration Crackdown', 'structural',
    'Increased border enforcement, detention capacity, and deportation operations aimed at reducing undocumented entry.',
    'IMMIGRATION', 'Border Enforcement', 'Border Enforcement', 'Interior',
    'Nationalism', '["Nationalism","Security"]'::jsonb,
    8, 'population',
    3, 'population',
    '[
        {"stat_key":"illegal_immigration",     "direction":"down","rate":2,   "delay_ticks":2, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":0.5, "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation", "direction":"down","rate":0.3, "delay_ticks":2, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"crime_rate",               "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation","direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":20,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'illegal_immigration', 'DOWN', 2, 48, 0, 100, 3, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Illegal Immigration Crackdown (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Border Enforcement', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_se, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 24. Academic Exchange Program | EDUCATION | education | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $8M×Population up / $2M×Population/t
-- Ideologies: Globalism, Progress
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
    'academic_exchange_program_' || to_hex(extract(epoch from now())::int),
    'Academic Exchange Program', 'structural',
    'Formal government partnerships with foreign universities to facilitate student and faculty exchanges, gradually improving higher education and international standing at modest brain drain cost.',
    'EDUCATION', 'Education', 'Education', 'Education',
    'Globalism', '["Globalism","Progress"]'::jsonb,
    8, 'population',
    2, 'population',
    '[
        {"stat_key":"academic_immigration",     "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"higher_education",         "direction":"up",  "rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation", "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"emigration",               "direction":"up",  "rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'academic_immigration', 'UP', 0.2, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Academic Exchange Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'EDUCATION', 'Education', 'Education', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 25. Social Mobility Scholarships | EDUCATION | education | LEVER
-- Active: Av, SE, Pa
-- Cost: $30M×Population up / $10M×Population/t
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
    'social_mobility_scholarships_' || to_hex(extract(epoch from now())::int),
    'Social Mobility Scholarships', 'lever',
    'Means-tested scholarship funding for low-income students to access higher education, improving social mobility and reducing inequality while retaining educated citizens.',
    'EDUCATION', 'Education', 'Education', 'Education',
    'Equality', '["Equality","Progress"]'::jsonb,
    30, 'population',
    10, 'population',
    '[
        {"stat_key":"social_mobility",          "direction":"up",  "rate":1,   "delay_ticks":6, "duration_ticks":24,"adjust_type":null,"adjust_value":0},
        {"stat_key":"higher_education",         "direction":"up",  "rate":0.5, "delay_ticks":6, "duration_ticks":24,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality",        "direction":"down","rate":0.3, "delay_ticks":8, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"poverty_rate",             "direction":"down","rate":0.2, "delay_ticks":10,"duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"emigration",               "direction":"down","rate":0.2, "delay_ticks":8, "duration_ticks":16,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'social_mobility', 'UP', 1, 24, 0, 100, 10, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Social Mobility Scholarships (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'EDUCATION', 'Education', 'Education', 'active', 0, true, true, 24
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

END $$;
