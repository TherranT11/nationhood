-- ════════════════════════════════════════════════════════════════════
-- 20270680 — Fix orphaned-role-slot ghost rows on PS + JM indexes
--
-- Pre-commit audit on d2d4d54 surfaced a logic bug shared by the
-- Permanent Secretary (20270679) and Junior Minister (20270669)
-- partial unique indexes. Both included abandoned_at rows in their
-- uniqueness check:
--
--   CREATE UNIQUE INDEX ... (nation_id, politician_<X>)
--   WHERE politician_<X> IS NOT NULL;
--
-- Scenario: Player A becomes PS of Defense (or JM of Sports), then
-- abandons their politician. The abandoned_at column is set but the
-- role-slot column is left populated. Player B applies for the same
-- slot. The seek RPCs both correctly check `politician_<X> IS NOT
-- NULL AND abandoned_at IS NULL` for vacancy and find the slot
-- free. But B's UPDATE trips the partial index — A's ghost row
-- still occupies the slug — and the EXCEPTION block returns a
-- misleading 'slot_held_by_player' / 'portfolio_filled' even
-- though no live player holds it.
--
-- Fix: rebuild both partial indexes with `AND abandoned_at IS NULL`
-- so they only enforce uniqueness among live holders. Ghost rows
-- coexist freely.
--
-- The proper SoT-correct fix is to clear the role-state columns
-- when a politician is abandoned (cleanup hook at the abandon
-- boundary), but that touches multiple abandon paths. This index
-- adjustment is the focused fix for the immediate audit finding;
-- the cleanup-on-abandon work is a separate concern.
--
-- DROP + CREATE rather than CREATE OR REPLACE because PostgreSQL
-- has no ALTER INDEX body-patch syntax. Index swap is atomic
-- within the BEGIN/COMMIT.
--
-- Apply after 20270679.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Permanent Secretary (Tier 3, 20270679) ──────────────────────
DROP INDEX IF EXISTS public.factions_one_permanent_secretary_per_nation_ministry;
CREATE UNIQUE INDEX factions_one_permanent_secretary_per_nation_ministry
    ON public.factions (nation_id, politician_permanent_secretary_ministry)
    WHERE politician_permanent_secretary_ministry IS NOT NULL
      AND abandoned_at IS NULL;

-- ── Junior Minister (Tier 4, 20270669) ──────────────────────────
DROP INDEX IF EXISTS public.factions_one_junior_per_nation_portfolio;
CREATE UNIQUE INDEX factions_one_junior_per_nation_portfolio
    ON public.factions (nation_id, politician_junior_portfolio)
    WHERE politician_junior_portfolio IS NOT NULL
      AND abandoned_at IS NULL;

COMMIT;
