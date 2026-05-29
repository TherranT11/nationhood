-- ════════════════════════════════════════════════════════════════════
-- combat_events — per-tick casualty columns + stalemate row kind
-- ════════════════════════════════════════════════════════════════════
-- Two related changes feeding the war-room's new Monthly Casualties &
-- Losses box (under the per-front Combat Events column):
--
--   1. CASUALTY COLUMNS
--      Adds cas_pressor + cas_claimant ints. processCombat already
--      computes these numbers in-loop when it calls applyCasualties;
--      this migration just gives them somewhere to land.
--      Existing rows default to 0 (historical events: no backfill —
--      the data was never persisted before this commit).
--
--   2. 'stalemate' KIND
--      processCombat applies casualties on every engagement tick
--      (any side assaulting → bleed), but the table previously only
--      accepted rows for meeting / breakthrough (i.e., the line
--      actually moved). Stalemate fights — both sides bleed, neither
--      breaks — would have gone unrecorded, undercounting Monthly
--      Casualties. The new kind value is for THAT case.
--
--      Stalemate rows carry casualties + pressor/claimant nation ids
--      and names (by convention pressor = nation_a, claimant =
--      nation_b on the front) but leave the narrative fields
--      sector_name / army_name / unit_name NULL. The war-room events
--      feed filters to kind IN ('meeting', 'breakthrough') so the
--      prose column never has to render a stalemate row; the
--      Monthly Casualties box sums across all three kinds.
--
-- Idempotent (ADD COLUMN IF NOT EXISTS, DROP CONSTRAINT IF EXISTS).
-- No backfill for the new casualty columns is possible — the bleed
-- from previous ticks was applied to unit manpower in-place and not
-- saved elsewhere. Pre-migration rows read as 0 lost on both sides.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Casualty columns ─────────────────────────────────────────────
ALTER TABLE public.combat_events
    ADD COLUMN IF NOT EXISTS cas_pressor  int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cas_claimant int NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.combat_events.cas_pressor IS
    'Manpower lost by the pressor (advancing in meeting / breakthrough; nation_a by convention in stalemate) during this engagement tick. 0 on rows from before 20270391.';
COMMENT ON COLUMN public.combat_events.cas_claimant IS
    'Manpower lost by the claimant (retreating in meeting / breakthrough; nation_b by convention in stalemate) during this engagement tick. 0 on rows from before 20270391.';

-- ── 2. New 'stalemate' kind ─────────────────────────────────────────
-- Re-apply the CHECK with the wider domain. Drop-then-add is idempotent
-- because the IF EXISTS guard handles re-runs.
ALTER TABLE public.combat_events
    DROP CONSTRAINT IF EXISTS combat_events_kind_check;
ALTER TABLE public.combat_events
    ADD CONSTRAINT combat_events_kind_check
    CHECK (kind IN ('meeting', 'breakthrough', 'stalemate'));

-- Narrative fields drop NOT NULL so stalemate rows don't have to invent
-- a "winning" sector / army / unit. Existing meeting / breakthrough rows
-- keep their populated values (emitCombatEvent still fills them). The
-- renderer falls back to '—' if NULL is encountered, but in practice
-- the events query filters stalemate rows out of the prose feed.
ALTER TABLE public.combat_events
    ALTER COLUMN sector_name DROP NOT NULL,
    ALTER COLUMN army_name   DROP NOT NULL,
    ALTER COLUMN unit_name   DROP NOT NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
