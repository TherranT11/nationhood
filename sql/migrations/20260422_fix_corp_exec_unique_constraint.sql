-- Fix: Firing a second executive for the same role throws
--   "duplicate key value violates unique constraint 'uq_corp_exec_role'"
--
-- Root cause: 20260412_corp_executives.sql line 47 declared
--
--     CONSTRAINT uq_corp_exec_role UNIQUE (faction_id, role, status)
--
-- which enforces uniqueness across ALL status values, not just 'active'.
-- The comment directly above it ("One active executive per role per
-- corporation") makes the original intent clear — the fix is a partial
-- unique index scoped to status = 'active'.
--
-- Symptom: the first time you fire (e.g.) a CEO it works. Hire another CEO,
-- try to fire them, and the UPDATE to status='fired' collides with the row
-- already sitting at (faction_id, 'CEO', 'fired'). Same for any role the
-- corp has churned more than once.
--
-- Fix: drop the full-row constraint, replace with a partial unique index
-- on (faction_id, role) WHERE status = 'active'. Fired / expired / resigned
-- rows become free to accumulate as the historical audit trail they are.
--
-- Idempotent. No data touched.

ALTER TABLE corp_executives
    DROP CONSTRAINT IF EXISTS uq_corp_exec_role;

CREATE UNIQUE INDEX IF NOT EXISTS uq_corp_exec_role_active
    ON corp_executives (faction_id, role)
    WHERE status = 'active';

-- ==================== VERIFY ====================
-- Expect: old constraint gone, new partial index present.
SELECT conname FROM pg_constraint WHERE conname = 'uq_corp_exec_role';
-- (empty)

SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'corp_executives'
  AND indexname = 'uq_corp_exec_role_active';
-- uq_corp_exec_role_active | CREATE UNIQUE INDEX ... WHERE (status = 'active')
