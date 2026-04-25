-- One-time corp tick offset realignment
-- Use this only if corp processing already ran on the same tick as political advance
-- and you want to re-stagger load immediately.
--
-- Why this works:
-- - corp processing is keyed by shard.corp_last_processed_tick
-- - setting it equal to current_tick marks the current cycle as already processed
-- - next corp run will happen on the next cycle's midpoint (4h after political on an 8h interval)

BEGIN;

UPDATE shard
SET corp_last_processed_tick = current_tick
WHERE name = 'Alpha Shard';

COMMIT;
