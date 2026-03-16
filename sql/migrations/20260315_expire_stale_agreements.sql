-- Expire diplomatic proposals that have passed their duration
-- duration_years is stored in proposal_data; 12 ticks per year
-- Sets terminated_at_tick so the 6-tick display window works correctly

-- Step 1: Expire active diplomatic proposals past their duration
UPDATE diplomatic_proposals
SET status = 'expired',
    terminated_at_tick = (
        activated_at_tick + (COALESCE((proposal_data->>'duration_years')::int, 0) * 12)
    )
WHERE status = 'active'
  AND proposal_type != 'state_visit'
  AND activated_at_tick IS NOT NULL
  AND (proposal_data->>'duration_years') IS NOT NULL
  AND (proposal_data->>'duration_years')::int > 0
  AND (
      activated_at_tick + ((proposal_data->>'duration_years')::int * 12)
  ) <= (SELECT current_tick FROM shard WHERE name = 'Alpha Shard');

-- Step 2: Finalize trade agreements with pending withdrawals past their notice period
UPDATE trade_agreements
SET status = 'withdrawn'
WHERE status = 'active'
  AND withdrawn_at_tick IS NOT NULL
  AND withdrawn_at_tick <= (SELECT current_tick FROM shard WHERE name = 'Alpha Shard');

-- Step 3: Expire any active trade agreements past their expires_at_tick
UPDATE trade_agreements
SET status = 'expired'
WHERE status = 'active'
  AND expires_at_tick IS NOT NULL
  AND expires_at_tick <= (SELECT current_tick FROM shard WHERE name = 'Alpha Shard');
