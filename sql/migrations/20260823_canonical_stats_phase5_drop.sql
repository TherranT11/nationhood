-- 20260823_canonical_stats_phase5_drop.sql
--
-- Phase 5 of the canonical-stats refactor. Drops the legacy stat
-- columns that have been replaced by canonical names in Phases 1–4.
--
-- IRREVERSIBLE: column drops cannot be rolled back without restoring
-- from backup. Pre-flight checks before running:
--
--   1. Verify both edge functions are deployed at >= 9c406a4 (the
--      Phase-2/3 sync). Older deployments still SELECT/UPDATE the
--      columns being dropped here.
--        supabase functions deploy advance-tick
--        supabase functions deploy advance-corp-tick
--
--   2. Verify the canonical replacement columns are populated:
--        SELECT id, name,
--               global_image, unskilled_workers, skilled_workers, wages
--          FROM nations
--         WHERE global_image IS NULL OR unskilled_workers IS NULL
--            OR skilled_workers IS NULL OR wages IS NULL
--         LIMIT 5;
--      Should return zero rows (Phase 1's backfill should have
--      populated every existing nation).
--
-- Columns dropped per design directive:
--   nations.international_reputation  → replaced by nations.global_image
--   nations.sanctions                 → folded into nations.global_image
--   nations.labor_force_participation → split into unskilled/skilled_workers
--   nations.unemployment              → split into unskilled/skilled_workers
--   nations.minimum_wage              → replaced by nations.wages
--   nations."GDP" (capitalized)       → kept lowercase nations.gdp instead
--
-- Same drops applied to nations_history. Snapshot rows older than
-- this migration retain their pre-drop values in the new columns
-- (Phase 1 backfill already copied them).
--
-- Columns INTENTIONALLY KEPT despite being legacy aliases:
--   nations.urbanization     — Phase 2 aliased to skilled_workers but
--                              the underlying column may still be
--                              referenced by event-log rows / saved
--                              JSON. Drop in a later cleanup if needed.
--   nations.trade_agreements — Phase 2 aliased to global_image but
--                              user did not request drop.
--
-- Aliases in stats.js are RETAINED so legacy stat_effects JSON in
-- DB rows (events, policies, bills, EOs) keeps routing correctly.

BEGIN;

ALTER TABLE nations
    DROP COLUMN IF EXISTS international_reputation,
    DROP COLUMN IF EXISTS sanctions,
    DROP COLUMN IF EXISTS labor_force_participation,
    DROP COLUMN IF EXISTS unemployment,
    DROP COLUMN IF EXISTS minimum_wage,
    DROP COLUMN IF EXISTS "GDP";

ALTER TABLE nations_history
    DROP COLUMN IF EXISTS international_reputation,
    DROP COLUMN IF EXISTS sanctions,
    DROP COLUMN IF EXISTS labor_force_participation,
    DROP COLUMN IF EXISTS unemployment,
    DROP COLUMN IF EXISTS minimum_wage;
-- nations_history never had a capitalized "GDP" column; only the
-- lowercase gdp, which we keep.

COMMIT;

NOTIFY pgrst, 'reload schema';
