-- Batch insert: Urbanization policies part 3 (4 policies)
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
-- 1. Rural University and Research Hub Program | EDUCATION | Education | LEVER
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
        {"stat_key":"urbanization",          "direction":"down", "rate":0.2, "delay_ticks":6, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"higher_education",      "direction":"up",   "rate":0.2, "delay_ticks":6, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"academic_immigration",  "direction":"up",   "rate":0.1, "delay_ticks":6, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"poverty_rate",          "direction":"down", "rate":0.1, "delay_ticks":8, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",           "direction":"up",   "rate":0.3, "delay_ticks":1, "duration_ticks":12, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'DOWN', 0.2, 20, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Rural University and Research Hub Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'EDUCATION', 'Education', 'Education', 'active', 0, true, true, 28
FROM unnest(ARRAY[v_mo, v_av, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 2. Remote Work Infrastructure Program | ECONOMICS | Infrastructure | STRUCTURAL
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
    'ECONOMICS', 'Infrastructure', 'Infrastructure', 'Infrastructure',
    'Progress', '["Progress","Individualism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization",           "direction":"down", "rate":0.15, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"digital_infrastructure", "direction":"up",   "rate":0.2,  "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"service_output",         "direction":"up",   "rate":0.1,  "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"happiness",              "direction":"up",   "rate":0.1,  "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'DOWN', 0.15, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Remote Work Infrastructure Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Infrastructure', 'Infrastructure', 'active', 0, true, true, 53
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 3. Urban Density Incentive Tax | ECONOMICS | Fiscal Policy | STRUCTURAL
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
    'ECONOMICS', 'Fiscal Policy', 'Fiscal Policy', 'Treasury',
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
SELECT nid, v_policy_id, 'ECONOMICS', 'Fiscal Policy', 'Treasury', 'active', 0, true, true, 53
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 4. Industrial Relocation to Urban Zones | ECONOMICS | Structural Reform | STRUCTURAL
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
    'ECONOMICS', 'Structural Reform', 'Structural Reform', 'Industry',
    'Nationalism', '["Nationalism","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"urbanization",          "direction":"up",   "rate":0.2,  "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"manufacturing_output",  "direction":"up",   "rate":0.15, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"pollution",             "direction":"up",   "rate":0.2,  "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"arable_land",           "direction":"up",   "rate":0.1,  "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"foreign_investment",    "direction":"down", "rate":0.1,  "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'urbanization', 'UP', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Industrial Relocation to Urban Zones (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Structural Reform', 'Industry', 'active', 0, true, true, 53
FROM unnest(ARRAY[v_me, v_sa, v_mo]) AS nid WHERE nid IS NOT NULL;

END $$;
