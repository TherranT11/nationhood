-- ============================================================
-- Insert the Republic of Flandis — Meridian continent
-- ============================================================
-- Parliamentary Republic · Population 15,900,000
-- GDP $415B · Elected Head of State (President)
-- Dutch-inspired culture · Capital: Brelvaan
-- Established: 1399 · Motto: "Strength Through the People"
-- ============================================================

-- Step 1: Insert Flandis if it doesn't exist (with Alpha Shard FK)
INSERT INTO nations (name, government_type, total_seats, max_parties, capital, shard_id, continent)
SELECT 'Flandis', 'Parliamentary', 182, 8, 'Brelvaan', s.id, 'Meridian'
FROM shard s
WHERE s.name = 'Alpha Shard'
AND NOT EXISTS (SELECT 1 FROM nations WHERE LOWER(name) = 'flandis');

-- Step 2: Set all stats
UPDATE nations SET
    government_type = 'Parliamentary',
    total_seats = 182,
    max_parties = 8,
    capital = 'Brelvaan',
    continent = 'Meridian',

    -- Head of State (Elected President)
    hos_election_method = 'direct_vote',
    head_of_state_title = 'President',
    head_of_state_first_name = 'Harmen',
    head_of_state_last_name = 'Van der Laan',
    head_of_state_age = 58,

    -- GDP & Debt (dollar-scale)
    gdp = 415000000000,
    debt = 212000000000,

    -- Fiscal & Monetary (0-100 scale)
    gdp_growth = 50,
    debt_growth = 28,
    inflation = 22,
    interest_rates = 38,
    trade_balance = 74,
    currency_strength = 74,
    foreign_investment = 78,
    credit = 82,

    -- Taxation
    income_tax = 71,
    corporate_tax = 54,
    sales_tax = 66,
    tariffs = 18,

    -- Labor & Inequality
    unemployment = 32,
    labor_force_participation = 74,
    minimum_wage = 64,
    union_strength = 58,
    poverty_rate = 14,
    income_inequality = 31,

    -- Demographics
    population = 15900000,
    population_growth = 24,
    median_age = 66,
    eligible_voters = 13674000,
    ethnic_diversity = 56,

    -- Healthcare
    healthcare_quality = 84,
    healthcare_accessibility = 88,
    beds_per_100k = 72,
    lifespan = 83,
    drug_use = 62,

    -- Education
    literacy = 98,
    higher_education = 74,
    education_accessibility = 82,
    academic_immigration = 71,

    -- Infrastructure
    physical_infrastructure = 92,
    digital_infrastructure = 84,
    rail_network = 82,
    urbanization = 88,

    -- Energy & Resources
    energy_generation = 64,
    renewable_energy_percentage = 18,
    arable_land = 52,
    rare_minerals = 12,
    oil_and_gas = 34,
    fuel_prices = 72,

    -- Environment
    pollution = 54,
    carbon_emissions = 58,

    -- Quality of Life
    standard_of_living = 82,
    happiness = 74,
    social_mobility = 68,
    benefits = 50,

    -- Security
    crime_rate = 34,
    incarceration_rate = 28,
    religiosity = 24,
    cost_of_living = 76,
    manufacturing_output = 62,
    service_output = 86,
    housing_affordability = 16,

    -- Governance
    stability = 84,
    legitimacy = 78,
    efficiency = 82,
    corruption = 14,
    press_freedom = 88,
    judicial_independence = 84,
    freedom_index = 88,
    polarization = 32,
    civil_unrest = 22,
    terrorism = 12,
    political_violence = 8,

    -- International
    immigration = 66,
    illegal_immigration = 38,
    emigration = 24,
    international_reputation = 72,

    -- Approval defaults
    national_approval = 50,
    gov_approval = 50,
    gov_approval_institutional = 50,
    gov_approval_outcomes = 50,
    gov_approval_events = 0

WHERE LOWER(name) = 'flandis';

