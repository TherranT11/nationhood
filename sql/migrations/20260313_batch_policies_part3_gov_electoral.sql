-- Batch insert Part 3: Governance (electoral + media) policies
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
-- 11. Mandatory Civil Registration | GOVERNANCE | electoral | STRUCTURAL
-- Active: Me, Sa
-- Cost: $8M×Population up / $2M×Population/t
-- Ideologies: Security, Collectivism
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
    'mandatory_civil_registration_' || to_hex(extract(epoch from now())::int),
    'Mandatory Civil Registration', 'structural',
    'A national identity and tracking system requiring all citizens to register with the state, improving administrative efficiency and border control while becoming a tool of surveillance and patronage.',
    'GOVERNANCE', 'Electoral', 'Electoral', 'Interior',
    'Security', '["Security","Collectivism"]'::jsonb,
    8, 'population',
    2, 'population',
    '[
        {"stat_key":"efficiency",               "direction":"up",  "rate":0.5, "delay_ticks":3, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"crime_rate",               "direction":"down","rate":0.3, "delay_ticks":4, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"illegal_immigration",      "direction":"down","rate":0.5, "delay_ticks":3, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":0.5, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",               "direction":"up",  "rate":0.5, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"emigration",               "direction":"up",  "rate":0.3, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"legitimacy",               "direction":"down","rate":0.2, "delay_ticks":8, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'efficiency', 'UP', 0.5, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Mandatory Civil Registration (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Electoral', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_me, v_sa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 12. Voter Identification Requirements | GOVERNANCE | electoral | STRUCTURAL
-- Active: Sa, Mo
-- Cost: $5M×Population up / $1M×Population/t
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
    'voter_identification_requirements_' || to_hex(extract(epoch from now())::int),
    'Voter Identification Requirements', 'structural',
    'Mandatory government-issued identification requirements for voting, framed as preventing fraud but suppressing turnout among populations less likely to hold official documentation.',
    'GOVERNANCE', 'Electoral', 'Electoral', 'Interior',
    'Security', '["Security","Tradition"]'::jsonb,
    5, 'population',
    1, 'population',
    '[
        {"stat_key":"eligible_voters",          "direction":"down","rate":0.15,"delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",               "direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"legitimacy",               "direction":"down","rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"up",  "rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'eligible_voters', 'DOWN', 0.15, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Voter Identification Requirements (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Electoral', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 13. Voting Rights Expansion | GOVERNANCE | electoral | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $3M×Population up / $0.5M×Population/t
-- Ideologies: Equality, Liberty
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
    'voting_rights_expansion_' || to_hex(extract(epoch from now())::int),
    'Voting Rights Expansion', 'structural',
    'Removal of voting restrictions including property requirements, felony disenfranchisement, and onerous registration barriers, slowly broadening democratic participation.',
    'GOVERNANCE', 'Electoral', 'Electoral', 'Interior',
    'Equality', '["Equality","Liberty"]'::jsonb,
    3, 'population',
    0.5, 'population',
    '[
        {"stat_key":"eligible_voters",          "direction":"up",  "rate":0.2, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"legitimacy",               "direction":"up",  "rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"up",  "rate":0.1, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"down","rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'eligible_voters', 'UP', 0.2, 48, 0, 100, 0.5, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Voting Rights Expansion (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Electoral', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 14. Mandatory Voting | GOVERNANCE | electoral | STRUCTURAL
-- Active: Av, Pa
-- Cost: $5M×Population up (no ongoing)
-- Ideologies: Collectivism, Equality
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
    'mandatory_voting_' || to_hex(extract(epoch from now())::int),
    'Mandatory Voting', 'structural',
    'Compulsory participation in elections under penalty of fine or civic sanction, boosting turnout and institutional legitimacy while restricting the right to abstain.',
    'GOVERNANCE', 'Electoral', 'Electoral', 'Interior',
    'Collectivism', '["Collectivism","Equality"]'::jsonb,
    5, 'population',
    0, NULL,
    '[
        {"stat_key":"eligible_voters",          "direction":"up",  "rate":1,   "delay_ticks":2, "duration_ticks":8, "adjust_type":null,"adjust_value":0},
        {"stat_key":"legitimacy",               "direction":"up",  "rate":0.5, "delay_ticks":2, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"down","rate":0.3, "delay_ticks":4, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":0.3, "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"civil_unrest",             "direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":12,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'eligible_voters', 'UP', 1, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Mandatory Voting (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Electoral', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 15. Sedition and Defamation Reform | GOVERNANCE | law_enforcement | STRUCTURAL
-- Active: Me, Sa
-- Cost: $2M×Population up / $0.5M×Population/t
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
    'sedition_defamation_reform_' || to_hex(extract(epoch from now())::int),
    'Sedition and Defamation Reform', 'structural',
    'Strengthened defamation and sedition laws framed as protection from harmful speech, delivering the heaviest press freedom damage in the policy set while critics fall silent out of legal fear.',
    'GOVERNANCE', 'Law Enforcement', 'Law Enforcement', 'Justice',
    'Security', '["Security","Tradition"]'::jsonb,
    2, 'population',
    0.5, 'population',
    '[
        {"stat_key":"stability",                "direction":"up",  "rate":0.5, "delay_ticks":2, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"civil_unrest",             "direction":"down","rate":0.3, "delay_ticks":2, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"down","rate":0.3, "delay_ticks":5, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"press_freedom",            "direction":"down","rate":1.5, "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":0.5, "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"judicial_independence",     "direction":"down","rate":0.5, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation", "direction":"down","rate":0.5, "delay_ticks":2, "duration_ticks":16,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'press_freedom', 'DOWN', 1.5, 48, 0, 100, 0.5, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Sedition and Defamation Reform (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Law Enforcement', 'Justice', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_me, v_sa]) AS nid WHERE nid IS NOT NULL;

END $$;
