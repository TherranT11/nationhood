-- Batch insert: Housing & Property policies (10 policies)
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
-- 1. Public Housing Construction Act | SOCIAL | Welfare | LEVER
-- Active: Me, SE, Mo, Pa
-- Cost: $60M×Population up / $12M×Population/t
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
    'public_housing_construction_act_' || to_hex(extract(epoch from now())::int),
    'Public Housing Construction Act', 'lever',
    'A large-scale government program building state-owned affordable housing units in high-demand urban areas, directly improving housing access for low and middle income citizens.',
    'SOCIAL', 'Welfare', 'Welfare', 'Interior',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    60, 'population',
    12, 'population',
    '[
        {"stat_key":"housing_affordability","direction":"up",  "rate":1,   "delay_ticks":6, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"poverty_rate",         "direction":"down","rate":0.3, "delay_ticks":8, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"standard_of_living",   "direction":"up",  "rate":0.2, "delay_ticks":8, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",         "direction":"down","rate":0.3, "delay_ticks":2, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",          "direction":"up",  "rate":0.5, "delay_ticks":1, "duration_ticks":12,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'housing_affordability', 'UP', 1, 20, 0, 100, 12, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Public Housing Construction Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Welfare', 'Interior', 'active', 0, true, true, 20
FROM unnest(ARRAY[v_me, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 2. Zoning Reform Act | ECONOMICS | Infrastructure | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $5M up / $1M×Population/t
-- Ideologies: Liberty, Progress
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
    'zoning_reform_act_' || to_hex(extract(epoch from now())::int),
    'Zoning Reform Act', 'structural',
    'Loosening of restrictive zoning laws to permit higher-density residential construction, increasing housing supply by allowing more units to be built where demand is highest.',
    'ECONOMICS', 'Infrastructure', 'Infrastructure', 'Transportation',
    'Liberty', '["Liberty","Progress"]'::jsonb,
    5, NULL,
    1, 'population',
    '[
        {"stat_key":"housing_affordability",  "direction":"up","rate":0.2, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"urbanization",           "direction":"up","rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"physical_infrastructure","direction":"up","rate":0.1, "delay_ticks":8, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",             "direction":"up","rate":0.1, "delay_ticks":8, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality",      "direction":"up","rate":0.1, "delay_ticks":8, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'housing_affordability', 'UP', 0.2, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Zoning Reform Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Infrastructure', 'Transportation', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 3. First Home Buyer Scheme | SOCIAL | Welfare | LEVER
-- Active: Av, SE, Pa
-- Cost: $20M×Population up / $5M×Population/t
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
    'first_home_buyer_scheme_' || to_hex(extract(epoch from now())::int),
    'First Home Buyer Scheme', 'lever',
    'Government grants, deposit guarantees, and stamp duty exemptions for first-time home buyers, stimulating entry-level housing demand and improving affordability for younger citizens.',
    'SOCIAL', 'Welfare', 'Welfare', 'Interior',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    20, 'population',
    5, 'population',
    '[
        {"stat_key":"housing_affordability","direction":"up","rate":0.5, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"happiness",            "direction":"up","rate":0.2, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"social_mobility",      "direction":"up","rate":0.2, "delay_ticks":5, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",          "direction":"up","rate":0.3, "delay_ticks":1, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"inflation",            "direction":"up","rate":0.1, "delay_ticks":3, "duration_ticks":12,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'housing_affordability', 'UP', 0.5, 16, 0, 100, 5, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: First Home Buyer Scheme (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Welfare', 'Interior', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 4. Land Value Tax | ECONOMICS | Fiscal Policy | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $3M up / $1M×Population/t
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
    'land_value_tax_' || to_hex(extract(epoch from now())::int),
    'Land Value Tax', 'structural',
    'An annual tax on the unimproved value of land, discouraging speculative land banking and incentivizing development of underused urban plots, gradually improving housing supply.',
    'ECONOMICS', 'Fiscal Policy', 'Fiscal Policy', 'Finance',
    'Equality', '["Equality","Liberty"]'::jsonb,
    3, NULL,
    1, 'population',
    '[
        {"stat_key":"housing_affordability","direction":"up",  "rate":0.15,"delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality",    "direction":"down","rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",           "direction":"down","rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",           "direction":"up",  "rate":0.1, "delay_ticks":8, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",   "direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'housing_affordability', 'UP', 0.15, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Land Value Tax (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Fiscal Policy', 'Finance', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 5. Vacant Property Levy | ECONOMICS | Fiscal Policy | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $2M up / $0.5M×Population/t
-- Ideologies: Equality, Nationalism
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
    'vacant_property_levy_' || to_hex(extract(epoch from now())::int),
    'Vacant Property Levy', 'structural',
    'A tax on residential properties left unoccupied for more than six months, forcing speculative investors to either sell or rent, releasing supply into the housing market.',
    'ECONOMICS', 'Fiscal Policy', 'Fiscal Policy', 'Finance',
    'Equality', '["Equality","Nationalism"]'::jsonb,
    2, NULL,
    0.5, 'population',
    '[
        {"stat_key":"housing_affordability","direction":"up",  "rate":0.15,"delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality",    "direction":"down","rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",   "direction":"down","rate":0.15,"delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",           "direction":"down","rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'housing_affordability', 'UP', 0.15, 48, 0, 100, 0.5, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Vacant Property Levy (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Fiscal Policy', 'Finance', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 6. Social Housing Voucher Program | SOCIAL | Welfare | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $15M×Population up / $5M×Population/t
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
    'social_housing_voucher_program_' || to_hex(extract(epoch from now())::int),
    'Social Housing Voucher Program', 'structural',
    'Direct rental subsidies for low-income households allowing them to access private market housing, improving affordability without requiring new construction.',
    'SOCIAL', 'Welfare', 'Welfare', 'Interior',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    15, 'population',
    5, 'population',
    '[
        {"stat_key":"housing_affordability","direction":"up",  "rate":0.2, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"poverty_rate",         "direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"standard_of_living",   "direction":"up",  "rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"benefits",             "direction":"up",  "rate":0.1, "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",          "direction":"up",  "rate":0.2, "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'housing_affordability', 'UP', 0.2, 48, 0, 100, 5, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Social Housing Voucher Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Welfare', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 7. Foreign Property Ownership Restrictions | IMMIGRATION | Regulatory | STRUCTURAL
-- Active: Sa, Mo, SE
-- Cost: $3M up / $1M×Population/t
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
    'foreign_property_ownership_restrictions_' || to_hex(extract(epoch from now())::int),
    'Foreign Property Ownership Restrictions', 'structural',
    'Limits or outright bans on non-resident foreign nationals purchasing residential property, reducing speculative demand and freeing housing stock for citizens.',
    'IMMIGRATION', 'Regulatory', 'Regulatory', 'Interior',
    'Nationalism', '["Nationalism","Collectivism"]'::jsonb,
    3, NULL,
    1, 'population',
    '[
        {"stat_key":"housing_affordability",   "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",      "direction":"down","rate":0.2, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation","direction":"down","rate":0.1, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality",       "direction":"down","rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'housing_affordability', 'UP', 0.2, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Foreign Property Ownership Restrictions (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Regulatory', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_mo, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 8. Construction Industry Deregulation | ECONOMICS | Regulatory | STRUCTURAL
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
    'construction_industry_deregulation_' || to_hex(extract(epoch from now())::int),
    'Construction Industry Deregulation', 'structural',
    'Reduction of building codes, permitting timelines, and development restrictions to accelerate private housing construction, increasing supply through market mechanisms.',
    'ECONOMICS', 'Regulatory', 'Regulatory', 'Interior',
    'Individualism', '["Individualism","Liberty"]'::jsonb,
    3, NULL,
    1, 'population',
    '[
        {"stat_key":"housing_affordability",  "direction":"up",  "rate":0.15,"delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",             "direction":"up",  "rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",           "direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"physical_infrastructure","direction":"up",  "rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",             "direction":"up",  "rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'housing_affordability', 'UP', 0.15, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Construction Industry Deregulation (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Regulatory', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 9. Community Land Trust Act | SOCIAL | Welfare | STRUCTURAL
-- Active: Av, Pa
-- Cost: $10M×Population up / $3M×Population/t
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
    'community_land_trust_act_' || to_hex(extract(epoch from now())::int),
    'Community Land Trust Act', 'structural',
    'A legal framework for nonprofit community land trusts that permanently remove land from the speculative market, providing perpetually affordable housing in perpetuity.',
    'SOCIAL', 'Welfare', 'Welfare', 'Interior',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    10, 'population',
    3, 'population',
    '[
        {"stat_key":"housing_affordability","direction":"up",  "rate":0.2,  "delay_ticks":8, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"social_mobility",      "direction":"up",  "rate":0.15, "delay_ticks":8, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality",    "direction":"down","rate":0.1,  "delay_ticks":8, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",   "direction":"down","rate":0.1,  "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",           "direction":"down","rate":0.1,  "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'housing_affordability', 'UP', 0.2, 48, 0, 100, 3, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Community Land Trust Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Welfare', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 10. Mortgage Interest Deduction Reform | ECONOMICS | Fiscal Policy | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $2M up / $1M×Population/t
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
    'mortgage_interest_deduction_reform_' || to_hex(extract(epoch from now())::int),
    'Mortgage Interest Deduction Reform', 'structural',
    'Restructuring of mortgage tax deductions to favor primary residences over investment properties and cap deductions at median home values, redirecting the subsidy to ordinary buyers.',
    'ECONOMICS', 'Fiscal Policy', 'Fiscal Policy', 'Finance',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    2, NULL,
    1, 'population',
    '[
        {"stat_key":"housing_affordability","direction":"up",  "rate":0.15,"delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality",    "direction":"down","rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_tax",           "direction":"up",  "rate":0.1, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"credit",               "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'housing_affordability', 'UP', 0.15, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Mortgage Interest Deduction Reform (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Fiscal Policy', 'Finance', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

END $$;
