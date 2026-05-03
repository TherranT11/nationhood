-- 20260810_drop_call_snap_election.sql
--
-- Remove the call_snap_election RPC. The Party-Leader action it backed
-- has been retired in favor of call_early_elections (PM-only), which
-- covers the dissolve-and-call workflow. The auto-snap deadlock breaker
-- in advance-tick has also been removed (see comment in
-- supabase/functions/advance-tick/index.ts and js/game/elections.js).
--
-- Idempotent. Drops both signatures defined across the original
-- 20260515 migration and the 20260626 PM-only update.

BEGIN;

DROP FUNCTION IF EXISTS public.call_snap_election(UUID, UUID);

COMMIT;

NOTIFY pgrst, 'reload schema';
