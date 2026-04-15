-- National Infrastructure Renewal Act
-- Pro-construction policy that generates staggered construction contracts.
-- Cost: $200 × population. Effects over 20-35 ticks. Generates 13 contracts total.
-- Wave 1 (tick 1): 3 civil, 1 industrial, 1 megaproject
-- Wave 2 (tick 6): 3 civil, 2 industrial
-- Wave 3 (tick 12): 3 civil

DO $$
DECLARE v_policy_id uuid;
BEGIN
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
    'national_infrastructure_renewal',
    'National Infrastructure Renewal Act', 'lever',
    'A sweeping government program commissioning roads, bridges, railways, and public buildings across the nation. Generates a wave of construction contracts funded by public debt. Construction corporations thrive, jobs multiply, but pollution climbs. Costs $200 per citizen.',
    'ECONOMICS', 'Construction', 'Infrastructure', 'Finance',
    'Progress', '["Progress","Collectivism"]'::jsonb,
    200, 'population',
    0, NULL,
    '[
        {"stat_key":"physical_infrastructure", "direction":"up",   "rate":0.1, "delay_ticks":3,  "duration_ticks":30, "adjust_type":null, "adjust_value":0},
        {"stat_key":"urbanization",            "direction":"up",   "rate":0.1, "delay_ticks":4,  "duration_ticks":35, "adjust_type":null, "adjust_value":0},
        {"stat_key":"unemployment",            "direction":"down", "rate":0.2, "delay_ticks":2,  "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"gdp_growth",              "direction":"up",   "rate":0.2, "delay_ticks":3,  "duration_ticks":20, "adjust_type":null, "adjust_value":0},
        {"stat_key":"pollution",               "direction":"up",   "rate":0.2, "delay_ticks":3,  "duration_ticks":25, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'physical_infrastructure', 'UP', 0.1, 35, 0, 100, 0, true
) RETURNING id INTO v_policy_id;
RAISE NOTICE 'Created: National Infrastructure Renewal Act (%) — policy_key: national_infrastructure_renewal', v_policy_id;
END $$;
