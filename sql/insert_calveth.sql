-- ============================================================
-- Insert the Kingdom of Calveth — first nation of the Meridian continent
-- ============================================================
-- Constitutional Monarchy (Parliamentary Democracy) · Population 13,000,000
-- GDP $717B · Hereditary Head of State
-- Dynasty: House of Ashgrove · King Edmund Ashgrove, Age 62
-- Heir Apparent: Prince Alaric Ashgrove, Age 34
-- ============================================================

-- Step 1: Insert Calveth if it doesn't exist (with Alpha Shard FK)
INSERT INTO nations (name, government_type, total_seats, max_parties, capital, shard_id, continent)
SELECT 'Calveth', 'Parliamentary', 155, 8, 'Coronhaven', s.id, 'Meridian'
FROM shard s
WHERE s.name = 'Alpha Shard'
AND NOT EXISTS (SELECT 1 FROM nations WHERE LOWER(name) = 'calveth');

-- Step 2: Set all stats
UPDATE nations SET
    government_type = 'Parliamentary',
    total_seats = 155,
    max_parties = 8,
    capital = 'Coronhaven',
    continent = 'Meridian',

    -- Monarchy / Head of State
    hos_election_method = 'hereditary',
    head_of_state_title = 'King',
    head_of_state_first_name = 'Edmund',
    head_of_state_last_name = 'Ashgrove',
    head_of_state_age = 62,
    dynasty_name = 'House of Ashgrove',
    dynasty_established_tick = 0,

    -- GDP & Debt (dollar-scale)
    gdp = 717000000000,
    debt = 143000000000,

    -- Fiscal & Monetary (0-100 scale)
    gdp_growth = 44,
    debt_growth = 22,
    inflation = 14,
    interest_rates = 42,
    trade_balance = 44,
    currency_strength = 78,
    foreign_investment = 72,
    credit = 81,

    -- Taxation
    income_tax = 66,
    corporate_tax = 52,
    sales_tax = 58,
    tariffs = 18,

    -- Labor & Inequality
    unemployment = 38,
    labor_force_participation = 71,
    minimum_wage = 77,
    union_strength = 54,
    poverty_rate = 18,
    income_inequality = 23,

    -- Demographics
    population = 13000000,
    population_growth = 28,
    median_age = 67,
    eligible_voters = 10920000,
    ethnic_diversity = 9,

    -- Healthcare
    healthcare_quality = 82,
    healthcare_accessibility = 86,
    beds_per_100k = 72,
    lifespan = 81,
    drug_use = 48,

    -- Education
    literacy = 93,
    higher_education = 74,
    education_accessibility = 78,
    academic_immigration = 72,

    -- Infrastructure
    physical_infrastructure = 78,
    digital_infrastructure = 76,
    rail_network = 66,
    urbanization = 72,

    -- Energy & Resources
    energy_generation = 68,
    renewable_energy_percentage = 34,
    arable_land = 19,
    rare_minerals = 28,
    oil_and_gas = 4,
    fuel_prices = 76,

    -- Environment
    pollution = 32,
    carbon_emissions = 36,

    -- Quality of Life
    standard_of_living = 81,
    happiness = 69,
    social_mobility = 62,
    benefits = 72,

    -- Security
    crime_rate = 36,
    incarceration_rate = 17,
    religiosity = 26,
    cost_of_living = 74,
    manufacturing_output = 52,
    service_output = 84,
    housing_affordability = 34,

    -- Governance
    stability = 96,
    legitimacy = 78,
    efficiency = 72,
    corruption = 6,
    press_freedom = 82,
    judicial_independence = 81,
    freedom_index = 84,
    polarization = 11,
    civil_unrest = 28,
    terrorism = 9,
    political_violence = 4,

    -- International
    immigration = 14,
    illegal_immigration = 6,
    emigration = 38,
    international_reputation = 74,

    -- Approval defaults
    national_approval = 50,
    gov_approval = 50,
    gov_approval_institutional = 50,
    gov_approval_outcomes = 50,
    gov_approval_events = 0

WHERE LOWER(name) = 'calveth';

