-- ════════════════════════════════════════════════════════════════════════════════
-- Seed 12 Construction Permit Policies
--
-- Each policy links to a construction permit via permit_key. When enacted,
-- the corresponding permit becomes required for all construction corps in
-- that nation. Repealing removes the requirement.
--
-- These are standard policies — any party can propose them as bills.
-- ════════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN

-- ── P01: Municipal Zoning & Land Use Act ───────────────────────────────────
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
    'permit_municipal_zoning_' || to_hex(extract(epoch from now())::int),
    'Municipal Zoning & Land Use Act',
    'structural',
    'Establishes municipal zoning boundaries and land-use classifications. All construction within city limits requires a Municipal Zoning Approval permit ($120K, 2 ticks processing). The most basic construction regulation — prevents uncontrolled development.',
    'PERMITS', 'Zoning', 'Zoning', 'Interior',
    'Security', '["Security","Collectivism"]'::jsonb,
    1, 'population',
    0.5, 'population',
    '[
        {"stat_key":"efficiency",        "direction":"up",  "rate":0.1, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"foreign_investment", "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"urbanization",      "direction":"up",  "rate":0.05,"delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'efficiency', 'UP', 0.1, 48, 0, 100, 0.5, true,
    'municipal_zoning'
);

-- ── P06: Structural Engineering Standards Act ──────────────────────────────
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
    'permit_structural_engineering_' || to_hex(extract(epoch from now())::int),
    'Structural Engineering Standards Act',
    'structural',
    'Mandates certified structural engineering for all construction projects. Corporations must hold a Structural Engineering Certification ($85K, 2 ticks). Buildings without certification receive a -10 quality penalty at inspection.',
    'PERMITS', 'Safety', 'Safety', 'Transportation',
    'Security', '["Security","Progress"]'::jsonb,
    2, 'population',
    0.5, 'population',
    '[
        {"stat_key":"stability",             "direction":"up",  "rate":0.1, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"standard_of_living",    "direction":"up",  "rate":0.05,"delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'stability', 'UP', 0.1, 48, 0, 100, 0.5, true,
    'structural_engineering'
);

-- ── P08: National Fire Safety Code ─────────────────────────────────────────
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
    'permit_fire_safety_' || to_hex(extract(epoch from now())::int),
    'National Fire Safety Code',
    'structural',
    'Requires fire suppression systems, emergency exits, and fire-resistant materials in all buildings. Corporations must hold Fire Safety Compliance ($65K, 2 ticks). Adds ~3% to material costs but reduces fire-related casualties.',
    'PERMITS', 'Safety', 'Safety', 'Interior',
    'Security', '["Security"]'::jsonb,
    1, 'population',
    0.3, 'population',
    '[
        {"stat_key":"stability",          "direction":"up",  "rate":0.05, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"cost_of_living",     "direction":"up",  "rate":0.05, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'stability', 'UP', 0.05, 48, 0, 100, 0.3, true,
    'fire_safety'
);

-- ── P12: Environmental Impact Assessment Act ───────────────────────────────
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
    'permit_environmental_impact_' || to_hex(extract(epoch from now())::int),
    'Environmental Impact Assessment Act',
    'structural',
    'Requires a full environmental impact assessment before major construction. 6-tick processing includes public comment, ecological survey, and regulatory review. The most politically contested permit — environmentalists love it, business lobbies hate it.',
    'PERMITS', 'Environmental', 'Environmental', 'Energy',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    5, 'population',
    1.5, 'population',
    '[
        {"stat_key":"pollution",          "direction":"down","rate":0.2, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"gdp_growth",         "direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"carbon_emissions",   "direction":"down","rate":0.1, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"international_reputation","direction":"up","rate":0.1,"delay_ticks":4,"duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'pollution', 'DOWN', 0.2, 48, 0, 100, 1.5, true,
    'environmental_impact'
);

-- ── P14: Construction Air Quality Standards Act ────────────────────────────
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
    'permit_air_quality_' || to_hex(extract(epoch from now())::int),
    'Construction Air Quality Standards Act',
    'structural',
    'Requires dust suppression and particulate monitoring during construction. Cheap and fast ($55K, 1 tick) but maintenance adds up. Reduces community opposition to construction projects by 30%.',
    'PERMITS', 'Environmental', 'Environmental', 'Energy',
    'Equality', '["Equality"]'::jsonb,
    1, 'population',
    0.3, 'population',
    '[
        {"stat_key":"pollution",     "direction":"down","rate":0.1, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"happiness",     "direction":"up",  "rate":0.05,"delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'pollution', 'DOWN', 0.1, 48, 0, 100, 0.3, true,
    'air_quality'
);

-- ── P17: Construction Waste Management Act ─────────────────────────────────
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
    'permit_waste_management_' || to_hex(extract(epoch from now())::int),
    'Construction Waste Management Act',
    'structural',
    'Requires proper sorting, recycling, and disposal of construction waste. Prevents illegal dumping. $110K application, 2 ticks processing. Adds ~2% to project costs but improves site operations.',
    'PERMITS', 'Environmental', 'Environmental', 'Energy',
    'Equality', '["Equality","Security"]'::jsonb,
    1, 'population',
    0.5, 'population',
    '[
        {"stat_key":"pollution",          "direction":"down","rate":0.1, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'pollution', 'DOWN', 0.1, 48, 0, 100, 0.5, true,
    'waste_management'
);

