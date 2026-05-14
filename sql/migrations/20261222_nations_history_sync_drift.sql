-- nations_history drift fix: pull in vola_culture_floor and any other
-- numeric columns added to `nations` after migration 20261133 ran.
--
-- Symptom: snapshotNationHistory (advance-tick) reports
--   "Could not find the 'vola_culture_floor' column of 'nations_history'
--    in the schema cache"
-- once per nation per tick (13 errors at tick 85 in production).
--
-- Root cause: vola_culture_floor was added to `nations` by
-- 20260914_vola_stadium_construction but the equivalent column wasn't
-- added to `nations_history`. The self-describing sync utility from
-- 20261133_nations_history_self_describing already handles this — it
-- ALTERs ADD COLUMN IF NOT EXISTS for every numeric column found on
-- `nations`. The utility was just never re-invoked after 20260914
-- introduced the drift.
--
-- This migration re-runs the sync. It's idempotent: columns already
-- present on nations_history are skipped, missing ones are added as
-- NUMERIC. The function RAISE NOTICEs each added column and returns
-- the count so the migration log records exactly which drift was
-- closed in production.
--
-- Long-term: a DDL event trigger on nations could call this
-- automatically; flagged in the 20261133 header comment as a future
-- option. Not adding it here without explicit go-ahead — automation
-- introduced silently is worse than the drift itself.

BEGIN;

SELECT public.sync_nations_history_columns() AS columns_added;

COMMIT;

NOTIFY pgrst, 'reload schema';
