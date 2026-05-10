-- Mirror of sql/migrations/20261115_nations_history_gdp_column.sql.
-- Adds the missing nations_history.gdp column so snapshotNationHistory
-- can record the live nation.gdp each tick.

BEGIN;

ALTER TABLE public.nations_history
    ADD COLUMN IF NOT EXISTS gdp NUMERIC;

COMMIT;

NOTIFY pgrst, 'reload schema';
