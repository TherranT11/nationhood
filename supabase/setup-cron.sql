-- ============================================================
-- pg_cron setup for automatic tick advancement
-- ============================================================
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
--
-- Prerequisites:
--   1. Deploy the Edge Function:
--        supabase functions deploy advance-tick
--
--   2. Enable the required extensions (if not already enabled):
--        Go to Dashboard → Database → Extensions
--        Enable: pg_cron, pg_net
--
-- This schedules a job that calls the advance-tick Edge Function
-- every minute. The function checks next_tick_at internally and
-- only processes a tick when it's actually due.
-- ============================================================

-- 1. Enable extensions (safe to run if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Remove any existing advance-tick job (idempotent)
SELECT cron.unschedule('advance-tick')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'advance-tick'
);

-- 3. Schedule the Edge Function to be called every minute
SELECT cron.schedule(
    'advance-tick',            -- job name
    '* * * * *',               -- every minute
    $$
    SELECT net.http_post(
        url    := 'https://pbumjalxclmegzckhqqr.supabase.co/functions/v1/advance-tick',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body   := '{}'::jsonb
    ) AS request_id;
    $$
);

-- ============================================================
-- IMPORTANT: The service_role_key must be available to pg_cron.
--
-- Option A (recommended): Set it as an app setting:
--   ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key-here';
--
-- Option B: Hardcode the key directly in the SQL above
--   (less secure but simpler for testing):
--   Replace:
--     current_setting('app.settings.service_role_key', true)
--   With:
--     'eyJhbGciOiJIUzI1NiIs...'  (your actual service_role_key)
--
-- To find your service_role_key:
--   Supabase Dashboard → Settings → API → service_role key
-- ============================================================

-- Verify the job is scheduled:
-- SELECT * FROM cron.job WHERE jobname = 'advance-tick';

-- To check recent job runs:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'advance-tick') ORDER BY start_time DESC LIMIT 10;

-- To unschedule (disable automatic ticks):
-- SELECT cron.unschedule('advance-tick');
