-- ════════════════════════════════════════════════════════════════
-- Add gdp column to nations_history
--
-- sql/work_schema.sql:155 lists nations_history.gdp, but prod schema
-- has drifted — the column doesn't exist. snapshotNationHistory
-- (js/game/political-actions.js) writes the column iff it's in
-- HISTORY_SNAPSHOT_COLUMNS. With this migration + the JS-side
-- addition of 'gdp' to NATION_STAT_COLUMNS (js/game/stats.js), every
-- subsequent tick records the live nation.gdp into history, and the
-- nation.html GDP card sparkline starts filling.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS.
-- ════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.nations_history
    ADD COLUMN IF NOT EXISTS gdp NUMERIC;

COMMIT;

NOTIFY pgrst, 'reload schema';
