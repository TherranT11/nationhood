-- ════════════════════════════════════════════════════════════════════════════════
-- Construction Permits — Phase 1D: Labor (2) + Community (2) + policies
--
-- LABOR:
-- 1. local_workforce         — Local Workforce Quota
-- 2. apprenticeship_training — Apprenticeship & Training
--
-- COMMUNITY (new category):
-- 3. community_consultation  — Community Consultation
-- 4. public_accessibility    — Public Accessibility
-- ════════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════════
-- PERMITS
-- ════════════════════════════════════════════════════════════════════════════════

INSERT INTO construction_permits
    (permit_key, name, category, description, cost, processing_ticks, duration_ticks, maintenance_per_tick, quality_bonus, speed_penalty, event_modifiers, required_for, difficulty, ministry)
VALUES

    -- ── Local Workforce Quota ──────────────────────────────────────────────────
    -- Requires minimum percentage of local workers. Fights unemployment
    -- and poverty but restricts hiring flexibility (4% slower).
    -- Cheapest labor permit — populist appeal.
    ('local_workforce', 'Local Workforce Quota Certificate', 'labor',
     'Requires a minimum percentage of construction workers to be local residents. Reduces unemployment and poverty in the construction sector but restricts hiring flexibility, slowing projects by 4%. The cheapest labor permit — strong populist appeal.',
     55000, 1, 24, 2000, 1, 0.04, '{}',
     '["civil_engineering", "industrial", "mega_project"]', 'EASY', 'labor'),

    -- ── Apprenticeship & Training ──────────────────────────────────────────────
    -- Requires workforce training programs on every project.
    -- Builds the next generation of skilled workers but trainees
    -- are slower (6% penalty). Long-term investment in human capital.
    ('apprenticeship_training', 'Apprenticeship & Training Program Certificate', 'labor',
     'Requires active apprenticeship programs on construction sites — a percentage of the workforce must be trainees receiving certified skills education. Builds long-term human capital but slows projects by 6% as trainees learn on the job. Boosts higher education and social mobility.',
     70000, 2, 24, 3000, 2, 0.06, '{}',
     '["civil_engineering", "industrial", "mega_project"]', 'EASY', 'education'),

    -- ── Community Consultation ─────────────────────────────────────────────────
    -- Public hearings before construction begins. Single-use (each project
    -- needs its own consultation). Heaviest speed penalty of any permit
    -- (10%) — community buy-in takes time. But dramatically reduces
    -- opposition events (80% reduction).
    ('community_consultation', 'Community Consultation & Public Hearing Certificate', 'community',
     'Requires public hearings, community impact assessment, and documented resident feedback before construction begins. Single-use — each project needs its own consultation process. The heaviest speed penalty of any permit (10%) but reduces community opposition events by 80%. Essential for projects that displace residents or reshape neighborhoods.',
     90000, 3, NULL, 0, 2, 0.10, '{"community_opposition": 0.2}',
     '["civil_engineering", "mega_project"]', 'MODERATE', 'interior'),

    -- ── Public Accessibility ───────────────────────────────────────────────────
    -- Universal accessibility standards for all public-facing buildings.
    -- Wheelchair ramps, elevators, tactile indicators, hearing loops.
    -- High quality bonus (+3) — accessible buildings are better buildings.
    ('public_accessibility', 'Public Accessibility Standards Certificate', 'community',
     'Requires universal accessibility in all public-facing construction — wheelchair access, elevators, tactile wayfinding, hearing loops, and emergency evacuation for persons with disabilities. Adds 4% to construction time but produces higher-quality, more inclusive buildings (+3 quality). Without it, advocacy groups can force expensive retrofits.',
     80000, 2, 24, 3000, 3, 0.04, '{}',
     '["civil_engineering", "mega_project"]', 'EASY', 'interior')

ON CONFLICT (permit_key) DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════════
-- POLICIES
-- ════════════════════════════════════════════════════════════════════════════════

