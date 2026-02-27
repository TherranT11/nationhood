-- ============================================================
-- Insert Palvera — the final nation of the Alpha Shard
-- ============================================================
-- Presidential Republic · Population 6,650,000
-- GDP $106B · Debt $48B
--
-- If Veldaria already exists in the DB, rename it to Palvera
-- and overwrite all stats. Otherwise insert fresh.
-- ============================================================

-- Step 1: Rename Veldaria → Palvera if it exists
UPDATE nations SET name = 'Palvera' WHERE LOWER(name) = 'veldaria';

-- Step 2: Check if Palvera now exists; if not, insert it
INSERT INTO nations (name, government_type, total_seats, max_parties)
SELECT 'Palvera', 'Presidential', 120, 8
WHERE NOT EXISTS (SELECT 1 FROM nations WHERE LOWER(name) = 'palvera');

-- Step 3: Set all stats
UPDATE nations SET
    government_type = 'Presidential',
    total_seats = 120,
    max_parties = 8,

    -- GDP & Debt (dollar-scale)
    gdp = 106000000000,
    debt = 48000000000,

    -- Fiscal & Monetary (0-100 scale)
    gdp_growth = 40,
    debt_growth = 48,
    inflation = 28,
    interest_rates = 35,
    trade_balance = 32,
    currency_strength = 38,
    foreign_investment = 30,
    credit = 45,

    -- Taxation
    income_tax = 58,
    corporate_tax = 48,
    sales_tax = 42,
    tariffs = 32,

    -- Labor & Inequality
    unemployment = 48,
    labor_force_participation = 62,
    minimum_wage = 55,
    union_strength = 68,
    poverty_rate = 22,
    income_inequality = 28,

    -- Demographics
    population = 6650000,
    population_growth = 32,
    birth_rate = 42,
    death_rate = 25,
    median_age = 52,
    eligible_voters = 65,
    ethnic_diversity = 42,

    -- Healthcare
    healthcare_quality = 62,
    healthcare_accessibility = 72,
    beds_per_100k = 55,
    lifespan = 68,
    drug_use = 30,

    -- Education
    literacy = 82,
    higher_education = 55,
    education_accessibility = 72,
    academic_immigration = 32,

    -- Infrastructure
    physical_infrastructure = 45,
    digital_infrastructure = 40,
    rail_network = 22,
    urbanization = 55,

    -- Energy & Resources
    energy_generation = 35,
    renewable_energy_percentage = 58,
    arable_land = 25,
    rare_minerals = 12,
    oil_and_gas = 8,
    fuel_prices = 62,

    -- Environment
    pollution = 22,
    carbon_emissions = 18,

    -- Quality of Life
    standard_of_living = 52,
    happiness = 58,
    social_mobility = 52,
    benefits = 68,

    -- Security
    crime_rate = 28,
    incarceration_rate = 22,
    religious = 42,

    -- Governance
    stability = 68,
    legitimacy = 72,
    efficiency = 48,
    corruption = 20,
    press_freedom = 85,
    judicial_independence = 78,
    freedom_index = 82,
    polarization = 42,
    civil_unrest = 22,
    terrorism = 5,
    political_violence = 8,

    -- International
    immigration = 28,
    illegal_immigration = 18,
    emigration = 58,
    international_reputation = 55,
    trade_agreements = 38,
    sanctions = 3,

    -- Approval defaults
    national_approval = 50,
    gov_approval = 50,
    gov_approval_institutional = 50,
    gov_approval_outcomes = 50,
    gov_approval_events = 0

WHERE LOWER(name) = 'palvera';

-- Step 4: Save seed_stats snapshot for shard reset
UPDATE nations
SET seed_stats = jsonb_build_object(
    'government_type', 'Presidential',
    'total_seats', 120,
    'max_parties', 8,
    'gdp', 106000000000,
    'debt', 48000000000,
    'gdp_growth', 40,
    'debt_growth', 48,
    'inflation', 28,
    'interest_rates', 35,
    'trade_balance', 32,
    'currency_strength', 38,
    'foreign_investment', 30,
    'credit', 45,
    'income_tax', 58,
    'corporate_tax', 48,
    'sales_tax', 42,
    'tariffs', 32,
    'unemployment', 48,
    'labor_force_participation', 62,
    'minimum_wage', 55,
    'union_strength', 68,
    'poverty_rate', 22,
    'income_inequality', 28,
    'population', 6650000,
    'population_growth', 32,
    'birth_rate', 42,
    'death_rate', 25,
    'median_age', 52,
    'eligible_voters', 65,
    'ethnic_diversity', 42,
    'healthcare_quality', 62,
    'healthcare_accessibility', 72,
    'beds_per_100k', 55,
    'lifespan', 68,
    'drug_use', 30,
    'literacy', 82,
    'higher_education', 55,
    'education_accessibility', 72,
    'academic_immigration', 32,
    'physical_infrastructure', 45,
    'digital_infrastructure', 40,
    'rail_network', 22,
    'urbanization', 55,
    'energy_generation', 35,
    'renewable_energy_percentage', 58,
    'arable_land', 25,
    'rare_minerals', 12,
    'oil_and_gas', 8,
    'fuel_prices', 62,
    'pollution', 22,
    'carbon_emissions', 18,
    'standard_of_living', 52,
    'happiness', 58,
    'social_mobility', 52,
    'benefits', 68,
    'crime_rate', 28,
    'incarceration_rate', 22,
    'religious', 42,
    'stability', 68,
    'legitimacy', 72,
    'efficiency', 48,
    'corruption', 20,
    'press_freedom', 85,
    'judicial_independence', 78,
    'freedom_index', 82,
    'polarization', 42,
    'civil_unrest', 22,
    'terrorism', 5,
    'political_violence', 8,
    'immigration', 28,
    'illegal_immigration', 18,
    'emigration', 58,
    'international_reputation', 55,
    'trade_agreements', 38,
    'sanctions', 3
)
WHERE LOWER(name) = 'palvera';

-- Step 5: Verify
SELECT name, government_type, total_seats, max_parties, gdp, debt, population,
       stability, legitimacy, press_freedom, freedom_index, corruption
FROM nations
WHERE LOWER(name) = 'palvera';
