-- Batch insert: Efficiency & Governance policies (regulatory, fiscal_policy, border_enforcement, regime_control)
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
-- 1. Regulatory Simplification Act | GOVERNANCE | Regulatory | LEVER
-- Active: Av, SE, Pa
-- Cost: $5M×Population up
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
    'regulatory_simplification_act_' || to_hex(extract(epoch from now())::int),
    'Regulatory Simplification Act', 'lever',
    'A comprehensive audit and culling of redundant, outdated, or contradictory regulations across all government departments, reducing compliance burden on businesses and citizens.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Interior',
    'Liberty', '["Liberty","Individualism"]'::jsonb,
    5, 'population',
    0, NULL,
    '[
        {"stat_key":"efficiency",          "direction":"up",  "rate":0.5, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",          "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",  "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",          "direction":"up",  "rate":0.1, "delay_ticks":6, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"legitimacy",          "direction":"up",  "rate":0.1, "delay_ticks":5, "duration_ticks":12,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'efficiency', 'UP', 0.5, 16, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Regulatory Simplification Act (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Interior', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 2. Civil Service Meritocracy Reform | GOVERNANCE | Regulatory | STRUCTURAL
-- Active: Av, SE, Mo, Pa
-- Cost: $8M×Population up / $2M×Population/t
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
    'civil_service_meritocracy_reform_' || to_hex(extract(epoch from now())::int),
    'Civil Service Meritocracy Reform', 'structural',
    'Replacement of seniority-based government hiring and promotion with competitive examination and performance review, reducing deadwood and improving institutional output.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Interior',
    'Liberty', '["Liberty","Progress"]'::jsonb,
    8, 'population',
    2, 'population',
    '[
        {"stat_key":"efficiency",          "direction":"up",  "rate":0.2,  "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",          "direction":"down","rate":0.15, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"legitimacy",          "direction":"up",  "rate":0.1,  "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",        "direction":"up",  "rate":0.1,  "delay_ticks":2, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"stability",           "direction":"down","rate":0.1,  "delay_ticks":3, "duration_ticks":12,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'efficiency', 'UP', 0.2, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Civil Service Meritocracy Reform (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 3. Integrated Tax Administration System | ECONOMICS | Fiscal Policy | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $12M×Population up / $3M×Population/t
-- Ideologies: Liberty (Agnostic as second = just Liberty)
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
    'integrated_tax_admin_system_' || to_hex(extract(epoch from now())::int),
    'Integrated Tax Administration System', 'structural',
    'A centralized digital tax collection and enforcement platform reducing evasion, automating returns, and cutting the administrative cost of revenue collection.',
    'ECONOMICS', 'Fiscal Policy', 'Fiscal Policy', 'Finance',
    'Liberty', '["Liberty"]'::jsonb,
    12, 'population',
    3, 'population',
    '[
        {"stat_key":"efficiency",              "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",              "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"credit",                  "direction":"up",  "rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",             "direction":"down","rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"digital_infrastructure",  "direction":"up",  "rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'efficiency', 'UP', 0.2, 48, 0, 100, 3, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Integrated Tax Administration System (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'ECONOMICS', 'Fiscal Policy', 'Finance', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 4. Public Procurement Reform | GOVERNANCE | Regulatory | LEVER
-- Active: Av, SE, Mo, Pa
-- Cost: $6M×Population up
-- Ideologies: Liberty, Globalism
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
    'public_procurement_reform_' || to_hex(extract(epoch from now())::int),
    'Public Procurement Reform', 'lever',
    'Overhaul of government contracting processes through open tendering, digital bidding platforms, and independent audit requirements, cutting costs and reducing kickback opportunities.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Interior',
    'Liberty', '["Liberty","Globalism"]'::jsonb,
    6, 'population',
    0, NULL,
    '[
        {"stat_key":"efficiency",          "direction":"up",  "rate":0.3, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",          "direction":"down","rate":0.3, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",         "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",  "direction":"up",  "rate":0.1, "delay_ticks":5, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"stability",           "direction":"down","rate":0.1, "delay_ticks":2, "duration_ticks":8, "adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'efficiency', 'UP', 0.3, 16, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Public Procurement Reform (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Interior', 'active', 0, true, true, 16
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 5. Interministerial Coordination Office | GOVERNANCE | Regulatory | STRUCTURAL
-- Active: Av, SE, Mo, Pa
-- Cost: $5M×Population up / $2M×Population/t
-- Ideologies: Collectivism (Agnostic listed = just Collectivism)
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
    'interministerial_coordination_office_' || to_hex(extract(epoch from now())::int),
    'Interministerial Coordination Office', 'structural',
    'A permanent cross-departmental body responsible for eliminating policy contradictions, deduplicating programs, and ensuring ministries share data and resources rather than hoarding them.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Interior',
    'Collectivism', '["Collectivism"]'::jsonb,
    5, 'population',
    2, 'population',
    '[
        {"stat_key":"efficiency",          "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"legitimacy",          "direction":"up",  "rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"stability",           "direction":"up",  "rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",         "direction":"down","rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'efficiency', 'UP', 0.2, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Interministerial Coordination Office (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 6. Automated Border Processing System | IMMIGRATION | Border Enforcement | STRUCTURAL
-- Active: Sa, SE, Mo
-- Cost: $10M×Population up / $2M×Population/t
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
    'automated_border_processing_' || to_hex(extract(epoch from now())::int),
    'Automated Border Processing System', 'structural',
    'Biometric scanning, pre-clearance programs, and AI-assisted processing at border crossings reducing wait times, staffing costs, and human error in immigration administration.',
    'IMMIGRATION', 'Border Enforcement', 'Border Enforcement', 'Interior',
    'Security', '["Security","Nationalism"]'::jsonb,
    10, 'population',
    2, 'population',
    '[
        {"stat_key":"efficiency",              "direction":"up",  "rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"illegal_immigration",     "direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",              "direction":"down","rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",           "direction":"down","rate":0.1, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",      "direction":"up",  "rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'efficiency', 'UP', 0.2, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Automated Border Processing System (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'IMMIGRATION', 'Border Enforcement', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_se, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 7. Central Planning Directorate | GOVERNANCE | Regime Control | STRUCTURAL
-- Active: Sa
-- Cost: $10M×Population up / $3M×Population/t
-- Ideologies: Collectivism, Nationalism
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
    'central_planning_directorate_' || to_hex(extract(epoch from now())::int),
    'Central Planning Directorate', 'structural',
    'A supreme economic coordination body with authority to override ministry decisions, eliminate inter-departmental competition, and enforce unified resource allocation — brutally efficient in the short term, brittle over time.',
    'GOVERNANCE', 'Regime Control', 'Regime Control', 'Interior',
    'Collectivism', '["Collectivism","Nationalism"]'::jsonb,
    10, 'population',
    3, 'population',
    '[
        {"stat_key":"efficiency",          "direction":"up",  "rate":0.5, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",          "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"stability",           "direction":"up",  "rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",          "direction":"up",  "rate":0.3, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",       "direction":"down","rate":0.3, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",  "direction":"down","rate":0.2, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'efficiency', 'UP', 0.5, 48, 0, 100, 3, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Central Planning Directorate (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regime Control', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 8. Unified Command Administration | GOVERNANCE | Regime Control | STRUCTURAL
-- Active: Sa, Me
-- Cost: $8M×Population up / $2M×Population/t
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
    'unified_command_administration_' || to_hex(extract(epoch from now())::int),
    'Unified Command Administration', 'structural',
    'Consolidation of all regional and local government under direct central executive control, eliminating the friction of federated governance and ensuring directives are carried out without local resistance.',
    'GOVERNANCE', 'Regime Control', 'Regime Control', 'Interior',
    'Nationalism', '["Nationalism","Security"]'::jsonb,
    8, 'population',
    2, 'population',
    '[
        {"stat_key":"efficiency",          "direction":"up",  "rate":0.4, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"stability",           "direction":"up",  "rate":0.3, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",          "direction":"up",  "rate":0.2, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"legitimacy",          "direction":"down","rate":0.2, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"civil_unrest",        "direction":"up",  "rate":0.2, "delay_ticks":8, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",       "direction":"down","rate":0.2, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'efficiency', 'UP', 0.4, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Unified Command Administration (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regime Control', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_me]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 9. Technocratic Governance Commission | GOVERNANCE | Regime Control | STRUCTURAL
-- Active: Sa
-- Cost: $12M×Population up / $4M×Population/t
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
    'technocratic_governance_commission_' || to_hex(extract(epoch from now())::int),
    'Technocratic Governance Commission', 'structural',
    'Replacement of elected or politically appointed administrators with credentialed technocrats answerable only to the executive, removing democratic friction from policy implementation entirely.',
    'GOVERNANCE', 'Regime Control', 'Regime Control', 'Interior',
    'Progress', '["Progress","Nationalism"]'::jsonb,
    12, 'population',
    4, 'population',
    '[
        {"stat_key":"efficiency",              "direction":"up",  "rate":0.4, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"gdp_growth",              "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",              "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"legitimacy",              "direction":"down","rate":0.3, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",           "direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"judicial_independence",   "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'efficiency', 'UP', 0.4, 48, 0, 100, 4, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Technocratic Governance Commission (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regime Control', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa]) AS nid WHERE nid IS NOT NULL;

END $$;