-- Step 3: Save seed_stats snapshot for shard reset
UPDATE nations
SET seed_stats = jsonb_build_object(
    'government_type', 'Parliamentary',
    'total_seats', 182,
    'max_parties', 8,
    'capital', 'Brelvaan',
    'gdp', 415000000000,
    'debt', 212000000000,
    'gdp_growth', 50,
    'debt_growth', 28,
    'inflation', 22,
    'interest_rates', 38,
    'trade_balance', 74,
    'currency_strength', 74,
    'foreign_investment', 78,
    'credit', 82,
    'income_tax', 71,
    'corporate_tax', 54,
    'sales_tax', 66,
    'tariffs', 18,
    'unemployment', 32,
    'labor_force_participation', 74,
    'minimum_wage', 64,
    'union_strength', 58,
    'poverty_rate', 14,
    'income_inequality', 31,
    'population', 15900000,
    'population_growth', 24,
    'median_age', 66,
    'eligible_voters', 13674000,
    'ethnic_diversity', 56,
    'healthcare_quality', 84,
    'healthcare_accessibility', 88,
    'beds_per_100k', 72,
    'lifespan', 83,
    'drug_use', 62,
    'literacy', 98,
    'higher_education', 74,
    'education_accessibility', 82,
    'academic_immigration', 71,
    'physical_infrastructure', 92,
    'digital_infrastructure', 84,
    'rail_network', 82,
    'urbanization', 88,
    'energy_generation', 64,
    'renewable_energy_percentage', 18
) || jsonb_build_object(
    'arable_land', 52,
    'rare_minerals', 12,
    'oil_and_gas', 34,
    'fuel_prices', 72,
    'pollution', 54,
    'carbon_emissions', 58,
    'standard_of_living', 82,
    'happiness', 74,
    'social_mobility', 68,
    'benefits', 50,
    'crime_rate', 34,
    'incarceration_rate', 28,
    'religiosity', 24,
    'cost_of_living', 76,
    'manufacturing_output', 62,
    'service_output', 86,
    'housing_affordability', 16,
    'stability', 84,
    'legitimacy', 78,
    'efficiency', 82,
    'corruption', 14,
    'press_freedom', 88,
    'judicial_independence', 84,
    'freedom_index', 88,
    'polarization', 32,
    'civil_unrest', 22,
    'terrorism', 12,
    'political_violence', 8,
    'immigration', 66,
    'illegal_immigration', 38,
    'emigration', 24,
    'international_reputation', 72,
    'hos_election_method', 'direct_vote',
    'head_of_state_title', 'President'
)
WHERE LOWER(name) = 'flandis';

-- Step 4: Insert nation profile (lore, flag, sidebar metadata)
INSERT INTO nation_profiles (
    nation_id,
    flag_url,
    overview,
    motto,
    history_timeline,
    official_name,
    demonym,
    languages,
    religion,
    currency_name,
    founded_year,
    national_anthem,
    national_animal,
    national_flower,
    geographic_region,
    climate,
    area_sq_km,
    coastline_km,
    natural_resources,
    major_industries,
    major_exports,
    major_imports,
    calling_code,
    internet_tld,
    drives_on
)
SELECT
    n.id,
    'assets/flags/Flandis.png',
    'The Republic of Flandis is a prosperous parliamentary republic on the Meridian continent, renowned for its advanced infrastructure, liberal democratic traditions, and thriving trade economy. Its capital, Brelvaan, is a hub of commerce, engineering, and civic culture. Founded in 1399, Flandis has a long history of merchant republicanism and pragmatic governance. The Flandish people are known for their industrious spirit, direct manner, and deep commitment to civil liberties. The nation boasts world-class healthcare and education systems, though rising housing costs and an aging population pose growing challenges. Flandis maintains a strong trade surplus and attracts significant foreign investment, making it one of Meridian''s most economically dynamic states.',
    'Strength Through the People',
    '[
        {"year": "1399", "event": "The Free City of Brelvaan declares independence, founding the Flandish Republic."},
        {"year": "1482", "event": "The Merchant Charter establishes parliamentary governance and codifies trade law."},
        {"year": "1561", "event": "The Golden Age begins; Flandish traders dominate continental maritime routes."},
        {"year": "1648", "event": "The Great Reform Act expands suffrage to all property-holding citizens."},
        {"year": "1723", "event": "Industrial revolution transforms Flandis into a manufacturing and engineering powerhouse."},
        {"year": "1801", "event": "Universal male suffrage enacted following the Brelvaan Workers'' Movement."},
        {"year": "1889", "event": "Women gain full voting rights; Flandis becomes one of the first Meridian nations to do so."},
        {"year": "1934", "event": "The Continental Crisis tests Flandish neutrality; economic hardship follows."},
        {"year": "1952", "event": "Post-war reconstruction; modern welfare state and national healthcare system established."},
        {"year": "1978", "event": "Digital infrastructure boom; Brelvaan becomes a technology and financial center."},
        {"year": "2025", "event": "Current political era begins; parliamentary elections reshape the national landscape."}
    ]'::jsonb,
    'Republic of Flandis',
    'Flandish',
    'Flandish (official), Meridian Common',
    'Reformed Church (plurality), Secular, Catholic minority',
    'Flandish Guilder (ƒ)',
    '1399',
    'The People''s March',
    'Golden Eagle',
    'Orange Tulip',
    'Lowland plains and coastal deltas of the Meridian continent — river estuaries, polders, rolling farmland',
    'Maritime temperate; mild summers, cool winters, frequent rainfall and coastal fog',
    '142,800',
    '3,420',
    'Natural gas, arable land, peat, clay, sand, wind energy potential',
    'Advanced manufacturing, financial services, agricultural exports, logistics, engineering',
    'Machinery, refined petroleum products, agricultural goods, chemicals, electronics',
    'Crude oil, vehicles, electronics, raw materials, textiles',
    '+37',
    '.fl',
    'right'
