-- =========================================================================
-- ALPHA STATS REFACTOR — Phase 9: drop legacy columns
--
-- Final phase. Drops the ~75 legacy stat columns from `nations` and
-- `nations_history`, leaving the alpha-23 stat menu plus non-stat
-- metadata (population, eligible_voters, gov_approval*, ideology
-- voter columns, head_of_state, etc.) intact.
--
-- Two categories collapsed into one DROP list:
--
--   1. NULL-sentinel deletions (STAT_KEY_ALIASES nulls in stats.js).
--      These stats are gone from the simulation entirely.
--
--   2. Rename targets — the alpha-23 column now holds the data, the
--      legacy column lingered through the dual-stat window.
--
-- Phase 9 prep complete:
--   * No CHECK constraints reference these columns.
--   * No views or stored functions reference them.
--   * No direct property reads in the JS engine (Phase 7H/8.5.3 swept).
--   * STAT_KEY_ALIASES keeps the null sentinels so event/policy
--     stat_effects JSON pointing to these names continues to be
--     filtered by translateStatEffect at apply time.
--
-- IF EXISTS gates each DROP so re-running is a no-op on columns
-- already removed (some columns in the list may have been dropped
-- by earlier partial migrations).
-- =========================================================================

-- ── nations ──
ALTER TABLE nations
    -- NULL-sentinel deletions (STAT_KEY_ALIASES nulls)
    DROP COLUMN IF EXISTS religious,
    DROP COLUMN IF EXISTS religiosity,
    DROP COLUMN IF EXISTS efficiency,
    DROP COLUMN IF EXISTS happiness,
    DROP COLUMN IF EXISTS polarization,
    DROP COLUMN IF EXISTS freedom_index,
    DROP COLUMN IF EXISTS gdp,
    DROP COLUMN IF EXISTS "GDP",
    DROP COLUMN IF EXISTS inflation,
    DROP COLUMN IF EXISTS foreign_investment,
    DROP COLUMN IF EXISTS tariffs,
    DROP COLUMN IF EXISTS credit,
    DROP COLUMN IF EXISTS credit_rating,
    DROP COLUMN IF EXISTS credit_score,
    DROP COLUMN IF EXISTS literacy,
    DROP COLUMN IF EXISTS literacy_rate,
    DROP COLUMN IF EXISTS academic_immigration,
    DROP COLUMN IF EXISTS oil_and_gas,
    DROP COLUMN IF EXISTS rare_minerals,
    DROP COLUMN IF EXISTS energy_generation,
    DROP COLUMN IF EXISTS fuel_prices,
    DROP COLUMN IF EXISTS pollution,
    DROP COLUMN IF EXISTS social_mobility,
    DROP COLUMN IF EXISTS benefits,
    DROP COLUMN IF EXISTS population_growth,
    DROP COLUMN IF EXISTS debt_growth,
    DROP COLUMN IF EXISTS minimum_wage,
    DROP COLUMN IF EXISTS union_strength,
    DROP COLUMN IF EXISTS illegal_immigration,
    DROP COLUMN IF EXISTS emigration,
    DROP COLUMN IF EXISTS sales_tax,
    DROP COLUMN IF EXISTS interest_rates,
    DROP COLUMN IF EXISTS poverty_rate,
    DROP COLUMN IF EXISTS income_inequality,
    DROP COLUMN IF EXISTS trade_balance,
    DROP COLUMN IF EXISTS trade,
    DROP COLUMN IF EXISTS trade_volume,
    DROP COLUMN IF EXISTS currency_strength,
    DROP COLUMN IF EXISTS birth_rate,
    DROP COLUMN IF EXISTS death_rate,
    DROP COLUMN IF EXISTS median_age,
    DROP COLUMN IF EXISTS carbon_emissions,
    DROP COLUMN IF EXISTS renewable_energy_percentage,
    DROP COLUMN IF EXISTS press_freedom,
    DROP COLUMN IF EXISTS incarceration_rate,
    DROP COLUMN IF EXISTS drug_use,
    DROP COLUMN IF EXISTS ethnic_diversity,
    DROP COLUMN IF EXISTS education_accessibility,
    DROP COLUMN IF EXISTS technology,
    DROP COLUMN IF EXISTS service_output,
    DROP COLUMN IF EXISTS housing_affordability,

    -- Rename targets (data already migrated to alpha-23 column)
    DROP COLUMN IF EXISTS unemployment,
    DROP COLUMN IF EXISTS labor_force_participation,
    DROP COLUMN IF EXISTS healthcare_quality,
    DROP COLUMN IF EXISTS healthcare_accessibility,
    DROP COLUMN IF EXISTS beds_per_100k,
    DROP COLUMN IF EXISTS lifespan,
    DROP COLUMN IF EXISTS higher_education,
    DROP COLUMN IF EXISTS physical_infrastructure,
    DROP COLUMN IF EXISTS digital_infrastructure,
    DROP COLUMN IF EXISTS rail_network,
    DROP COLUMN IF EXISTS urbanization,
    DROP COLUMN IF EXISTS arable_land,
    DROP COLUMN IF EXISTS manufacturing_output,
    DROP COLUMN IF EXISTS international_reputation,
    DROP COLUMN IF EXISTS stability,
    DROP COLUMN IF EXISTS legitimacy,
    DROP COLUMN IF EXISTS judicial_independence,
    DROP COLUMN IF EXISTS civil_unrest,
    DROP COLUMN IF EXISTS terrorism,
    DROP COLUMN IF EXISTS political_violence,
    DROP COLUMN IF EXISTS trade_agreements,
    DROP COLUMN IF EXISTS sanctions,
    DROP COLUMN IF EXISTS "GDP_growth";


