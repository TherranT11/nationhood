-- ═══════════════════════════════════════════════════════════════════════════════
-- RETIRE BOND SCHEMA — final step of the bond dead-code cull (Phase 3, Unit 6)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Bonds were retired in 20260911 (open bond requests cancelled; no creation
-- path remains) and all bond *code* was removed in commits 1affce5..db5b5cf.
-- This strips the now-orphaned bond schema from the polymorphic finance
-- tables. NON-bond flows (loan / insurance / equity) are untouched.
--
-- Destructive + irreversible for row data (the bond rows are inert — no
-- code reads or writes them post-cull — so this is safe; the rows cannot
-- be reconstructed and intentionally are not). Wrapped in a single
-- transaction (atomic) and idempotent (safe to re-run).
--
-- Deletion order is dictated by the FK graph:
--   finance_active_loans.request_id → finance_loan_requests(id)  [NO cascade]
--   finance_loan_offers.request_id  → finance_loan_requests(id)  [ON DELETE CASCADE]
-- So: delete bond active_loans first, then bond offers (explicit; would
-- cascade anyway — bonds bypass offers, so normally zero rows), then the
-- bond requests. Nothing FK-references finance_active_loans.id.
--
-- OUT OF SCOPE (flagged, deliberately untouched): construction_contracts
-- .bond_id is a separate legacy column with NO foreign key, pointing at
-- the long-dropped bond_holdings table (20260430). It is referenced by
-- sql/create_admin_reset_tables.sql; dropping it is its own change and is
-- not part of the finance_loan_requests bond system this cull targets.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Inert bond positions (no ON DELETE CASCADE on this FK → must precede
--    the finance_loan_requests delete).
DELETE FROM finance_active_loans
 WHERE request_id IN (
     SELECT id FROM finance_loan_requests WHERE request_type = 'bond'
 );

-- 2. Any bond offers (bonds bypass the offers table, so typically none;
--    explicit + order-safe rather than relying solely on the cascade).
DELETE FROM finance_loan_offers
 WHERE request_id IN (
     SELECT id FROM finance_loan_requests WHERE request_type = 'bond'
 );

-- 3. The bond requests themselves.
DELETE FROM finance_loan_requests WHERE request_type = 'bond';

-- 4. Forbid 'bond' going forward. Inline column CHECKs are auto-named
--    <table>_<column>_check; DROP IF EXISTS keeps this idempotent (and
--    even if the auto-name differed, the re-added constraint still
--    enforces the restriction once bond rows are gone).
ALTER TABLE finance_loan_requests
    DROP CONSTRAINT IF EXISTS finance_loan_requests_request_type_check;
ALTER TABLE finance_loan_requests
    ADD  CONSTRAINT finance_loan_requests_request_type_check
         CHECK (request_type IN ('loan', 'insurance', 'equity'));

-- 5. Drop the bond-only columns. Verified no non-bond reader (the only
--    reader, advance-corp-tick's finance select, dropped issuer_nation_id
--    in commit 075cf74). Dropping issuer_nation_id also drops its
--    nations(id) FK automatically.
ALTER TABLE finance_loan_requests DROP COLUMN IF EXISTS coupon_rate;
ALTER TABLE finance_loan_requests DROP COLUMN IF EXISTS issuer_nation_id;

COMMENT ON TABLE finance_loan_requests IS
    'Polymorphic financial requests: corp loans, insurance policies, equity raises. request_type discriminates which subset of columns is meaningful. (Bonds retired 20260911 / schema stripped 20270148.)';

COMMIT;

-- ── ROLLBACK (structural only — deleted bond ROW DATA is unrecoverable) ──
-- BEGIN;
-- ALTER TABLE finance_loan_requests
--     DROP CONSTRAINT IF EXISTS finance_loan_requests_request_type_check;
-- ALTER TABLE finance_loan_requests
--     ADD  CONSTRAINT finance_loan_requests_request_type_check
--          CHECK (request_type IN ('loan', 'bond', 'insurance', 'equity'));
-- ALTER TABLE finance_loan_requests ADD COLUMN IF NOT EXISTS issuer_nation_id uuid REFERENCES nations(id);
-- ALTER TABLE finance_loan_requests ADD COLUMN IF NOT EXISTS coupon_rate      numeric(4,2);
-- COMMIT;
-- (Bonds remain code-dead after rollback; this only restores the shape.)
