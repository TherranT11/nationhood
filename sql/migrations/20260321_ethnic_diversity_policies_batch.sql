-- Batch insert: Ethnic Diversity policies (10 policies)
-- These policies target ethnic diversity reduction through various mechanisms.
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
-- 1. Mandatory Cultural Assimilation Registry | GOVERNANCE | Regulatory | STRUCTURAL
-- Active: Sa, Mo, Me
-- Ideologies: Nationalism, Tradition
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
    'mandatory_cultural_assimilation_registry_' || to_hex(extract(epoch from now())::int),
    'Mandatory Cultural Assimilation Registry', 'structural',
    'A national registration system requiring ethnic minorities and immigrants to formally demonstrate cultural assimilation through language testing, civic examinations, and renunciation of foreign cultural affiliations as a condition of full civic participation.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Interior',
    'Nationalism', '["Nationalism","Tradition"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"ethnic_diversity",          "direction":"down", "rate":0.2, "delay_ticks":4,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"immigration",               "direction":"down", "rate":0.1, "delay_ticks":4,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"polarization",              "direction":"down", "rate":0.1, "delay_ticks":8,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"freedom_index",             "direction":"down", "rate":0.2, "delay_ticks":2,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"down", "rate":0.1, "delay_ticks":3,  "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'ethnic_diversity', 'DOWN', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Mandatory Cultural Assimilation Registry (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_mo, v_me]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 2. Ethnic Origin Immigration Restriction Act | IMMIGRATION | Border Enforcement | STRUCTURAL
-- Active: Sa, Mo, SE
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
    'ethnic_origin_immigration_restriction_act_' || to_hex(extract(epoch from now())::int),
    'Ethnic Origin Immigration Restriction Act', 'structural',
    'Legislation restricting immigration intake to applicants from defined cultural or ethnic origin nations, framed as preserving social cohesion but functioning as an explicit ethnic filter on who may enter and settle.',
    'IMMIGRATION', 'Border Enforcement', 'Border Enforcement', 'Interior',
    'Nationalism', '["Nationalism","Security"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"ethnic_diversity",          "direction":"down", "rate":0.3, "delay_ticks":3,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"immigration",               "direction":"down", "rate":0.2, "delay_ticks":3,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"polarization",              "direction":"down", "rate":0.1, "delay_ticks":6,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"down", "rate":0.2, "delay_ticks":2,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"foreign_investment",        "direction":"down", "rate":0.1, "delay_ticks":3,  "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'ethnic_diversity', 'DOWN', 0.3, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Ethnic Origin Immigration Restriction Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Border Enforcement', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_mo, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 3. Minority Language Suppression Act | GOVERNANCE | Civil Rights | STRUCTURAL
-- Active: Sa, Me, Mo
-- Ideologies: Nationalism, Tradition
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
    'minority_language_suppression_act_' || to_hex(extract(epoch from now())::int),
    'Minority Language Suppression Act', 'structural',
    'Prohibition of minority languages in public institutions, schools, courts, and government services, mandating the dominant national language exclusively and eroding the cultural infrastructure that sustains distinct ethnic communities.',
    'GOVERNANCE', 'Civil Rights', 'Civil Rights', 'Interior',
    'Nationalism', '["Nationalism","Tradition"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"ethnic_diversity",          "direction":"down", "rate":0.2, "delay_ticks":5,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"stability",                 "direction":"up",   "rate":0.1, "delay_ticks":6,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"polarization",              "direction":"up",   "rate":0.1, "delay_ticks":4,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"freedom_index",             "direction":"down", "rate":0.2, "delay_ticks":2,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"down", "rate":0.1, "delay_ticks":3,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"civil_unrest",              "direction":"up",   "rate":0.1, "delay_ticks":5,  "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'ethnic_diversity', 'DOWN', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Minority Language Suppression Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Civil Rights', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_me, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 4. National Cultural Homogeneity Education Curriculum | EDUCATION | Education | STRUCTURAL
