-- Retire ambassadors whose term has expired (0 months remaining).
-- These ambassadors should have been retired by processAmbassadorRetirements
-- but got stuck due to potential errors in the tick handler.

-- Step 1: Retire any active ambassador whose term has elapsed
UPDATE ambassadors
SET status = 'recalled',
    is_active = false,
    recalled_at_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1)
WHERE is_active = true
  AND status = 'active'
  AND appointed_at_tick IS NOT NULL
  AND (SELECT current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1) - appointed_at_tick >= COALESCE(term_length, 60);
