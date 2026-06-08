-- ════════════════════════════════════════════════════════════════════
-- 20270736 — Cities: stats + budget rescale to 1-10 single integers
--
-- Per user spec, every city stat (and the budget) is a single
-- integer 1-10. The 0-100 storage + display-time banding the v1.0
-- /v1.1 schema used was over-engineered — the player-facing model
-- has always been 1-10 with 5 descriptive bands. Collapsing storage
-- to match the player model removes the conversion layer and lets
-- the mayor actions (next migration) write whole-number deltas
-- without rounding gymnastics.
--
-- Columns rescaled (10 total):
--   • budget         bigint → int 1-10 (was dollars, default $1M)
--   • infrastructure int 0-100 → int 1-10
--   • appeal         int 0-100 → int 1-10
--   • growth         int 0-100 → int 1-10
--   • crime          int 0-100 → int 1-10
--   • approval       int 0-100 → int 1-10
--   • pollution      int 0-100 → int 1-10
--   • jobs           int 0-100 → int 1-10
--   • services       int 0-100 → int 1-10
--   • affordability  int 0-100 → int 1-10
--
-- Backfill formula — int 0-100 stats: CEIL(stat / 10.0) clamped
-- to 1-10. budget: CEIL(budget / 1_000_000) clamped 1-10. CEIL
-- (not ROUND) is the band-preserving choice — ROUND would silently
-- shift bucket-boundary values like 81 → 8 (band 3 "Booming")
-- when the old 81 was band 4 "Hyper-Growth." CEIL keeps every
-- value in its original descriptive bucket:
--   old  1-20  (band 0) → CEIL/10 = 1-2  → (1-2)/2 floor = 0 ✓
--   old 21-40  (band 1) → CEIL/10 = 3-4  → (2-3)/2 floor = 1 ✓
--   old 41-60  (band 2) → CEIL/10 = 5-6  → (4-5)/2 floor = 2 ✓
--   old 61-80  (band 3) → CEIL/10 = 7-8  → (6-7)/2 floor = 3 ✓
--   old 81-100 (band 4) → CEIL/10 = 9-10 → (8-9)/2 floor = 4 ✓
--
-- Defaults: 5 across the board (band 2, the middle label
-- "Adequate / Moderate / Pleasant but Modest / etc."). crime
-- defaults shift from 25 → 3 (still the second band, "Smuggling
-- Dominant" — same flavour as the prior default).
--
-- Constraints replaced in-place — drop the BETWEEN 0 AND 100
-- CHECKs, swap the type for budget, add BETWEEN 1 AND 10 CHECKs.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Drop the old CHECK constraints ───────────────────────────────
-- Names match Postgres' default constraint-naming pattern
-- (table_column_check) since the original CREATE TABLE / ALTER
-- TABLE statements didn't give them explicit names.
ALTER TABLE public.cities
    DROP CONSTRAINT IF EXISTS cities_infrastructure_check,
    DROP CONSTRAINT IF EXISTS cities_appeal_check,
    DROP CONSTRAINT IF EXISTS cities_growth_check,
    DROP CONSTRAINT IF EXISTS cities_crime_check,
    DROP CONSTRAINT IF EXISTS cities_approval_check,
    DROP CONSTRAINT IF EXISTS cities_pollution_check,
    DROP CONSTRAINT IF EXISTS cities_jobs_check,
    DROP CONSTRAINT IF EXISTS cities_services_check,
    DROP CONSTRAINT IF EXISTS cities_affordability_check;

-- ── 2. Backfill existing rows to the 1-10 scale ─────────────────────
-- ROUND(/10) with the 1..10 clamp preserves the descriptive band
-- label every city is currently rendering (band index stable).
UPDATE public.cities SET
    infrastructure = GREATEST(1, LEAST(10, CEIL(infrastructure / 10.0)::int)),
    appeal         = GREATEST(1, LEAST(10, CEIL(appeal         / 10.0)::int)),
    growth         = GREATEST(1, LEAST(10, CEIL(growth         / 10.0)::int)),
    crime          = GREATEST(1, LEAST(10, CEIL(crime          / 10.0)::int)),
    approval       = GREATEST(1, LEAST(10, CEIL(approval       / 10.0)::int)),
    pollution      = GREATEST(1, LEAST(10, CEIL(pollution      / 10.0)::int)),
    jobs           = GREATEST(1, LEAST(10, CEIL(jobs           / 10.0)::int)),
    services       = GREATEST(1, LEAST(10, CEIL(services       / 10.0)::int)),
    affordability  = GREATEST(1, LEAST(10, CEIL(affordability  / 10.0)::int)),
    budget         = GREATEST(1, LEAST(10, CEIL(budget / 1000000.0)::int));

-- ── 3. Change budget type from bigint → int ─────────────────────────
ALTER TABLE public.cities
    ALTER COLUMN budget TYPE int USING budget::int;

-- ── 4. New defaults: 5 across the board (band 2 "middle") ───────────
-- crime default goes 25 → 3 (band 1, "Smuggling Dominant" — same
-- flavour as the pre-migration 25/0-100 default).
ALTER TABLE public.cities
    ALTER COLUMN budget         SET DEFAULT 5,
    ALTER COLUMN infrastructure SET DEFAULT 5,
    ALTER COLUMN appeal         SET DEFAULT 5,
    ALTER COLUMN growth         SET DEFAULT 5,
    ALTER COLUMN crime          SET DEFAULT 3,
    ALTER COLUMN approval       SET DEFAULT 5,
    ALTER COLUMN pollution      SET DEFAULT 5,
    ALTER COLUMN jobs           SET DEFAULT 5,
    ALTER COLUMN services       SET DEFAULT 5,
    ALTER COLUMN affordability  SET DEFAULT 5;

-- ── 5. Add the new 1-10 CHECK constraints ──────────────────────────
ALTER TABLE public.cities
    ADD CONSTRAINT cities_budget_check         CHECK (budget         BETWEEN 1 AND 10),
    ADD CONSTRAINT cities_infrastructure_check CHECK (infrastructure BETWEEN 1 AND 10),
    ADD CONSTRAINT cities_appeal_check         CHECK (appeal         BETWEEN 1 AND 10),
    ADD CONSTRAINT cities_growth_check         CHECK (growth         BETWEEN 1 AND 10),
    ADD CONSTRAINT cities_crime_check          CHECK (crime          BETWEEN 1 AND 10),
    ADD CONSTRAINT cities_approval_check       CHECK (approval       BETWEEN 1 AND 10),
    ADD CONSTRAINT cities_pollution_check      CHECK (pollution      BETWEEN 1 AND 10),
    ADD CONSTRAINT cities_jobs_check           CHECK (jobs           BETWEEN 1 AND 10),
    ADD CONSTRAINT cities_services_check       CHECK (services       BETWEEN 1 AND 10),
    ADD CONSTRAINT cities_affordability_check  CHECK (affordability  BETWEEN 1 AND 10);

-- ── 6. Refresh column comments to reflect the new scale ─────────────
COMMENT ON COLUMN public.cities.budget         IS '20270736 — int 1-10. Mayor''s discretionary fund stat. Collect Taxes adds floor(growth/3); capped at 10.';
COMMENT ON COLUMN public.cities.infrastructure IS '20270736 — int 1-10. UI maps via city-labels.js bands (Failing / Strained / Adequate / Modern / Advanced).';
COMMENT ON COLUMN public.cities.appeal         IS '20270736 — int 1-10. UI maps via city-labels.js bands (Bleak Eyesore / Faded / Pleasant / Charming / Breathtaking).';
COMMENT ON COLUMN public.cities.growth         IS '20270736 — int 1-10. Drives the Collect Taxes yield (floor(growth/3) added to budget). Campaign decrements by 1, floored at 1.';
COMMENT ON COLUMN public.cities.crime          IS '20270736 — int 1-10. UI bands (Safe / Smuggling / Organized / Gangs / Total Lawlessness).';
COMMENT ON COLUMN public.cities.approval       IS '20270736 — int 1-10. Mayor approval. Not yet wired into actions.';
COMMENT ON COLUMN public.cities.pollution      IS '20270736 — int 1-10. UI bands (Pristine / Minor / Moderate / Severe / Hazardous).';
COMMENT ON COLUMN public.cities.jobs           IS '20270736 — int 1-10. UI bands (Critical Deficit / Limited / Modest / Robust / Surging).';
COMMENT ON COLUMN public.cities.services       IS '20270736 — int 1-10. UI bands (Non-Existent / Long Queues / Functional / Efficient / Comprehensive).';
COMMENT ON COLUMN public.cities.affordability  IS '20270736 — int 1-10. UI bands (Extreme Hardship / Pricing Out / Balance / Accessible / Dirt Cheap).';

COMMIT;
