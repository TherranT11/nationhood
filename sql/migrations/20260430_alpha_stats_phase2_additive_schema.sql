-- =========================================================================
-- ALPHA STATS REFACTOR — Phase 2: additive schema + backfill
--
-- Adds the 14 new columns that don't already exist on `nations`. The other
-- five new column names (budget, debt, gdp_growth, immigration,
-- standard_of_living) already exist and stay as-is.
--
-- Runs after Phase 1 inventory. Old columns are NOT touched — Phase 9 drops
-- them. Until then, both schemas coexist and `seed_new_stats()` keeps the
-- new columns derivable from the old.
--
-- Mapping (locked-in column names per the design discussion):
--
--   NEW                | SOURCE
--   ───────────────────┼──────────────────────────────────────────────────
--   control            | net-new (default 50)
--   unrest             | weighted avg: civil_unrest * 0.6
--                      |             + terrorism * 0.25
--                      |             + political_violence * 0.15
--   authority          | net-new (default 50)
--   crown_authority    | 50 for absolute monarchies, NULL otherwise
--   energy             | net-new (default 50)
--   health             | avg(healthcare_accessibility, healthcare_quality,
--                      |     lifespan, beds_per_100k)
--   education          | rename from higher_education
--   power              | net-new (default 50)
--   infrastructure     | avg(physical_infrastructure,
--                      |     digital_infrastructure, rail_network)
--   industry           | net-new (default 50)
--   farmland           | rename from arable_land
--   cost_of_living     | net-new (default 50)
--   goods              | net-new (default 50)
--   workforce          | avg(urbanization, 100 - unemployment,
--                      |     labor_force_participation), clamped to [0,100]
--
-- Idempotent: the seed function uses COALESCE so re-running preserves any
-- admin-edited values. ADD COLUMN IF NOT EXISTS guards re-runnability of
-- the schema changes too.
-- =========================================================================

BEGIN;

-- ── Step 1: add columns (NULL-able, no DEFAULT yet so we can detect
--           "not yet seeded" rows during the backfill) ─────────────────────
ALTER TABLE nations ADD COLUMN IF NOT EXISTS control          NUMERIC;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS unrest           NUMERIC;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS authority        NUMERIC;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS crown_authority  NUMERIC;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS energy           NUMERIC;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS health           NUMERIC;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS education        NUMERIC;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS power            NUMERIC;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS infrastructure   NUMERIC;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS industry         NUMERIC;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS farmland         NUMERIC;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS cost_of_living   NUMERIC;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS goods            NUMERIC;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS workforce        NUMERIC;

