-- Batch insert: Healthcare Accessibility policies (14 policies)
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
-- 1. Community Health Clinic Network | SOCIAL | Healthcare | LEVER
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
    'community_health_clinic_network_' || to_hex(extract(epoch from now())::int),
    'Community Health Clinic Network', 'lever',
    'Government-funded construction of small primary care clinics in underserved neighborhoods, rural towns, and remote areas, bringing basic diagnosis, treatment, and referral services within reach of all citizens.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"healthcare_accessibility", "direction":"up",   "rate":0.5, "delay_ticks":5, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"beds_per_100k",            "direction":"up",   "rate":0.2, "delay_ticks":5, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"death_rate",               "direction":"down", "rate":0.1, "delay_ticks":8, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"unemployment",             "direction":"down", "rate":0.1, "delay_ticks":3, "duration_ticks":12, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",   "rate":0.3, "delay_ticks":1, "duration_ticks":12, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'healthcare_accessibility', 'UP', 0.5, 20, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Community Health Clinic Network (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 28
FROM unnest(ARRAY[v_me, v_mo, v_pa, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 2. Rural Doctor Incentive Program | SOCIAL | Healthcare | STRUCTURAL
-- Active: Me, Mo, Pa, Av
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
    'rural_doctor_incentive_program_' || to_hex(extract(epoch from now())::int),
    'Rural Doctor Incentive Program', 'structural',
    'Salary supplements, housing allowances, student loan forgiveness, and funded continuing education for physicians and nurses who commit to practicing in rural or underserved communities.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"healthcare_accessibility", "direction":"up",   "rate":0.2, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_quality",       "direction":"up",   "rate":0.1, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"death_rate",               "direction":"down", "rate":0.1, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",   "rate":0.1, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'healthcare_accessibility', 'UP', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Rural Doctor Incentive Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 54
FROM unnest(ARRAY[v_me, v_mo, v_pa, v_av]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 3. Telemedicine and Digital Health Platform | SOCIAL | Healthcare | STRUCTURAL
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
    'telemedicine_digital_health_platform_' || to_hex(extract(epoch from now())::int),
    'Telemedicine and Digital Health Platform', 'structural',
    'National telehealth infrastructure enabling remote consultations, prescription renewals, and specialist video referrals via smartphone or computer, extending healthcare reach without physical facilities.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Progress', '["Progress","Individualism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"healthcare_accessibility", "direction":"up", "rate":0.2, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_quality",       "direction":"up", "rate":0.1, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"digital_infrastructure",   "direction":"up", "rate":0.1, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"efficiency",               "direction":"up", "rate":0.1, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up", "rate":0.1, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'healthcare_accessibility', 'UP', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Telemedicine and Digital Health Platform (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 52
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 4. Mobile Health Unit Deployment | SOCIAL | Healthcare | LEVER
-- Active: Me, Mo, Pa
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
    'mobile_health_unit_deployment_' || to_hex(extract(epoch from now())::int),
    'Mobile Health Unit Deployment', 'lever',
    'Fleet of government-operated mobile clinics providing basic medical care, vaccination, maternal health, and chronic disease screening to remote communities on regular scheduled circuits.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"healthcare_accessibility", "direction":"up",   "rate":0.3,  "delay_ticks":3, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"death_rate",               "direction":"down", "rate":0.1,  "delay_ticks":5, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"poverty_rate",             "direction":"down", "rate":0.05, "delay_ticks":5, "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",   "rate":0.2,  "delay_ticks":1, "duration_ticks":12, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'healthcare_accessibility', 'UP', 0.3, 16, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Mobile Health Unit Deployment (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 21
FROM unnest(ARRAY[v_me, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 5. National Health Insurance Subsidy | SOCIAL | Welfare | STRUCTURAL
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
    'national_health_insurance_subsidy_' || to_hex(extract(epoch from now())::int),
    'National Health Insurance Subsidy', 'structural',
    'Income-tested premium subsidies reducing private health insurance costs for low and middle income households, expanding coverage through market mechanisms without full public provision.',
    'SOCIAL', 'Welfare', 'Welfare', 'Health',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"healthcare_accessibility", "direction":"up",   "rate":0.25, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"happiness",                "direction":"up",   "rate":0.1,  "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"income_inequality",        "direction":"down", "rate":0.1,  "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",   "rate":0.2,  "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'healthcare_accessibility', 'UP', 0.25, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: National Health Insurance Subsidy (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Welfare', 'Health', 'active', 0, true, true, 53
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 6. Community Health Worker Program | SOCIAL | Healthcare | STRUCTURAL
-- Active: Me, Mo, Pa
-- Ideologies: Equality, Tradition
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
    'community_health_worker_program_' || to_hex(extract(epoch from now())::int),
    'Community Health Worker Program', 'structural',
    'Training and formal deployment of lay community health workers drawn from local populations to provide first-line health education, basic care, and hospital referral in areas without formal healthcare infrastructure.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Equality', '["Equality","Tradition"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"healthcare_accessibility", "direction":"up",   "rate":0.2, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"death_rate",               "direction":"down", "rate":0.1, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"social_mobility",          "direction":"up",   "rate":0.1, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"unemployment",             "direction":"down", "rate":0.1, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",   "rate":0.1, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'healthcare_accessibility', 'UP', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Community Health Worker Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 54
FROM unnest(ARRAY[v_me, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 7. Emergency Care Non-Refusal Mandate | GOVERNANCE | Regulatory | STRUCTURAL
-- Active: Av, SE, Pa, Mo
-- Ideologies: Equality, Agnostic
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
    'emergency_care_non_refusal_mandate_' || to_hex(extract(epoch from now())::int),
    'Emergency Care Non-Refusal Mandate', 'structural',
    'Legal requirement that all licensed medical facilities provide emergency treatment regardless of insurance status or ability to pay, with a public indemnity fund compensating providers for uncompensated care.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Health',
    'Equality', '["Equality","Agnostic"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"healthcare_accessibility", "direction":"up", "rate":0.15, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"legitimacy",               "direction":"up", "rate":0.1,  "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"happiness",                "direction":"up", "rate":0.1,  "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up", "rate":0.1,  "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'healthcare_accessibility', 'UP', 0.15, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Emergency Care Non-Refusal Mandate (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Health', 'active', 0, true, true, 51
FROM unnest(ARRAY[v_av, v_se, v_pa, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 8. National Disease Screening Program | SOCIAL | Healthcare | STRUCTURAL
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
    'national_disease_screening_program_' || to_hex(extract(epoch from now())::int),
    'National Disease Screening Program', 'structural',
    'Government-funded population screening for prevalent conditions including cancer, cardiovascular disease, and diabetes, catching illness at earlier and more treatable stages before it becomes acute.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Progress', '["Progress","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"healthcare_accessibility", "direction":"up",   "rate":0.15, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_quality",       "direction":"up",   "rate":0.1,  "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"lifespan",                 "direction":"up",   "rate":0.2,  "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"death_rate",               "direction":"down", "rate":0.2,  "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",   "rate":0.1,  "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'healthcare_accessibility', 'UP', 0.15, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: National Disease Screening Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 53
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 9. Medical School Capacity Expansion | EDUCATION | Education | LEVER
-- Active: Av, SE, Pa, Mo
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
    'medical_school_capacity_expansion_' || to_hex(extract(epoch from now())::int),
    'Medical School Capacity Expansion', 'lever',
    'Government grants expanding enrollment at medical schools and nursing colleges, addressing the underlying workforce shortage that is the primary structural constraint on healthcare accessibility.',
    'EDUCATION', 'Education', 'Education', 'Education',
    'Progress', '["Progress","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"healthcare_accessibility", "direction":"up",   "rate":0.2, "delay_ticks":8,  "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_quality",       "direction":"up",   "rate":0.1, "delay_ticks":10, "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"higher_education",         "direction":"up",   "rate":0.1, "delay_ticks":6,  "duration_ticks":16, "adjust_type":null, "adjust_value":0},
        {"stat_key":"unemployment",             "direction":"down", "rate":0.1, "delay_ticks":4,  "duration_ticks":12, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",   "rate":0.2, "delay_ticks":1,  "duration_ticks":12, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'healthcare_accessibility', 'UP', 0.2, 20, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Medical School Capacity Expansion (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'EDUCATION', 'Education', 'Education', 'active', 0, true, true, 30
FROM unnest(ARRAY[v_av, v_se, v_pa, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 10. Maternal and Child Health Program | SOCIAL | Healthcare | STRUCTURAL
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
    'maternal_and_child_health_program_' || to_hex(extract(epoch from now())::int),
    'Maternal and Child Health Program', 'structural',
    'Comprehensive antenatal care, postnatal support, childhood vaccination schedules, and pediatric primary care ensuring mothers and children are not excluded from the healthcare system by cost or distance.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"healthcare_accessibility", "direction":"up",   "rate":0.2, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"death_rate",               "direction":"down", "rate":0.2, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"birth_rate",               "direction":"up",   "rate":0.1, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"happiness",                "direction":"up",   "rate":0.1, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",   "rate":0.1, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'healthcare_accessibility', 'UP', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Maternal and Child Health Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 52
FROM unnest(ARRAY[v_me, v_mo, v_pa, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 11. Mental Health Parity and Integration Act | SOCIAL | Healthcare | STRUCTURAL
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
    'mental_health_parity_integration_act_' || to_hex(extract(epoch from now())::int),
    'Mental Health Parity and Integration Act', 'structural',
    'Legally mandated equal insurance coverage and funding for mental health services alongside physical health, with investment in community mental health centers and crisis intervention programs.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Equality', '["Equality","Progress"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"healthcare_accessibility",  "direction":"up",   "rate":0.15, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"happiness",                 "direction":"up",   "rate":0.2,  "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"drug_use",                  "direction":"down", "rate":0.1,  "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"labor_force_participation", "direction":"up",   "rate":0.1,  "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",               "direction":"up",   "rate":0.1,  "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'healthcare_accessibility', 'UP', 0.15, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Mental Health Parity and Integration Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 54
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 12. Patient Transport and Access Fund | SOCIAL | Welfare | STRUCTURAL
-- Active: Me, Mo, Pa
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
    'patient_transport_access_fund_' || to_hex(extract(epoch from now())::int),
    'Patient Transport and Access Fund', 'structural',
    'Government-subsidized transport to medical appointments for rural and low-income patients, addressing the practical access barrier that prevents citizens from using healthcare that theoretically exists.',
    'SOCIAL', 'Welfare', 'Welfare', 'Health',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"healthcare_accessibility", "direction":"up",   "rate":0.1,  "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"cost_of_living",           "direction":"down", "rate":0.05, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",   "rate":0.05, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'healthcare_accessibility', 'UP', 0.1, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Patient Transport and Access Fund (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Welfare', 'Health', 'active', 0, true, true, 51
FROM unnest(ARRAY[v_me, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 13. School-Based Health Services Program | SOCIAL | Education | STRUCTURAL
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
    'school_based_health_services_program_' || to_hex(extract(epoch from now())::int),
    'School-Based Health Services Program', 'structural',
    'Resident nurses, counselors, and basic medical services in all public schools, using the existing school network as a healthcare touchpoint for children who may not otherwise see a clinician.',
    'SOCIAL', 'Education', 'Education', 'Health',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"healthcare_accessibility", "direction":"up",   "rate":0.15, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"education_accessibility",  "direction":"up",   "rate":0.1,  "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"death_rate",               "direction":"down", "rate":0.05, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"drug_use",                 "direction":"down", "rate":0.05, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"up",   "rate":0.1,  "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'healthcare_accessibility', 'UP', 0.15, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: School-Based Health Services Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Education', 'Health', 'active', 0, true, true, 53
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 14. International Medical Workforce Recruitment | SOCIAL | Healthcare | STRUCTURAL
-- Active: Av, SE, Pa
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
    'international_medical_workforce_recruitment_' || to_hex(extract(epoch from now())::int),
    'International Medical Workforce Recruitment', 'structural',
    'Streamlined credential recognition, fast-tracked visa processing, and relocation incentives for qualified foreign doctors, nurses, and allied health professionals to address domestic workforce shortages.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Health',
    'Globalism', '["Globalism","Progress"]'::jsonb,
    0, NULL,
    0, NULL,
    '[
        {"stat_key":"healthcare_accessibility",  "direction":"up", "rate":0.2, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_quality",        "direction":"up", "rate":0.1, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"academic_immigration",      "direction":"up", "rate":0.1, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"up", "rate":0.1, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'healthcare_accessibility', 'UP', 0.2, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: International Medical Workforce Recruitment (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 51
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

END $$;
