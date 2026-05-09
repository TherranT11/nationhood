-- ════════════════════════════════════════════════════════════════
-- Ensure shard.corp_last_processed_tick exists in production
--
-- The advance-corp-tick edge function reads + writes this column
-- on every invocation (advance-corp-tick/index.ts:4488, 4500, 4546,
-- 4549). When the column is missing, every tick aborts at the
-- claim step with:
--   Tick claim failed: column shard.corp_last_processed_tick does not exist
--
-- Why we need a NEW migration with TODAY's date:
--   The original ALTER lived at sql/migrations/20260402_*.sql but was
--   never applied to prod. Commit af4751e tried to fix this on
--   2026-05-08 by mirroring the file to supabase/migrations/ — but
--   reused the original 20260402 timestamp. supabase db push only
--   applies migrations with timestamps NEWER than its tracked head;
--   backdated files are silently skipped. So the mirror deployed
--   nothing.
--
-- This file uses today's timestamp so the next db push WILL execute
-- it. ADD COLUMN IF NOT EXISTS makes it safe to re-run.
-- ════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.shard
    ADD COLUMN IF NOT EXISTS corp_last_processed_tick INTEGER DEFAULT -1;

COMMIT;

NOTIFY pgrst, 'reload schema';