-- ── Step 2: seed function — backfills new columns from old per the
--           mapping table. COALESCE on the target column means
--           admin-edited values are never clobbered on re-run. Callable
--           per-nation so admin tools can re-derive a single nation's
--           values later. ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION seed_new_stats(p_nation_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE nations SET
        control       = COALESCE(control,       50),
        authority     = COALESCE(authority,     50),
        energy        = COALESCE(energy,        50),
        power         = COALESCE(power,         50),
        industry      = COALESCE(industry,      50),
        cost_of_living = COALESCE(cost_of_living, 50),
        goods         = COALESCE(goods,         50),

        unrest = COALESCE(unrest, ROUND(
            COALESCE(civil_unrest,       50) * 0.60 +
            COALESCE(terrorism,          50) * 0.25 +
            COALESCE(political_violence, 50) * 0.15
        , 2)),

        health = COALESCE(health, ROUND((
            COALESCE(healthcare_accessibility, 50) +
            COALESCE(healthcare_quality,       50) +
            COALESCE(lifespan,                 50) +
            COALESCE(beds_per_100k,            50)
        ) / 4.0, 2)),

        infrastructure = COALESCE(infrastructure, ROUND((
            COALESCE(physical_infrastructure, 50) +
            COALESCE(digital_infrastructure,  50) +
            COALESCE(rail_network,            50)
        ) / 3.0, 2)),

        workforce = COALESCE(workforce, GREATEST(0, LEAST(100, ROUND((
            COALESCE(urbanization,                50) +
            (100 - COALESCE(unemployment,         50)) +
            COALESCE(labor_force_participation,   50)
        ) / 3.0, 2)))),

        education = COALESCE(education, COALESCE(higher_education, 50)),
        farmland  = COALESCE(farmland,  COALESCE(arable_land,      50)),

        crown_authority = CASE
            WHEN crown_authority IS NOT NULL THEN crown_authority
            WHEN government_type ILIKE 'absolute monarchy%' THEN 50
            ELSE NULL
        END
    WHERE id = p_nation_id;
END;
$$;

-- ── Step 3: run the backfill once for every existing nation ─────────────
SELECT seed_new_stats(id) FROM nations;

-- ── Step 4: lock in DEFAULT + NOT NULL for future INSERTs.
--           crown_authority deliberately stays NULL-able. ────────────────
ALTER TABLE nations ALTER COLUMN control        SET DEFAULT 50;
ALTER TABLE nations ALTER COLUMN control        SET NOT NULL;
ALTER TABLE nations ALTER COLUMN unrest         SET DEFAULT 50;
ALTER TABLE nations ALTER COLUMN unrest         SET NOT NULL;
ALTER TABLE nations ALTER COLUMN authority      SET DEFAULT 50;
ALTER TABLE nations ALTER COLUMN authority      SET NOT NULL;
ALTER TABLE nations ALTER COLUMN energy         SET DEFAULT 50;
ALTER TABLE nations ALTER COLUMN energy         SET NOT NULL;
ALTER TABLE nations ALTER COLUMN health         SET DEFAULT 50;
ALTER TABLE nations ALTER COLUMN health         SET NOT NULL;
ALTER TABLE nations ALTER COLUMN education      SET DEFAULT 50;
ALTER TABLE nations ALTER COLUMN education      SET NOT NULL;
ALTER TABLE nations ALTER COLUMN power          SET DEFAULT 50;
ALTER TABLE nations ALTER COLUMN power          SET NOT NULL;
ALTER TABLE nations ALTER COLUMN infrastructure SET DEFAULT 50;
ALTER TABLE nations ALTER COLUMN infrastructure SET NOT NULL;
ALTER TABLE nations ALTER COLUMN industry       SET DEFAULT 50;
ALTER TABLE nations ALTER COLUMN industry       SET NOT NULL;
ALTER TABLE nations ALTER COLUMN farmland       SET DEFAULT 50;
ALTER TABLE nations ALTER COLUMN farmland       SET NOT NULL;
ALTER TABLE nations ALTER COLUMN cost_of_living SET DEFAULT 50;
ALTER TABLE nations ALTER COLUMN cost_of_living SET NOT NULL;
ALTER TABLE nations ALTER COLUMN goods          SET DEFAULT 50;
ALTER TABLE nations ALTER COLUMN goods          SET NOT NULL;
ALTER TABLE nations ALTER COLUMN workforce      SET DEFAULT 50;
ALTER TABLE nations ALTER COLUMN workforce      SET NOT NULL;

-- ── Step 5: range CHECK (0..100, NULL allowed for crown_authority).
--           NOT VALID matches the pattern used by independent_seats etc. ─
ALTER TABLE nations DROP CONSTRAINT IF EXISTS nations_alpha_stats_range;
ALTER TABLE nations ADD CONSTRAINT nations_alpha_stats_range CHECK (
    control          BETWEEN 0 AND 100 AND
    unrest           BETWEEN 0 AND 100 AND
    authority        BETWEEN 0 AND 100 AND
    (crown_authority IS NULL OR crown_authority BETWEEN 0 AND 100) AND
    energy           BETWEEN 0 AND 100 AND
    health           BETWEEN 0 AND 100 AND
    education        BETWEEN 0 AND 100 AND
    power            BETWEEN 0 AND 100 AND
    infrastructure   BETWEEN 0 AND 100 AND
    industry         BETWEEN 0 AND 100 AND
    farmland         BETWEEN 0 AND 100 AND
    cost_of_living   BETWEEN 0 AND 100 AND
    goods            BETWEEN 0 AND 100 AND
    workforce        BETWEEN 0 AND 100
) NOT VALID;

-- ── Step 6: column documentation. Anyone reading the schema will see how
--           the new columns were sourced. ──────────────────────────────
COMMENT ON COLUMN nations.control IS
    'Alpha Phase 2: practical reach of the state (enforce laws, collect taxes, project will). 0-100. Net-new column, default 50.';
COMMENT ON COLUMN nations.unrest IS
    'Alpha Phase 2: public discontent / protests / strikes / insurgency. 0-100. Backfilled from civil_unrest * 0.6 + terrorism * 0.25 + political_violence * 0.15.';
COMMENT ON COLUMN nations.authority IS
    'Alpha Phase 2: legitimacy / acceptance commanded from population. Distinct from control (can enforce) — authority is whether enforcement is welcomed. 0-100. Net-new column.';
COMMENT ON COLUMN nations.crown_authority IS
    'Alpha Phase 2: monarch personal power vs nobility / clergy / vassals. 0-100, NULL for non-monarchies. Seeded at 50 for nations whose government_type begins "Absolute Monarchy".';
COMMENT ON COLUMN nations.energy IS
    'Alpha Phase 2: capacity to produce + distribute power (electricity, fuel, industrial inputs). 0-100. Net-new column.';
COMMENT ON COLUMN nations.health IS
    'Alpha Phase 2: population wellbeing (life expectancy, disease, medical infrastructure). 0-100. Backfilled from avg(healthcare_accessibility, healthcare_quality, lifespan, beds_per_100k).';
COMMENT ON COLUMN nations.education IS
    'Alpha Phase 2: literacy, skill level, knowledge base. 0-100. Backfilled from higher_education.';
COMMENT ON COLUMN nations.power IS
    'Alpha Phase 2: ability to project military / diplomatic / economic force beyond borders. 0-100. Net-new column.';
COMMENT ON COLUMN nations.infrastructure IS
    'Alpha Phase 2: physical backbone (roads, rail, ports, telecom, water). 0-100. Backfilled from avg(physical_infrastructure, digital_infrastructure, rail_network).';
COMMENT ON COLUMN nations.industry IS
    'Alpha Phase 2: manufacturing + productive capacity. 0-100. Net-new column (was JSONB-only as manufacturing_output).';
COMMENT ON COLUMN nations.farmland IS
    'Alpha Phase 2: agricultural capacity to feed population + export. 0-100. Backfilled from arable_land.';
COMMENT ON COLUMN nations.cost_of_living IS
    'Alpha Phase 2: how expensive daily necessities are. 0-100, where high is bad. Net-new column (was JSONB-only).';
COMMENT ON COLUMN nations.goods IS
    'Alpha Phase 2: availability + variety of consumer products. 0-100. Net-new column.';
COMMENT ON COLUMN nations.workforce IS
    'Alpha Phase 2: size + skill of working-age population in employment. 0-100. Backfilled from avg(urbanization, 100 - unemployment, labor_force_participation).';

COMMIT;

-- Verify: every nation should now have non-null new stat columns
-- (crown_authority NULL only on non-monarchies). Inspect manually to
-- catch any obviously-bad backfill values before Phase 3 cuts the UI over.
SELECT
    name, government_type,
    control, unrest, authority, crown_authority,
    energy, health, education, power,
    infrastructure, industry, farmland,
    cost_of_living, goods, workforce
FROM nations
ORDER BY name;
