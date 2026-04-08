-- ============================================================
-- pg_cron setup for automatic corporation tick processing
-- ============================================================
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
--
-- Prerequisites:
--   1. Deploy the Edge Function:
--        supabase functions deploy advance-corp-tick
--
--   2. Enable the required extensions (if not already enabled):
--        Go to Dashboard → Database → Extensions
--        Enable: pg_cron, pg_net
--
-- BEFORE RUNNING: Replace YOUR_SERVICE_ROLE_KEY_HERE below with
-- your actual service_role key from:
--   Dashboard → Settings → API → service_role key (the secret one)
--
-- This schedules a job that calls the advance-corp-tick Edge Function
-- every minute. The function reads current_tick from the shard and
-- only processes if the tick has changed since its last run.
-- It does NOT advance the tick — advance-tick owns that.
-- ============================================================

-- 1. Enable extensions (safe to run if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Remove any existing advance-corp-tick job (idempotent)
SELECT cron.unschedule('advance-corp-tick')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'advance-corp-tick'
);

-- 3. Schedule the Edge Function to be called every minute
SELECT cron.schedule(
    'advance-corp-tick',           -- job name
    '* * * * *',                   -- every minute
    $$
    SELECT net.http_post(
        url    := 'https://pbumjalxclmegzckhqqr.supabase.co/functions/v1/advance-corp-tick',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE'
        ),
        body   := '{}'::jsonb,
        timeout_milliseconds := 120000
    ) AS request_id;
    $$
);

-- Verify the job is scheduled:
-- SELECT * FROM cron.job WHERE jobname = 'advance-corp-tick';

-- To check recent job runs:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'advance-corp-tick') ORDER BY start_time DESC LIMIT 10;

-- To unschedule (disable automatic corp ticks):
-- SELECT cron.unschedule('advance-corp-tick');
