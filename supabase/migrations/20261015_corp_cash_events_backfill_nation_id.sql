-- ════════════════════════════════════════════════════════════════
-- Step 2a of 6: Backfill corp_cash_events.nation_id
--
-- Step 1 (20261014) added the column nullable. This populates it on
-- every existing row using the corp's CURRENT home nation
-- (factions.nation_id). The backfill runs once; future inserts go
-- through the updated emit_corp_cash_event / logCashEvent paths
-- (step 2b in advance-corp-tick) which set nation_id explicitly.
--
-- Limitation: uses corp's current nation, not the historical nation
-- at event time. factions.nation_id is stable per corp in practice,
-- so the difference is academic. Documented as a v1 limitation.
--
-- Idempotent — UPDATE filters on IS NULL so re-running is a no-op.
-- ════════════════════════════════════════════════════════════════

BEGIN;

UPDATE corp_cash_events ev
   SET nation_id = f.nation_id
  FROM factions f
 WHERE ev.corp_id = f.id
   AND ev.nation_id IS NULL
   AND f.nation_id IS NOT NULL;

COMMIT;
