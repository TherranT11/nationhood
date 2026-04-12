-- ════════════════════════════════════════════════════════════════════════════════
-- Construction Permits — Phase 1C: Safety (2) + Financial (2) + policies
--
-- SAFETY:
-- 1. seismic_resilience            — Seismic Resilience
-- 2. disaster_preparedness         — Disaster Preparedness
--
-- FINANCIAL:
-- 3. foreign_investment_clearance  — Foreign Investment Clearance
-- 4. anti_corruption               — Anti-Corruption Compliance
-- ════════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════════
-- PERMITS
-- ════════════════════════════════════════════════════════════════════════════════

INSERT INTO construction_permits
    (permit_key, name, category, description, cost, processing_ticks, duration_ticks, maintenance_per_tick, quality_bonus, speed_penalty, event_modifiers, required_for, difficulty, ministry)
VALUES

    -- ── Seismic Resilience ─────────────────────────────────────────────────────
    -- Earthquake-resistant design standards. High quality bonus reflects
    -- the superior engineering required. Without it, buildings can collapse.
    ('seismic_resilience', 'Seismic Resilience Certification', 'safety',
     'Certifies earthquake-resistant design, foundation engineering, and structural reinforcement standards. Reduces structural failure events by 70%. Required for construction in seismically active zones. Without this certification, buildings face catastrophic collapse risk during earthquakes.',
     190000, 3, 24, 5000, 4, 0.06, '{"structural_failure": 0.3}',
     '["civil_engineering", "industrial", "mega_project"]', 'HARD', 'infrastructure'),

    -- ── Disaster Preparedness ──────────────────────────────────────────────────
    -- Emergency systems, evacuation routes, shelter capacity.
    -- Protects occupants during natural disasters and crises.
    ('disaster_preparedness', 'Disaster Preparedness Compliance Certificate', 'safety',
     'Requires emergency evacuation systems, shelter capacity, backup power, and emergency supply storage in all new construction. Reduces disaster casualty events by 60%. Covers hurricane shelters, earthquake safe rooms, and flood evacuation infrastructure.',
     110000, 2, 24, 4000, 2, 0, '{"disaster_casualties": 0.4}',
     '["civil_engineering", "mega_project"]', 'MODERATE', 'interior'),

    -- ── Foreign Investment Clearance ───────────────────────────────────────────
    -- Security review for projects funded by foreign capital. Longest
    -- processing time (5 ticks) — reflects real-world CFIUS-style review.
    -- Short duration (12 ticks) forces frequent renewal.
    ('foreign_investment_clearance', 'Foreign Investment Security Clearance', 'financial',
     'Security review for construction projects funded by foreign capital. Screens for national security risks, strategic asset concerns, and foreign influence. The longest processing time of any permit (5 ticks) reflects the depth of the security investigation. Must be renewed every 12 ticks.',
     250000, 5, 12, 7000, 1, 0, '{}',
     '["industrial", "mega_project"]', 'COMPLEX', 'finance'),

    -- ── Anti-Corruption Compliance ─────────────────────────────────────────────
    -- Transparency and anti-bribery certification. Targets the intersection
    -- of government contracts and private construction. High impact on
    -- corruption stat.
    ('anti_corruption', 'Anti-Corruption Compliance Certificate', 'financial',
     'Requires transparent bidding records, anti-bribery certification, beneficial ownership disclosure, and independent audit trails. Dramatically reduces corruption scandal events. Essential for government-commissioned construction where public funds are at stake.',
     175000, 3, 24, 5000, 2, 0, '{"corruption_scandal": 0.3}',
     '["civil_engineering", "industrial", "mega_project"]', 'HARD', 'justice')

ON CONFLICT (permit_key) DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════════
-- POLICIES
-- ════════════════════════════════════════════════════════════════════════════════

