-- ════════════════════════════════════════════════════════════════
-- Add state_apparatus column to nations_history
--
-- Companion to commit 4ed35e3 (control → state_apparatus rename).
-- The user manually renamed nations.control → nations.state_apparatus
-- but nations_history was never touched — neither column exists on
-- prod (verified via information_schema query).
--
-- Result: snapshotNationHistory has been failing every tick since
-- tick 45 because the upsert payload includes state_apparatus as
-- an unknown column → PostgREST 42703 → entire row rejected → no
-- history written for ANY column. nations_history.latest_tick has
-- been pinned at 45 while live nation rows advanced to 74+.
--
-- This migration adds the column. snapshotNationHistory resumes
-- writing on the next tick after deployment.
-- ════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.nations_history
    ADD COLUMN IF NOT EXISTS state_apparatus NUMERIC;

COMMIT;

NOTIFY pgrst, 'reload schema';
