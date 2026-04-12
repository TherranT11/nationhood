-- ════════════════════════════════════════════════════════════════════════════════
-- Construction Permit Stat Effects — Phase 3: 16 new permits
--
-- Same pattern as 20260411_permit_gdp_stat_effects.sql:
-- Every active permit drags GDP_growth by -0.05/tick but improves
-- 1-3 thematically related nation stats. Creates a clear
-- regulation vs. growth tradeoff.
--
-- Effects use duration_ticks=99999 (effectively permanent while law active).
-- delay_ticks=2 so effects kick in quickly after enactment.
-- ════════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════
-- ENVIRONMENTAL (3 permits)
-- ═══════════════════════════════════════════════════

-- Noise & Vibration Control Act
-- GDP drag + happiness boost + civil unrest reduction
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",    "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"happiness",      "direction":"up",   "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"civil_unrest",   "direction":"down", "rate":0.02, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'noise_vibration';

-- Hazardous Materials Safety Act
-- GDP drag + pollution reduction + healthcare quality improvement
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",         "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"pollution",           "direction":"down", "rate":0.04, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"healthcare_quality", "direction":"up",   "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'hazmat_handling';

-- Water Resource Protection Act
-- GDP drag + arable land protection + pollution reduction
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",  "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"arable_land", "direction":"up",   "rate":0.03, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"pollution",   "direction":"down", "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'water_resource';


-- ═══════════════════════════════════════════════════
-- SPECIALIZED (5 permits)
-- ═══════════════════════════════════════════════════

-- Coastal Construction Safety Act
-- GDP drag + trade balance + physical infrastructure
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",             "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"trade_balance",           "direction":"up",   "rate":0.04, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"physical_infrastructure", "direction":"up",   "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'coastal_maritime';

-- National Renewable Energy Standards Act
-- GDP drag + renewable energy boost + carbon emissions reduction
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",                 "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"renewable_energy_percentage", "direction":"up",   "rate":0.06, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"carbon_emissions",            "direction":"down", "rate":0.04, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'renewable_energy';

-- Telecommunications Infrastructure Standards Act
-- GDP drag + digital infrastructure + service output
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",            "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"digital_infrastructure", "direction":"up",   "rate":0.06, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"service_output",         "direction":"up",   "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'telecom_infrastructure';

-- Agricultural Land Preservation Act
-- GDP drag + arable land protection (urbanization drag is the tradeoff)
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",    "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"arable_land",   "direction":"up",   "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"urbanization",  "direction":"down", "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'agri_land_conversion';

-- National Heritage Protection Act
-- GDP drag + happiness + international reputation
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",              "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"happiness",                "direction":"up",   "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"international_reputation", "direction":"up",   "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'heritage_preservation';


-- ═══════════════════════════════════════════════════
-- SAFETY (2 permits)
-- ═══════════════════════════════════════════════════

-- National Seismic Building Code
-- GDP drag + stability + physical infrastructure
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",             "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"stability",               "direction":"up",   "rate":0.03, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"physical_infrastructure", "direction":"up",   "rate":0.04, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'seismic_resilience';

-- Disaster Preparedness in Construction Act
-- GDP drag + stability + happiness
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth", "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"stability",   "direction":"up",   "rate":0.04, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"happiness",   "direction":"up",   "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'disaster_preparedness';


-- ═══════════════════════════════════════════════════
-- FINANCIAL (2 permits)
-- ═══════════════════════════════════════════════════

-- Foreign Investment Review Act
-- GDP drag + foreign investment boost + corruption reduction
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",        "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"foreign_investment", "direction":"up",   "rate":0.06, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"corruption",         "direction":"down", "rate":0.04, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'foreign_investment_clearance';

-- Construction Anti-Corruption Act
-- GDP drag + corruption reduction + judicial independence
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",            "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"corruption",             "direction":"down", "rate":0.06, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"judicial_independence", "direction":"up",   "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'anti_corruption';


-- ═══════════════════════════════════════════════════
-- LABOR (2 permits)
-- ═══════════════════════════════════════════════════

-- Local Workforce Employment Act
-- GDP drag + unemployment reduction + poverty reduction
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",    "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"unemployment",  "direction":"down", "rate":0.06, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"poverty_rate",  "direction":"down", "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'local_workforce';

-- Construction Apprenticeship & Skills Act
-- GDP drag + higher education + social mobility
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",       "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"higher_education", "direction":"up",   "rate":0.04, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"social_mobility",  "direction":"up",   "rate":0.04, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'apprenticeship_training';


-- ═══════════════════════════════════════════════════
-- COMMUNITY (2 permits)
-- ═══════════════════════════════════════════════════

-- Community Consultation in Construction Act
-- GDP drag + happiness + civil unrest reduction + legitimacy
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",   "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"happiness",     "direction":"up",   "rate":0.06, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"civil_unrest", "direction":"down", "rate":0.04, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"legitimacy",    "direction":"up",   "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'community_consultation';

-- Public Accessibility Standards Act
-- GDP drag + happiness + healthcare accessibility + freedom index
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",              "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"happiness",                "direction":"up",   "rate":0.04, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"healthcare_accessibility", "direction":"up",   "rate":0.04, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"freedom_index",            "direction":"up",   "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'public_accessibility';


-- ═══════════════════════════════════════════════════
-- Reset effects_applied_through_tick so new effects apply
-- retroactively for any nation that already enacted these
-- ═══════════════════════════════════════════════════

UPDATE active_laws SET effects_applied_through_tick = NULL
WHERE policy_id IN (
    SELECT id FROM policies WHERE permit_key IN (
        'noise_vibration', 'hazmat_handling', 'water_resource',
        'coastal_maritime', 'renewable_energy', 'telecom_infrastructure',
        'agri_land_conversion', 'heritage_preservation',
        'seismic_resilience', 'disaster_preparedness',
        'foreign_investment_clearance', 'anti_corruption',
        'local_workforce', 'apprenticeship_training',
        'community_consultation', 'public_accessibility'
    )
);