-- ── nations_history ──
ALTER TABLE nations_history
    DROP COLUMN IF EXISTS religious,
    DROP COLUMN IF EXISTS religiosity,
    DROP COLUMN IF EXISTS efficiency,
    DROP COLUMN IF EXISTS happiness,
    DROP COLUMN IF EXISTS polarization,
    DROP COLUMN IF EXISTS freedom_index,
    DROP COLUMN IF EXISTS gdp,
    DROP COLUMN IF EXISTS "GDP",
    DROP COLUMN IF EXISTS inflation,
    DROP COLUMN IF EXISTS foreign_investment,
    DROP COLUMN IF EXISTS tariffs,
    DROP COLUMN IF EXISTS credit,
    DROP COLUMN IF EXISTS credit_rating,
    DROP COLUMN IF EXISTS credit_score,
    DROP COLUMN IF EXISTS literacy,
    DROP COLUMN IF EXISTS literacy_rate,
    DROP COLUMN IF EXISTS academic_immigration,
    DROP COLUMN IF EXISTS oil_and_gas,
    DROP COLUMN IF EXISTS rare_minerals,
    DROP COLUMN IF EXISTS energy_generation,
    DROP COLUMN IF EXISTS fuel_prices,
    DROP COLUMN IF EXISTS pollution,
    DROP COLUMN IF EXISTS social_mobility,
    DROP COLUMN IF EXISTS benefits,
    DROP COLUMN IF EXISTS population_growth,
    DROP COLUMN IF EXISTS debt_growth,
    DROP COLUMN IF EXISTS minimum_wage,
    DROP COLUMN IF EXISTS union_strength,
    DROP COLUMN IF EXISTS illegal_immigration,
    DROP COLUMN IF EXISTS emigration,
    DROP COLUMN IF EXISTS sales_tax,
    DROP COLUMN IF EXISTS interest_rates,
    DROP COLUMN IF EXISTS poverty_rate,
    DROP COLUMN IF EXISTS income_inequality,
    DROP COLUMN IF EXISTS trade_balance,
    DROP COLUMN IF EXISTS trade,
    DROP COLUMN IF EXISTS trade_volume,
    DROP COLUMN IF EXISTS currency_strength,
    DROP COLUMN IF EXISTS birth_rate,
    DROP COLUMN IF EXISTS death_rate,
    DROP COLUMN IF EXISTS median_age,
    DROP COLUMN IF EXISTS carbon_emissions,
    DROP COLUMN IF EXISTS renewable_energy_percentage,
    DROP COLUMN IF EXISTS press_freedom,
    DROP COLUMN IF EXISTS incarceration_rate,
    DROP COLUMN IF EXISTS drug_use,
    DROP COLUMN IF EXISTS ethnic_diversity,
    DROP COLUMN IF EXISTS education_accessibility,
    DROP COLUMN IF EXISTS technology,
    DROP COLUMN IF EXISTS service_output,
    DROP COLUMN IF EXISTS housing_affordability,
    DROP COLUMN IF EXISTS unemployment,
    DROP COLUMN IF EXISTS labor_force_participation,
    DROP COLUMN IF EXISTS healthcare_quality,
    DROP COLUMN IF EXISTS healthcare_accessibility,
    DROP COLUMN IF EXISTS beds_per_100k,
    DROP COLUMN IF EXISTS lifespan,
    DROP COLUMN IF EXISTS higher_education,
    DROP COLUMN IF EXISTS physical_infrastructure,
    DROP COLUMN IF EXISTS digital_infrastructure,
    DROP COLUMN IF EXISTS rail_network,
    DROP COLUMN IF EXISTS urbanization,
    DROP COLUMN IF EXISTS arable_land,
    DROP COLUMN IF EXISTS manufacturing_output,
    DROP COLUMN IF EXISTS international_reputation,
    DROP COLUMN IF EXISTS stability,
    DROP COLUMN IF EXISTS legitimacy,
    DROP COLUMN IF EXISTS judicial_independence,
    DROP COLUMN IF EXISTS civil_unrest,
    DROP COLUMN IF EXISTS terrorism,
    DROP COLUMN IF EXISTS political_violence,
    DROP COLUMN IF EXISTS trade_agreements,
    DROP COLUMN IF EXISTS sanctions;

-- =========================================================================
-- Spot-check: confirm none of the dropped names remain on either table.
-- Should return zero rows after the migration.
-- =========================================================================
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('nations', 'nations_history')
  AND column_name IN (
      'religious','religiosity','efficiency','happiness','polarization',
      'freedom_index','gdp','GDP','inflation','foreign_investment','tariffs',
      'credit','credit_rating','credit_score','literacy','literacy_rate',
      'academic_immigration','oil_and_gas','rare_minerals','energy_generation',
      'fuel_prices','pollution','social_mobility','benefits','population_growth',
      'debt_growth','minimum_wage','union_strength','illegal_immigration',
      'emigration','sales_tax','interest_rates','poverty_rate','income_inequality',
      'trade_balance','trade','trade_volume','currency_strength','birth_rate',
      'death_rate','median_age','carbon_emissions','renewable_energy_percentage',
      'press_freedom','incarceration_rate','drug_use','ethnic_diversity',
      'education_accessibility','technology','service_output','housing_affordability',
      'unemployment','labor_force_participation','healthcare_quality',
      'healthcare_accessibility','beds_per_100k','lifespan','higher_education',
      'physical_infrastructure','digital_infrastructure','rail_network',
      'urbanization','arable_land','manufacturing_output','international_reputation',
      'stability','legitimacy','judicial_independence','civil_unrest','terrorism',
      'political_violence','trade_agreements','sanctions','GDP_growth'
  );