-- ── Local Workforce Employment Act ────────────────────────────────────────────
INSERT INTO policies (
    policy_key, policy_name, policy_type, description,
    major_sector, minor_sector, law_category, fiscal_category,
    ideology, ideologies,
    upfront_cost, upfront_scaling_stat,
    ongoing_base_cost, ongoing_scaling_stat,
    stat_effects,
    target_stat, stat_direction, stat_change_per_tick, duration_months,
    stat_floor, stat_ceiling, ongoing_cost_per_tick, is_active,
    permit_key
) VALUES (
    'permit_local_workforce_' || to_hex(extract(epoch from now())::int),
    'Local Workforce Employment Act',
    'structural',
    'Requires a Local Workforce Quota Certificate ($55K, 1 tick) for all construction projects. Mandates that a minimum percentage of workers be local residents. Reduces unemployment and poverty in the construction sector but slows projects by 4%. A populist favorite — easy to pass, hard to repeal without looking anti-worker.',
    'PERMITS', 'Labor', 'Labor', 'Labor',
    'Collectivism', '["Collectivism","Equality"]'::jsonb,
    1, 'population',
    0.2, 'population',
    '[
        {"stat_key":"unemployment",    "direction":"down","rate":0.08, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"poverty_rate",    "direction":"down","rate":0.04, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"immigration",     "direction":"down","rate":0.03, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"gdp_growth",      "direction":"down","rate":0.03, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'unemployment', 'DOWN', 0.08, 48, 0, 100, 0.2, true,
    'local_workforce'
);

-- ── Construction Apprenticeship & Skills Act ──────────────────────────────────
INSERT INTO policies (
    policy_key, policy_name, policy_type, description,
    major_sector, minor_sector, law_category, fiscal_category,
    ideology, ideologies,
    upfront_cost, upfront_scaling_stat,
    ongoing_base_cost, ongoing_scaling_stat,
    stat_effects,
    target_stat, stat_direction, stat_change_per_tick, duration_months,
    stat_floor, stat_ceiling, ongoing_cost_per_tick, is_active,
    permit_key
) VALUES (
    'permit_apprenticeship_training_' || to_hex(extract(epoch from now())::int),
    'Construction Apprenticeship & Skills Act',
    'structural',
    'Requires an Apprenticeship & Training Program Certificate ($70K, 2 ticks) for all construction. Mandates on-site skills training with certified apprenticeships. Slows construction by 6% as trainees learn, but builds long-term human capital. The rare permit that improves education stats — investment in the next generation of skilled workers.',
    'PERMITS', 'Labor', 'Labor', 'Education',
    'Progress', '["Progress","Equality"]'::jsonb,
    1, 'population',
    0.3, 'population',
    '[
        {"stat_key":"higher_education",  "direction":"up",  "rate":0.05, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"social_mobility",   "direction":"up",  "rate":0.05, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"unemployment",      "direction":"down","rate":0.04, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"gdp_growth",        "direction":"down","rate":0.03, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'higher_education', 'UP', 0.05, 48, 0, 100, 0.3, true,
    'apprenticeship_training'
);

-- ── Community Consultation in Construction Act ────────────────────────────────
INSERT INTO policies (
    policy_key, policy_name, policy_type, description,
    major_sector, minor_sector, law_category, fiscal_category,
    ideology, ideologies,
    upfront_cost, upfront_scaling_stat,
    ongoing_base_cost, ongoing_scaling_stat,
    stat_effects,
    target_stat, stat_direction, stat_change_per_tick, duration_months,
    stat_floor, stat_ceiling, ongoing_cost_per_tick, is_active,
    permit_key
) VALUES (
    'permit_community_consultation_' || to_hex(extract(epoch from now())::int),
    'Community Consultation in Construction Act',
    'structural',
    'Requires a Community Consultation Certificate ($90K, 3 ticks, single-use per project) before construction can begin. Mandates public hearings, impact assessment, and documented community feedback. The heaviest speed penalty (10%) but reduces community opposition by 80%. Politically powerful — repealing it looks like silencing the public.',
    'PERMITS', 'Community', 'Social', 'Interior',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    1, 'population',
    0.3, 'population',
    '[
        {"stat_key":"happiness",      "direction":"up",  "rate":0.08, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"civil_unrest",   "direction":"down","rate":0.05, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"legitimacy",     "direction":"up",  "rate":0.04, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"gdp_growth",     "direction":"down","rate":0.05, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'happiness', 'UP', 0.08, 48, 0, 100, 0.3, true,
    'community_consultation'
);

-- ── Public Accessibility Standards Act ────────────────────────────────────────
INSERT INTO policies (
    policy_key, policy_name, policy_type, description,
    major_sector, minor_sector, law_category, fiscal_category,
    ideology, ideologies,
    upfront_cost, upfront_scaling_stat,
    ongoing_base_cost, ongoing_scaling_stat,
    stat_effects,
    target_stat, stat_direction, stat_change_per_tick, duration_months,
    stat_floor, stat_ceiling, ongoing_cost_per_tick, is_active,
    permit_key
) VALUES (
    'permit_public_accessibility_' || to_hex(extract(epoch from now())::int),
    'Public Accessibility Standards Act',
    'structural',
    'Requires a Public Accessibility Standards Certificate ($80K, 2 ticks) for all public-facing construction. Mandates wheelchair access, elevators, tactile wayfinding, hearing loops, and accessible emergency evacuation. Adds 4% to construction time but produces higher-quality buildings (+3 quality). Without it, advocacy groups can force costly retrofits.',
    'PERMITS', 'Community', 'Social', 'Interior',
    'Equality', '["Equality","Progress"]'::jsonb,
    1, 'population',
    0.3, 'population',
    '[
        {"stat_key":"happiness",                 "direction":"up",  "rate":0.05, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"healthcare_accessibility",  "direction":"up",  "rate":0.05, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"freedom_index",             "direction":"up",  "rate":0.04, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"cost_of_living",            "direction":"up",  "rate":0.03, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'healthcare_accessibility', 'UP', 0.05, 48, 0, 100, 0.3, true,
    'public_accessibility'
);

COMMIT;
