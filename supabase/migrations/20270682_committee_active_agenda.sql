-- ════════════════════════════════════════════════════════════════════
-- 20270682 — NEUTRALISED (see 20270683 for the working implementation)
--
-- This file originally shipped a broken committee active-agenda
-- mechanic: it dropped the 9-value committee_proposals.status enum
-- from 20270662 and replaced it with a narrow 5-value enum
-- ('queued','active','tabled','reported_out','withdrawn'). On any
-- database with rows already in {in_hearing, awaiting_report_vote,
-- reported, on_floor, enacted, failed}, the new CHECK fails:
--
--   ERROR: check constraint "committee_proposals_status_check" of
--          relation "committee_proposals" is violated by some row
--          (SQLSTATE 23514)
--
-- which is exactly what CI hit on the first apply attempt.
--
-- 20270683 was written to undo this migration's damage AND ship the
-- correct active-agenda behavior. Crucially, every step in 20270683
-- is idempotent (UPDATE WHERE status='active' is a no-op on a DB that
-- never got 'active'; DROP IF EXISTS is safe). So the cleanest fix
-- is to make THIS file a no-op — the working state lives in 20270683
-- onward.
--
-- Body deliberately empty (apart from the schema-reload). Do not add
-- anything here; if you need to alter the committee active-agenda
-- mechanic, do it in a new migration.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- Intentionally no schema changes. See header.

NOTIFY pgrst, 'reload schema';

COMMIT;
