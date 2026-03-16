-- ============================================================
-- Migration: stat_schema_migration
-- Remove trade_agreements/sanctions/birth_rate/death_rate stat columns,
-- rename religious → religiosity, add cost_of_living/manufacturing_output/
-- service_output/housing_affordability.
--
-- NOTE: The trade_agreements TABLE is untouched — only the NUMERIC stat
-- column on the nations table is dropped.
-- ============================================================

BEGIN;

-- 1. Drop removed stat columns from nations
ALTER TABLE nations DROP COLUMN IF EXISTS trade_agreements;
ALTER TABLE nations DROP COLUMN IF EXISTS sanctions;
ALTER TABLE nations DROP COLUMN IF EXISTS birth_rate;
ALTER TABLE nations DROP COLUMN IF EXISTS death_rate;

-- 2. Rename religious → religiosity
ALTER TABLE nations RENAME COLUMN religious TO religiosity;

-- 3. Add new stat columns (0-100 scale, default 50)
ALTER TABLE nations ADD COLUMN IF NOT EXISTS cost_of_living NUMERIC DEFAULT 50;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS manufacturing_output NUMERIC DEFAULT 50;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS service_output NUMERIC DEFAULT 50;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS housing_affordability NUMERIC DEFAULT 50;

-- 4. Mirror changes in nations_history
ALTER TABLE nations_history DROP COLUMN IF EXISTS trade_agreements;
ALTER TABLE nations_history DROP COLUMN IF EXISTS sanctions;
ALTER TABLE nations_history DROP COLUMN IF EXISTS birth_rate;
ALTER TABLE nations_history DROP COLUMN IF EXISTS death_rate;
ALTER TABLE nations_history RENAME COLUMN religious TO religiosity;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS cost_of_living NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS manufacturing_output NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS service_output NUMERIC;
ALTER TABLE nations_history ADD COLUMN IF NOT EXISTS housing_affordability NUMERIC;

-- 5. Retarget healthcare policy effects: death_rate → population_growth (direction inverted)
-- Expanded Healthcare Coverage: death_rate down 0.3 → population_growth up 0.3
-- Universal Healthcare: death_rate down 0.2 → population_growth up 0.2
-- Emergency Medical Services: death_rate down 0.5 → population_growth up 0.5
UPDATE policies
SET stat_effects = (
    SELECT jsonb_agg(
        CASE
            WHEN (elem->>'stat_key') = 'death_rate'
            THEN jsonb_set(
                jsonb_set(elem, '{stat_key}', '"population_growth"'),
                '{direction}', '"up"'
            )
            ELSE elem
        END
    )
    FROM jsonb_array_elements(stat_effects) AS elem
)
WHERE stat_effects::text LIKE '%death_rate%';

COMMIT;
