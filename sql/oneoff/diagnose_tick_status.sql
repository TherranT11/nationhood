-- ═══════════════════════════════════════════════════════════════════════════════
-- Diagnostic: is the tick stuck?
-- ═══════════════════════════════════════════════════════════════════════════════
-- Read-only — safe to run against prod. Pulls every signal we need to tell
-- whether tick 59 → 60 is just slow (waiting for next_tick_at) or actually
-- stuck (cron not firing, edge function erroring, or next_tick_at pinned in
-- the future).
--
-- If you see:
--   • shard.next_tick_at in the FUTURE → not stuck, just waiting. The
--     "NEXT TICK" countdown in the UI is reading this.
--   • shard.next_tick_at in the PAST and time_since_next_tick_at large →
--     stuck. Check Sections 2/3 for why the edge function isn't picking it up.
--   • Section 2 shows recent cron runs failing → cron is firing but
--     advance-tick is erroring; check function logs.
--   • Section 2 shows no recent runs → cron itself is broken (job paused,
--     pg_cron extension dropped, service-role key rotated).
--   • Section 3 shows successful HTTP 200 responses but tick didn't advance →
--     the edge function ran but returned early (date/tick mismatch, locked
--     shard, etc.) — check the response body.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Current shard state ────────────────────────────────────────────────────
SELECT
    name,
    current_tick,
    current_date,
    tick_interval_hours,
    next_tick_at,
    next_tick_at - now()                           AS time_until_next_tick,
    now() - next_tick_at                           AS time_since_next_tick_at,
    CASE
        WHEN next_tick_at IS NULL                  THEN 'no schedule (broken)'
        WHEN next_tick_at > now()                  THEN 'waiting (not stuck)'
        WHEN now() - next_tick_at < interval '5 minutes'
                                                   THEN 'overdue but within cron grace'
        ELSE 'overdue — likely stuck'
    END                                            AS status
FROM public.shard
WHERE name = 'Alpha Shard';

-- ── 2. Recent advance-tick cron runs ──────────────────────────────────────────
-- pg_cron records every job execution in cron.job_run_details. If this
-- returns no rows, the cron job either isn't scheduled or pg_cron is off.
SELECT
    jr.start_time,
    jr.end_time,
    jr.end_time - jr.start_time                    AS duration,
    jr.status,
    LEFT(jr.return_message, 200)                   AS return_message
FROM cron.job_run_details jr
JOIN cron.job j ON j.jobid = jr.jobid
WHERE j.jobname = 'advance-tick'
ORDER BY jr.start_time DESC
LIMIT 10;

-- ── 3. Recent net.http_post responses (advance-tick edge function) ────────────
-- Even when cron logs "succeeded", the actual HTTP response from the edge
-- function lives in net._http_response. Look for non-200 status codes or
-- error_msg populated.
SELECT
    r.created                                      AS request_started,
    r.status_code,
    r.error_msg,
    LEFT(r.content::text, 300)                     AS response_body
FROM net._http_response r
WHERE r.created > now() - interval '2 hours'
ORDER BY r.created DESC
LIMIT 10;

-- ── 4. Is the cron job even scheduled? ────────────────────────────────────────
SELECT
    jobname,
    schedule,
    active,
    LEFT(command, 200)                             AS command_preview
FROM cron.job
WHERE jobname IN ('advance-tick', 'advance-corp-tick');

-- ── 5. Does shard.current_date match shard.current_tick? ──────────────────────
-- The edge function computes current_date deterministically from current_tick
-- (months[tick % 12] + (2000 + floor(tick / 12))). If these drift apart, the
-- tick may be advancing without the date updating, which can read as "stuck"
-- in the UI even though shard.current_tick is fine.
WITH s AS (SELECT current_tick, current_date FROM public.shard WHERE name = 'Alpha Shard')
SELECT
    s.current_tick,
    s.current_date                                 AS stored_date,
    (ARRAY['January','February','March','April','May','June',
           'July','August','September','October','November','December'])[1 + (s.current_tick % 12)]
        || ', ' || (2000 + (s.current_tick / 12))::text
                                                   AS expected_date,
    CASE
        WHEN s.current_date = (ARRAY['January','February','March','April','May','June',
                                     'July','August','September','October','November','December'])[1 + (s.current_tick % 12)]
                              || ', ' || (2000 + (s.current_tick / 12))::text
        THEN 'in sync'
        ELSE 'DRIFT — date does not match tick'
    END                                            AS sync_status
FROM s;
