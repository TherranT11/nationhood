-- Finance loans: explicit remaining principal tracking for amortization parity.
--
-- Migration notes:
-- 1) Adds finance_active_loans.remaining_principal.
-- 2) Backfills from existing principal/paid accounting for request_type='loan'.
-- 3) Marks active loans as repaid when reconciled principal is zero.
--
-- One-time historical repair script (safer to run during low traffic):
--   sql/fixes/reconcile_finance_active_loans_remaining_principal.sql

ALTER TABLE finance_active_loans
    ADD COLUMN IF NOT EXISTS remaining_principal BIGINT;

UPDATE finance_active_loans fal
SET remaining_principal = CASE
    WHEN req.request_type = 'loan' THEN GREATEST(
        0,
        COALESCE(fal.principal, 0)
        - GREATEST(COALESCE(fal.total_paid, 0) - COALESCE(fal.total_interest_paid, 0), 0)
    )
    ELSE COALESCE(fal.principal, 0)
END
FROM finance_loan_requests req
WHERE req.id = fal.request_id
  AND fal.remaining_principal IS NULL;

ALTER TABLE finance_active_loans
    ALTER COLUMN remaining_principal SET DEFAULT 0;

UPDATE finance_active_loans
SET remaining_principal = 0
WHERE remaining_principal IS NULL;

ALTER TABLE finance_active_loans
    ALTER COLUMN remaining_principal SET NOT NULL;

ALTER TABLE finance_active_loans
    ADD CONSTRAINT finance_active_loans_remaining_principal_nonnegative
    CHECK (remaining_principal >= 0);

UPDATE finance_active_loans fal
SET status = 'repaid',
    completed_tick = COALESCE(fal.completed_tick, fal.last_payment_tick, fal.started_tick)
FROM finance_loan_requests req
WHERE req.id = fal.request_id
  AND req.request_type = 'loan'
  AND fal.status IN ('current', 'late', 'delinquent')
  AND fal.remaining_principal <= 0;