-- Active: Sa, Mo, Me
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
    'national_cultural_homogeneity_education_curriculum_' || to_hex(extract(epoch from now())::int),
    'National Cultural Homogeneity Education Curriculum', 'structural',
    'State-mandated school curriculum erasing or marginalizing minority cultural histories and replacing them with a singular dominant national narrative, reshaping generational identity over time toward cultural uniformity.',
    'EDUCATION', 'Education', 'Education', 'Education',
    'Tradition', '["Tradition","Nationalism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"ethnic_diversity",          "direction":"down", "rate":0.15,"delay_ticks":8,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"stability",                 "direction":"up",   "rate":0.1, "delay_ticks":10, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"polarization",              "direction":"down", "rate":0.1, "delay_ticks":10, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"freedom_index",             "direction":"down", "rate":0.1, "delay_ticks":6,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"academic_immigration",      "direction":"down", "rate":0.1, "delay_ticks":8,  "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'ethnic_diversity', 'DOWN', 0.15, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: National Cultural Homogeneity Education Curriculum (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'EDUCATION', 'Education', 'Education', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_mo, v_me]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 5. Citizenship Stripping and Revocation Act | GOVERNANCE | Law Enforcement | STRUCTURAL
-- Active: Sa, Me
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
    'citizenship_stripping_revocation_act_' || to_hex(extract(epoch from now())::int),
    'Citizenship Stripping and Revocation Act', 'structural',
    'Legislation enabling the state to revoke citizenship from naturalized citizens or dual nationals on broadly defined security, loyalty, or cultural grounds, creating a two-tier citizenship that targets ethnic minorities disproportionately.',
    'GOVERNANCE', 'Law Enforcement', 'Law Enforcement', 'Justice',
    'Nationalism', '["Nationalism","Security"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"ethnic_diversity",          "direction":"down", "rate":0.25,"delay_ticks":3,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"freedom_index",             "direction":"down", "rate":0.3, "delay_ticks":2,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"emigration",                "direction":"up",   "rate":0.2, "delay_ticks":3,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"down", "rate":0.3, "delay_ticks":2,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"civil_unrest",              "direction":"up",   "rate":0.2, "delay_ticks":5,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"legitimacy",                "direction":"down", "rate":0.2, "delay_ticks":6,  "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'ethnic_diversity', 'DOWN', 0.25, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Citizenship Stripping and Revocation Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Law Enforcement', 'Justice', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_me]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 6. Ethnic Residential Zoning Restrictions | GOVERNANCE | Regulatory | STRUCTURAL
-- Active: Sa, Me, Mo
-- Ideologies: Security, Nationalism
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
    'ethnic_residential_zoning_restrictions_' || to_hex(extract(epoch from now())::int),
    'Ethnic Residential Zoning Restrictions', 'structural',
    'Legal restrictions preventing ethnic minority populations from purchasing property or settling in designated neighborhoods or regions, enforcing geographic separation and fragmenting community networks through residential law.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Interior',
    'Security', '["Security","Nationalism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"ethnic_diversity",          "direction":"down", "rate":0.2, "delay_ticks":4,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"housing_affordability",     "direction":"down", "rate":0.1, "delay_ticks":3,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"civil_unrest",              "direction":"up",   "rate":0.2, "delay_ticks":5,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"freedom_index",             "direction":"down", "rate":0.2, "delay_ticks":2,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"down", "rate":0.2, "delay_ticks":2,  "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"legitimacy",                "direction":"down", "rate":0.1, "delay_ticks":6,  "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'ethnic_diversity', 'DOWN', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Ethnic Residential Zoning Restrictions (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_me, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 7. Mass Deportation of Undocumented Minorities | IMMIGRATION | Border Enforcement | LEVER
