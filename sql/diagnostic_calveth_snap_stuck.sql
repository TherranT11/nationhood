-- Diagnostic: why is Calveth stuck in "FROZEN (CARETAKER)" with no election?
--
-- Run each block in Supabase Studio. The combined output narrows the failure
-- to one of three modes:
--   (A) No scheduled election row  -> snap RPC never inserted (pre-2026-04-29
--       silent RLS failure) OR a later cancel cleared it. Caretaker is real,
--       but nothing is queued to run.
--   (B) Scheduled row exists with election_tick <= current_tick -> election
--       is overdue; processElections is failing on it (look at edge logs).
--   (C) Election already 'completed' but government_formations still shows
--       caretaker -> Vostia-pattern post-election cleanup skip.

-- 0. Current tick
SELECT name, current_tick FROM shard WHERE name = 'Alpha Shard';

-- 1. Calveth government_formations rows (all statuses, recent first)
SELECT id, status, formation_type, formed_at, created_at,
       ministry_assignments->>'prime_minister' AS pm_party_id,
       array_length(party_ids, 1) AS coalition_size
  FROM government_formations
 WHERE nation_id = (SELECT id FROM nations WHERE name = 'Calveth')
 ORDER BY COALESCE(formed_at, created_at) DESC
 LIMIT 20;

-- 2. Calveth elections rows (any status, recent first)
SELECT id, election_type, status, election_tick, created_at
  FROM elections
 WHERE nation_id = (SELECT id FROM nations WHERE name = 'Calveth')
 ORDER BY COALESCE(election_tick, 0) DESC, created_at DESC
 LIMIT 20;

-- 3. Frozen bills count (sanity check that caretaker really fired)
SELECT COUNT(*) AS frozen_bill_count
  FROM bills
 WHERE nation_id = (SELECT id FROM nations WHERE name = 'Calveth')
   AND status = 'frozen';

-- 4. head_of_government + active ministries (cabinet still seated as caretaker?)
SELECT 'hog' AS source, first_name || ' ' || last_name AS who, active::text AS detail
  FROM head_of_government
 WHERE nation_id = (SELECT id FROM nations WHERE name = 'Calveth')
   AND active = true
UNION ALL
SELECT 'ministry', ministry_name,
       COALESCE(minister_first_name || ' ' || minister_last_name, '<vacant>')
  FROM ministries
 WHERE nation_id = (SELECT id FROM nations WHERE name = 'Calveth')
   AND is_active = true
 ORDER BY 1, 2;

-- 5. Most recent snap-related events
SELECT fired_at_tick, event_name, trigger_key, effects_applied
  FROM event_log
 WHERE nation_id = (SELECT id FROM nations WHERE name = 'Calveth')
   AND (trigger_key IN ('snap_election_called', 'election_completed',
                         'government_formed', 'no_confidence_passed')
        OR event_name ILIKE '%election%'
        OR event_name ILIKE '%caretaker%'
        OR event_name ILIKE '%legislature%')
 ORDER BY fired_at_tick DESC
 LIMIT 15;
