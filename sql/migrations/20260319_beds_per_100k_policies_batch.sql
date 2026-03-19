-- Batch insert: Beds Per 100K policies (15 policies)
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
-- 1. Regional Hospital Construction Program | SOCIAL | Healthcare | LEVER
-- Active: Me, Mo, Pa, SE
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
    'regional_hospital_construction_program_' || to_hex(extract(epoch from now())::int),
    'Regional Hospital Construction Program', 'lever',
    'State-funded construction of full-service district hospitals in regions currently without adequate inpatient facilities, distributing bed capacity beyond the capital and major cities.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"beds_per_100k",            "direction":"up",   "rate":0.8, "delay_ticks":8, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_accessibility",  "direction":"up",   "rate":0.3, "delay_ticks":8, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"unemployment",             "direction":"down", "rate":0.2, "delay_ticks":3, "duration_ticks":12, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",   "rate":0.5, "delay_ticks":1, "duration_ticks":12, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'beds_per_100k', 'UP', 0.8, 20, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Regional Hospital Construction Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 28
FROM unnest(ARRAY[v_me, v_mo, v_pa, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 2. Private Hospital Development Incentives | SOCIAL | Healthcare | STRUCTURAL
-- Active: Av, Sa, SE, Pa
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
    'private_hospital_development_incentives_' || to_hex(extract(epoch from now())::int),
    'Private Hospital Development Incentives', 'structural',
    'Tax credits, expedited licensing, and preferential land grants for private hospital investment, growing national bed capacity through market mechanisms and reducing fiscal pressure on the public system.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Individualism', '["Individualism","Progress"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"beds_per_100k",        "direction":"up", "rate":0.3, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_quality",    "direction":"up", "rate":0.1, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"foreign_investment",    "direction":"up", "rate":0.1, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"income_inequality",     "direction":"up", "rate":0.1, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'beds_per_100k', 'UP', 0.3, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Private Hospital Development Incentives (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 54
FROM unnest(ARRAY[v_av, v_sa, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 3. Specialist Medical Center Development | SOCIAL | Healthcare | LEVER
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
    'specialist_medical_center_development_' || to_hex(extract(epoch from now())::int),
    'Specialist Medical Center Development', 'lever',
    'Government-funded construction of dedicated specialist hospitals for oncology, cardiac surgery, orthopedics, and neurology, adding high-acuity capacity and ending the practice of sending complex cases abroad.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Progress', '["Progress","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"beds_per_100k",            "direction":"up", "rate":0.5, "delay_ticks":7, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_quality",        "direction":"up", "rate":0.3, "delay_ticks":8, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_accessibility",  "direction":"up", "rate":0.2, "delay_ticks":8, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",               "direction":"up", "rate":0.4, "delay_ticks":1, "duration_ticks":12, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'beds_per_100k', 'UP', 0.5, 20, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Specialist Medical Center Development (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 28
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 4. Long-Term and Elderly Care Facility Expansion | SOCIAL | Healthcare | STRUCTURAL
-- Active: Av, Mo, Pa
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
    'long_term_elderly_care_facility_expansion_' || to_hex(extract(epoch from now())::int),
    'Long-Term and Elderly Care Facility Expansion', 'structural',
    'Investment in nursing homes, rehabilitation centers, and residential elderly care facilities, releasing acute hospital beds occupied by patients who require long-term support rather than active medical treatment.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Tradition', '["Tradition","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"beds_per_100k",        "direction":"up", "rate":0.3, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"lifespan",             "direction":"up", "rate":0.2, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_quality",   "direction":"up", "rate":0.1, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"median_age",           "direction":"up", "rate":0.1, "delay_ticks":8, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",          "direction":"up", "rate":0.2, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'beds_per_100k', 'UP', 0.3, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Long-Term and Elderly Care Facility Expansion (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 56
FROM unnest(ARRAY[v_av, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 5. National Hospital Bed Minimum Standard | GOVERNANCE | Regulatory | STRUCTURAL
-- Active: Av, SE, Mo, Pa
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
    'national_hospital_bed_minimum_standard_' || to_hex(extract(epoch from now())::int),
    'National Hospital Bed Minimum Standard', 'structural',
    'Legally binding regional bed-to-population ratio requirements forcing investment in underserved areas, with a national compliance fund supporting local authorities unable to meet standards independently.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Health',
    'Security', '["Security","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"beds_per_100k",            "direction":"up", "rate":0.2,  "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_accessibility",  "direction":"up", "rate":0.1,  "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"legitimacy",               "direction":"up", "rate":0.1,  "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up", "rate":0.15, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'beds_per_100k', 'UP', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: National Hospital Bed Minimum Standard (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Health', 'active', 0, true, true, 53
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 6. Military Hospital Civilian Access Act | GOVERNANCE | Regulatory | STRUCTURAL
-- Active: Sa, Mo, SE
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
    'military_hospital_civilian_access_act_' || to_hex(extract(epoch from now())::int),
    'Military Hospital Civilian Access Act', 'structural',
    'Opening of military hospital facilities, operating theaters, and medical staff to civilian patients during peacetime, utilizing existing government-owned bed capacity without new construction expenditure.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Health',
    'Security', '["Security","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"beds_per_100k",            "direction":"up", "rate":0.2, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_accessibility",  "direction":"up", "rate":0.1, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"efficiency",               "direction":"up", "rate":0.1, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'beds_per_100k', 'UP', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Military Hospital Civilian Access Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Health', 'active', 0, true, true, 50
FROM unnest(ARRAY[v_sa, v_mo, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 7. Psychiatric and Mental Health Inpatient Expansion | SOCIAL | Healthcare | STRUCTURAL
-- Active: Av, SE, Pa, Mo
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
    'psychiatric_mental_health_inpatient_expansion_' || to_hex(extract(epoch from now())::int),
    'Psychiatric and Mental Health Inpatient Expansion', 'structural',
    'Dedicated funding for psychiatric inpatient wards and residential mental health facilities, addressing the severe undercount of mental health beds relative to need in national bed statistics.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Equality', '["Equality","Progress"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"beds_per_100k",            "direction":"up",   "rate":0.2,  "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_accessibility",  "direction":"up",   "rate":0.1,  "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"happiness",                "direction":"up",   "rate":0.15, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"drug_use",                 "direction":"down", "rate":0.1,  "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",   "rate":0.1,  "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'beds_per_100k', 'UP', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Psychiatric and Mental Health Inpatient Expansion (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 54
FROM unnest(ARRAY[v_av, v_se, v_pa, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 8. International Hospital Partnership Program | SOCIAL | Healthcare | LEVER
-- Active: Sa, SE, Pa
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
    'international_hospital_partnership_program_' || to_hex(extract(epoch from now())::int),
    'International Hospital Partnership Program', 'lever',
    'Joint venture agreements with foreign hospital groups and health systems bringing private capital, management expertise, and technology to build and operate new domestic hospital facilities.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Globalism', '["Globalism","Progress"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"beds_per_100k",        "direction":"up", "rate":0.3, "delay_ticks":6, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_quality",    "direction":"up", "rate":0.2, "delay_ticks":6, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"foreign_investment",    "direction":"up", "rate":0.2, "delay_ticks":4, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"academic_immigration",  "direction":"up", "rate":0.1, "delay_ticks":5, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",           "direction":"up", "rate":0.2, "delay_ticks":1, "duration_ticks":12, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'beds_per_100k', 'UP', 0.3, 20, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: International Hospital Partnership Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 26
FROM unnest(ARRAY[v_sa, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 9. Hospice and Palliative Care Network Expansion | SOCIAL | Healthcare | STRUCTURAL
-- Active: Av, SE, Mo, Pa
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
    'hospice_palliative_care_network_expansion_' || to_hex(extract(epoch from now())::int),
    'Hospice and Palliative Care Network Expansion', 'structural',
    'Community-based hospice facilities providing end-of-life care outside acute hospital settings, adding a specialized care layer while freeing general hospital beds from patients who do not require acute intervention.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Tradition', '["Tradition","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"beds_per_100k",        "direction":"up",   "rate":0.2, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_quality",    "direction":"up",   "rate":0.1, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"happiness",            "direction":"up",   "rate":0.1, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"death_rate",           "direction":"down", "rate":0.1, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",          "direction":"up",   "rate":0.1, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'beds_per_100k', 'UP', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Hospice and Palliative Care Network Expansion (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 54
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 10. Nursing Workforce Expansion Initiative | LABOR | Workers | STRUCTURAL
-- Active: Av, SE, Mo, Pa
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
    'nursing_workforce_expansion_initiative_' || to_hex(extract(epoch from now())::int),
    'Nursing Workforce Expansion Initiative', 'structural',
    'Nursing scholarships, international nurse recruitment agreements, pay parity legislation, and career pathway improvements specifically targeting the nursing shortage that leaves funded beds unstaffed.',
    'LABOR', 'Workers', 'Workers', 'Health',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"beds_per_100k",            "direction":"up",   "rate":0.2, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_accessibility",  "direction":"up",   "rate":0.1, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_quality",        "direction":"up",   "rate":0.1, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"unemployment",             "direction":"down", "rate":0.1, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",   "rate":0.1, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'beds_per_100k', 'UP', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Nursing Workforce Expansion Initiative (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'LABOR', 'Workers', 'Health', 'active', 0, true, true, 53
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 11. Community Rehabilitation Center Program | SOCIAL | Healthcare | LEVER
-- Active: Av, SE, Pa
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
    'community_rehabilitation_center_program_' || to_hex(extract(epoch from now())::int),
    'Community Rehabilitation Center Program', 'lever',
    'Government-built step-down and rehabilitation centers for recovering surgical and stroke patients, providing an intermediate care layer that clears acute hospital beds faster and improves recovery outcomes.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Equality', '["Equality","Progress"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"beds_per_100k",            "direction":"up", "rate":0.3,  "delay_ticks":5, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_accessibility",  "direction":"up", "rate":0.15, "delay_ticks":5, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_quality",        "direction":"up", "rate":0.1,  "delay_ticks":6, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"lifespan",                 "direction":"up", "rate":0.1,  "delay_ticks":8, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up", "rate":0.2,  "delay_ticks":1, "duration_ticks":12, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'beds_per_100k', 'UP', 0.3, 20, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Community Rehabilitation Center Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 25
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 12. Children's Hospital Network | SOCIAL | Healthcare | LEVER
-- Active: Av, SE, Pa, Mo
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
    'childrens_hospital_network_' || to_hex(extract(epoch from now())::int),
    'Children''s Hospital Network', 'lever',
    'Dedicated pediatric hospitals in major population centers providing specialist children''s medical and surgical care, adding child-specific capacity and relieving general wards of complex pediatric cases.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"beds_per_100k",            "direction":"up",   "rate":0.4, "delay_ticks":7, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_accessibility",  "direction":"up",   "rate":0.2, "delay_ticks":7, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"death_rate",               "direction":"down", "rate":0.1, "delay_ticks":8, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"birth_rate",               "direction":"up",   "rate":0.1, "delay_ticks":8, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",   "rate":0.3, "delay_ticks":1, "duration_ticks":12, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'beds_per_100k', 'UP', 0.4, 20, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Children''s Hospital Network (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 27
FROM unnest(ARRAY[v_av, v_se, v_pa, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 13. Day Surgery and Ambulatory Care Expansion | SOCIAL | Healthcare | STRUCTURAL
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
    'day_surgery_ambulatory_care_expansion_' || to_hex(extract(epoch from now())::int),
    'Day Surgery and Ambulatory Care Expansion', 'structural',
    'Investment in outpatient surgical centers performing procedures without overnight admission, increasing surgical throughput and freeing inpatient beds by reducing average length of stay for elective procedures.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Progress', '["Progress","Individualism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"beds_per_100k",            "direction":"down", "rate":0.1, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_accessibility",  "direction":"up",   "rate":0.2, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_quality",        "direction":"up",   "rate":0.2, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"efficiency",               "direction":"up",   "rate":0.2, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",   "rate":0.1, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'beds_per_100k', 'DOWN', 0.1, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Day Surgery and Ambulatory Care Expansion (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 52
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 14. Hospital Decommissioning and Consolidation | SOCIAL | Healthcare | LEVER
-- Active: Av, SE, Pa
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
    'hospital_decommissioning_consolidation_' || to_hex(extract(epoch from now())::int),
    'Hospital Decommissioning and Consolidation', 'lever',
    'Planned closure of underutilized rural or financially unviable small hospitals with consolidation of services into larger regional centers, improving clinical quality and efficiency at the cost of local access and bed count.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Individualism', '["Individualism","Progress"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"beds_per_100k",            "direction":"down", "rate":0.3, "delay_ticks":3, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_quality",        "direction":"up",   "rate":0.2, "delay_ticks":4, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"efficiency",               "direction":"up",   "rate":0.2, "delay_ticks":3, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_accessibility",  "direction":"down", "rate":0.2, "delay_ticks":3, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"down", "rate":0.2, "delay_ticks":2, "duration_ticks":16, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'beds_per_100k', 'DOWN', 0.3, 16, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Hospital Decommissioning and Consolidation (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 19
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 15. National Emergency Medical Reserve | GOVERNANCE | Regulatory | STRUCTURAL
-- Active: Av, Sa, SE
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
    'national_emergency_medical_reserve_' || to_hex(extract(epoch from now())::int),
    'National Emergency Medical Reserve', 'structural',
    'A maintained strategic reserve of portable hospital units, field hospital equipment, and trained rapid-deployment medical teams providing surge capacity during pandemics, disasters, and crises.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Health',
    'Security', '["Security","Nationalism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"beds_per_100k",            "direction":"up", "rate":0.1,  "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"stability",                "direction":"up", "rate":0.1,  "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_accessibility",  "direction":"up", "rate":0.05, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up", "rate":0.1,  "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'beds_per_100k', 'UP', 0.1, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: National Emergency Medical Reserve (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Health', 'active', 0, true, true, 51
FROM unnest(ARRAY[v_av, v_sa, v_se]) AS nid WHERE nid IS NOT NULL;

END $$;
