-- ════════════════════════════════════════════════════════════════
-- Ensure shard.corp_last_processed_tick exists in production
--
-- Mirror of supabase/migrations/20261111_ensure_corp_last_processed_tick.sql.
-- See that file's header for full context. Kept in both trees so
-- npm run migrate:work and supabase db push both apply it.
-- ════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.shard
    ADD COLUMN IF NOT EXISTS corp_last_processed_tick INTEGER DEFAULT -1;

COMMIT;

NOTIFY pgrst, 'reload schema';
