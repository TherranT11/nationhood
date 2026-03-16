-- Batch insert: Service Sector policies (10 policies)
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
-- 1. Small Business Credit Guarantee | ECONOMICS | Fiscal Policy | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $10M×Population up / $3M×Population/t
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
    'small_business_credit_guarantee_' || to_hex(extract(epoch from now())::int),
    'Small Business Credit Guarantee', 'structural',
    'State-backed loan guarantees for small service businesses that lack collateral for conventional lending, expanding credit access and stimulating service sector growth.',
    'ECONOMICS', 'Fiscal Policy', 'Fiscal Policy', 'Finance',
    'Individualism', '["Individualism","Liberty"]'::jsonb,
    10, 'population',
    3, 'population',
    '[
        {"stat_key":"service_output","direction":"up",  "rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"credit",        "direction":"up",  "rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",  "direction":"down","rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",    "direction":"up",  "rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",   "direction":"up",  "rate":0.1, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'service_output', 'UP', 0.2, 48, 0, 100, 3, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Small Business Credit Guarantee (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Fiscal Policy', 'Finance', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 2. Professional Licensing Simplification | GOVERNANCE | Regulatory | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $3M up / $1M×Population/t
-- Ideologies: Liberty, Individualism
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
    'professional_licensing_simplification_' || to_hex(extract(epoch from now())::int),
    'Professional Licensing Simplification', 'structural',
    'Reform of occupational licensing requirements to remove unnecessary barriers to entry in service professions, expanding the supply of qualified workers and reducing costs.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Interior',
    'Liberty', '["Liberty","Individualism"]'::jsonb,
    3, NULL,
    1, 'population',
    '[
        {"stat_key":"service_output",            "direction":"up",  "rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"efficiency",                "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation", "direction":"up",  "rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality",         "direction":"down","rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'service_output', 'UP', 0.2, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Professional Licensing Simplification (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 3. Tourism Development Strategy | ECONOMICS | Trade Policy | LEVER
-- Active: Pa, SE, Mo
-- Cost: $20M×Population up (no ongoing)
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
    'tourism_development_strategy_' || to_hex(extract(epoch from now())::int),
    'Tourism Development Strategy', 'lever',
    'Coordinated marketing campaigns, infrastructure investment, and visa liberalization to attract international visitors, directly driving service sector revenue.',
    'ECONOMICS', 'Trade Policy', 'Trade Policy', 'Finance',
    'Globalism', '["Globalism","Progress"]'::jsonb,
    20, 'population',
    0, NULL,
    '[
        {"stat_key":"service_output",            "direction":"up","rate":0.4, "delay_ticks":4, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"up","rate":0.2, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"immigration",               "direction":"up","rate":0.2, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",                "direction":"up","rate":0.2, "delay_ticks":5, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"physical_infrastructure",   "direction":"up","rate":0.1, "delay_ticks":6, "duration_ticks":16,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'service_output', 'UP', 0.4, 16, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Tourism Development Strategy (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Trade Policy', 'Finance', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_pa, v_se, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 4. Tech Sector Investment Program | ECONOMICS | Infrastructure | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $30M×Population up / $8M×Population/t
-- Ideologies: Progress, Globalism
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
    'tech_sector_investment_program_' || to_hex(extract(epoch from now())::int),
    'Tech Sector Investment Program', 'structural',
    'Government co-investment in technology parks, startup incubators, and digital infrastructure to grow the software, fintech, and professional services industries.',
    'ECONOMICS', 'Infrastructure', 'Infrastructure', 'Transportation',
    'Progress', '["Progress","Globalism"]'::jsonb,
    30, 'population',
    8, 'population',
    '[
        {"stat_key":"service_output",        "direction":"up","rate":0.3, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"digital_infrastructure","direction":"up","rate":0.2, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"academic_immigration",  "direction":"up","rate":0.2, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",            "direction":"up","rate":0.2, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",           "direction":"up","rate":0.2, "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'service_output', 'UP', 0.3, 48, 0, 100, 8, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Tech Sector Investment Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Infrastructure', 'Transportation', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 5. Financial Services Deregulation | ECONOMICS | Regulatory | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $3M up / $1M×Population/t
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
    'financial_services_deregulation_' || to_hex(extract(epoch from now())::int),
    'Financial Services Deregulation', 'structural',
    'Loosening of restrictions on banking, insurance, and investment services to stimulate financial sector growth, expanding credit availability and service output at some systemic risk.',
    'ECONOMICS', 'Regulatory', 'Regulatory', 'Interior',
    'Individualism', '["Individualism","Liberty"]'::jsonb,
    3, NULL,
    1, 'population',
    '[
        {"stat_key":"service_output",     "direction":"up","rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"credit",             "direction":"up","rate":0.3, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment", "direction":"up","rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",         "direction":"up","rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality",  "direction":"up","rate":0.2, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'service_output', 'UP', 0.2, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Financial Services Deregulation (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Regulatory', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 6. Remote Work Infrastructure Investment | ECONOMICS | Infrastructure | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $15M×Population up / $4M×Population/t
-- Ideologies: Progress, Liberty
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
    'remote_work_infrastructure_investment_' || to_hex(extract(epoch from now())::int),
    'Remote Work Infrastructure Investment', 'structural',
    'Investment in broadband, co-working facilities, and digital tools enabling knowledge workers to operate remotely, expanding the geographic footprint of the service economy.',
    'ECONOMICS', 'Infrastructure', 'Infrastructure', 'Transportation',
    'Progress', '["Progress","Liberty"]'::jsonb,
    15, 'population',
    4, 'population',
    '[
        {"stat_key":"service_output",        "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"digital_infrastructure","direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"urbanization",          "direction":"down","rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"happiness",             "direction":"up",  "rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",           "direction":"up",  "rate":0.1, "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'service_output', 'UP', 0.2, 48, 0, 100, 4, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Remote Work Infrastructure Investment (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Infrastructure', 'Transportation', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 7. Service Export Promotion Agency | ECONOMICS | Trade Policy | LEVER
-- Active: Av, SE, Pa
-- Cost: $10M×Population up (no ongoing)
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
    'service_export_promotion_agency_' || to_hex(extract(epoch from now())::int),
    'Service Export Promotion Agency', 'lever',
    'A government body actively marketing domestic service industries — legal, financial, medical, educational, engineering — to foreign buyers and markets.',
    'ECONOMICS', 'Trade Policy', 'Trade Policy', 'Finance',
    'Globalism', '["Globalism","Progress"]'::jsonb,
    10, 'population',
    0, NULL,
    '[
        {"stat_key":"service_output",           "direction":"up","rate":0.3, "delay_ticks":4, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"trade_balance",            "direction":"up","rate":0.2, "delay_ticks":4, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation", "direction":"up","rate":0.1, "delay_ticks":3, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"trade_balance",            "direction":"up","rate":0.1, "delay_ticks":5, "duration_ticks":12,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'service_output', 'UP', 0.3, 16, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Service Export Promotion Agency (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Trade Policy', 'Finance', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 8. Financial Inclusion Initiative | ECONOMICS | Fiscal Policy | STRUCTURAL
-- Active: Me, Mo, Pa
-- Cost: $12M×Population up / $3M×Population/t
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
    'financial_inclusion_initiative_' || to_hex(extract(epoch from now())::int),
    'Financial Inclusion Initiative', 'structural',
    'Programs expanding banking access, mobile payment infrastructure, and microfinance to unbanked citizens, bringing informal economic activity into the formal service economy.',
    'ECONOMICS', 'Fiscal Policy', 'Fiscal Policy', 'Finance',
    'Equality', '["Equality","Progress"]'::jsonb,
    12, 'population',
    3, 'population',
    '[
        {"stat_key":"service_output",    "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"credit",            "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"poverty_rate",      "direction":"down","rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality", "direction":"down","rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",        "direction":"down","rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'service_output', 'UP', 0.2, 48, 0, 100, 3, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Financial Inclusion Initiative (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Fiscal Policy', 'Finance', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_me, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 9. Healthcare Services Expansion | SOCIAL | Healthcare | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $25M×Population up / $6M×Population/t
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
    'healthcare_services_expansion_' || to_hex(extract(epoch from now())::int),
    'Healthcare Services Expansion', 'structural',
    'Investment in private and public healthcare facilities, medical training, and health technology that grows the healthcare service sector while improving population health outcomes.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Healthcare',
    'Equality', '["Equality","Progress"]'::jsonb,
    25, 'population',
    6, 'population',
    '[
        {"stat_key":"service_output",            "direction":"up",  "rate":0.2, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"healthcare_quality",        "direction":"up",  "rate":0.2, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"healthcare_accessibility",  "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",              "direction":"down","rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",               "direction":"up",  "rate":0.2, "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'service_output', 'UP', 0.2, 48, 0, 100, 6, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Healthcare Services Expansion (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Healthcare', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 10. Retail and Hospitality Development Fund | ECONOMICS | Regulatory | LEVER
-- Active: SE, Mo, Pa
-- Cost: $15M×Population up (no ongoing)
-- Ideologies: Individualism, Collectivism
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
    'retail_and_hospitality_development_fund_' || to_hex(extract(epoch from now())::int),
    'Retail and Hospitality Development Fund', 'lever',
    'Grants, low-interest loans, and training subsidies for retail, restaurant, and hospitality businesses, directly stimulating the consumer-facing service sector.',
    'ECONOMICS', 'Regulatory', 'Regulatory', 'Interior',
    'Individualism', '["Individualism","Collectivism"]'::jsonb,
    15, 'population',
    0, NULL,
    '[
        {"stat_key":"service_output","direction":"up",  "rate":0.3, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",  "direction":"down","rate":0.2, "delay_ticks":2, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"happiness",     "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",   "direction":"up",  "rate":0.2, "delay_ticks":1, "duration_ticks":16,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'service_output', 'UP', 0.3, 16, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Retail and Hospitality Development Fund (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Regulatory', 'Interior', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

END $$;
