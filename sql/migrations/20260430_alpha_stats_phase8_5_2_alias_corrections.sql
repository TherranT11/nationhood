-- =========================================================================
-- ALPHA STATS REFACTOR — Phase 8.5.2: SQL alias helper corrections
--
-- Mirrors the JS-side changes in stats.js for the alpha-23 menu:
--
--   * authority   → public_approval  (rename)
--   * goods       → service_sector   (rename)
--   * crime_rate  → crime            (rename)
--
--   * income_tax / corporate_tax / corruption / crime — restored to
--     the live alpha menu (Phase 5 had them returning NULL).
--   * legitimacy + judicial_independence cascade to public_approval
--     (matching the bills.js Phase 7H collapse).
--
-- Rerunning is safe: alpha_translate_stat_key returns the same value
-- every call.
-- =========================================================================

CREATE OR REPLACE FUNCTION alpha_translate_stat_key(p_old_key TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_old_key
        -- ── Direct renames into the alpha-23 schema ──
        WHEN 'civil_unrest'              THEN 'unrest'
        WHEN 'terrorism'                 THEN 'unrest'
        WHEN 'political_violence'        THEN 'unrest'
        WHEN 'healthcare_accessibility'  THEN 'health'
        WHEN 'healthcare_quality'        THEN 'health'
        WHEN 'lifespan'                  THEN 'health'
        WHEN 'beds_per_100k'             THEN 'health'
        WHEN 'hospital_beds'             THEN 'health'
        WHEN 'physical_infrastructure'   THEN 'infrastructure'
        WHEN 'digital_infrastructure'    THEN 'infrastructure'
        WHEN 'rail_network'              THEN 'infrastructure'
        WHEN 'urbanization'              THEN 'workforce'
        WHEN 'labor_force_participation' THEN 'workforce'
        WHEN 'higher_education'          THEN 'education'
        WHEN 'education_quality'         THEN 'education'
        WHEN 'arable_land'               THEN 'farmland'
        WHEN 'manufacturing_output'      THEN 'industry'
        WHEN 'international_reputation'  THEN 'power'
        WHEN 'intl_reputation'           THEN 'power'
        WHEN 'diplomatic_standing'       THEN 'power'
        WHEN 'tourism'                   THEN 'power'
        WHEN 'trade_agreements'          THEN 'power'
        WHEN 'sanctions'                 THEN 'power'
        WHEN 'stability'                 THEN 'control'
        WHEN 'military_strength'         THEN 'control'

        -- ── Phase 8.5.2 renames ──
        WHEN 'authority'                 THEN 'public_approval'
        WHEN 'legitimacy'                THEN 'public_approval'
        WHEN 'judicial_independence'     THEN 'public_approval'
        WHEN 'goods'                     THEN 'service_sector'
        WHEN 'crime_rate'                THEN 'crime'

        -- ── Inverted (rename + direction flip handled separately) ──
        WHEN 'unemployment'              THEN 'workforce'

        -- ── DELETED — Phase 9 drops the column. NULL signals "drop entry". ──
        -- Phase 8.5.2 restored income_tax / corporate_tax / corruption /
        -- crime (was crime_rate) to the live alpha menu, so they're no
        -- longer in the deletion list.
        WHEN 'religious'                 THEN NULL
        WHEN 'religiosity'               THEN NULL
        WHEN 'efficiency'                THEN NULL
        WHEN 'happiness'                 THEN NULL
        WHEN 'polarization'              THEN NULL
        WHEN 'freedom_index'             THEN NULL
        WHEN 'gdp'                       THEN NULL
        WHEN 'GDP'                       THEN NULL
        WHEN 'inflation'                 THEN NULL
        WHEN 'foreign_investment'        THEN NULL
        WHEN 'tariffs'                   THEN NULL
        WHEN 'credit'                    THEN NULL
        WHEN 'credit_rating'             THEN NULL
        WHEN 'credit_score'              THEN NULL
        WHEN 'literacy'                  THEN NULL
        WHEN 'literacy_rate'             THEN NULL
        WHEN 'academic_immigration'      THEN NULL
        WHEN 'oil_and_gas'               THEN NULL
        WHEN 'rare_minerals'             THEN NULL
        WHEN 'energy_generation'         THEN NULL
        WHEN 'fuel_prices'               THEN NULL
        WHEN 'pollution'                 THEN NULL
        WHEN 'social_mobility'           THEN NULL
        WHEN 'benefits'                  THEN NULL
        WHEN 'population_growth'         THEN NULL
        WHEN 'debt_growth'               THEN NULL
        WHEN 'minimum_wage'              THEN NULL
        WHEN 'union_strength'            THEN NULL
        WHEN 'illegal_immigration'       THEN NULL
        WHEN 'emigration'                THEN NULL
        WHEN 'sales_tax'                 THEN NULL
        WHEN 'interest_rates'            THEN NULL
        WHEN 'poverty_rate'              THEN NULL
        WHEN 'income_inequality'         THEN NULL
        WHEN 'trade_balance'             THEN NULL
        WHEN 'trade'                     THEN NULL
        WHEN 'trade_volume'              THEN NULL
        WHEN 'currency_strength'         THEN NULL
        WHEN 'birth_rate'                THEN NULL
        WHEN 'death_rate'                THEN NULL
        WHEN 'median_age'                THEN NULL
        WHEN 'carbon_emissions'          THEN NULL
        WHEN 'renewable_energy_percentage' THEN NULL
        WHEN 'press_freedom'             THEN NULL
        WHEN 'incarceration_rate'        THEN NULL
        WHEN 'drug_use'                  THEN NULL
        WHEN 'ethnic_diversity'          THEN NULL
        WHEN 'education_accessibility'   THEN NULL
        WHEN 'technology'                THEN NULL
        WHEN 'service_output'            THEN NULL
        WHEN 'housing_affordability'     THEN NULL

        -- Unknown / already-translated key — pass through unchanged.
        ELSE p_old_key
    END;
$$;

-- =========================================================================
-- Spot-check the new mappings
-- =========================================================================
SELECT
    alpha_translate_stat_key('authority')          AS authority_to,
    alpha_translate_stat_key('goods')              AS goods_to,
    alpha_translate_stat_key('crime_rate')         AS crime_rate_to,
    alpha_translate_stat_key('income_tax')         AS income_tax_to,
    alpha_translate_stat_key('corporate_tax')      AS corporate_tax_to,
    alpha_translate_stat_key('corruption')         AS corruption_to,
    alpha_translate_stat_key('crime')              AS crime_to,
    alpha_translate_stat_key('public_approval')    AS public_approval_to,
    alpha_translate_stat_key('service_sector')     AS service_sector_to,
    alpha_translate_stat_key('inflation')          AS inflation_to;
-- Expected: public_approval, service_sector, crime, income_tax,
-- corporate_tax, corruption, crime, public_approval, service_sector, NULL