-- ── P18: Occupational Health & Safety Act ───────────────────────────────────
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
    'permit_ohs_compliance_' || to_hex(extract(epoch from now())::int),
    'Occupational Health & Safety Act',
    'structural',
    'Requires safety officers on-site, PPE for all workers, safety training programs, and incident reporting. Reduces worker injury rate by 50%. The most impactful labor permit — $150K, 3 ticks processing.',
    'PERMITS', 'Labor', 'Labor', 'Labor',
    'Equality', '["Equality","Collectivism"]'::jsonb,
    3, 'population',
    1, 'population',
    '[
        {"stat_key":"happiness",             "direction":"up",  "rate":0.1, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"standard_of_living",    "direction":"up",  "rate":0.05,"delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"cost_of_living",        "direction":"up",  "rate":0.05,"delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'happiness', 'UP', 0.1, 48, 0, 100, 1, true,
    'ohs_compliance'
);

-- ── P21: Construction Working Hours Act ────────────────────────────────────
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
    'permit_working_hours_' || to_hex(extract(epoch from now())::int),
    'Construction Working Hours Act',
    'structural',
    'Limits construction work to 10 hours/day with mandatory overtime pay. Reduces construction speed by 8% but improves worker safety (-20% incidents) and quality (+1 inspection). $60K, 1 tick processing.',
    'PERMITS', 'Labor', 'Labor', 'Labor',
    'Equality', '["Equality"]'::jsonb,
    1, 'population',
    0.3, 'population',
    '[
        {"stat_key":"happiness",              "direction":"up",  "rate":0.05,"delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"manufacturing_output",   "direction":"down","rate":0.05,"delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'happiness', 'UP', 0.05, 48, 0, 100, 0.3, true,
    'working_hours'
);

-- ── P22: Construction Union Rights Act ─────────────────────────────────────
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
    'permit_union_representation_' || to_hex(extract(epoch from now())::int),
    'Construction Union Rights Act',
    'structural',
    'Requires allowing union representatives on construction sites and recognizing collective bargaining. Increases wages ~5% but reduces strike risk by 70%. $45K, 1 tick processing. Popular with labor parties.',
    'PERMITS', 'Labor', 'Labor', 'Labor',
    'Collectivism', '["Collectivism","Equality"]'::jsonb,
    0.5, 'population',
    0.2, 'population',
    '[
        {"stat_key":"union_strength",     "direction":"up",  "rate":0.1, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"income_inequality",  "direction":"down","rate":0.05,"delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'union_strength', 'UP', 0.1, 48, 0, 100, 0.2, true,
    'union_representation'
);

-- ── P23: Infrastructure Transport Regulations Act ──────────────────────────
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
    'permit_heavy_transport_' || to_hex(extract(epoch from now())::int),
    'Infrastructure Transport Regulations Act',
    'structural',
    'Regulates heavy equipment transport on national roads. Corporations need a Heavy Transport Corridor Access permit ($60K, 1 tick) to move Tier 2+ equipment to construction sites. Protects road infrastructure from overweight loads.',
    'PERMITS', 'Specialized', 'Specialized', 'Transportation',
    'Security', '["Security"]'::jsonb,
    1, 'population',
    0.3, 'population',
    '[
        {"stat_key":"physical_infrastructure","direction":"up","rate":0.05,"delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'physical_infrastructure', 'UP', 0.05, 48, 0, 100, 0.3, true,
    'heavy_transport'
);

-- ── P28: Construction Performance Bond Act ─────────────────────────────────
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
    'permit_performance_bond_' || to_hex(extract(epoch from now())::int),
    'Construction Performance Bond Act',
    'structural',
    'Requires construction corporations to post a performance bond (3% of project value) guaranteeing completion. Protects the government if a contractor goes bankrupt mid-project. Bond is held for the project duration.',
    'PERMITS', 'Financial', 'Financial', 'Finance',
    'Security', '["Security","Individualism"]'::jsonb,
    1, 'gdp',
    0, null,
    '[
        {"stat_key":"credit",              "direction":"up",  "rate":0.05,"delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"foreign_investment",  "direction":"up",  "rate":0.05,"delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'credit', 'UP', 0.05, 48, 0, 100, 0, true,
    'performance_bond'
);

-- ── P30: Corporate Tax Compliance Act ──────────────────────────────────────
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
    'permit_tax_compliance_' || to_hex(extract(epoch from now())::int),
    'Corporate Tax Compliance Act',
    'structural',
    'Requires corporations to obtain annual tax compliance clearance ($35K, 2 ticks) confirming all taxes are paid. Without it, corporations cannot bid on government contracts. The cheapest permit but must be renewed annually.',
    'PERMITS', 'Financial', 'Financial', 'Finance',
    'Security', '["Security","Collectivism"]'::jsonb,
    0.5, 'population',
    0.2, 'population',
    '[
        {"stat_key":"corruption",    "direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
        {"stat_key":"efficiency",    "direction":"up",  "rate":0.05,"delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    'corruption', 'DOWN', 0.1, 48, 0, 100, 0.2, true,
    'tax_compliance'
);

RAISE NOTICE 'Seeded 12 construction permit policies with permit_key links';

END $$;
