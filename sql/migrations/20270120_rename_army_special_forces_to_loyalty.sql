-- ════════════════════════════════════════════════════════════════
-- Rename factions.army_special_forces → factions.army_loyalty
--
-- The "Special Forces" army operating modifier is repurposed as
-- "Loyalty". RENAME (not add/drop) so existing values carry over and
-- there is exactly one source of truth — nothing is named
-- special_forces while meaning loyalty. Display-only modifier (no
-- engine/tick consumers; only army-dashboard.html reads it), so the
-- rename is the whole data-side change.
--
-- Idempotent: renames only when the old column still exists and the
-- new one doesn't, so re-running (or running after a partial apply)
-- is a safe no-op. Ordered after 20270104 (which creates the column).
-- ════════════════════════════════════════════════════════════════

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'factions'
           AND column_name = 'army_special_forces'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'factions'
           AND column_name = 'army_loyalty'
    ) THEN
        ALTER TABLE public.factions RENAME COLUMN army_special_forces TO army_loyalty;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
