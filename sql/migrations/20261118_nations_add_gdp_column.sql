-- ════════════════════════════════════════════════════════════════
-- Re-add nations.gdp column
--
-- The alpha stats refactor (Phase 7e) dropped both nations.gdp and
-- nations.starting_gdp on the rationale that gdp_growth was the only
-- stat the simulator needed. The display layer (Government Budget
-- panel + nation.html GDP card) keeps reading nation.gdp, treating
-- a missing column as 0 (Number(undefined) || 0). That's why the
-- card has been showing "$0" for every nation.
--
-- Re-adding the column. Stored in $B abstract units (e.g. 358.6 =
-- $358.6B). Per-tick drift driven by applyGdpGrowthDrift in
-- js/game/budget.js advances the value each tick using the
-- gdp_growth stat. _gbFmtGdpCurrency renders the abstract value
-- with B/T suffix.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS. Default 0 so freshly-seeded
-- nations don't render NaN before the seed migration runs.
-- ════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.nations
    ADD COLUMN IF NOT EXISTS gdp NUMERIC DEFAULT 0;

COMMIT;

NOTIFY pgrst, 'reload schema';
