-- =========================================================================
-- ALPHA STATS REFACTOR — Phase 8: crisis + event template remap
--
-- Translates stat_key references in the five crisis/event template
-- child tables onto the alpha 19-column schema. Reuses helpers
-- (alpha_translate_stat_key, alpha_should_invert) defined in
-- 20260430_alpha_stats_phase5_data_rewrite.sql.
--
-- Tables rewritten:
--   crisis_triggers      — fires the crisis when stat passes threshold
--   crisis_end_triggers  — clears the crisis when stat passes threshold
--   crisis_effects       — per-tick stat damage while crisis active
--   event_triggers       — random-event eligibility ranges on stat
--   event_effects        — random-event one-shot stat changes
--
-- Three update patterns, applied in order so an inverted alias
-- (unemployment → workforce) keeps its semantic when triggers flip
-- operator + threshold and effects flip sign:
--
--   1. INVERTED + DELETED rows handled FIRST (using OLD stat_key
--      values): unemployment triggers flip operator/threshold;
--      unemployment effects flip change sign; deleted-stat rows are
--      dropped wholesale (their crisis/event becomes silently
--      ineligible to fire and trivially recovers).
--
--   2. SECOND, rename pass on the surviving stat_key values
--      (alpha_translate_stat_key handles every alias including the
--      ones already flipped in step 1).
--
-- Idempotent: re-running passes already-translated keys through
-- unchanged. Safe to wrap in BEGIN/COMMIT.
-- =========================================================================

BEGIN;

-- ── Triggers (crisis_triggers, crisis_end_triggers, event_triggers)
-- have stat_key + operator + threshold (or min_value/max_value).
-- INVERTED alias: flip operator (gte ↔ lte) and threshold = 100 - old.
-- Phase 9 will drop the deleted columns from `nations`; trigger rows
-- referencing those columns are useless (would never read), so DELETE.

-- crisis_triggers
UPDATE crisis_triggers SET
    operator  = CASE LOWER(operator) WHEN 'gte' THEN 'lte' WHEN 'lte' THEN 'gte' ELSE operator END,
    threshold = 100 - threshold
WHERE alpha_should_invert(stat_key);

DELETE FROM crisis_triggers WHERE alpha_translate_stat_key(stat_key) IS NULL;

UPDATE crisis_triggers SET stat_key = alpha_translate_stat_key(stat_key)
WHERE stat_key IS NOT NULL
  AND alpha_translate_stat_key(stat_key) IS NOT NULL
  AND alpha_translate_stat_key(stat_key) <> stat_key;

-- crisis_end_triggers (same shape as crisis_triggers)
UPDATE crisis_end_triggers SET
    operator  = CASE LOWER(operator) WHEN 'gte' THEN 'lte' WHEN 'lte' THEN 'gte' ELSE operator END,
    threshold = 100 - threshold
WHERE alpha_should_invert(stat_key);

DELETE FROM crisis_end_triggers WHERE alpha_translate_stat_key(stat_key) IS NULL;

UPDATE crisis_end_triggers SET stat_key = alpha_translate_stat_key(stat_key)
WHERE stat_key IS NOT NULL
  AND alpha_translate_stat_key(stat_key) IS NOT NULL
  AND alpha_translate_stat_key(stat_key) <> stat_key;

-- event_triggers (uses min_value / max_value range instead of operator)
-- For inverted alias: swap min and max, then flip each by 100 - old.
UPDATE event_triggers SET
    min_value = 100 - max_value,
    max_value = 100 - min_value
WHERE alpha_should_invert(stat_key);

DELETE FROM event_triggers WHERE alpha_translate_stat_key(stat_key) IS NULL;

UPDATE event_triggers SET stat_key = alpha_translate_stat_key(stat_key)
WHERE stat_key IS NOT NULL
  AND alpha_translate_stat_key(stat_key) IS NOT NULL
  AND alpha_translate_stat_key(stat_key) <> stat_key;

-- ── Effects (crisis_effects, event_effects) carry per-tick damage or
-- one-shot delta. INVERTED alias: negate change_per_tick / change_value
-- so the alpha-19 column moves the same direction the legacy stat
-- would have moved. Deleted-stat rows are dropped (no nation column
-- to write to post-Phase 9).

-- crisis_effects (target='nation' uses stat_key; target='minister' uses
-- minister_key — only stat_key is in scope).
-- Inversion-driven flips run FIRST while stat_key is still the legacy
-- value (e.g., 'unemployment'); idempotent on re-run because the
-- alpha_should_invert check will be false on the renamed key.
UPDATE crisis_effects
SET change_per_tick = -change_per_tick,
    stat_floor      = CASE
                         WHEN stat_floor IS NOT NULL
                              AND stat_floor BETWEEN 0 AND 100
                         THEN 100 - stat_floor
                         ELSE stat_floor
                      END
WHERE alpha_should_invert(stat_key);

DELETE FROM crisis_effects
WHERE target = 'nation'
  AND alpha_translate_stat_key(stat_key) IS NULL
  AND stat_key IS NOT NULL;

UPDATE crisis_effects SET stat_key = alpha_translate_stat_key(stat_key)
WHERE stat_key IS NOT NULL
  AND alpha_translate_stat_key(stat_key) IS NOT NULL
  AND alpha_translate_stat_key(stat_key) <> stat_key;

-- event_effects
UPDATE event_effects SET change_value = -change_value
WHERE alpha_should_invert(stat_key);

DELETE FROM event_effects
WHERE target = 'nation'
  AND alpha_translate_stat_key(stat_key) IS NULL
  AND stat_key IS NOT NULL;

UPDATE event_effects SET stat_key = alpha_translate_stat_key(stat_key)
WHERE stat_key IS NOT NULL
  AND alpha_translate_stat_key(stat_key) IS NOT NULL
  AND alpha_translate_stat_key(stat_key) <> stat_key;

-- stat_floor inversion already handled inside the crisis_effects
-- block above (folded into the WHERE alpha_should_invert(stat_key)
-- update so the OLD key drives the flip and re-runs are no-ops).

COMMIT;

-- =========================================================================
-- Verification — every surviving row should reference an alpha-19
-- column. Empty result rows = clean migration.
-- =========================================================================
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
SELECT 'crisis_triggers'     AS tbl, id, stat_key FROM crisis_triggers     WHERE stat_key IN (SELECT k FROM legacy_keys)
UNION ALL
SELECT 'crisis_end_triggers' AS tbl, id, stat_key FROM crisis_end_triggers WHERE stat_key IN (SELECT k FROM legacy_keys)
UNION ALL
SELECT 'crisis_effects'      AS tbl, id, stat_key FROM crisis_effects      WHERE stat_key IN (SELECT k FROM legacy_keys)
UNION ALL
SELECT 'event_triggers'      AS tbl, id, stat_key FROM event_triggers      WHERE stat_key IN (SELECT k FROM legacy_keys)
UNION ALL
SELECT 'event_effects'       AS tbl, id, stat_key FROM event_effects       WHERE stat_key IN (SELECT k FROM legacy_keys);
