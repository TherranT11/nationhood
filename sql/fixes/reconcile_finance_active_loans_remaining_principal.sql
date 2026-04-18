-- One-time reconciliation for historical finance_active_loans balances.
-- Run after deploying remaining_principal code path to align old rows.

BEGIN;

WITH loan_recalc AS (
    SELECT
        fal.id,
        GREATEST(
            0,
            COALESCE(fal.principal, 0)
            - GREATEST(COALESCE(fal.total_paid, 0) - COALESCE(fal.total_interest_paid, 0), 0)
        )::BIGINT AS recalculated_remaining
    FROM finance_active_loans fal
    JOIN finance_loan_requests req ON req.id = fal.request_id
    WHERE req.request_type = 'loan'
),
updated AS (
    UPDATE finance_active_loans fal
    SET remaining_principal = lr.recalculated_remaining,
        status = CASE
            WHEN lr.recalculated_remaining <= 0 AND fal.status IN ('current', 'late', 'delinquent') THEN 'repaid'
            ELSE fal.status
        END,
        completed_tick = CASE
            WHEN lr.recalculated_remaining <= 0 AND fal.status IN ('current', 'late', 'delinquent')
                THEN COALESCE(fal.completed_tick, fal.last_payment_tick, fal.started_tick)
            ELSE fal.completed_tick
        END
    FROM loan_recalc lr
    WHERE fal.id = lr.id
      AND (
        COALESCE(fal.remaining_principal, -1) <> lr.recalculated_remaining
        OR (lr.recalculated_remaining <= 0 AND fal.status IN ('current', 'late', 'delinquent'))
      )
    RETURNING fal.id
)
SELECT COUNT(*) AS rows_reconciled FROM updated;

COMMIT;
