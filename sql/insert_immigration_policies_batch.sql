-- Batch insert: 19 Immigration policies (immigration + border_enforcement law categories)
-- Nation key: Av=Avelia, Sa=Sangreza, SE=San Estrella, Mo=Montequilla, Me=Melizea, Pa=Palvera

DO $$
DECLARE
    v_policy_id uuid;
    v_nation_id uuid;
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
-- 1. Humanitarian Visa Expansion | immigration | STRUCTURAL
-- Active: Av, Pa, SE
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
    'humanitarian_visa_expansion_' || to_hex(extract(epoch from now())::int),
    'Humanitarian Visa Expansion', 'structural',
    'Broad expansion of humanitarian visa categories allowing entry for refugees, asylum seekers, and displaced persons, growing the labor force and population at the cost of cultural tension.',
    'IMMIGRATION', 'Immigration', 'Immigration', 'Interior',
    'Globalism', '["Globalism","Equality"]'::jsonb,
    5, 'population',
    1, 'population',
    '[
        {"stat_key":"immigration",              "direction":"up","rate":1,   "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation", "direction":"up","rate":0.3, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"population_growth",         "direction":"up","rate":0.2, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"ethnic_diversity",          "direction":"up","rate":0.2, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"up","rate":0.2, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",               "direction":"up","rate":0.1, "delay_ticks":5,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'UP', 1, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Humanitarian Visa Expansion (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Immigration', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_pa, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 2. Skilled Worker Visa Program | immigration | STRUCTURAL
-- Active: Av, SE, Pa
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
    'skilled_worker_visa_program_' || to_hex(extract(epoch from now())::int),
    'Skilled Worker Visa Program', 'structural',
    'Fast-track visa pathways for engineers, doctors, academics, and technical workers, importing human capital directly while creating long-term brain drain risk as migrants eventually move on.',
    'IMMIGRATION', 'Immigration', 'Immigration', 'Interior',
    'Globalism', '["Globalism","Progress"]'::jsonb,
    10, 'population',
    3, 'population',
    '[
        {"stat_key":"immigration",              "direction":"up","rate":0.5, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"academic_immigration",      "direction":"up","rate":0.5, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"higher_education",          "direction":"up","rate":0.2, "delay_ticks":6,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"digital_infrastructure",    "direction":"up","rate":0.1, "delay_ticks":6,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",               "direction":"up","rate":0.2, "delay_ticks":6,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"emigration",               "direction":"up","rate":0.1, "delay_ticks":8,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'UP', 0.5, 48, 0, 100, 3, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Skilled Worker Visa Program (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Immigration', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 3. Guest Worker Program | immigration | STRUCTURAL
-- Active: Sa, SE, Mo
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
    'guest_worker_program_' || to_hex(extract(epoch from now())::int),
    'Guest Worker Program', 'structural',
    'Temporary work permits for foreign nationals filling low-skill labor shortages in agriculture, construction, and services, reducing unemployment while widening income gaps.',
    'IMMIGRATION', 'Immigration', 'Immigration', 'Interior',
    'Globalism', '["Globalism","Individualism"]'::jsonb,
    3, 'population',
    1, 'population',
    '[
        {"stat_key":"immigration",              "direction":"up",  "rate":0.5, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation", "direction":"up",  "rate":0.4, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",             "direction":"down","rate":0.3, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality",        "direction":"up",  "rate":0.2, "delay_ticks":6,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"up",  "rate":0.2, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'UP', 0.5, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Guest Worker Program (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Immigration', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_se, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 4. Mass Amnesty Program | immigration | LEVER (no ongoing cost)
-- Active: SE, Pa, Me
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
    'mass_amnesty_program_' || to_hex(extract(epoch from now())::int),
    'Mass Amnesty Program', 'lever',
    'One-time legalization of undocumented residents already living in the country, converting a shadow labor force into taxable, legal workers at a major political cost.',
    'IMMIGRATION', 'Immigration', 'Immigration', 'Interior',
    'Globalism', '["Globalism","Collectivism"]'::jsonb,
    20, 'population',
    0, NULL,
    '[
        {"stat_key":"immigration",              "direction":"up",  "rate":1.5, "delay_ticks":2,"duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation", "direction":"up",  "rate":0.5, "delay_ticks":2,"duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",             "direction":"down","rate":0.5, "delay_ticks":2,"duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",               "direction":"up",  "rate":0.3, "delay_ticks":3,"duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"civil_unrest",             "direction":"up",  "rate":0.3, "delay_ticks":4,"duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"up",  "rate":0.5, "delay_ticks":3,"duration_ticks":16,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'UP', 1.5, 16, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Mass Amnesty Program (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Immigration', 'Interior', 'active', 0, true, true, 20
FROM unnest(ARRAY[v_se, v_pa, v_me]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 5. Family Reunification Policy | immigration | STRUCTURAL
-- Active: Av, SE, Pa
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
    'family_reunification_policy_' || to_hex(extract(epoch from now())::int),
    'Family Reunification Policy', 'structural',
    'Priority visa processing for family members of existing citizens and legal residents, strengthening immigrant community roots and social integration.',
    'IMMIGRATION', 'Immigration', 'Immigration', 'Interior',
    'Globalism', '["Globalism","Equality"]'::jsonb,
    8, 'population',
    2, 'population',
    '[
        {"stat_key":"immigration",              "direction":"up","rate":0.3, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"ethnic_diversity",          "direction":"up","rate":0.2, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"social_mobility",           "direction":"up","rate":0.2, "delay_ticks":8,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"up","rate":0.2, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"up","rate":0.1, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'UP', 0.3, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Family Reunification Policy (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Immigration', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 6. Visa Pathway Simplification | immigration | STRUCTURAL
-- Active: Av, SE, Mo, Pa
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
    'visa_pathway_simplification_' || to_hex(extract(epoch from now())::int),
    'Visa Pathway Simplification', 'structural',
    'Streamlining and digitization of visa application processes, reducing bureaucratic barriers that push legal immigrants into undocumented channels.',
    'IMMIGRATION', 'Immigration', 'Immigration', 'Interior',
    'Globalism', '["Globalism","Liberty"]'::jsonb,
    5, 'population',
    2, 'population',
    '[
        {"stat_key":"immigration",              "direction":"up",  "rate":0.4, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"illegal_immigration",      "direction":"down","rate":0.3, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation", "direction":"up",  "rate":0.2, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",               "direction":"down","rate":0.1, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",               "direction":"up",  "rate":0.1, "delay_ticks":5,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'UP', 0.4, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Visa Pathway Simplification (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Immigration', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 7. International Student Attraction Program | immigration | STRUCTURAL
-- Active: Av, SE, Pa
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
    'international_student_attraction_program_' || to_hex(extract(epoch from now())::int),
    'International Student Attraction Program', 'structural',
    'Subsidized tuition, scholarships, and post-graduation work rights designed to attract foreign students and convert them into long-term skilled residents.',
    'IMMIGRATION', 'Immigration', 'Immigration', 'Interior',
    'Globalism', '["Globalism","Progress"]'::jsonb,
    8, 'population',
    2, 'population',
    '[
        {"stat_key":"immigration",              "direction":"up","rate":0.5, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"academic_immigration",      "direction":"up","rate":0.3, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"up","rate":0.2, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",        "direction":"up","rate":0.2, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"up","rate":0.1, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'UP', 0.5, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: International Student Attraction Program (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Immigration', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 8. Investor Residency Program | immigration | STRUCTURAL
-- Active: Av, Sa, SE, Pa
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
    'investor_residency_program_' || to_hex(extract(epoch from now())::int),
    'Investor Residency Program', 'structural',
    'Residency and citizenship pathways for foreign nationals who make a minimum qualifying investment in the national economy, attracting capital at the cost of plutocratic inequality.',
    'IMMIGRATION', 'Immigration', 'Immigration', 'Interior',
    'Globalism', '["Globalism","Individualism"]'::jsonb,
    5, 'population',
    1, 'population',
    '[
        {"stat_key":"immigration",              "direction":"up","rate":0.3, "delay_ticks":5,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",        "direction":"up","rate":0.3, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",               "direction":"up","rate":0.2, "delay_ticks":6,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality",        "direction":"up","rate":0.2, "delay_ticks":5,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",               "direction":"up","rate":0.1, "delay_ticks":6,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'UP', 0.3, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Investor Residency Program (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Immigration', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_sa, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 9. Refugee Emergency Intake | immigration | LEVER (no ongoing cost)
-- Active: Av, Pa, SE
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
    'refugee_emergency_intake_' || to_hex(extract(epoch from now())::int),
    'Refugee Emergency Intake', 'lever',
    'Emergency acceptance of large refugee populations fleeing conflict or disaster, providing immediate labor and population boost but generating significant social strain.',
    'IMMIGRATION', 'Immigration', 'Immigration', 'Interior',
    'Collectivism', '["Collectivism","Equality"]'::jsonb,
    15, 'population',
    0, NULL,
    '[
        {"stat_key":"immigration",              "direction":"up",  "rate":1,   "delay_ticks":1,"duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation", "direction":"up",  "rate":0.5, "delay_ticks":1,"duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",             "direction":"down","rate":0.5, "delay_ticks":1,"duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"civil_unrest",             "direction":"up",  "rate":0.5, "delay_ticks":3,"duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"up",  "rate":0.5, "delay_ticks":2,"duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"social_mobility",           "direction":"down","rate":0.2, "delay_ticks":4,"duration_ticks":12,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'UP', 1, 12, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Refugee Emergency Intake (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Immigration', 'Interior', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_av, v_pa, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 10. Diaspora Return Initiative | immigration | STRUCTURAL
-- Active: Me, Mo, Pa
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
    'diaspora_return_initiative_' || to_hex(extract(epoch from now())::int),
    'Diaspora Return Initiative', 'structural',
    'Financial incentives, tax breaks, and housing support encouraging citizens who emigrated to return home, converting brain drain into brain gain.',
    'IMMIGRATION', 'Immigration', 'Immigration', 'Interior',
    'Globalism', '["Globalism","Progress"]'::jsonb,
    10, 'population',
    2, 'population',
    '[
        {"stat_key":"immigration",              "direction":"up",  "rate":0.2, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"emigration",               "direction":"down","rate":0.2, "delay_ticks":5,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"happiness",                "direction":"up",  "rate":0.1, "delay_ticks":6,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"up",  "rate":0.2, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"social_mobility",           "direction":"up",  "rate":0.1, "delay_ticks":8,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'UP', 0.2, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Diaspora Return Initiative (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Immigration', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_me, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 11. Immigration Quota Reduction | border_enforcement | STRUCTURAL
-- Active: Sa, Mo
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
    'immigration_quota_reduction_' || to_hex(extract(epoch from now())::int),
    'Immigration Quota Reduction', 'structural',
    'Legislated cuts to annual legal immigration caps across all categories, reducing inflow while pushing frustrated migrants toward undocumented channels.',
    'IMMIGRATION', 'Border Enforcement', 'Border Enforcement', 'Interior',
    'Nationalism', '["Nationalism","Security"]'::jsonb,
    10, 'population',
    3, 'population',
    '[
        {"stat_key":"immigration",              "direction":"down","rate":1,   "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"illegal_immigration",      "direction":"up",  "rate":0.3, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation", "direction":"down","rate":0.2, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"down","rate":0.1, "delay_ticks":6,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"down","rate":0.2, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'DOWN', 1, 48, 0, 100, 3, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Immigration Quota Reduction (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Border Enforcement', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 12. Border Wall Construction | border_enforcement | LEVER
-- Active: Sa, Mo, SE
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
    'border_wall_construction_' || to_hex(extract(epoch from now())::int),
    'Border Wall Construction', 'lever',
    'Physical barrier infrastructure along national borders reducing both legal and illegal crossings, with high upfront cost and long-term maintenance burden.',
    'IMMIGRATION', 'Border Enforcement', 'Border Enforcement', 'Interior',
    'Nationalism', '["Nationalism","Security"]'::jsonb,
    15, 'population',
    5, 'population',
    '[
        {"stat_key":"immigration",              "direction":"down","rate":0.5, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"illegal_immigration",      "direction":"down","rate":0.5, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"crime_rate",               "direction":"down","rate":0.1, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":0.1, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation", "direction":"down","rate":0.2, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",               "direction":"up",  "rate":0.1, "delay_ticks":5,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'DOWN', 0.5, 48, 0, 100, 5, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Border Wall Construction (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Border Enforcement', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_mo, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 13. Mandatory Employer Verification | border_enforcement | STRUCTURAL
-- Active: Sa, SE, Mo
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
    'mandatory_employer_verification_' || to_hex(extract(epoch from now())::int),
    'Mandatory Employer Verification', 'structural',
    'Legal requirement for all employers to verify the immigration status of new hires through a national database, reducing undocumented labor while creating a surveillance infrastructure.',
    'IMMIGRATION', 'Border Enforcement', 'Border Enforcement', 'Interior',
    'Security', '["Security","Nationalism"]'::jsonb,
    20, 'population',
    5, 'population',
    '[
        {"stat_key":"immigration",              "direction":"down","rate":0.3,  "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"illegal_immigration",      "direction":"down","rate":0.5,  "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"efficiency",               "direction":"up",  "rate":0.1,  "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":0.15, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",               "direction":"up",  "rate":0.2,  "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"down","rate":0.1,  "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'DOWN', 0.3, 48, 0, 100, 5, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Mandatory Employer Verification (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Border Enforcement', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_se, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 14. Mass Deportation Program | border_enforcement | LEVER (no ongoing cost)
-- Active: Sa, SE
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
    'mass_deportation_program_' || to_hex(extract(epoch from now())::int),
    'Mass Deportation Program', 'lever',
    'Large-scale removal operations targeting undocumented residents, delivering an immediate drop in illegal immigration at significant humanitarian and reputational cost.',
    'IMMIGRATION', 'Border Enforcement', 'Border Enforcement', 'Interior',
    'Nationalism', '["Nationalism","Security"]'::jsonb,
    10, 'population',
    0, NULL,
    '[
        {"stat_key":"immigration",              "direction":"down","rate":0.5, "delay_ticks":1,"duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"illegal_immigration",      "direction":"down","rate":1,   "delay_ticks":1,"duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"civil_unrest",             "direction":"up",  "rate":0.5, "delay_ticks":2,"duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"down","rate":0.5, "delay_ticks":1,"duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":0.5, "delay_ticks":1,"duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation", "direction":"down","rate":0.3, "delay_ticks":2,"duration_ticks":12,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'DOWN', 0.5, 12, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Mass Deportation Program (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Border Enforcement', 'Interior', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_sa, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 15. Cultural Compatibility Screening | border_enforcement | STRUCTURAL
-- Active: Sa, Mo
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
    'cultural_compatibility_screening_' || to_hex(extract(epoch from now())::int),
    'Cultural Compatibility Screening', 'structural',
    'Immigration approval processes weighted toward applicants from culturally similar nations, framed as social cohesion policy but functioning as ethnic and religious filtering.',
    'IMMIGRATION', 'Border Enforcement', 'Border Enforcement', 'Interior',
    'Nationalism', '["Nationalism","Tradition"]'::jsonb,
    5, 'population',
    1, 'population',
    '[
        {"stat_key":"immigration",              "direction":"down","rate":0.3, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"academic_immigration",      "direction":"down","rate":0.3, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"down","rate":0.2, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",        "direction":"down","rate":0.1, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"down","rate":0.1, "delay_ticks":5,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'DOWN', 0.3, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Cultural Compatibility Screening (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Border Enforcement', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 16. Mandatory Immigration Detention | border_enforcement | STRUCTURAL
-- Active: Sa, SE
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
    'mandatory_immigration_detention_' || to_hex(extract(epoch from now())::int),
    'Mandatory Immigration Detention', 'structural',
    'Compulsory detention of all asylum seekers and undocumented arrivals pending processing, deterring irregular entry while generating domestic and international criticism.',
    'IMMIGRATION', 'Border Enforcement', 'Border Enforcement', 'Interior',
    'Nationalism', '["Nationalism","Security"]'::jsonb,
    8, 'population',
    2, 'population',
    '[
        {"stat_key":"immigration",              "direction":"down","rate":0.4,  "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"illegal_immigration",      "direction":"down","rate":0.2,  "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"happiness",                "direction":"down","rate":0.1,  "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"down","rate":0.15, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":0.1,  "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'DOWN', 0.4, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Mandatory Immigration Detention (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Border Enforcement', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 17. Remittance Tax | border_enforcement | STRUCTURAL
-- Active: Sa, Mo, SE
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
    'remittance_tax_' || to_hex(extract(epoch from now())::int),
    'Remittance Tax', 'structural',
    'A levy on money transfers sent abroad by foreign workers, reducing the financial incentive for economic migration while generating modest revenue and slowing labor inflow.',
    'IMMIGRATION', 'Border Enforcement', 'Border Enforcement', 'Interior',
    'Nationalism', '["Nationalism","Tradition"]'::jsonb,
    5, 'population',
    1, 'population',
    '[
        {"stat_key":"immigration",              "direction":"down","rate":0.2, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"illegal_immigration",      "direction":"down","rate":0.3, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation", "direction":"down","rate":0.1, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",               "direction":"down","rate":0.1, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",               "direction":"down","rate":0.1, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'DOWN', 0.2, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Remittance Tax (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Border Enforcement', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_mo, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 18. Safe Third Country Agreement | border_enforcement | STRUCTURAL
-- Active: Sa, SE, Mo
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
    'safe_third_country_agreement_' || to_hex(extract(epoch from now())::int),
    'Safe Third Country Agreement', 'structural',
    'Bilateral treaties requiring asylum seekers to apply in the first safe country they reach rather than the destination nation, legally deflecting claims before they arrive.',
    'IMMIGRATION', 'Border Enforcement', 'Border Enforcement', 'Interior',
    'Nationalism', '["Nationalism","Security"]'::jsonb,
    3, 'population',
    1, 'population',
    '[
        {"stat_key":"immigration",              "direction":"down","rate":0.5, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"illegal_immigration",      "direction":"down","rate":0.2, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"down","rate":0.3, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",        "direction":"down","rate":0.2, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"trade_agreements",          "direction":"down","rate":0.1, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'DOWN', 0.5, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Safe Third Country Agreement (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Border Enforcement', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_se, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 19. Biometric Border Control System | border_enforcement | STRUCTURAL
-- Active: Sa, SE, Mo
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
    'biometric_border_control_system_' || to_hex(extract(epoch from now())::int),
    'Biometric Border Control System', 'structural',
    'A national biometric database and border scanning infrastructure tracking all entries and exits, improving border efficiency and reducing illegal crossings at a civil liberties cost.',
    'IMMIGRATION', 'Border Enforcement', 'Border Enforcement', 'Interior',
    'Security', '["Security","Nationalism"]'::jsonb,
    12, 'population',
    4, 'population',
    '[
        {"stat_key":"immigration",              "direction":"down","rate":0.3, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"illegal_immigration",      "direction":"down","rate":0.4, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"efficiency",               "direction":"up",  "rate":0.1, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",               "direction":"down","rate":0.1, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":0.1, "delay_ticks":2,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'immigration', 'DOWN', 0.3, 48, 0, 100, 4, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Biometric Border Control System (%)' , v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Border Enforcement', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_se, v_mo]) AS nid WHERE nid IS NOT NULL;

RAISE NOTICE '✅ All 19 immigration policies created successfully.';
END $$;
