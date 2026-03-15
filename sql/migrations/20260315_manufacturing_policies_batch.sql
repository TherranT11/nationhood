-- Batch insert: Manufacturing & Industrial policies (10 policies)
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
-- 1. National Industrial Policy | ECONOMICS | Structural Reform | STRUCTURAL
-- Active: Me, Sa, Mo
-- Cost: $30M×Population up / $8M×Population/t
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
    'national_industrial_policy_' || to_hex(extract(epoch from now())::int),
    'National Industrial Policy', 'structural',
    'A coordinated government strategy identifying and supporting strategic manufacturing sectors through subsidies, procurement preferences, and long-term investment guarantees.',
    'ECONOMICS', 'Structural Reform', 'Structural Reform', 'Finance',
    'Nationalism', '["Nationalism","Collectivism"]'::jsonb,
    30, 'population',
    8, 'population',
    '[
        {"stat_key":"manufacturing_output","direction":"up",  "rate":0.3, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",          "direction":"up",  "rate":0.2, "delay_ticks":8, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",        "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",  "direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",         "direction":"up",  "rate":0.2, "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'manufacturing_output', 'UP', 0.3, 48, 0, 100, 8, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: National Industrial Policy (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Structural Reform', 'Finance', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_me, v_sa, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 2. Manufacturing Tax Credit Program | ECONOMICS | Fiscal Policy | STRUCTURAL
-- Active: Av, Sa, SE
-- Cost: $5M up / $2M×Population/t
-- Ideologies: Individualism, Nationalism
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
    'manufacturing_tax_credit_program_' || to_hex(extract(epoch from now())::int),
    'Manufacturing Tax Credit Program', 'structural',
    'Targeted corporate tax credits for capital investment in domestic manufacturing equipment, facilities, and workforce expansion.',
    'ECONOMICS', 'Fiscal Policy', 'Fiscal Policy', 'Finance',
    'Individualism', '["Individualism","Nationalism"]'::jsonb,
    5, NULL,
    2, 'population',
    '[
        {"stat_key":"manufacturing_output","direction":"up",  "rate":0.2,  "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",  "direction":"up",  "rate":0.15, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",        "direction":"down","rate":0.1,  "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corporate_tax",       "direction":"down","rate":0.1,  "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",         "direction":"up",  "rate":0.1,  "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'manufacturing_output', 'UP', 0.2, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Manufacturing Tax Credit Program (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Fiscal Policy', 'Finance', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_sa, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 3. Special Economic Zones | ECONOMICS | Trade Policy | LEVER
-- Active: Sa, SE, Mo
-- Cost: $25M×Population up (no ongoing)
-- Ideologies: Globalism, Individualism
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
    'special_economic_zones_' || to_hex(extract(epoch from now())::int),
    'Special Economic Zones', 'lever',
    'Designated geographic areas with reduced taxes, relaxed regulations, and infrastructure investment designed to attract manufacturing investment and industrial clusters.',
    'ECONOMICS', 'Trade Policy', 'Trade Policy', 'Finance',
    'Globalism', '["Globalism","Individualism"]'::jsonb,
    25, 'population',
    0, NULL,
    '[
        {"stat_key":"manufacturing_output","direction":"up",  "rate":0.5, "delay_ticks":5, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",  "direction":"up",  "rate":0.5, "delay_ticks":4, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",        "direction":"down","rate":0.3, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality",   "direction":"up",  "rate":0.2, "delay_ticks":5, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",          "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":20,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'manufacturing_output', 'UP', 0.5, 20, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Special Economic Zones (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Trade Policy', 'Finance', 'active', 0, true, true, 20
FROM unnest(ARRAY[v_sa, v_se, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 4. Vocational Training Expansion | EDUCATION | Education | STRUCTURAL
-- Active: Av, SE, Mo, Pa
-- Cost: $20M×Population up / $5M×Population/t
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
    'vocational_training_expansion_' || to_hex(extract(epoch from now())::int),
    'Vocational Training Expansion', 'structural',
    'Expansion of trade schools, apprenticeship programs, and technical colleges producing the skilled tradespeople and technicians that manufacturing industries need.',
    'EDUCATION', 'Education', 'Education', 'Education',
    'Collectivism', '["Collectivism","Equality"]'::jsonb,
    20, 'population',
    5, 'population',
    '[
        {"stat_key":"manufacturing_output",       "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",               "direction":"down","rate":0.2, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation",  "direction":"up",  "rate":0.2, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"social_mobility",            "direction":"up",  "rate":0.1, "delay_ticks":8, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",                "direction":"up",  "rate":0.1, "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'manufacturing_output', 'UP', 0.2, 48, 0, 100, 5, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Vocational Training Expansion (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'EDUCATION', 'Education', 'Education', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 5. Automation Investment Incentives | ECONOMICS | Fiscal Policy | STRUCTURAL
-- Active: Av, Sa, SE
-- Cost: $15M×Population up / $4M×Population/t
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
    'automation_investment_incentives_' || to_hex(extract(epoch from now())::int),
    'Automation Investment Incentives', 'structural',
    'Tax incentives and government co-investment for manufacturers adopting automation and robotics, improving output capacity while creating long-term labor displacement risk.',
    'ECONOMICS', 'Fiscal Policy', 'Fiscal Policy', 'Finance',
    'Progress', '["Progress","Individualism"]'::jsonb,
    15, 'population',
    4, 'population',
    '[
        {"stat_key":"manufacturing_output","direction":"up","rate":0.3, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",          "direction":"up","rate":0.2, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"efficiency",          "direction":"up","rate":0.2, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",        "direction":"up","rate":0.2, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"income_inequality",   "direction":"up","rate":0.2, "delay_ticks":8, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'manufacturing_output', 'UP', 0.3, 48, 0, 100, 4, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Automation Investment Incentives (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Fiscal Policy', 'Finance', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_sa, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 6. Strategic Supply Chain Localization | ECONOMICS | Trade Policy | STRUCTURAL
-- Active: Me, Sa, Mo
-- Cost: $8M×Population up / $2M×Population/t
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
    'strategic_supply_chain_localization_' || to_hex(extract(epoch from now())::int),
    'Strategic Supply Chain Localization', 'structural',
    'Government incentives and requirements for manufacturers to source inputs domestically, building resilient local supply chains at the cost of short-term efficiency.',
    'ECONOMICS', 'Trade Policy', 'Trade Policy', 'Finance',
    'Nationalism', '["Nationalism","Collectivism"]'::jsonb,
    8, 'population',
    2, 'population',
    '[
        {"stat_key":"manufacturing_output","direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"trade_balance",       "direction":"up",  "rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",        "direction":"down","rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",  "direction":"down","rate":0.2, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"inflation",           "direction":"up",  "rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'manufacturing_output', 'UP', 0.2, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Strategic Supply Chain Localization (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Trade Policy', 'Finance', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_me, v_sa, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 7. Export Credit Agency | ECONOMICS | Trade Policy | STRUCTURAL
-- Active: Av, Sa, SE
-- Cost: $15M×Population up / $4M×Population/t
-- Ideologies: Nationalism, Globalism
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
    'export_credit_agency_' || to_hex(extract(epoch from now())::int),
    'Export Credit Agency', 'structural',
    'A state-backed financial institution providing loans, guarantees, and insurance to domestic manufacturers exporting goods, reducing the financial risk of entering foreign markets.',
    'ECONOMICS', 'Trade Policy', 'Trade Policy', 'Finance',
    'Nationalism', '["Nationalism","Globalism"]'::jsonb,
    15, 'population',
    4, 'population',
    '[
        {"stat_key":"manufacturing_output","direction":"up","rate":0.2, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"trade_balance",       "direction":"up","rate":0.2, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",  "direction":"up","rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",         "direction":"up","rate":0.1, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"credit",              "direction":"up","rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'manufacturing_output', 'UP', 0.2, 48, 0, 100, 4, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Export Credit Agency (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Trade Policy', 'Finance', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_sa, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 8. Industrial Research and Development Fund | ECONOMICS | Regulatory | LEVER
-- Active: Av, SE, Pa
-- Cost: $25M×Population up (no ongoing)
-- Ideologies: Progress, Nationalism
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
    'industrial_research_and_development_fund_' || to_hex(extract(epoch from now())::int),
    'Industrial Research and Development Fund', 'lever',
    'Direct government grants to manufacturing firms investing in product and process innovation, improving competitiveness and output capacity over a medium-term horizon.',
    'ECONOMICS', 'Regulatory', 'Regulatory', 'Finance',
    'Progress', '["Progress","Nationalism"]'::jsonb,
    25, 'population',
    0, NULL,
    '[
        {"stat_key":"manufacturing_output", "direction":"up","rate":0.3, "delay_ticks":5, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",           "direction":"up","rate":0.2, "delay_ticks":6, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"higher_education",     "direction":"up","rate":0.1, "delay_ticks":6, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"academic_immigration", "direction":"up","rate":0.1, "delay_ticks":6, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",          "direction":"up","rate":0.2, "delay_ticks":1, "duration_ticks":16,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'manufacturing_output', 'UP', 0.3, 16, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Industrial Research and Development Fund (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Regulatory', 'Finance', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 9. Anti-Dumping Trade Enforcement | ECONOMICS | Trade Policy | STRUCTURAL
-- Active: Me, Sa, Mo
-- Cost: $5M up / $1M×Population/t
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
    'anti_dumping_trade_enforcement_' || to_hex(extract(epoch from now())::int),
    'Anti-Dumping Trade Enforcement', 'structural',
    'Tariffs and quotas specifically targeting foreign goods sold below cost to undercut domestic manufacturers, protecting industrial output from predatory trade practices.',
    'ECONOMICS', 'Trade Policy', 'Trade Policy', 'Finance',
    'Nationalism', '["Nationalism","Security"]'::jsonb,
    5, NULL,
    1, 'population',
    '[
        {"stat_key":"manufacturing_output",       "direction":"up",  "rate":0.15,"delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"tariffs",                    "direction":"up",  "rate":0.1, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",               "direction":"down","rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"inflation",                  "direction":"up",  "rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation",   "direction":"down","rate":0.1, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'manufacturing_output', 'UP', 0.15, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Anti-Dumping Trade Enforcement (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Trade Policy', 'Finance', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_me, v_sa, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 10. Industrial Corridor Development | ECONOMICS | Infrastructure | LEVER
-- Active: Mo, SE, Sa
-- Cost: $40M×Population up (no ongoing)
-- Ideologies: Progress, Nationalism
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
    'industrial_corridor_development_' || to_hex(extract(epoch from now())::int),
    'Industrial Corridor Development', 'lever',
    'Government-planned industrial zones with pre-built infrastructure, utilities, and transport links reducing setup costs for manufacturers and clustering industries for supply chain efficiency.',
    'ECONOMICS', 'Infrastructure', 'Infrastructure', 'Transportation',
    'Progress', '["Progress","Nationalism"]'::jsonb,
    40, 'population',
    0, NULL,
    '[
        {"stat_key":"manufacturing_output",       "direction":"up",  "rate":0.4, "delay_ticks":6, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"physical_infrastructure",    "direction":"up",  "rate":0.3, "delay_ticks":8, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",               "direction":"down","rate":0.3, "delay_ticks":4, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"urbanization",               "direction":"up",  "rate":0.2, "delay_ticks":8, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",                "direction":"up",  "rate":0.4, "delay_ticks":1, "duration_ticks":12,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'manufacturing_output', 'UP', 0.4, 20, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Industrial Corridor Development (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Infrastructure', 'Transportation', 'active', 0, true, true, 20
FROM unnest(ARRAY[v_mo, v_se, v_sa]) AS nid WHERE nid IS NOT NULL;

END $$;