-- ── National Seismic Building Code ────────────────────────────────────────────
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
    'permit_seismic_resilience_' || to_hex(extract(epoch from now())::int),
    'National Seismic Building Code',
    'structural',
    'Mandates Seismic Resilience Certification ($190K, 3 ticks) for all construction in seismically active regions. Requires earthquake-resistant design, reinforced foundations, and structural redundancy. Slows construction by 6% but prevents catastrophic building collapses. Politically popular after any earthquake event.',
    'PERMITS', 'Safety', 'Safety', 'Transportation',
    'Security', '["Security"]'::jsonb,
    3, 'population',
    0.6, 'population',
    '[
        {"stat_key":"stability",                "direction":"up",  "rate":0.05, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"physical_infrastructure",  "direction":"up",  "rate":0.06, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"gdp_growth",               "direction":"down","rate":0.04, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"cost_of_living",           "direction":"up",  "rate":0.04, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'stability', 'UP', 0.05, 48, 0, 100, 0.6, true,
    'seismic_resilience'
);

-- ── Disaster Preparedness in Construction Act ─────────────────────────────────
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
    'permit_disaster_preparedness_' || to_hex(extract(epoch from now())::int),
    'Disaster Preparedness in Construction Act',
    'structural',
    'Requires Disaster Preparedness Compliance ($110K, 2 ticks) for all civil and mega construction. Mandates emergency evacuation systems, shelter capacity, and backup power. Reduces disaster casualties by 60%. The cheapest safety permit — designed to save lives without crippling the construction industry.',
    'PERMITS', 'Safety', 'Safety', 'Interior',
    'Security', '["Security","Equality"]'::jsonb,
    1, 'population',
    0.4, 'population',
    '[
        {"stat_key":"stability",   "direction":"up",  "rate":0.05, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"happiness",   "direction":"up",  "rate":0.04, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"legitimacy",  "direction":"up",  "rate":0.03, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'stability', 'UP', 0.05, 48, 0, 100, 0.4, true,
    'disaster_preparedness'
);

-- ── Foreign Investment Review Act ─────────────────────────────────────────────
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
    'permit_foreign_investment_clearance_' || to_hex(extract(epoch from now())::int),
    'Foreign Investment Review Act',
    'structural',
    'Requires Foreign Investment Security Clearance ($250K, 5 ticks, 12-tick duration) for construction projects funded by foreign capital. The most expensive and slowest permit — screens for national security risks and foreign influence. Protectionist but builds investor confidence through transparency.',
    'PERMITS', 'Financial', 'Governance', 'Finance',
    'Security', '["Security","Tradition"]'::jsonb,
    4, 'population',
    1.0, 'population',
    '[
        {"stat_key":"foreign_investment",       "direction":"up",  "rate":0.06, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"corruption",               "direction":"down","rate":0.05, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"gdp_growth",               "direction":"down","rate":0.05, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"international_reputation", "direction":"down","rate":0.03, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'foreign_investment', 'UP', 0.06, 48, 0, 100, 1.0, true,
    'foreign_investment_clearance'
);

-- ── Construction Anti-Corruption Act ──────────────────────────────────────────
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
    'permit_anti_corruption_' || to_hex(extract(epoch from now())::int),
    'Construction Anti-Corruption Act',
    'structural',
    'Requires Anti-Corruption Compliance Certificate ($175K, 3 ticks) for all construction. Mandates transparent bidding, anti-bribery certification, and independent audit trails. The strongest anti-corruption permit — reduces bribery scandal events by 70%. Popular with reform movements and international observers.',
    'PERMITS', 'Financial', 'Governance', 'Justice',
    'Equality', '["Equality","Progress"]'::jsonb,
    3, 'population',
    0.8, 'population',
    '[
        {"stat_key":"corruption",              "direction":"down","rate":0.1,  "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"judicial_independence",   "direction":"up",  "rate":0.04, "delay_ticks":5, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"foreign_investment",      "direction":"up",  "rate":0.05, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"gdp_growth",              "direction":"down","rate":0.04, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'corruption', 'DOWN', 0.1, 48, 0, 100, 0.8, true,
    'anti_corruption'
);

COMMIT;