FROM nations n
WHERE LOWER(n.name) = 'flandis'
ON CONFLICT (nation_id) DO NOTHING;

-- Step 5: Insert diplomatic relations with all existing nations
-- Default relation_score is 35 (neutral) but with specific overrides
INSERT INTO diplomatic_relations (nation_a_id, nation_b_id, relation_score)
SELECT
    LEAST(flandis.id, n.id),
    GREATEST(flandis.id, n.id),
    CASE
        WHEN n.continent = 'Crucera' THEN 20   -- Cruceran nations start at 20
        WHEN LOWER(n.name) = 'calveth' THEN 30 -- Calveth starts at 30
        ELSE 35                                  -- Default neutral
    END
FROM nations flandis
CROSS JOIN nations n
WHERE LOWER(flandis.name) = 'flandis'
  AND n.id != flandis.id
ON CONFLICT (nation_a_id, nation_b_id) DO NOTHING;

-- Step 6: Set up election scheduling
-- Parliamentary elections: first election at tick 180, every 24 ticks
-- (This would typically be done via the Admin Panel, but included here for reference)
-- INSERT INTO election_schedule (nation_id, election_type, first_tick, frequency_ticks)
-- SELECT n.id, 'parliamentary', 180, 24
-- FROM nations n WHERE LOWER(n.name) = 'flandis';

-- Step 7: Insert 8 one-time alpha tester codes for Flandis
INSERT INTO alpha_tester_codes (code, nation_id)
SELECT code, n.id
FROM nations n,
     unnest(ARRAY[
         'GOLDEN-EAGLE-7K2X',
         'BRELVAAN-PORT-4P8N',
         'FLANDISH-GUILD-9W3D',
         'ORANGE-TULIP-2L6R',
         'MERIDIAN-TRADE-5M1Y',
         'PEOPLES-MARCH-8J4V',
         'GUILDER-MINT-3Q7F',
         'FREE-CITY-6T9B'
     ]) AS code
WHERE LOWER(n.name) = 'flandis'
ON CONFLICT (code) DO NOTHING;

-- Step 8: Verify
SELECT name, government_type, total_seats, max_parties, gdp, debt, population,
       stability, legitimacy, press_freedom, freedom_index, corruption,
       hos_election_method, head_of_state_title,
       head_of_state_first_name, head_of_state_last_name, head_of_state_age,
       continent, capital
FROM nations
WHERE LOWER(name) = 'flandis';
