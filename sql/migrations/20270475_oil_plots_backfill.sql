-- Re-run the oil-plot backfill from 20270473.
--
-- The backfill DO block in 20270473_oil_plots.sql calls
-- _seed_oil_plots_for_nation for every nation with a positive
-- nation_industry_bases.base for industry_key='oil_gas'. On Melizea's
-- DB the seed produced zero plots, so the Surveys panel showed
-- "No oil plots seeded for this nation yet."
--
-- _seed_oil_plots_for_nation is idempotent (skips nations already at
-- their target plot count), so re-running it is safe whether the
-- original DO block worked or not.

BEGIN;

DO $$
DECLARE
    v_nation_id uuid;
BEGIN
    FOR v_nation_id IN
        SELECT DISTINCT nation_id
          FROM nation_industry_bases
         WHERE industry_key = 'oil_gas' AND base > 0
    LOOP
        PERFORM _seed_oil_plots_for_nation(v_nation_id);
    END LOOP;
END $$;

COMMIT;
