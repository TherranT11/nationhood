-- 20270111_unstick_caretaker_elections.sql
--
-- One-shot cleanup (Stage-1 interim, part A): unstick every nation
-- currently frozen in caretaker because its resolving election is
-- overdue, pathologically far out, or duplicated.
--
-- Root cause (Dravka, Avelia): the caretaker safety-net only
-- rescheduled an *overdue* scheduled election (election_tick <=
-- current_tick). A future-dated election (Dravka: caretaker since
-- ~tick 76, election scheduled at 112) or stacked duplicates (Avelia:
-- scheduled 98 AND 106) never triggered it, so the legislature stayed
-- frozen indefinitely. js/game/elections.js processGovernmentVacancy
-- is generalised to prevent recurrence; this fixes the nations already
-- stuck.
--
-- Two steps, scoped to nations with a live caretaker formation:
--   1. Drop duplicate scheduled elections (keep the soonest per
--      nation), only when unreferenced by any government_formations
--      (FK-safe; a not-yet-run scheduled election normally has no
--      formation pointing at it, but guarded regardless).
--   2. Pull the soonest scheduled election forward to current_tick+1
--      when it is overdue or further than the formation window (3
--      ticks) away. Healthy short caretakers (election within 3 ticks)
--      are left untouched.
--
-- Caretaker nations with NO scheduled election at all are handled by
-- the generalised safety-net on the next tick (it schedules one).
-- Pure DML, no schema change. Idempotent (re-running finds nothing to
-- pull/dedupe once nations have resolved).

BEGIN;

-- 1. Dedupe stacked scheduled elections for caretaker nations.
WITH care AS (
    SELECT DISTINCT nation_id
    FROM government_formations
    WHERE status = 'caretaker'
),
ranked AS (
    SELECT e.id,
           ROW_NUMBER() OVER (
               PARTITION BY e.nation_id
               ORDER BY e.election_tick ASC, e.id
           ) AS rn
    FROM elections e
    JOIN care c ON c.nation_id = e.nation_id
    WHERE e.status = 'scheduled'
)
DELETE FROM elections e
USING ranked r
WHERE e.id = r.id
  AND r.rn > 1
  AND NOT EXISTS (
      SELECT 1 FROM government_formations gf WHERE gf.election_id = e.id
  );

-- 2. Pull the (now sole) soonest scheduled election forward for any
--    caretaker nation whose election is overdue or > 3 ticks out.
WITH cur AS (
    SELECT current_tick AS t FROM shard WHERE name = 'Alpha Shard' LIMIT 1
),
soonest AS (
    SELECT DISTINCT ON (e.nation_id) e.id, e.election_tick
    FROM elections e
    JOIN government_formations gf
      ON gf.nation_id = e.nation_id AND gf.status = 'caretaker'
    WHERE e.status = 'scheduled'
    ORDER BY e.nation_id, e.election_tick ASC, e.id
)
UPDATE elections e
SET election_tick = (SELECT t FROM cur) + 1
FROM soonest s, cur
WHERE e.id = s.id
  AND ( s.election_tick < cur.t OR s.election_tick > cur.t + 3 );

COMMIT;

NOTIFY pgrst, 'reload schema';
