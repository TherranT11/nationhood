-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTORS — drop the BETWEEN 1 AND 3 weight CHECK
-- ═══════════════════════════════════════════════════════════════════════════════
-- The original sectors table (migration 20260426_sectors_phase0) capped
-- weight at 1..3 with a CHECK constraint. We've since dropped the cap in
-- the engine and the admin UI so admins can shape oversized blocs when
-- a nation's design calls for it (e.g. theocracies with a dominant
-- religious-conservative bloc, or sector_weight_targets on target-based
-- options that push a sector to +5).
--
-- The CHECK was still in place at the DB layer, so any UPDATE pushing
-- weight above 3 fails with sectors_weight_check. This migration drops
-- the upper bound while keeping a sane non-negative floor (>= 1).
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.sectors
    DROP CONSTRAINT IF EXISTS sectors_weight_check;

ALTER TABLE public.sectors
    ADD CONSTRAINT sectors_weight_check CHECK (weight >= 1);

NOTIFY pgrst, 'reload schema';

COMMIT;
