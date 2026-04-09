-- ============================================================
-- Insert the nation of Sierramar (Puerto Rican/Caribbean Spanish inspired)
-- Parliamentary Democracy · Crucera continent
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
    'Sierramar', 'Parliamentary', 100, 8, 'Porto Serrano', 'Crucera',
    s.id,
    3800000, 2698000, 32, 62, 48,
    'President', NULL, NULL, NULL, 'parliamentary_appointment',
    17000000000, 14000000000, 44, 26, 44, 52,
    28, 38, 42, 38,
    32, 36, 38, 36,
    58, 52, 28, 38,
    54, 68,
    42, 38, 32, 64, 44,
    72, 28, 44, 12,
    34, 22, 8, 58,
    28, 18, 42, 14, 8, 38,
    34, 22,
    38, 58, 28, 36,
    44, 22, 62,
    62, 48, 72,
    52, 58, 34, 62,
    54, 44, 58,
    48, 38, 8, 18,
    38, 52, 58, 26,
    50, 0
FROM shard s WHERE s.name = 'Alpha Shard'
AND NOT EXISTS (SELECT 1 FROM nations WHERE LOWER(name) = 'sierramar');

-- Step 2: Save seed_stats snapshot
UPDATE nations SET seed_stats = to_jsonb(nations) - 'id' - 'shard_id' - 'seed_stats' - 'created_at' - 'updated_at'
WHERE LOWER(name) = 'sierramar';

-- Step 3: Nation profile
INSERT INTO nation_profiles (
    nation_id, flag_url, overview, motto, demonym,
    official_name, languages, religion, currency_name,
    founded_year, geographic_region, climate,
    area_sq_km, natural_resources, major_industries, major_exports, major_imports
)
SELECT n.id,
    'assets/flags/Sierramar.png',
    'Sierramar is a small but spirited Caribbean island democracy on the Crucera continent, shaped by colonial legacy, cultural resilience, and the restless ambition of its people. With a service-driven economy, deep religious traditions, and a young population hungry for opportunity, Sierramar punches above its weight in regional politics. Emigration drains talent while corruption and inequality test the patience of its citizens. The capital Porto Serrano hums with music, debate, and the constant tension between tradition and progress.',
    'Isla de Fuerza, Pueblo de Fe (Island of Strength, People of Faith)',
    'Sierramareño',
    'Commonwealth of Sierramar',
    'Sierramareño Spanish, Cruceran Creole',
    'Roman Catholic (majority), Evangelical Protestant, Afro-Caribbean spiritual traditions',
    'Sierramareño Peso (SMP)',
    '1952',
    'Tropical island with mountainous interior, coastal plains, and a natural harbor at Porto Serrano. The Sierra del Mar mountain range bisects the island.',
    'Tropical maritime with mild seasonal variation',
    '9,100',
    'Limited — some offshore fisheries, modest arable land, potential for solar and wind energy',
    'Tourism, financial services, pharmaceuticals, light manufacturing, rum production',
    'Pharmaceuticals, rum, coffee, tobacco, light electronics',
    'Oil, vehicles, machinery, food products, construction materials'
FROM nations n WHERE LOWER(n.name) = 'sierramar'
ON CONFLICT (nation_id) DO NOTHING;

-- Step 4: Diplomatic relations with all existing nations
INSERT INTO diplomatic_relations (nation_a_id, nation_b_id, relation_score, proximity)
SELECT
    LEAST(sm.id, n.id),
    GREATEST(sm.id, n.id),
    30,
    CASE LOWER(n.name)
        WHEN 'avelia'       THEN 32
        WHEN 'melizea'      THEN 28
        WHEN 'sangreza'     THEN 22
        WHEN 'montequilla'  THEN 24
        WHEN 'san estrella' THEN 18
        WHEN 'palvera'      THEN 26
        WHEN 'calveth'      THEN 72
        WHEN 'flandis'      THEN 68
        WHEN 'vostia'       THEN 78
        ELSE 75
    END
FROM nations sm
CROSS JOIN nations n
WHERE LOWER(sm.name) = 'sierramar'
  AND n.id != sm.id
ON CONFLICT (nation_a_id, nation_b_id) DO NOTHING;

-- Step 5: Schedule elections within 3 ticks
INSERT INTO elections (nation_id, election_tick, election_type, status)
SELECT n.id,
    (SELECT current_tick + 3 FROM shard WHERE name = 'Alpha Shard'),
    'parliamentary',
    'scheduled'
FROM nations n WHERE LOWER(n.name) = 'sierramar';

-- Step 6: Create 12 ministry slots (vacant — filled after first election)
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
    ('labor', 'Ministry of Labor'),
    ('justice', 'Ministry of Justice'),
    ('trade', 'Ministry of Trade'),
    ('energy', 'Ministry of Energy'),
    ('transportation', 'Ministry of Transportation')
) AS m(key, name)
WHERE LOWER(n.name) = 'sierramar'
ON CONFLICT DO NOTHING;

-- Verify
SELECT name, government_type, total_seats, capital, gdp, population, stability, corruption
FROM nations WHERE LOWER(name) = 'sierramar';
