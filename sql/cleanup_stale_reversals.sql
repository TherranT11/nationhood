-- Cleanup script: remove stale reversal active_laws and unstick broken bills.
-- Run this in Supabase SQL editor BEFORE deploying the updated edge function.

-- 1. Clear dangling FK references pointing to active_laws that no longer exist
UPDATE bills SET repeal_active_law_id = NULL
WHERE repeal_active_law_id IS NOT NULL
AND repeal_active_law_id NOT IN (SELECT id FROM active_laws);

UPDATE bill_articles SET repeal_active_law_id = NULL
WHERE repeal_active_law_id IS NOT NULL
AND repeal_active_law_id NOT IN (SELECT id FROM active_laws);

-- 2. Delete all reversal active_laws (temporary undo-effect rows that
--    should have been processed already; the upsert fix prevents new ones
--    from getting stuck)
DELETE FROM active_laws WHERE is_reversal = true;

-- 3. Unstick any bills stuck in 'voting' past their deadline
UPDATE bills SET status = 'failed'
WHERE status = 'voting'
AND vote_deadline < (SELECT current_tick FROM shard WHERE name = 'Alpha Shard');

-- 4. Unstick any bills stuck on president's desk past their deadline
UPDATE bills SET status = 'failed'
WHERE status = 'president_desk'
AND president_desk_deadline < (SELECT current_tick FROM shard WHERE name = 'Alpha Shard');
