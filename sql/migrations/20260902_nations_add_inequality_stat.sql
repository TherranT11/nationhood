-- ═══════════════════════════════════════════════════════════════════════════════
-- NATIONS — add `inequality` stat column
-- ═══════════════════════════════════════════════════════════════════════════════
-- New 0-100 stat that target-based policies can pull on (Stat Targets in
-- policyadmin.html → Wellbeing group). Defaults to 50 for every nation;
-- the engine treats it like any other column on `nations` once it's in
-- NATION_STAT_COLUMNS in js/game/stats.js (companion code change in the
-- same commit).
--
-- Idempotent: ADD COLUMN IF NOT EXISTS guards against re-runs, and the
-- backfill UPDATE is a no-op once the column exists with its default.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.nations
    ADD COLUMN IF NOT EXISTS inequality SMALLINT NOT NULL DEFAULT 50
        CHECK (inequality BETWEEN 0 AND 100);

-- Backfill any rows the default didn't catch (e.g. if the column was
-- added in a separate transaction without the DEFAULT clause). Safe
-- to run repeatedly.
UPDATE public.nations
SET inequality = 50
WHERE inequality IS NULL;

COMMENT ON COLUMN public.nations.inequality IS
    'Income / wealth inequality index, 0-100. Higher = more unequal. Defaults to 50. Target-based policies can pull this via stat_targets.';

NOTIFY pgrst, 'reload schema';

COMMIT;
