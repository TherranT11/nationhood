-- ============================================================
-- Danwei founding administration — Phase 16 of new-nation walkthrough
-- ============================================================
-- Seeds a caretaker administration row covering the 1-6 tick window
-- between nation creation and the first direct presidential election.
-- Run AFTER insert_danwei.sql (Phase 2) so the nations row exists,
-- and AFTER insert_danwei_phase14_election_schedule.sql (Phase 14) so
-- the next_election_tick is set (this script doesn't need it, but the
-- caretaker only makes sense when the schedule is in place).
--
-- When the first election fires, js/game/elections.js:inauguratePresident()
-- runs `.update({ended_at_tick, stats_at_end, end_reason, approval_at_end})
-- .eq('nation_id', n.id).is('ended_at_tick', null)` and naturally closes
-- this caretaker row before inserting the elected president's admin —
-- so admin history reads cleanly: Caretaker Administration → first
-- elected president's administration.
--
-- Idempotent: INSERT WHERE NOT EXISTS guards against re-runs.
--
-- Field choices for the caretaker:
--   - admin_name: 'Caretaker Administration' (no party suffix; matches
--     the convention in inauguratePresident which uses '<lastname>
--     Administration' for elected presidents).
--   - president_party_id / president_party_name: NULL (no faction yet).
--   - coalition_parties: '[]'::jsonb (empty — no parties seated).
--   - total_seats: 0 (no party-affiliated seats; chamber is unseated
--     until the first election fills it).
--   - stats_at_start: NULL (caretaker is a placeholder, not a policy
--     baseline; inauguratePresident will set stats_at_end at closeout
--     and the asymmetry honestly reflects the caretaker role).
--   - approval_at_start: 50 (neutral — no record to approve).
-- ============================================================

INSERT INTO administrations (
    nation_id,
    admin_name,
    head_of_state,
    head_of_state_title,
    president_name,
    president_party_id,
    president_party_name,
    coalition_parties,
    total_seats,
    government_type,
    started_at_tick,
    started_at_date,
    stats_at_start,
    approval_at_start
)
SELECT
    n.id,
    'Caretaker Administration',
    n.head_of_state_first_name || ' ' || n.head_of_state_last_name,
    n.head_of_state_title,
    n.head_of_state_first_name || ' ' || n.head_of_state_last_name,
    NULL::uuid,
    NULL::text,
    '[]'::jsonb,
    0,
    'Presidential',
    s.current_tick,
    s."current_date",
    NULL::jsonb,
    50
  FROM nations n
  JOIN shard s ON s.id = n.shard_id
 WHERE LOWER(n.name) = 'danwei'
   AND NOT EXISTS (
       SELECT 1
         FROM administrations a
        WHERE a.nation_id = n.id
          AND a.ended_at_tick IS NULL
   );

-- Verify: dump the caretaker administration row + a sanity check
-- that the nation has exactly one open admin.
SELECT n.name,
       a.admin_name,
       a.head_of_state,
       a.head_of_state_title,
       a.government_type,
       a.president_party_id,
       a.president_party_name,
       a.coalition_parties,
       a.total_seats,
       a.started_at_tick,
       a.started_at_date,
       a.approval_at_start,
       a.ended_at_tick
  FROM administrations a
  JOIN nations n ON n.id = a.nation_id
 WHERE LOWER(n.name) = 'danwei'
 ORDER BY a.started_at_tick DESC;

SELECT n.name,
       COUNT(*) FILTER (WHERE a.ended_at_tick IS NULL) AS open_admins
  FROM nations n
  LEFT JOIN administrations a ON a.nation_id = n.id
 WHERE LOWER(n.name) = 'danwei'
 GROUP BY n.name;
