-- =========================================================================
-- ALPHA STATS REFACTOR — Phase 5: data rewrite (JSONB + TEXT)
--
-- The Phase 4 JS shim (translateStatEffect) re-maps legacy 80-stat keys
-- onto the alpha 19-column schema at apply time, so today's tick
-- processor keeps applying bills correctly. This migration rewrites the
-- stored JSONB and TEXT columns themselves so the shim becomes
-- belt-and-suspenders rather than load-bearing.
--
-- Mirrors the Phase 4 alias table 1:1. Two SQL functions implement the
-- same translation logic the JS uses; UPDATEs walk every live table that
-- holds stat-key references in storage.
--
-- Tables rewritten:
--
--   policy_options.stat_effects   (JSONB array of stat-effect entries)
--   active_laws.reversal_effects  (JSONB array of stat-effect entries)
--   policies.target_stat          (TEXT — single-stat fallback per policy)
--   policies.secondary_stat       (TEXT)
--   policies.cost_scaling_stat    (TEXT — references stat for cost scaling)
--   policies.cost_scaling_stat_2  (TEXT)
--   policies.stat_direction       (TEXT — flipped when target_stat inverts)
--
-- Out of scope:
--
--   bill_articles.effect_data     — discriminated union (TAX_CHANGE,
--                                   bailout, etc.); no stat_key payload
--   policy_options.sector_effects — sector_key (electoral sector), not
--                                   nation stat_key
--   policies.side_effects         — column exists but has no readers in
--                                   the JS engine; left alone pending
--                                   Phase 7 audit
--   crisis_templates / event_templates — Phase 8
--
-- Idempotent: running twice is a no-op. The translate function passes
-- already-new keys through unchanged; UPDATEs only touch non-null rows.
-- =========================================================================

BEGIN;

