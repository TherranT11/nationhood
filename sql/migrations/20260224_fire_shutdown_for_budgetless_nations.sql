-- One-time manual activation: fire Government Shutdown crisis for every nation
-- that currently has a budget bill in progress (floor or committee) but has NOT
-- yet passed one (last_budget_tick is NULL or expired).
--
-- Safe to re-run: uses ON CONFLICT DO NOTHING on the (crisis_id, nation_id) unique constraint.

-- Step 1: Insert active_crises rows
INSERT INTO active_crises (crisis_id, nation_id, started_at_tick, effects_applied_log)
SELECT
    '00000000-0000-0000-0000-000000000001',   -- Government Shutdown crisis UUID
    n.id,
    s.current_tick,
    '[]'::jsonb
FROM nations n
CROSS JOIN (SELECT current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1) s
WHERE EXISTS (
    SELECT 1 FROM bills b
    WHERE b.nation_id = n.id
      AND b.bill_type = 'budget'
      AND b.status IN ('floor', 'committee')
)
ON CONFLICT (crisis_id, nation_id) DO NOTHING;

-- Step 2: Log event for each newly-activated shutdown
INSERT INTO event_log (nation_id, event_name, description_used, category, effects_applied, fired_at_tick)
SELECT
    n.id,
    'CRISIS_STARTED: Government Shutdown',
    'The government has shut down due to failure to pass a budget. [Manually activated]',
    'crisis',
    '[]'::jsonb,
    s.current_tick
FROM nations n
CROSS JOIN (SELECT current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1) s
WHERE EXISTS (
    SELECT 1 FROM bills b
    WHERE b.nation_id = n.id
      AND b.bill_type = 'budget'
      AND b.status IN ('floor', 'committee')
)
AND EXISTS (
    SELECT 1 FROM active_crises ac
    WHERE ac.nation_id = n.id
      AND ac.crisis_id = '00000000-0000-0000-0000-000000000001'
);
