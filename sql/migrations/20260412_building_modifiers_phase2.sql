-- ════════════════════════════════════════════════════════════════════════════════
-- Building Modifiers — Phase 2: 17 new modifiers for 16 new permits
--
-- These modifiers describe site/project characteristics that require the
-- new permits from Phase 1. Auto-generated contracts roll 0-3 modifiers
-- based on nation stats; each modifier adds cost, rep, and permit requirements.
--
-- Modifier categories:
--   site          — Auto-rolled based on nation stat thresholds
--   nation        — Rolled based on nation-wide conditions
--   player_choice — Selectable by the corporation at bid time
-- ════════════════════════════════════════════════════════════════════════════════

BEGIN;

INSERT INTO building_modifiers
    (modifier_key, name, category, description, cost_multiplier, reputation_bonus, required_permits, probability_stat, probability_threshold, probability_base, applies_to, icon)
VALUES

    -- ═══════════════════════════════════════════════════
    -- SITE CHARACTERISTICS (auto-rolled from nation stats)
    -- ═══════════════════════════════════════════════════

    -- Noise & Vibration permit (#1)
    ('residential_adjacent', 'Residential-Adjacent Site', 'site',
     'Construction next to residential neighborhoods. Noise and vibration control required to prevent community disruption. Common in urbanized nations.',
     1.08, 1, '["noise_vibration"]'::jsonb,
     'urbanization', 55, 0.18,
     '["civil_engineering"]'::jsonb, '🏘️'),

    -- Hazmat permit (#2)
    ('industrial_chemical', 'Industrial Chemical Site', 'site',
     'Construction involving chemical processing, fuel storage, or industrial waste. Requires hazardous materials handling certification and environmental impact assessment.',
     1.18, 2, '["hazmat_handling","environmental_impact"]'::jsonb,
     'manufacturing_output', 50, 0.12,
     '["industrial","mega_project"]'::jsonb, '☣️'),

    -- Water Resource permit (#3)
    ('flood_plain', 'Flood Plain Construction', 'site',
     'Construction in a designated flood-risk zone. Requires water resource management, raised foundations, and flood barrier engineering.',
     1.12, 2, '["water_resource"]'::jsonb,
     'physical_infrastructure', 30, 0.10,
     '["civil_engineering","industrial"]'::jsonb, '🌊'),

    -- Coastal & Maritime permit (#4)
    ('offshore', 'Offshore Construction', 'site',
     'Marine platform, breakwater, or open-water structure. The most expensive site modifier — requires coastal engineering, marine-grade materials, and weather window scheduling.',
     1.35, 5, '["coastal_maritime","structural_engineering"]'::jsonb,
     NULL, 0, 0.04,
     '["industrial","mega_project"]'::jsonb, '🚢'),

    ('port_expansion', 'Port Expansion Zone', 'site',
     'Extension of existing port facilities — new berths, container yards, or loading infrastructure. Requires coastal permits and strong trade infrastructure.',
     1.15, 3, '["coastal_maritime"]'::jsonb,
     'trade_balance', 60, 0.10,
     '["industrial","mega_project"]'::jsonb, '⚓'),

    -- Renewable Energy permit (#5)
    ('solar_installation', 'Solar Array Installation', 'site',
     'Large-scale solar panel array requiring grid connection certification and environmental clearance for land use.',
     1.05, 2, '["renewable_energy"]'::jsonb,
     'renewable_energy_percentage', 40, 0.15,
     '["civil_engineering","industrial"]'::jsonb, '☀️'),

    ('wind_farm', 'Wind Farm Development', 'site',
     'Wind turbine installation requiring environmental impact assessment for bird migration, noise, and visual impact. Higher cost than solar but stronger reputation.',
     1.10, 3, '["renewable_energy","environmental_impact"]'::jsonb,
     'renewable_energy_percentage', 50, 0.10,
     '["industrial","mega_project"]'::jsonb, '💨'),

    -- Telecom Infrastructure permit (#6)
    ('fiber_optic', 'Fiber Optic Network', 'site',
     'Underground or aerial fiber optic cable installation. Requires telecom licensing and utility corridor access.',
     1.08, 1, '["telecom_infrastructure"]'::jsonb,
     'digital_infrastructure', 45, 0.15,
     '["civil_engineering","industrial"]'::jsonb, '🔌'),

    ('cell_tower', 'Cell Tower Installation', 'site',
     'Mobile communications tower construction. Requires spectrum compliance and electromagnetic safety assessment.',
     1.05, 1, '["telecom_infrastructure"]'::jsonb,
     'digital_infrastructure', 40, 0.12,
     '["civil_engineering"]'::jsonb, '📡'),

    ('data_center', 'Data Center Complex', 'site',
     'Large-scale data processing facility requiring massive power supply, cooling systems, and fire suppression. High-value but complex.',
     1.22, 3, '["telecom_infrastructure","fire_safety"]'::jsonb,
     'digital_infrastructure', 60, 0.08,
     '["industrial","mega_project"]'::jsonb, '🖥️'),

    -- Agricultural Land Conversion permit (#7)
    ('farmland_conversion', 'Farmland Conversion', 'site',
     'Development on designated agricultural land. Requires food security impact review. Each conversion permanently reduces the nation''s arable land — cheap to build on but costly to the food system.',
     0.95, -2, '["agri_land_conversion"]'::jsonb,
     'urbanization', 65, 0.12,
     '["civil_engineering","industrial"]'::jsonb, '🚜'),

    -- Seismic Resilience permit (#9)
    ('earthquake_prone', 'High Seismic Risk Zone', 'site',
     'Construction in an active fault zone with frequent seismic activity. Requires both seismic resilience and structural engineering certification. More demanding than standard seismic_zone modifier.',
     1.15, 3, '["seismic_resilience","structural_engineering"]'::jsonb,
     'stability', 25, 0.08,
     '["civil_engineering","industrial","mega_project"]'::jsonb, '🌋'),

    -- Disaster Preparedness permit (#10)
    ('evacuation_routes', 'Evacuation Route Infrastructure', 'site',
     'Construction of or near emergency evacuation corridors. Must integrate with national disaster response network.',
     1.10, 2, '["disaster_preparedness"]'::jsonb,
     NULL, 0, 0.06,
     '["civil_engineering","mega_project"]'::jsonb, '🚨'),

    ('emergency_shelter', 'Emergency Shelter Designation', 'site',
     'Building designated as emergency shelter during crises. Requires reinforced structure, backup power, water storage, and medical facilities.',
     1.08, 2, '["disaster_preparedness"]'::jsonb,
     'stability', 35, 0.08,
     '["civil_engineering"]'::jsonb, '🏥'),

    -- ═══════════════════════════════════════════════════
    -- NATION-SPECIFIC (auto-rolled from nation conditions)
    -- ═══════════════════════════════════════════════════

    -- Foreign Investment Clearance permit (#11)
    ('foreign_funded', 'Foreign-Funded Project', 'nation',
     'Project financed partially or fully by foreign capital. Requires security clearance review to screen for foreign influence and strategic asset concerns.',
     1.05, 1, '["foreign_investment_clearance"]'::jsonb,
     'foreign_investment', 60, 0.15,
     '["industrial","mega_project"]'::jsonb, '🌐'),

    -- Anti-Corruption permit (#12)
    ('government_contract', 'Government-Commissioned Project', 'nation',
     'Project commissioned and funded by the national government using public funds. Requires anti-corruption compliance and tax clearance to prevent misuse of public money.',
     1.10, 3, '["anti_corruption","tax_compliance"]'::jsonb,
     NULL, 0, 0.20,
     '["civil_engineering","industrial","mega_project"]'::jsonb, '🏛️'),

    -- Community Consultation permit (#15)
    ('residential_displacement', 'Residential Displacement Zone', 'site',
     'Project requires relocation of existing residents. The most politically sensitive modifier — requires community consultation and dramatically increases cost. Reputation penalty reflects public resentment.',
     1.20, -3, '["community_consultation"]'::jsonb,
     'urbanization', 70, 0.08,
     '["civil_engineering","mega_project"]'::jsonb, '🏚️')

    -- Note: green_building is a player_choice added below

ON CONFLICT (modifier_key) DO NOTHING;

-- Player choice modifier for Renewable Energy permit
INSERT INTO building_modifiers
    (modifier_key, name, category, description, cost_multiplier, reputation_bonus, required_permits, probability_stat, probability_threshold, probability_base, applies_to, icon)
VALUES
    ('green_building', 'Green Building Certification', 'player_choice',
     'Voluntary sustainable construction standard — solar panels, rainwater harvesting, energy-efficient HVAC, recycled materials. Costs more but earns significant reputation and contributes to national renewable energy targets.',
     1.12, 4, '["renewable_energy"]'::jsonb,
     NULL, 0, 0,
     '["civil_engineering","industrial"]'::jsonb, '🌿')
ON CONFLICT (modifier_key) DO NOTHING;

COMMIT;