-- Active: Sa, Me, SE
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
    'mass_deportation_undocumented_minorities_' || to_hex(extract(epoch from now())::int),
    'Mass Deportation of Undocumented Minorities', 'lever',
    'A large-scale targeted deportation operation focused on undocumented ethnic minority populations, rapidly reducing visible minority communities through removal operations that frequently ensnare documented residents as well.',
    'IMMIGRATION', 'Border Enforcement', 'Border Enforcement', 'Interior',
    'Nationalism', '["Nationalism","Security"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"ethnic_diversity",          "direction":"down", "rate":0.5, "delay_ticks":1,  "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"illegal_immigration",       "direction":"down", "rate":0.3, "delay_ticks":1,  "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"civil_unrest",              "direction":"up",   "rate":0.4, "delay_ticks":2,  "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"down", "rate":0.5, "delay_ticks":1,  "duration_ticks":12, "adjust_type":null, "adjust_value":0},
        {"stat_key":"freedom_index",             "direction":"down", "rate":0.3, "delay_ticks":1,  "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"labor_force_participation", "direction":"down", "rate":0.2, "delay_ticks":2,  "duration_ticks":16, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'ethnic_diversity', 'DOWN', 0.5, 16, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Mass Deportation of Undocumented Minorities (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Border Enforcement', 'Interior', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_sa, v_me, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 8. Ethnic Cultural Institution Defunding | GOVERNANCE | Regulatory | LEVER
-- Active: Sa, Me, Mo
-- Ideologies: Nationalism, Tradition
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
    'ethnic_cultural_institution_defunding_' || to_hex(extract(epoch from now())::int),
    'Ethnic Cultural Institution Defunding', 'lever',
    'Sudden withdrawal of state funding from minority cultural centers, community organizations, language schools, and ethnic media, dismantling the institutional infrastructure of minority communities faster than gradual policy erosion.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Interior',
    'Nationalism', '["Nationalism","Tradition"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"ethnic_diversity",          "direction":"down", "rate":0.3, "delay_ticks":2,  "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"happiness",                 "direction":"down", "rate":0.2, "delay_ticks":2,  "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"civil_unrest",              "direction":"up",   "rate":0.2, "delay_ticks":3,  "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"polarization",              "direction":"up",   "rate":0.2, "delay_ticks":3,  "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"down", "rate":0.2, "delay_ticks":2,  "duration_ticks":12, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'ethnic_diversity', 'DOWN', 0.3, 16, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Ethnic Cultural Institution Defunding (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Interior', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_sa, v_me, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 9. Forced Internal Resettlement Program | GOVERNANCE | Regime Control | LEVER
-- Active: Sa, Me
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
    'forced_internal_resettlement_program_' || to_hex(extract(epoch from now())::int),
    'Forced Internal Resettlement Program', 'lever',
    'State-directed compulsory relocation of ethnic minority populations from their home regions to dispersed internal settlements, breaking up geographic community concentrations under the administrative framing of national development.',
    'GOVERNANCE', 'Regime Control', 'Regime Control', 'Interior',
    'Nationalism', '["Nationalism","Security"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"ethnic_diversity",          "direction":"down", "rate":0.4, "delay_ticks":2,  "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"stability",                 "direction":"up",   "rate":0.1, "delay_ticks":3,  "duration_ticks":12, "adjust_type":null, "adjust_value":0},
        {"stat_key":"civil_unrest",              "direction":"up",   "rate":0.4, "delay_ticks":4,  "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"down", "rate":0.5, "delay_ticks":1,  "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"sanctions",                 "direction":"up",   "rate":0.3, "delay_ticks":2,  "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"legitimacy",                "direction":"down", "rate":0.3, "delay_ticks":4,  "duration_ticks":20, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'ethnic_diversity', 'DOWN', 0.4, 16, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Forced Internal Resettlement Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regime Control', 'Interior', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_sa, v_me]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 10. Minority Business and Property Expropriation | ECONOMICS | Structural Reform | LEVER
-- Active: Sa, Me
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
    'minority_business_property_expropriation_' || to_hex(extract(epoch from now())::int),
    'Minority Business and Property Expropriation', 'lever',
    'State seizure of businesses, property, and assets owned by ethnic minority communities under economic nationalization framing, stripping the economic foundation of minority communities and accelerating emigration.',
    'ECONOMICS', 'Structural Reform', 'Structural Reform', 'Finance',
    'Nationalism', '["Nationalism","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"ethnic_diversity",          "direction":"down", "rate":0.4, "delay_ticks":2,  "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"corruption",                "direction":"up",   "rate":0.3, "delay_ticks":3,  "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"foreign_investment",        "direction":"down", "rate":0.4, "delay_ticks":1,  "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"emigration",                "direction":"up",   "rate":0.3, "delay_ticks":2,  "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"down", "rate":0.4, "delay_ticks":1,  "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"gdp_growth",                "direction":"down", "rate":0.2, "delay_ticks":3,  "duration_ticks":16, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'ethnic_diversity', 'DOWN', 0.4, 16, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Minority Business and Property Expropriation (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Structural Reform', 'Finance', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_sa, v_me]) AS nid WHERE nid IS NOT NULL;

END $$;
