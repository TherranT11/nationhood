-- ═══════════════════════════════════════════════════════════════════════════════
-- POLITICIAN-SIDE NATION STATS — fork from the legacy (parties) columns
-- ═══════════════════════════════════════════════════════════════════════════════
-- The politician nation page now reads from its own dedicated columns rather
-- than the legacy ones the parties surface uses. This keeps each surface
-- writable independently — when Parties is sunsetted the legacy columns can
-- be dropped without touching the politician renderer.
--
-- New columns on `nations`:
--   politician_gdp            NUMERIC (dollar amount)
--   politician_budget         NUMERIC (dollar amount — treasury balance)
--   politician_debt           NUMERIC (dollar amount)
--   politician_stability      INT 0-100
--   politician_civil_freedoms INT 0-100
--
-- All five default to safe baselines (0 for the money figures, 50 for the
-- 0-100 scores) so existing nations carry a value the renderer can show.
-- Hajjara is seeded with the canonical values requested in the design pass.
-- Other nations stay at the default until an admin tool / migration sets
-- them per nation.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE nations
    ADD COLUMN IF NOT EXISTS politician_gdp            NUMERIC NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS politician_budget         NUMERIC NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS politician_debt           NUMERIC NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS politician_stability      INT NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS politician_civil_freedoms INT NOT NULL DEFAULT 50;

COMMENT ON COLUMN nations.politician_gdp            IS 'Dollar GDP shown on the politician nation page. Distinct from the legacy nations.gdp the parties surface reads.';
COMMENT ON COLUMN nations.politician_budget         IS 'Dollar treasury balance shown on the politician nation page (was a 0-100 score on the legacy side).';
COMMENT ON COLUMN nations.politician_debt           IS 'Dollar national debt shown on the politician nation page.';
COMMENT ON COLUMN nations.politician_stability      IS '0-100 stability score on the politician nation page. Independent of the legacy 100−unrest derivation.';
COMMENT ON COLUMN nations.politician_civil_freedoms IS '0-100 civil freedoms score on the politician nation page. Distinct from the legacy global_image column.';

-- Seed Hajjara to the canonical values from the design pass.
UPDATE nations
   SET politician_gdp            = 441000000000,
       politician_budget         = 126000000000,
       politician_debt           = 106000000000,
       politician_stability      = 91,
       politician_civil_freedoms = 41
 WHERE LOWER(name) = 'hajjara';

COMMIT;