-- ── Helper 1: TEXT → TEXT translation
-- Returns:
--   * new key for renames           e.g. 'civil_unrest'  → 'unrest'
--   * NULL for deleted-with-no-replacement  e.g. 'happiness' → NULL
--   * passthrough for unknown keys (already-translated, custom, etc.)
CREATE OR REPLACE FUNCTION alpha_translate_stat_key(p_old_key TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_old_key
        -- ── Direct renames into the 19-column schema ──
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
        WHEN 'legitimacy'                THEN 'authority'

        -- ── Inverted (rename + direction flip handled separately) ──
        WHEN 'unemployment'              THEN 'workforce'

        -- ── DELETED — Phase 9 drops the column. NULL signals "drop entry". ──
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
        WHEN 'income_tax'                THEN NULL
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
        WHEN 'crime_rate'                THEN NULL
        WHEN 'social_mobility'           THEN NULL
        WHEN 'benefits'                  THEN NULL
        WHEN 'population_growth'         THEN NULL
        WHEN 'debt_growth'               THEN NULL
        WHEN 'minimum_wage'              THEN NULL
        WHEN 'union_strength'            THEN NULL
        WHEN 'illegal_immigration'       THEN NULL
        WHEN 'emigration'                THEN NULL
        WHEN 'corporate_tax'             THEN NULL
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
        WHEN 'corruption'                THEN NULL
        WHEN 'press_freedom'             THEN NULL
        WHEN 'judicial_independence'     THEN NULL
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

-- ── Helper 2: should the apply direction flip for this old key?
-- e.g. unemployment going UP corresponds to workforce going DOWN.
CREATE OR REPLACE FUNCTION alpha_should_invert(p_old_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE
AS $$
    SELECT p_old_key = 'unemployment';
$$;

-- ── Helper 3: per-entry JSONB translator. Returns NULL for entries
-- whose stat is being deleted; caller filters NULLs.
CREATE OR REPLACE FUNCTION alpha_translate_stat_effect_entry(p_eff JSONB)
RETURNS JSONB
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    v_old_key TEXT;
    v_new_key TEXT;
    v_invert BOOLEAN;
    v_out    JSONB;
BEGIN
    IF p_eff IS NULL OR jsonb_typeof(p_eff) <> 'object' THEN
        RETURN p_eff;
    END IF;

    v_old_key := COALESCE(p_eff->>'stat_key', p_eff->>'stat');
    IF v_old_key IS NULL THEN
        RETURN p_eff;  -- entry doesn't carry a stat key (e.g., funding-only)
    END IF;

    v_new_key := alpha_translate_stat_key(v_old_key);
    IF v_new_key IS NULL THEN
        RETURN NULL;  -- DELETED — caller drops this entry
    END IF;

    v_invert := alpha_should_invert(v_old_key);
    v_out := p_eff;

    IF p_eff ? 'stat_key' THEN
        v_out := jsonb_set(v_out, '{stat_key}', to_jsonb(v_new_key));
    END IF;
    IF p_eff ? 'stat' THEN
        v_out := jsonb_set(v_out, '{stat}', to_jsonb(v_new_key));
    END IF;

    IF v_invert THEN
        IF v_out->>'direction' = 'up' THEN
            v_out := jsonb_set(v_out, '{direction}', '"down"'::jsonb);
        ELSIF v_out->>'direction' = 'down' THEN
            v_out := jsonb_set(v_out, '{direction}', '"up"'::jsonb);
        END IF;
        IF jsonb_typeof(v_out->'delta') = 'number' THEN
            v_out := jsonb_set(v_out, '{delta}',
                to_jsonb(-((v_out->>'delta')::NUMERIC)));
        END IF;
    END IF;

    RETURN v_out;
END;
$$;

-- ── Helper 4: array translator (drops null entries from helper 3)
CREATE OR REPLACE FUNCTION alpha_translate_stat_effects(p_arr JSONB)
RETURNS JSONB
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    v_out        JSONB := '[]'::jsonb;
    v_eff        JSONB;
    v_translated JSONB;
BEGIN
    IF p_arr IS NULL OR jsonb_typeof(p_arr) <> 'array' THEN
        RETURN p_arr;
    END IF;

    FOR v_eff IN SELECT jsonb_array_elements(p_arr) LOOP
        v_translated := alpha_translate_stat_effect_entry(v_eff);
        IF v_translated IS NOT NULL THEN
            v_out := v_out || v_translated;
        END IF;
    END LOOP;

    RETURN v_out;
END;
$$;

-- ── Drop NOT NULL on policies.target_stat / stat_direction so deleted
-- stats can null out cleanly (the rows become inert; the engine's
-- shim already handles null stat_key gracefully).
ALTER TABLE policies ALTER COLUMN target_stat    DROP NOT NULL;
ALTER TABLE policies ALTER COLUMN stat_direction DROP NOT NULL;

-- ── Rewrite JSONB columns
UPDATE policy_options
SET stat_effects = alpha_translate_stat_effects(stat_effects)
WHERE stat_effects IS NOT NULL
  AND jsonb_array_length(stat_effects) > 0;

UPDATE active_laws
SET reversal_effects = alpha_translate_stat_effects(reversal_effects)
WHERE reversal_effects IS NOT NULL
  AND jsonb_array_length(reversal_effects) > 0;

-- ── Rewrite policies TEXT columns. target_stat + stat_direction must
-- update together so direction flips on inverted aliases stay in sync
-- with the new key. PostgreSQL evaluates all RHS expressions against
-- the OLD row, so reading `target_stat` in the CASE expression below
-- gives us the original (pre-translation) key for the invert check.
UPDATE policies
SET target_stat    = alpha_translate_stat_key(target_stat),
    stat_direction = CASE
        WHEN alpha_translate_stat_key(target_stat) IS NULL THEN NULL
        WHEN alpha_should_invert(target_stat) THEN
            CASE LOWER(stat_direction)
                WHEN 'up'   THEN 'DOWN'
                WHEN 'down' THEN 'UP'
                ELSE stat_direction
            END
        ELSE stat_direction
    END
WHERE target_stat IS NOT NULL;

UPDATE policies
SET secondary_stat = alpha_translate_stat_key(secondary_stat)
WHERE secondary_stat IS NOT NULL;

UPDATE policies
SET cost_scaling_stat = alpha_translate_stat_key(cost_scaling_stat)
WHERE cost_scaling_stat IS NOT NULL;

UPDATE policies
SET cost_scaling_stat_2 = alpha_translate_stat_key(cost_scaling_stat_2)
WHERE cost_scaling_stat_2 IS NOT NULL;

COMMIT;

-- =========================================================================
-- Verification — both queries should return zero rows after the migration.
-- Anything left is either an unknown stat key (passed through unchanged
-- by alpha_translate_stat_key) or storage that the migration didn't touch
-- (e.g. policies.side_effects — no readers, intentionally skipped).
-- =========================================================================

-- 1. JSONB residue: policy_options.stat_effects + active_laws.reversal_effects
WITH legacy_keys AS (
    SELECT unnest(ARRAY[
        'civil_unrest','terrorism','political_violence',
        'healthcare_accessibility','healthcare_quality','lifespan','beds_per_100k','hospital_beds',
        'physical_infrastructure','digital_infrastructure','rail_network',
        'urbanization','labor_force_participation','unemployment',
        'higher_education','education_quality','arable_land','manufacturing_output',
        'international_reputation','intl_reputation','diplomatic_standing','tourism',
        'stability','military_strength','legitimacy',
        'religious','religiosity','efficiency','happiness','polarization','freedom_index',
        'gdp','GDP','inflation','foreign_investment','income_tax','tariffs',
        'credit','credit_rating','credit_score','literacy','literacy_rate','academic_immigration',
        'oil_and_gas','rare_minerals','energy_generation','fuel_prices','pollution',
        'crime_rate','social_mobility','benefits','population_growth','debt_growth',
        'minimum_wage','union_strength','illegal_immigration','emigration',
        'corporate_tax','sales_tax','interest_rates','poverty_rate','income_inequality',
        'trade_balance','trade','trade_volume','currency_strength',
        'birth_rate','death_rate','median_age','carbon_emissions','renewable_energy_percentage',
        'corruption','press_freedom','judicial_independence','incarceration_rate','drug_use',
        'ethnic_diversity','education_accessibility','technology','service_output','housing_affordability',
        'sanctions','trade_agreements'
    ]) AS k
)
SELECT 'policy_options.stat_effects' AS source, po.id, eff->>'stat_key' AS key
FROM policy_options po, jsonb_array_elements(po.stat_effects) AS eff
WHERE eff->>'stat_key' IN (SELECT k FROM legacy_keys)
   OR eff->>'stat'     IN (SELECT k FROM legacy_keys)
UNION ALL
SELECT 'active_laws.reversal_effects' AS source, al.id, eff->>'stat_key' AS key
FROM active_laws al, jsonb_array_elements(al.reversal_effects) AS eff
WHERE eff->>'stat_key' IN (SELECT k FROM legacy_keys)
   OR eff->>'stat'     IN (SELECT k FROM legacy_keys);

-- 2. TEXT residue on policies
SELECT id, policy_name, target_stat, secondary_stat, cost_scaling_stat, cost_scaling_stat_2
FROM policies
WHERE target_stat        IN (SELECT unnest(ARRAY['civil_unrest','terrorism','political_violence','healthcare_accessibility','healthcare_quality','lifespan','beds_per_100k','hospital_beds','physical_infrastructure','digital_infrastructure','rail_network','urbanization','labor_force_participation','unemployment','higher_education','education_quality','arable_land','manufacturing_output','international_reputation','intl_reputation','diplomatic_standing','tourism','stability','military_strength','legitimacy','religious','religiosity','efficiency','happiness','polarization','freedom_index','gdp','GDP','inflation','foreign_investment','income_tax','tariffs','credit','credit_rating','credit_score','literacy','literacy_rate','academic_immigration','oil_and_gas','rare_minerals','energy_generation','fuel_prices','pollution','crime_rate','social_mobility','benefits','population_growth','debt_growth','minimum_wage','union_strength','illegal_immigration','emigration','corporate_tax','sales_tax','interest_rates','poverty_rate','income_inequality','trade_balance','trade','trade_volume','currency_strength','birth_rate','death_rate','median_age','carbon_emissions','renewable_energy_percentage','corruption','press_freedom','judicial_independence','incarceration_rate','drug_use','ethnic_diversity','education_accessibility','technology','service_output','housing_affordability','sanctions','trade_agreements']))
   OR secondary_stat     IN (SELECT unnest(ARRAY['civil_unrest','terrorism','political_violence','healthcare_accessibility','healthcare_quality','lifespan','beds_per_100k','hospital_beds','physical_infrastructure','digital_infrastructure','rail_network','urbanization','labor_force_participation','unemployment','higher_education','education_quality','arable_land','manufacturing_output','international_reputation','intl_reputation','diplomatic_standing','tourism','stability','military_strength','legitimacy','religious','religiosity','efficiency','happiness','polarization','freedom_index','gdp','GDP','inflation','foreign_investment','income_tax','tariffs','credit','credit_rating','credit_score','literacy','literacy_rate','academic_immigration','oil_and_gas','rare_minerals','energy_generation','fuel_prices','pollution','crime_rate','social_mobility','benefits','population_growth','debt_growth','minimum_wage','union_strength','illegal_immigration','emigration','corporate_tax','sales_tax','interest_rates','poverty_rate','income_inequality','trade_balance','trade','trade_volume','currency_strength','birth_rate','death_rate','median_age','carbon_emissions','renewable_energy_percentage','corruption','press_freedom','judicial_independence','incarceration_rate','drug_use','ethnic_diversity','education_accessibility','technology','service_output','housing_affordability','sanctions','trade_agreements']));
