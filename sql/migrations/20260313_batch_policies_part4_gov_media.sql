-- Batch insert Part 4: Governance (media) policies
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
-- 16. National Unity Media Standards | GOVERNANCE | media | STRUCTURAL
-- Active: Me, Sa
-- Cost: $3M×Population up / $1M×Population/t
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
    'national_unity_media_standards_' || to_hex(extract(epoch from now())::int),
    'National Unity Media Standards', 'structural',
    'Government-mandated content regulations requiring media to adhere to nationally cohesive framing standards, reducing visible political conflict while suppressing independent journalism.',
    'GOVERNANCE', 'Media', 'Media', 'Interior',
    'Nationalism', '["Nationalism","Security"]'::jsonb,
    3, 'population',
    1, 'population',
    '[
        {"stat_key":"polarization",             "direction":"down","rate":0.5, "delay_ticks":4, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"stability",                "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"press_freedom",            "direction":"down","rate":1,   "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",               "direction":"up",  "rate":0.3, "delay_ticks":5, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"freedom_index",            "direction":"down","rate":0.3, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation", "direction":"down","rate":0.3, "delay_ticks":3, "duration_ticks":16,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'press_freedom', 'DOWN', 1, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: National Unity Media Standards (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Media', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_me, v_sa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 17. Public Broadcasting Service | GOVERNANCE | media | STRUCTURAL
-- Active: Av, SE, Mo, Pa
-- Cost: $3M×Population up / $1M×Population/t
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
    'public_broadcasting_service_' || to_hex(extract(epoch from now())::int),
    'Public Broadcasting Service', 'structural',
    'An editorially independent publicly funded broadcaster serving the public interest, improving media literacy and reducing polarization at modest efficiency cost.',
    'GOVERNANCE', 'Media', 'Media', 'Interior',
    'Collectivism', '["Collectivism","Equality"]'::jsonb,
    3, 'population',
    1, 'population',
    '[
        {"stat_key":"press_freedom",            "direction":"up",  "rate":0.5, "delay_ticks":2, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"literacy",                 "direction":"up",  "rate":0.3, "delay_ticks":6, "duration_ticks":24,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"down","rate":0.3, "delay_ticks":8, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",               "direction":"down","rate":0.2, "delay_ticks":8, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"efficiency",               "direction":"down","rate":0.2, "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'press_freedom', 'UP', 0.5, 48, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Public Broadcasting Service (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Media', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 18. State Media Network | GOVERNANCE | media | STRUCTURAL
-- Active: Me, Sa
-- Cost: $5M×Population up / $2M×Population/t
-- Ideologies: Collectivism, Security
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
    'state_media_network_' || to_hex(extract(epoch from now())::int),
    'State Media Network', 'structural',
    'Government-owned broadcast and news network framing national events through an officially approved lens, reducing visible dissent while undermining independent journalism.',
    'GOVERNANCE', 'Media', 'Media', 'Interior',
    'Collectivism', '["Collectivism","Security"]'::jsonb,
    5, 'population',
    2, 'population',
    '[
        {"stat_key":"press_freedom",            "direction":"down","rate":1,   "delay_ticks":2, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"stability",                "direction":"up",  "rate":0.5, "delay_ticks":3, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"down","rate":0.3, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",               "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"legitimacy",               "direction":"down","rate":0.2, "delay_ticks":6, "duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'press_freedom', 'DOWN', 1, 48, 0, 100, 2, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: State Media Network (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Media', 'Interior', 'active', 0, true, true, 48
FROM unnest(ARRAY[v_me, v_sa]) AS nid WHERE nid IS NOT NULL;

-- ============================================================
-- 19. Press Freedom Protection | GOVERNANCE | media | STRUCTURAL
-- Active: Av, SE, Mo, Pa
-- Cost: $2M up / $1M×Population/t
-- Ideologies: Liberty, Freedom
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
    'press_freedom_protection_' || to_hex(extract(epoch from now())::int),
    'Press Freedom Protection', 'structural',
    'Legal framework protecting journalists and publishers from government interference, establishing shield laws and prohibitions on prior restraint.',
    'GOVERNANCE', 'Media', 'Media', 'Justice',
    'Liberty', '["Liberty","Freedom"]'::jsonb,
    2, NULL,
    1, 'population',
    '[
        {"stat_key":"press_freedom",            "direction":"up",  "rate":1,   "delay_ticks":1, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"corruption",               "direction":"down","rate":0.5, "delay_ticks":4, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"legitimacy",               "direction":"up",  "rate":0.3, "delay_ticks":3, "duration_ticks":20,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"down","rate":0.3, "delay_ticks":5, "duration_ticks":16,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation", "direction":"up",  "rate":0.3, "delay_ticks":2, "duration_ticks":12,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'press_freedom', 'UP', 1, 20, 0, 100, 1, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: Press Freedom Protection (%)', v_policy_id;
INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
SELECT nid, v_policy_id, 'GOVERNANCE', 'Media', 'Justice', 'active', 0, true, true, 20
FROM unnest(ARRAY[v_av, v_se, v_mo, v_pa]) AS nid WHERE nid IS NOT NULL;

END $$;