-- Step 3: Save seed_stats snapshot for shard reset
UPDATE nations
SET seed_stats = jsonb_build_object(
    'government_type', 'Parliamentary',
    'total_seats', 155,
    'max_parties', 8,
    'capital', 'Coronhaven',
    'gdp', 717000000000,
    'debt', 143000000000,
    'gdp_growth', 44,
    'debt_growth', 22,
    'inflation', 14,
    'interest_rates', 42,
    'trade_balance', 44,
    'currency_strength', 78,
    'foreign_investment', 72,
    'credit', 81,
    'income_tax', 66,
    'corporate_tax', 52,
    'sales_tax', 58,
    'tariffs', 18,
    'unemployment', 38,
    'labor_force_participation', 71,
    'minimum_wage', 77,
    'union_strength', 54,
    'poverty_rate', 18,
    'income_inequality', 23,
    'population', 13000000,
    'population_growth', 28,
    'median_age', 67,
    'eligible_voters', 10920000,
    'ethnic_diversity', 9,
    'healthcare_quality', 82,
    'healthcare_accessibility', 86,
    'beds_per_100k', 72,
    'lifespan', 81,
    'drug_use', 48,
    'literacy', 93,
    'higher_education', 74,
    'education_accessibility', 78,
    'academic_immigration', 72,
    'physical_infrastructure', 78,
    'digital_infrastructure', 76,
    'rail_network', 66,
    'urbanization', 72,
    'energy_generation', 68,
    'renewable_energy_percentage', 34
) || jsonb_build_object(
    'arable_land', 19,
    'rare_minerals', 28,
    'oil_and_gas', 4,
    'fuel_prices', 76,
    'pollution', 32,
    'carbon_emissions', 36,
    'standard_of_living', 81,
    'happiness', 69,
    'social_mobility', 62,
    'benefits', 72,
    'crime_rate', 36,
    'incarceration_rate', 17,
    'religiosity', 26,
    'cost_of_living', 74,
    'manufacturing_output', 52,
    'service_output', 84,
    'housing_affordability', 34,
    'stability', 96,
    'legitimacy', 78,
    'efficiency', 72,
    'corruption', 6,
    'press_freedom', 82,
    'judicial_independence', 81,
    'freedom_index', 84,
    'polarization', 11,
    'civil_unrest', 28,
    'terrorism', 9,
    'political_violence', 4,
    'immigration', 14,
    'illegal_immigration', 6,
    'emigration', 38,
    'international_reputation', 74,
    'hos_election_method', 'hereditary',
    'head_of_state_title', 'King',
    'dynasty_name', 'House of Ashgrove'
)
WHERE LOWER(name) = 'calveth';

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
    'assets/flags/Calveth.png',
    'The Kingdom of Calveth is one of the oldest continuously governed states in the known world. A constitutional monarchy nestled in the temperate heartlands of the Meridian continent, Calveth blends centuries of royal tradition with modern parliamentary democracy. Its capital, Coronhaven, is famed for its grand legislative halls, ancient university quarter, and the Royal Palace of Ashgrove, seat of the ruling dynasty for over three centuries. The kingdom''s economy is driven by financial services, advanced manufacturing, and a world-class education system, though rising costs of living and an aging population present growing challenges. Calvethians are known for their civic pride, institutional trust, and quiet resolve.',
    'Steadfast and Just',
    '[
        {"year": "1187", "event": "The First Charter of Coronhaven establishes the Calvethian realm under King Aldric I."},
        {"year": "1402", "event": "The Great Concordat limits royal power; Parliament of Estates convened for the first time."},
        {"year": "1588", "event": "House of Ashgrove ascends to the throne after the War of the Silver Crown."},
        {"year": "1723", "event": "The Reform Act establishes universal male suffrage and the modern parliamentary system."},
        {"year": "1811", "event": "Industrial revolution transforms Calveth into a manufacturing and financial power."},
        {"year": "1896", "event": "Women gain voting rights following the Coronhaven Suffrage Movement."},
        {"year": "1942", "event": "The Continental Crisis: Calveth weathers a devastating cross-border conflict; neutrality strained."},
        {"year": "1967", "event": "Post-war economic miracle; welfare state and national health service established."},
        {"year": "1994", "event": "Financial services deregulation sparks rapid growth in the Coronhaven banking sector."},
        {"year": "2018", "event": "King Edmund Ashgrove ascends to the throne following the death of Queen Marguerite."},
        {"year": "2025", "event": "Current political era begins; parliamentary elections reshape the legislative landscape."}
    ]'::jsonb,
    'Kingdom of Calveth',
    'Calvethian',
    'Calvethian (official), Meridian Common',
    'Church of the Covenant (plurality), Secular, Old Faith minorities',
    'Calvethian Crown (C£)',
    '1187',
    'The Steadfast March',
    'Grey Stag',
    'Silver Thistle',
    'Temperate heartlands of the Meridian continent — rolling hills, river valleys, ancient forests',
    'Maritime temperate; mild summers, cool winters, frequent rainfall',
    '187,400',
    '2,150',
    'Iron ore, timber, rare earth minerals, freshwater reserves, limestone',
    'Financial services, precision engineering, pharmaceuticals, higher education, shipbuilding',
    'Financial instruments, precision machinery, pharmaceuticals, refined metals, educational services',
    'Petroleum products, raw materials, electronics, agricultural goods, vehicles',
    '+31',
    '.cv',
    'left'
FROM nations n
WHERE LOWER(n.name) = 'calveth'
ON CONFLICT (nation_id) DO NOTHING;

-- Step 5: Insert 8 one-time alpha tester codes for Calveth
INSERT INTO alpha_tester_codes (code, nation_id)
SELECT code, n.id
FROM nations n,
     unnest(ARRAY[
         'CROWN-ASHGROVE-7K2X',
         'MERIDIAN-REALM-4P8N',
         'SILVER-THISTLE-9W3D',
         'COVENANT-GUARD-2L6R',
         'CORONHAVEN-SEAT-5M1Y',
         'GREY-STAG-ROYAL-8J4V',
         'STEADFAST-MARCH-3Q7F',
         'CHARTER-FIRST-6T9B'
     ]) AS code
WHERE LOWER(n.name) = 'calveth'
ON CONFLICT (code) DO NOTHING;

-- Step 6: Verify
SELECT name, government_type, total_seats, max_parties, gdp, debt, population,
       stability, legitimacy, press_freedom, freedom_index, corruption,
       hos_election_method, dynasty_name, head_of_state_title,
       head_of_state_first_name, head_of_state_last_name, head_of_state_age,
       continent
FROM nations
WHERE LOWER(name) = 'calveth';
