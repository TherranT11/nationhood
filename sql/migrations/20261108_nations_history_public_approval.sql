-- ════════════════════════════════════════════════════════════════
-- nations_history.public_approval — close schema drift from the
-- 20260430 alpha-stats rename.
--
-- 20260430_alpha_stats_phase8_5_1_schema_corrections.sql renamed
-- nations.authority → nations.public_approval but did not touch
-- nations_history. Result: snapshotNationHistory (advance-tick,
-- once per nation per tick) tries to UPSERT a public_approval
-- column that doesn't exist, the upsert errors silently for that
-- column, and nation.html's Public Approval card sparkline pulls
-- back empty arrays from nations_history.
--
-- Defensive: rename if the legacy `authority` column still exists,
-- otherwise just add `public_approval` fresh. Both branches are
-- idempotent. After this lands, snapshots succeed; sparkline data
-- accumulates over the next several ticks.
-- ════════════════════════════════════════════════════════════════

BEGIN;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='nations_history'
                 AND column_name='authority')
    THEN
        ALTER TABLE public.nations_history
            RENAME COLUMN authority TO public_approval;
    END IF;
END $$;

ALTER TABLE public.nations_history
    ADD COLUMN IF NOT EXISTS public_approval NUMERIC;

COMMIT;

NOTIFY pgrst, 'reload schema';
