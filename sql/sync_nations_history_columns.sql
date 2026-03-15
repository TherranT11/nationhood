-- Sync nations_history columns to match all tracked nation stats.
-- Uses ADD COLUMN IF NOT EXISTS so it's safe to re-run.
-- Run this in Supabase SQL editor.

-- Economic
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS gdp NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS gdp_growth NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS debt NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS debt_growth NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS budget NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS inflation NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS interest_rates NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS trade_balance NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS currency_strength NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS foreign_investment NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS credit NUMERIC;

-- Taxation
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS income_tax NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS corporate_tax NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS sales_tax NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS tariffs NUMERIC;

-- Labor & Employment
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS unemployment NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS labor_force_participation NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS minimum_wage NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS union_strength NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS poverty_rate NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS income_inequality NUMERIC;

-- Demographics
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS population NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS population_growth NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS median_age NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS eligible_voters NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS ethnic_diversity NUMERIC;

-- Healthcare
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS healthcare_quality NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS healthcare_accessibility NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS beds_per_100k NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS lifespan NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS drug_use NUMERIC;

-- Education
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS literacy NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS higher_education NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS education_accessibility NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS academic_immigration NUMERIC;

-- Infrastructure
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS physical_infrastructure NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS digital_infrastructure NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS rail_network NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS urbanization NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS energy_generation NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS renewable_energy_percentage NUMERIC;

-- Resources
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS arable_land NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS rare_minerals NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS oil_and_gas NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS fuel_prices NUMERIC;

-- Environment
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS pollution NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS carbon_emissions NUMERIC;

-- Social
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS standard_of_living NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS happiness NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS social_mobility NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS benefits NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS crime_rate NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS incarceration_rate NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS religiosity NUMERIC;

-- Governance
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS stability NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS legitimacy NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS efficiency NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS corruption NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS press_freedom NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS judicial_independence NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS freedom_index NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS polarization NUMERIC;

-- Security
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS civil_unrest NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS terrorism NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS political_violence NUMERIC;

-- Immigration
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS immigration NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS illegal_immigration NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS emigration NUMERIC;

-- International
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS international_reputation NUMERIC;

-- Economy (new stats)
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS cost_of_living NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS manufacturing_output NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS service_output NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS housing_affordability NUMERIC;

-- Government approval
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS gov_approval NUMERIC;

-- Voter demographics
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS competition_voters NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS liberty_voters NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS security_voters NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS globalism_voters NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS progressive_voters NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS liberal_voters NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS moderate_voters NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS conservative_voters NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS nationalist_voters NUMERIC;
