-- ============================================================
-- Danwei stats — Phases 3-9 of new-nation walkthrough
-- ============================================================
-- All stat columns on the nations row. Run AFTER insert_danwei.sql
-- has populated the base record (Phase 2). Idempotent — pure UPDATE.
--
-- Cultural inspiration: Taiwan. Heavy globalist, individualist lean.
-- Developed open economy, strong export surplus, FDI-friendly,
-- aging population, low natural-resource endowment, advanced
-- digital infrastructure, low corruption, high press freedom.
-- ============================================================

UPDATE nations SET
    -- ── Fiscal & Monetary (0-100 scale) ──
    gdp_growth                  = 62,
    debt_growth                 = 22,
    inflation                   = 18,
    interest_rates              = 42,
    trade_balance               = 78,
    currency_strength           = 72,
    foreign_investment          = 68,
    credit                      = 78,

    -- ── Debt (dollar-scale) ──
    -- ~30% debt-to-GDP, conservative fiscal posture.
    debt                        = 291000000000,

    -- ── Taxation (0-100 scale, percentage rates clamped 0-50) ──
    -- Mid-range across the board; tariffs low to match globalist lean.
    income_tax                  = 44,
    corporate_tax               = 38,
    sales_tax                   = 42,
    tariffs                     = 15,

    -- ── Labor & Inequality ──
    unemployment                = 22,
    labor_force_participation   = 74,
    minimum_wage                = 52,
    union_strength              = 38,
    poverty_rate                = 14,
    income_inequality           = 48,

    -- ── Demographics ──
    -- (population, eligible_voters set in Phase 2; not touched here.)
    population_growth           = 18,
    median_age                  = 64,
    ethnic_diversity            = 22,

    -- ── Healthcare ──
    healthcare_quality          = 84,
    healthcare_accessibility    = 88,
    beds_per_100k               = 78,
    lifespan                    = 84,
    drug_use                    = 18,

    -- ── Education ──
    literacy                    = 98,
    higher_education            = 78,
    education_accessibility     = 82,
    academic_immigration        = 72,

    -- ── Infrastructure ──
    physical_infrastructure     = 82,
    digital_infrastructure      = 88,
    rail_network                = 72,
    urbanization                = 78,

    -- ── Energy & Resources ──
    -- Low natural endowment; high energy generation from
    -- non-domestic supply (imports). Renewable share low — Taiwan-
    -- like dependence on imported fossil fuels.
    energy_generation           = 68,
    renewable_energy_percentage = 8,
    arable_land                 = 28,
    rare_minerals               = 32,
    oil_and_gas                 = 4,
    fuel_prices                 = 62,

    -- ── Environment ──
    pollution                   = 64,
    carbon_emissions            = 68,

    -- ── Quality of Life ──
    standard_of_living          = 78,
    happiness                   = 66,
    social_mobility             = 72,
    benefits                    = 66,
    cost_of_living              = 72,
    housing_affordability       = 32,
    manufacturing_output        = 92,
    service_output              = 68,

    -- ── Security ──
    crime_rate                  = 18,
    incarceration_rate          = 22,
    religiosity                 = 48,

    -- ── Governance ──
    stability                   = 58,
    legitimacy                  = 72,
    efficiency                  = 68,
    gov_approval                = 58,
    corruption                  = 32,
    press_freedom               = 78,
    judicial_independence       = 72,
    freedom_index               = 78,
    polarization                = 62,
    civil_unrest                = 28,
    terrorism                   = 12,
    political_violence          = 14,

    -- ── Migration ──
    immigration                 = 32,
    illegal_immigration         = 18,
    emigration                  = 44
WHERE LOWER(name) = 'danwei';

-- Verify: dump the full stat surface for a sanity check.
SELECT name, government_type, continent,
       -- fiscal
       gdp_growth, inflation, interest_rates, currency_strength, foreign_investment, credit, debt,
       -- taxation
       income_tax, corporate_tax, sales_tax, tariffs,
       -- labor
       unemployment, labor_force_participation, minimum_wage, union_strength, poverty_rate, income_inequality,
       -- demographics
       population, eligible_voters, population_growth, median_age, ethnic_diversity,
       -- governance
       stability, legitimacy, efficiency, gov_approval, corruption, press_freedom, polarization,
       -- quality of life
       standard_of_living, happiness, cost_of_living, housing_affordability,
       -- output
       manufacturing_output, service_output
  FROM nations
 WHERE LOWER(name) = 'danwei';
