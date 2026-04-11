-- ════════════════════════════════════════════════════════════════════════════════
-- Update Construction Permit Policy Stat Effects
--
-- Design change: every active permit slightly drags GDP_growth (-0.05/tick)
-- but improves 1-2 thematically related nation stats. This creates a clear
-- regulation vs. growth tradeoff for players.
--
-- Effects are long-duration (99999 ticks = effectively permanent while law active).
-- delay_ticks=2 so effects kick in quickly after enactment.
-- ════════════════════════════════════════════════════════════════════════════════

-- P01: Municipal Zoning & Land Use Act
-- GDP drag + infrastructure and urbanization improvement
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",             "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"physical_infrastructure", "direction":"up",   "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"urbanization",            "direction":"up",   "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'municipal_zoning';

-- P06: Structural Engineering Standards Act
-- GDP drag + infrastructure and stability improvement
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",             "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"physical_infrastructure", "direction":"up",   "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"stability",               "direction":"up",   "rate":0.02, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'structural_engineering';

-- P08: National Fire Safety Code
-- GDP drag + happiness and healthcare improvement
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",              "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"happiness",                "direction":"up",   "rate":0.04, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"healthcare_accessibility", "direction":"up",   "rate":0.02, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'fire_safety';

-- P12: Environmental Impact Assessment Act
-- GDP drag + carbon emissions reduction and renewable energy boost
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",                "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"carbon_emissions",           "direction":"down", "rate":0.06, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"renewable_energy_percentage", "direction":"up",   "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'environmental_impact';

-- P14: Construction Air Quality Standards Act
-- GDP drag + carbon emissions reduction and healthcare improvement
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",              "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"carbon_emissions",         "direction":"down", "rate":0.04, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"healthcare_accessibility", "direction":"up",   "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'air_quality';

-- P17: Construction Waste Management Act
-- GDP drag + carbon emissions and healthcare improvement
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",              "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"carbon_emissions",         "direction":"down", "rate":0.03, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"healthcare_accessibility", "direction":"up",   "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'waste_management';

-- P18: Occupational Health & Safety Act
-- GDP drag + happiness and unemployment reduction
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",   "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"happiness",     "direction":"up",   "rate":0.04, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"unemployment", "direction":"down",  "rate":0.02, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'ohs_compliance';

-- P21: Construction Working Hours Act
-- GDP drag + happiness and healthcare improvement
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",              "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"happiness",                "direction":"up",   "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"healthcare_accessibility", "direction":"up",   "rate":0.02, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'working_hours';

-- P22: Construction Union Rights Act
-- GDP drag + income inequality reduction and civil unrest reduction
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",       "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"income_inequality", "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"civil_unrest",      "direction":"down", "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'union_representation';

-- P23: Infrastructure Transport Regulations Act
-- GDP drag + infrastructure and manufacturing improvement
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",             "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"physical_infrastructure", "direction":"up",   "rate":0.04, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"manufacturing_output",    "direction":"up",   "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'heavy_transport';

-- P28: Construction Performance Bond Act
-- GDP drag + foreign investment boost and corruption reduction
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",       "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"foreign_investment","direction":"up",   "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"corruption",        "direction":"down", "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'performance_bond';

-- P30: Corporate Tax Compliance Act
-- GDP drag + corruption reduction and foreign investment boost
UPDATE policies SET
    stat_effects = '[
        {"stat_key":"gdp_growth",       "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"corruption",        "direction":"down", "rate":0.05, "delay_ticks":2, "duration_ticks":99999},
        {"stat_key":"foreign_investment","direction":"up",   "rate":0.03, "delay_ticks":2, "duration_ticks":99999}
    ]'::jsonb,
    target_stat = 'gdp_growth', stat_direction = 'DOWN', stat_change_per_tick = 0.05
WHERE permit_key = 'tax_compliance';

-- Also update any active_laws that reference these policies so the new effects
-- apply retroactively to nations that already enacted them.
-- The tick processor reads stat_effects from the joined policies table, so
-- active_laws rows don't need stat_effects copied — they just need their
-- effects_applied_through_tick reset so the new duration window applies.
UPDATE active_laws SET effects_applied_through_tick = NULL
WHERE policy_id IN (SELECT id FROM policies WHERE permit_key IS NOT NULL);
