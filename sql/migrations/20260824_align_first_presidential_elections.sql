-- 20260824_align_first_presidential_elections.sql
--
-- Realign every presidential nation's first-ever presidential
-- election so it coincides with the next parliamentary tick — the
-- "General Election" cadence the engine now enforces in
-- ensureElectionsScheduled. Ships alongside that engine change.
--
-- Cycle rule (per design):
--   General (P+P) → 24 ticks → Midterm (P only) → 24 ticks → General
--
-- Targets only nations where:
--   1. There is a scheduled presidential election in the future, AND
--   2. There is no completed presidential election yet (i.e., the
--      nation has never held one — the "first-ever" case the engine
--      fix targets), AND
--   3. There is also a scheduled parliamentary election.
--
-- For matching nations: snap the presidential election_tick to the
-- parliamentary election_tick. They run together as a General.
-- Idempotent — re-running doesn't move already-aligned rows.

BEGIN;

UPDATE elections pres
SET    election_tick = parl.election_tick
FROM   elections parl
WHERE  pres.election_type = 'presidential'
  AND  pres.status = 'scheduled'
  AND  parl.nation_id = pres.nation_id
  AND  parl.election_type = 'parliamentary'
  AND  parl.status = 'scheduled'
  AND  pres.election_tick <> parl.election_tick
  AND  NOT EXISTS (
      SELECT 1 FROM elections completed_pres
       WHERE completed_pres.nation_id = pres.nation_id
         AND completed_pres.election_type = 'presidential'
         AND completed_pres.status = 'completed'
  );

COMMIT;

NOTIFY pgrst, 'reload schema';
