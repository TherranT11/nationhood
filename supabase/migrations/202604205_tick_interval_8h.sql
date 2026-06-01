-- Set tick interval to 8 hours for both political and corp ticks.
--
-- Effect:
--   • Political tick fires every 8h (was 16h).
--   • Corp tick fires at the 4h midpoint of each political interval (was 8h).
--   • Net pattern: Political --4h-- Corp --4h-- Political --4h-- Corp …
--     A tick event every 4 hours, alternating.
--
-- Safe to apply mid-cycle. The currently scheduled `next_tick_at` is
-- preserved, so the next political tick still fires at its existing
-- scheduled time; the new 8h interval takes effect on the tick AFTER
-- that. Corp tick won't re-fire this cycle because the time-gate uses
-- the new intervalMs/2 = 4h offset (already satisfied if corp already
-- ran this cycle, idempotency via corp_last_processed_tick).

UPDATE public.shard
SET tick_interval_hours = 8
WHERE name = 'Alpha Shard';
