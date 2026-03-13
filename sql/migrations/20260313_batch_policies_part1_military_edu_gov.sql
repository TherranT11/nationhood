-- Batch insert Part 1: Military, Education, Governance (law/regulatory) policies
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
-- 1. Mandatory Military Service | MILITARY | service | STRUCTURAL
-- Active: Sa, Mo
-- Cost: $5M×Population up / $2M×Population/t
-- Ideologies: Nationalism, Tradition, Security
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
    'mandatory_military_service_' || to_hex(extract(epoch from now())::int),
    'Mandatory Military Service', 'structural',
    'Compulsory military enlistment for all eligible citizens, building national unity and suppressing unrest while reducing labor availability and driving emigration among those who can leave.',
    'MILITARY', 'Military Service', 'Military Service', 'Defense',
    'Nationalism', '["Nationalism","Tradition","Security"]'::jsonb,
    5, 'population',
    2, 'population',
    '[
        {"stat_key":"stability",                "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"civil_unrest",             "direction":"down","rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"emigration",               "direction":"up",  "rate":0.15,"delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":0.1, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"happiness",                "direction":"down","rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation","direction":"down","rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'stability', 'UP', 0.2, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Mandatory Military Service (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'MILITARY', 'Military Service', 'Defense', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 2. National Loyalty Education Curriculum | EDUCATION | education | STRUCTURAL
-- Active: Sa, Mo
-- Cost: $5M×Population up / $1M×Population/t
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
    'national_loyalty_education_' || to_hex(extract(epoch from now())::int),
    'National Loyalty Education Curriculum', 'structural',
    'Mandatory civics and national identity curriculum in all public schools, improving literacy and long-term stability at the cost of academic freedom and international educational exchange.',
    'EDUCATION', 'Education', 'Education', 'Education',
    'Nationalism', '["Nationalism","Tradition"]'::jsonb,
    5, 'population',
    1, 'population',
    '[
        {"stat_key":"stability",                "direction":"up",  "rate":0.3, "delay_ticks":10,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"down","rate":0.5, "delay_ticks":10,"duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"literacy",                 "direction":"up",  "rate":0.2, "delay_ticks":8, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":0.5, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"academic_immigration",     "direction":"down","rate":0.3, "delay_ticks":8, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"higher_education",         "direction":"down","rate":0.3, "delay_ticks":10,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'stability', 'UP', 0.3, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: National Loyalty Education Curriculum (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'EDUCATION', 'Education', 'Education', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_mo]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 3. Judicial Appointment Reform | GOVERNANCE | law | STRUCTURAL
-- Active: Me, Sa
-- Cost: $3M up / $1M×Population/t
-- Ideologies: Nationalism, Collectivism
-- NOTE: "Independent Judicial Review" set as opposed after batch
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
    'judicial_appointment_reform_' || to_hex(extract(epoch from now())::int),
    'Judicial Appointment Reform', 'structural',
    'Restructuring of judicial appointment processes to give the executive greater control over court nominations, framed as eliminating activist judges but functioning to pack courts with loyalists.',
    'GOVERNANCE', 'Law', 'Law', 'Justice',
    'Nationalism', '["Nationalism","Collectivism"]'::jsonb,
    3, NULL,
    1, 'population',
    '[
        {"stat_key":"judicial_independence",    "direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"efficiency",               "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",               "direction":"up",  "rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"stability",                "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'judicial_independence', 'DOWN', 0.2, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Judicial Appointment Reform (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Law', 'Justice', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_me, v_sa]) AS nid WHERE nid IS NOT NULL;

-- Link opposed: "Independent Judicial Review"
UPDATE policies
SET opposed_policy_ids = COALESCE(opposed_policy_ids, '[]'::jsonb) || jsonb_build_array(v_policy_id::text)
WHERE LOWER(policy_name) = 'independent judicial review';

UPDATE policies
SET opposed_policy_ids = (
    SELECT jsonb_agg(p2.id::text)
    FROM policies p2
    WHERE LOWER(p2.policy_name) = 'independent judicial review'
)
WHERE id = v_policy_id
AND EXISTS (SELECT 1 FROM policies WHERE LOWER(policy_name) = 'independent judicial review');

-- ============================================================
-- 4. Public Sector Efficiency Reform | GOVERNANCE | regulatory | LEVER
-- Active: Av, SE, Pa
-- Cost: $5M×Population up (no ongoing)
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
    'public_sector_efficiency_reform_' || to_hex(extract(epoch from now())::int),
    'Public Sector Efficiency Reform', 'lever',
    'Audits, privatizations, and administrative streamlining of government agencies, improving efficiency and reducing corruption at the cost of public sector unemployment.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Interior',
    'Liberty', '["Liberty","Individualism"]'::jsonb,
    5, 'population',
    0, NULL,
    '[
        {"stat_key":"efficiency",               "direction":"up",  "rate":1,   "delay_ticks":3, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",               "direction":"down","rate":0.5, "delay_ticks":4, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"debt_growth",              "direction":"down","rate":0.3, "delay_ticks":4, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"unemployment",             "direction":"up",  "rate":0.3, "delay_ticks":2, "duration_ticks":12,"adjust_type":null,"adjust_value":0},
        {"stat_key":"legitimacy",               "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":16,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'efficiency', 'UP', 1, 20, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Public Sector Efficiency Reform (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Interior', 'active', 0, true, true, 20
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 5. Anti-Corruption Commission | GOVERNANCE | regulatory | STRUCTURAL
-- Active: Av, SE, Pa
-- Cost: $10M×Population up / $3M×Population/t
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
    'anti_corruption_commission_' || to_hex(extract(epoch from now())::int),
    'Anti-Corruption Commission', 'structural',
    'An independent body with prosecutorial authority to investigate and charge public officials for corruption, slowly improving institutional integrity across multiple fronts.',
    'GOVERNANCE', 'Regulatory', 'Regulatory', 'Justice',
    'Liberty', '["Liberty"]'::jsonb,
    10, 'population',
    3, 'population',
    '[
        {"stat_key":"corruption",               "direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"efficiency",               "direction":"up",  "rate":0.1, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"judicial_independence",     "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"foreign_investment",        "direction":"up",  "rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"legitimacy",               "direction":"up",  "rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'corruption', 'DOWN', 0.2, 48, 0, 100, 3, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Anti-Corruption Commission (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Justice', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_pa]) AS nid WHERE nid IS NOT NULL;

END $$;
