-- Batch insert: Cost of Living policies (10 policies)
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
-- 1. Essential Goods Price Cap | ECONOMICS | Fiscal Policy | LEVER
-- Active: Me, Sa
-- Cost: $10M×Population up (no ongoing)
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
    'essential_goods_price_cap_' || to_hex(extract(epoch from now())::int),
    'Essential Goods Price Cap', 'lever',
    'Temporary government-mandated maximum prices on a defined basket of essential goods including staple foods, medicine, and fuel, providing immediate relief at the cost of supply distortions.',
    'ECONOMICS', 'Fiscal Policy', 'Fiscal Policy', 'Finance',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    10, 'population',
    0, NULL,
    '[
        {"stat_key":"cost_of_living",    "direction":"down","rate":0.5, "delay_ticks":1, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"happiness",         "direction":"up",  "rate":0.3, "delay_ticks":1, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"poverty_rate",      "direction":"down","rate":0.2, "delay_ticks":2, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",        "direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment","direction":"down","rate":0.2, "delay_ticks":2, "duration_ticks":12,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'cost_of_living', 'DOWN', 0.5, 12, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Essential Goods Price Cap (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Fiscal Policy', 'Finance', 'active', 0, true, true, 12
FROM unnest(ARRAY[v_me, v_sa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 2. Food Security and Staples Program | SOCIAL | Welfare | STRUCTURAL
-- Active: Me, Mo, Pa
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
    'food_security_and_staples_program_' || to_hex(extract(epoch from now())::int),
    'Food Security and Staples Program', 'structural',
    'State procurement and subsidized distribution of basic foodstuffs, reducing the cost of essential nutrition for low-income households and anchoring food price inflation.',
    'SOCIAL', 'Welfare', 'Welfare', 'Interior',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    15, 'population',
    5, 'population',
    '[
        {"stat_key":"cost_of_living","direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"poverty_rate",  "direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"happiness",     "direction":"up",  "rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",   "direction":"up",  "rate":0.2, "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"arable_land",   "direction":"down","rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'cost_of_living', 'DOWN', 0.2, 48, 0, 100, 5, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Food Security and Staples Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Welfare', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_me, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 3. Public Transport Expansion | ECONOMICS | Infrastructure | LEVER
-- Active: Av, SE, Pa
-- Cost: $30M×Population up (no ongoing)
-- Ideologies: Collectivism, Progress
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
    'public_transport_expansion_' || to_hex(extract(epoch from now())::int),
    'Public Transport Expansion', 'lever',
    'Investment in buses, metro, and commuter rail reducing citizen dependence on private vehicles and fuel costs, directly cutting household transportation expenditure.',
    'ECONOMICS', 'Infrastructure', 'Infrastructure', 'Transportation',
    'Collectivism', '["Collectivism","Progress"]'::jsonb,
    30, 'population',
    0, NULL,
    '[
        {"stat_key":"cost_of_living","direction":"down","rate":0.3, "delay_ticks":6, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"fuel_prices",   "direction":"down","rate":0.2, "delay_ticks":5, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"pollution",     "direction":"down","rate":0.2, "delay_ticks":6, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"urbanization",  "direction":"up",  "rate":0.1, "delay_ticks":6, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",   "direction":"up",  "rate":0.3, "delay_ticks":1, "duration_ticks":12,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'cost_of_living', 'DOWN', 0.3, 20, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Public Transport Expansion (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Infrastructure', 'Transportation', 'active', 0, true, true, 20
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 4. Generic Medicine Access Act | SOCIAL | Healthcare | STRUCTURAL
-- Active: Av, SE, Mo, Pa
-- Cost: $5M×Population up / $2M×Population/t
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
    'generic_medicine_access_act_' || to_hex(extract(epoch from now())::int),
    'Generic Medicine Access Act', 'structural',
    'Legislation requiring public procurement of generic pharmaceuticals and loosening patent protections on essential medicines, directly reducing healthcare costs for citizens.',
    'SOCIAL', 'Healthcare', 'Healthcare', 'Healthcare',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    5, 'population',
    2, 'population',
    '[
        {"stat_key":"cost_of_living",           "direction":"down","rate":0.15,"delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"healthcare_accessibility", "direction":"up",  "rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"healthcare_quality",       "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation", "direction":"down","rate":0.1, "delay_ticks":2, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",       "direction":"down","rate":0.1, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'cost_of_living', 'DOWN', 0.15, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Generic Medicine Access Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'SOCIAL', 'Healthcare', 'Healthcare', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 5. Utility Price Regulation | ECONOMICS | Regulatory | STRUCTURAL
-- Active: Av, SE, Mo, Pa
-- Cost: $5M×Population up / $2M×Population/t
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
    'utility_price_regulation_' || to_hex(extract(epoch from now())::int),
    'Utility Price Regulation', 'structural',
    'Independent regulatory oversight of electricity, water, and gas pricing to prevent monopolistic overcharging, keeping household utility bills within a mandated affordability band.',
    'ECONOMICS', 'Regulatory', 'Regulatory', 'Interior',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    5, 'population',
    2, 'population',
    '[
        {"stat_key":"cost_of_living",    "direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"happiness",         "direction":"up",  "rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"efficiency",        "direction":"down","rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"energy_generation", "direction":"down","rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment","direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'cost_of_living', 'DOWN', 0.2, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Utility Price Regulation (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Regulatory', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 6. Import Tariff Reduction | ECONOMICS | Trade Policy | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $2M up / $1M×Population/t
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
    'import_tariff_reduction_' || to_hex(extract(epoch from now())::int),
    'Import Tariff Reduction', 'structural',
    'Lowering of tariffs on consumer goods to allow cheaper foreign products into the market, reducing prices for households while exposing domestic producers to more competition.',
    'ECONOMICS', 'Trade Policy', 'Trade Policy', 'Finance',
    'Globalism', '["Globalism","Liberty"]'::jsonb,
    2, NULL,
    1, 'population',
    '[
        {"stat_key":"cost_of_living",       "direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"inflation",            "direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",   "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"manufacturing_output", "direction":"down","rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",         "direction":"up",  "rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'cost_of_living', 'DOWN', 0.2, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Import Tariff Reduction (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Trade Policy', 'Finance', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 7. Anti-Price Gouging Enforcement | GOVERNANCE | Regulatory | LEVER
-- Active: Me, SE, Pa
-- Cost: $5M×Population up (no ongoing)
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
    'anti_price_gouging_enforcement_' || to_hex(extract(epoch from now())::int),
    'Anti-Price Gouging Enforcement', 'lever',
    'Emergency deployment of consumer protection authorities to prosecute retailers and suppliers engaged in price gouging during supply shortages, crises, or inflationary spikes.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Justice',
    'Equality', '["Equality","Liberty"]'::jsonb,
    5, 'population',
    0, NULL,
    '[
        {"stat_key":"cost_of_living",    "direction":"down","rate":0.3, "delay_ticks":2, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",        "direction":"down","rate":0.2, "delay_ticks":2, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"happiness",         "direction":"up",  "rate":0.2, "delay_ticks":2, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",        "direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment","direction":"down","rate":0.1, "delay_ticks":2, "duration_ticks":12,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'cost_of_living', 'DOWN', 0.3, 12, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Anti-Price Gouging Enforcement (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Justice', 'active', 0, true, true, 12
FROM unnest(ARRAY[v_me, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 8. Cost of Living Adjustment Act | LABOR | Workers | LEVER
-- Active: Me, SE, Mo, Pa
-- Cost: $5M×Population up / $3M×Population/t
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
    'cost_of_living_adjustment_act_' || to_hex(extract(epoch from now())::int),
    'Cost of Living Adjustment Act', 'lever',
    'Legislated automatic adjustment of wages, benefits, and pensions to cost of living indices, ensuring purchasing power is maintained during inflationary periods.',
    'LABOR', 'Workers', 'Workers', 'Labor',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    5, 'population',
    3, 'population',
    '[
        {"stat_key":"cost_of_living","direction":"down","rate":0.2, "delay_ticks":2, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"happiness",     "direction":"up",  "rate":0.2, "delay_ticks":2, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"poverty_rate",  "direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"inflation",     "direction":"up",  "rate":0.2, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",   "direction":"up",  "rate":0.3, "delay_ticks":1, "duration_ticks":16,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'cost_of_living', 'DOWN', 0.2, 16, 0, 100, 3, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Cost of Living Adjustment Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'LABOR', 'Workers', 'Labor', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_me, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 9. Supply Chain Efficiency Program | ECONOMICS | Trade Policy | LEVER
-- Active: Av, SE, Mo
-- Cost: $20M×Population up (no ongoing)
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
    'supply_chain_efficiency_program_' || to_hex(extract(epoch from now())::int),
    'Supply Chain Efficiency Program', 'lever',
    'Investment in logistics, port infrastructure, and wholesale distribution networks to reduce the cost of getting goods from producer to consumer, cutting retail prices through efficiency.',
    'ECONOMICS', 'Trade Policy', 'Trade Policy', 'Finance',
    'Progress', '["Progress","Globalism"]'::jsonb,
    20, 'population',
    0, NULL,
    '[
        {"stat_key":"cost_of_living",       "direction":"down","rate":0.2, "delay_ticks":5, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"manufacturing_output", "direction":"up",  "rate":0.1, "delay_ticks":5, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"physical_infrastructure","direction":"up","rate":0.2, "delay_ticks":6, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"trade_balance",        "direction":"up",  "rate":0.1, "delay_ticks":6, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",          "direction":"up",  "rate":0.2, "delay_ticks":1, "duration_ticks":12,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'cost_of_living', 'DOWN', 0.2, 16, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Supply Chain Efficiency Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Trade Policy', 'Finance', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_av, v_se, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 10. Inflation Targeting Framework | ECONOMICS | Fiscal Policy | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $5M×Population up / $2M×Population/t
-- Ideologies: Liberty, Agnostic
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
    'inflation_targeting_framework_' || to_hex(extract(epoch from now())::int),
    'Inflation Targeting Framework', 'structural',
    'A formal central bank mandate with binding inflation targets, interest rate tools, and public accountability mechanisms to keep price growth within a defined corridor.',
    'ECONOMICS', 'Fiscal Policy', 'Fiscal Policy', 'Finance',
    'Liberty', '["Liberty"]'::jsonb,
    5, 'population',
    2, 'population',
    '[
        {"stat_key":"cost_of_living","direction":"down","rate":0.15,"delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"inflation",     "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"credit",        "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"stability",     "direction":"up",  "rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",    "direction":"down","rate":0.1, "delay_ticks":4, "duration_ticks":16,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'cost_of_living', 'DOWN', 0.15, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Inflation Targeting Framework (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Fiscal Policy', 'Finance', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

END $$;
