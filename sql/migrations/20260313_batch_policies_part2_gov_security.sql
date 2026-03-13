-- Batch insert Part 2: Governance (law_enforcement) policies
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
-- 6. National Security Court System | GOVERNANCE | law | STRUCTURAL
-- Active: Sa, Me, SE
-- Cost: $6M×Population up / $2M×Population/t
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
    'national_security_court_' || to_hex(extract(epoch from now())::int),
    'National Security Court System', 'structural',
    'A parallel court system handling national security cases outside normal judicial procedure, processing threats quickly and reducing terrorism while hollowing out judicial independence.',
    'GOVERNANCE', 'Law', 'Law', 'Justice',
    'Security', '["Security","Nationalism"]'::jsonb,
    6, 'population',
    2, 'population',
    '[
        {"stat_key":"terrorism",                "direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"judicial_independence",     "direction":"down","rate":0.2, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"political_violence",        "direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":0.1, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"efficiency",               "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'terrorism', 'DOWN', 0.1, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: National Security Court System (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Law', 'Justice', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_me, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 7. Civil Asset Forfeiture | GOVERNANCE | law_enforcement | STRUCTURAL
-- Active: Me, Sa
-- Cost: $1M up (no scaling, no ongoing)
-- Ideologies: Security, Individualism
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
    'civil_asset_forfeiture_' || to_hex(extract(epoch from now())::int),
    'Civil Asset Forfeiture', 'structural',
    'Authority for law enforcement to seize assets suspected of being connected to crime without a conviction, becoming a revenue stream for corrupt agencies while hitting poor citizens hardest.',
    'GOVERNANCE', 'Law Enforcement', 'Law Enforcement', 'Justice',
    'Security', '["Security","Individualism"]'::jsonb,
    1, NULL,
    0, NULL,
    '[
        {"stat_key":"crime_rate",               "direction":"down","rate":0.1, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",               "direction":"up",  "rate":0.2, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":0.1, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"poverty_rate",             "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"legitimacy",               "direction":"down","rate":0.1, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'crime_rate', 'DOWN', 0.1, 48, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Civil Asset Forfeiture (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Law Enforcement', 'Justice', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_me, v_sa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 8. Anti-Extremism Legislation | GOVERNANCE | law_enforcement | STRUCTURAL
-- Active: Sa, Me, SE
-- Cost: $5M×Population up / $2M×Population/t
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
    'anti_extremism_legislation_' || to_hex(extract(epoch from now())::int),
    'Anti-Extremism Legislation', 'structural',
    'Broad legislation criminalizing extremist speech and organization, genuinely reducing terrorism while definitions expand to include legitimate political opposition over time.',
    'GOVERNANCE', 'Law Enforcement', 'Law Enforcement', 'Justice',
    'Security', '["Security","Tradition"]'::jsonb,
    5, 'population',
    2, 'population',
    '[
        {"stat_key":"terrorism",                "direction":"down","rate":1,   "delay_ticks":2, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"political_violence",        "direction":"down","rate":0.5, "delay_ticks":2, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"civil_unrest",             "direction":"down","rate":0.3, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":1,   "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"press_freedom",            "direction":"down","rate":0.5, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"judicial_independence",     "direction":"down","rate":0.5, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"up",  "rate":0.5, "delay_ticks":8, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'terrorism', 'DOWN', 1, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Anti-Extremism Legislation (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Law Enforcement', 'Justice', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_me, v_se]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 9. Digital Surveillance Network | GOVERNANCE | law_enforcement | STRUCTURAL
-- Active: Sa, Me
-- Cost: $5M×Population up / $1M×Population/t
-- Ideologies: Security
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
    'digital_surveillance_network_' || to_hex(extract(epoch from now())::int),
    'Digital Surveillance Network', 'structural',
    'State-operated mass surveillance infrastructure monitoring communications, movement, and financial activity to reduce crime and terrorism at significant cost to civil liberties.',
    'GOVERNANCE', 'Law Enforcement', 'Law Enforcement', 'Interior',
    'Security', '["Security"]'::jsonb,
    5, 'population',
    1, 'population',
    '[
        {"stat_key":"crime_rate",               "direction":"down","rate":0.5, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"terrorism",                "direction":"down","rate":0.5, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":1,   "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"press_freedom",            "direction":"down","rate":0.5, "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"stability",                "direction":"up",  "rate":0.5, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",               "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'crime_rate', 'DOWN', 0.5, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Digital Surveillance Network (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Law Enforcement', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_sa, v_me]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 10. Anti-Terrorism Task Force | GOVERNANCE | law_enforcement | STRUCTURAL
-- Active: Me, Sa, SE
-- Cost: $3M×Population up / $1M×Population/t
-- Ideologies: Security
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
    'anti_terrorism_task_force_' || to_hex(extract(epoch from now())::int),
    'Anti-Terrorism Task Force', 'structural',
    'A dedicated counter-terrorism unit with expanded surveillance and detention powers, reducing political violence at the cost of civil liberties.',
    'GOVERNANCE', 'Law Enforcement', 'Law Enforcement', 'Defense',
    'Security', '["Security"]'::jsonb,
    3, 'population',
    1, 'population',
    '[
        {"stat_key":"terrorism",                "direction":"down","rate":1,   "delay_ticks":2, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"political_violence",        "direction":"down","rate":0.5, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"stability",                "direction":"up",  "rate":0.5, "delay_ticks":3, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":0.5, "delay_ticks":1, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"civil_unrest",             "direction":"down","rate":0.3, "delay_ticks":4, "duration_ticks":12,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'terrorism', 'DOWN', 1, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Anti-Terrorism Task Force (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Law Enforcement', 'Defense', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_me, v_sa, v_se]) AS nid WHERE nid IS NOT NULL;

END $$;
