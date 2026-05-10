-- Mirror of sql/migrations/20261118_nations_add_gdp_column.sql.
-- Re-adds nations.gdp dropped by the alpha stats refactor; required
-- before the seed values in 20261117 can land.

BEGIN;

ALTER TABLE public.nations
    ADD COLUMN IF NOT EXISTS gdp NUMERIC DEFAULT 0;

COMMIT;

NOTIFY pgrst, 'reload schema';
