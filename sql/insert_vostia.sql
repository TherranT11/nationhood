-- ============================================================
-- Insert the nation of Vostia (Serbian/Montenegrin inspired)
-- Parliamentary Democracy · Meridian continent
-- ============================================================

-- Step 1: Insert nation row
INSERT INTO nations (
    name, government_type, total_seats, max_parties, capital, continent,
    shard_id,
    -- Demographics
    population, eligible_voters, median_age, ethnic_diversity, population_growth,
    -- Head of State (none until first election)
    head_of_state_title, head_of_state_first_name, head_of_state_last_name, head_of_state_age,
    hos_election_method,
    -- Economic
    gdp, debt, gdp_growth, debt_growth, inflation, interest_rates,
    trade_balance, currency_strength, foreign_investment, credit,
    income_tax, corporate_tax, sales_tax, tariffs,
    -- Labor
    unemployment, labor_force_participation, minimum_wage, union_strength,
    poverty_rate, income_inequality,
    -- Healthcare
    healthcare_quality, healthcare_accessibility, beds_per_100k, lifespan, drug_use,
    -- Education
    literacy, higher_education, education_accessibility, academic_immigration,
    -- Infrastructure
    physical_infrastructure, digital_infrastructure, rail_network, urbanization,
    -- Energy
    energy_generation, renewable_energy_percentage, arable_land, rare_minerals, oil_and_gas, fuel_prices,
    -- Environment
    pollution, carbon_emissions,
    -- Quality of Life
    standard_of_living, happiness, social_mobility, cost_of_living,
    housing_affordability, manufacturing_output, service_output,
    -- Crime / Security
    crime_rate, incarceration_rate, religiosity,
    -- Governance
    stability, legitimacy, efficiency, corruption,
    press_freedom, judicial_independence, freedom_index,
    polarization, civil_unrest, terrorism, political_violence,
    -- International
    immigration, illegal_immigration, emigration, international_reputation,
    -- Approval
    gov_approval, gov_approval_events
)
SELECT
    'Vostia', 'Parliamentary', 260, 8, 'Ostavar', 'Meridian',
    s.id,
    22500000, 17100000, 66, 38, 14,
    NULL, NULL, NULL, NULL, 'direct_vote',
    622000000000, 981000000000, 50, 50, 28, 44,
    38, 58, 52, 56,
    19, 16, 8, 50,
    54, 58, 42, 52,
    32, 54,
    62, 64, 66, 76, 32,
    96, 58, 64, 32,
    58, 52, 54, 58,
    62, 28, 62, 44, 18, 44,
    54, 52,
    58, 52, 44, 48,
    54, 58, 56,
    48, 44, 72,
    52, 56, 44, 62,
    52, 48, 56,
    66, 44, 18, 28,
    28, 34, 52, 50,
    50, 0
FROM shard s WHERE s.name = 'Alpha Shard'
AND NOT EXISTS (SELECT 1 FROM nations WHERE LOWER(name) = 'vostia');

-- Step 2: Save seed_stats snapshot
UPDATE nations SET seed_stats = to_jsonb(nations) - 'id' - 'shard_id' - 'seed_stats' - 'created_at' - 'updated_at'
WHERE LOWER(name) = 'vostia';

-- Step 3: Nation profile
INSERT INTO nation_profiles (
    nation_id, flag_url, overview, motto, demonym,
    official_name, languages, religion, currency_name,
    founded_year, geographic_region, climate,
    area_sq_km, natural_resources, major_industries, major_exports, major_imports
)
SELECT n.id,
    'assets/flags/Vostia.png',
    'Vostia is a mountainous parliamentary democracy in Meridian, shaped by centuries of empire, resistance, and reconstruction. Its people are fiercely independent, deeply religious, and politically passionate. The economy runs on heavy industry, mineral extraction, and a growing services sector, though corruption and emigration remain persistent challenges. Vostians take pride in their literary tradition, Orthodox heritage, and an unbroken line of folk music that predates written records.',
    'Sloboda i Čast (Freedom and Honor)',
    'Vostian',
    'Republic of Vostia',
    'Vostian (official), Montenegrin (regional)',
    'Orthodox Christian (majority), Catholic, Muslim minorities',
    'Vostian Dinar (VSD)',
    '1878',
    'Mountainous interior with fertile river valleys and a narrow Adriatic-style coastline. The Ostavar Basin is the economic heartland.',
    'Continental with Mediterranean coastal influence',
    '88,500',
    'Copper, zinc, lead, lignite, timber, hydroelectric potential',
    'Heavy industry, mining, agriculture, arms manufacturing, textiles',
    'Machinery, processed metals, agricultural products, arms',
    'Oil, electronics, vehicles, pharmaceuticals'
FROM nations n WHERE LOWER(n.name) = 'vostia'
ON CONFLICT (nation_id) DO NOTHING;

-- Step 4: Diplomatic relations with all existing nations
INSERT INTO diplomatic_relations (nation_a_id, nation_b_id, relation_score, proximity)
SELECT
    LEAST(vo.id, n.id),
    GREATEST(vo.id, n.id),
    30,
    CASE LOWER(n.name)
        WHEN 'calveth'      THEN 19
        WHEN 'flandis'      THEN 17
        WHEN 'melizea'      THEN 73
        WHEN 'avelia'       THEN 69
        WHEN 'sangreza'     THEN 70
        WHEN 'palvera'      THEN 76
        WHEN 'montequilla'  THEN 72
        WHEN 'san estrella' THEN 68
        ELSE 75
    END
FROM nations vo
CROSS JOIN nations n
WHERE LOWER(vo.name) = 'vostia'
  AND n.id != vo.id
ON CONFLICT (nation_a_id, nation_b_id) DO NOTHING;

-- Step 5: Schedule elections within 3 ticks
INSERT INTO elections (nation_id, election_tick, election_type, status)
SELECT n.id,
    (SELECT current_tick + 3 FROM shard WHERE name = 'Alpha Shard'),
    'parliamentary',
    'scheduled'
FROM nations n WHERE LOWER(n.name) = 'vostia';

-- Step 6: Create 8 ministry slots (vacant — filled after first election)
INSERT INTO ministries (nation_id, ministry_key, ministry_name, is_active, party_id)
SELECT n.id, m.key, m.name, true, NULL
FROM nations n,
(VALUES
    ('prime_minister', 'Prime Minister'),
    ('interior', 'Ministry of the Interior'),
    ('foreign', 'Foreign Ministry'),
    ('defense', 'Ministry of Defense'),
    ('finance', 'Ministry of Finance'),
    ('education', 'Ministry of Education'),
    ('healthcare', 'Ministry of Healthcare'),
    ('trade', 'Ministry of Trade')
) AS m(key, name)
WHERE LOWER(n.name) = 'vostia'
ON CONFLICT DO NOTHING;

-- Verify
SELECT name, government_type, total_seats, capital, gdp, population, stability, corruption
FROM nations WHERE LOWER(name) = 'vostia';
