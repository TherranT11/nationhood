-- Drop the temporary advance-corp-tick stubs from 20270488.
--
-- ⚠️  DO NOT PUSH UNTIL `supabase functions deploy advance-corp-tick`
--    HAS RUN. The deployed edge function still calls into these six
--    objects, and the stubs are the only thing keeping the per-tick
--    log spam silent. Dropping them before the redeploy reintroduces
--    the errors that 20270488 was written to silence.
--
-- File is staged in docs/pending-migrations/ so the db-push.yml path
-- trigger (supabase/migrations/**) doesn't fire and the supabase CLI
-- doesn't see it. To ship:
--   1. supabase functions deploy advance-corp-tick
--   2. git mv docs/pending-migrations/20270493_…sql supabase/migrations/
--   3. git commit + push to main; db-push.yml applies it.

BEGIN;

-- Stub tables (20270488 lines 42-125)
DROP TABLE IF EXISTS public.corp_properties              CASCADE;
DROP TABLE IF EXISTS public.corp_executives              CASCADE;
DROP TABLE IF EXISTS public.corp_equipment_deliveries    CASCADE;
DROP TABLE IF EXISTS public.loan_negotiations            CASCADE;

-- Stub RPCs (20270488 lines 127-138)
DROP FUNCTION IF EXISTS public.process_lawsuit_deadlines();
DROP FUNCTION IF EXISTS public.auto_abandon_stale_negotiations(int);

NOTIFY pgrst, 'reload schema';

COMMIT;
