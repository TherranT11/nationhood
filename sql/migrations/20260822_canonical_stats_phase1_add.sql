-- 20260822_canonical_stats_phase1_add.sql
--
-- Phase 1 of the canonical-stats refactor. Additive only: introduces
-- four new columns on `nations` and `nations_history`, backfilled from
-- the closest existing column. Old columns stay populated so unconverted
-- code keeps working until Phase 3 sweeps the call-sites.
--
-- New canonical stats:
--   global_image       — replaces the `power` alias (which mapped to
--                        international_reputation, intl_reputation,
--                        diplomatic_standing, tourism, sanctions, and
--                        trade_agreements). Backfill from
--                        international_reputation since that's the
--                        primary underlying column today.
--   unskilled_workers  — half of the workforce split. Backfill from
--                        labor_force_participation / 2 — the most direct
--                        workforce proxy in the existing schema. The
--                        50/50 split is intentional per design call;
--                        education-weighted refinement is a future pass.
--   skilled_workers    — other half of the workforce split. Same
--                        backfill.
--   wages              — replaces minimum_wage. Direct copy of the
--                        existing minimum_wage value for a clean
--                        starting state; semantic broadening (wages
--                        ≠ floor) happens in Phase 4 UI work.
--
-- Decay is intentionally left OFF for the four new stats per design
-- direction — they will not drift in stats.js until decay rules are
-- added in a later phase.
--
-- The legacy capitalized "GDP" bigint column and the new lowercase
-- gdp numeric column both already exist; this migration leaves them
-- alone. "GDP" gets dropped in Phase 5 once all readers have moved
-- to the canonical lowercase `gdp`.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + UPDATE on every existing row.
-- Re-running is safe: the UPDATE re-copies from the same source columns
-- (still present in this phase). Phase 5 will DROP the source columns
-- after the code conversion sweep is complete.

BEGIN;

-- ── nations ────────────────────────────────────────────────────────

ALTER TABLE nations
    ADD COLUMN IF NOT EXISTS global_image       numeric NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS unskilled_workers  numeric NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS skilled_workers    numeric NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS wages              numeric NOT NULL DEFAULT 50;

UPDATE nations
SET global_image      = COALESCE(international_reputation, 50),
    unskilled_workers = COALESCE(labor_force_participation, 50) / 2.0,
    skilled_workers   = COALESCE(labor_force_participation, 50) / 2.0,
    wages             = COALESCE(minimum_wage, 50);

-- ── nations_history ────────────────────────────────────────────────
-- nations_history mirrors nations, but its columns are nullable
-- (per-tick snapshots can be partial). Defaults are not applied to
-- avoid surprising historical chart consumers.

ALTER TABLE nations_history
    ADD COLUMN IF NOT EXISTS global_image       numeric,
    ADD COLUMN IF NOT EXISTS unskilled_workers  numeric,
    ADD COLUMN IF NOT EXISTS skilled_workers    numeric,
    ADD COLUMN IF NOT EXISTS wages              numeric;

UPDATE nations_history
SET global_image      = COALESCE(international_reputation, 50),
    unskilled_workers = COALESCE(labor_force_participation, 50) / 2.0,
    skilled_workers   = COALESCE(labor_force_participation, 50) / 2.0,
    wages             = COALESCE(minimum_wage, 50)
WHERE international_reputation IS NOT NULL
   OR labor_force_participation IS NOT NULL
   OR minimum_wage IS NOT NULL;

COMMIT;

-- Tell PostgREST to reload its schema cache so the new columns are
-- visible to clients without a manual restart.
NOTIFY pgrst, 'reload schema';
