-- ============================================================================
-- One-off repair: orphaned Castillo Banking → Castillo Construction $20M loan.
--
-- Symptom (reported T117): the loan's corp_loans row is GONE, but its
-- corp_loan_offers / corp_loan_requests rows are still 'accepted'. The $20M
-- principal was disbursed (borrower received + spent it) yet no loan tracks the
-- debt, so outstanding debt reads $0 and the lender can never be repaid —
-- money left the system unaccounted.
--
-- No live code path deletes corp_loans rows (only an ON DELETE CASCADE when a
-- whole corp is deleted, which would also have removed the offer/request — and
-- both survive). This row was therefore lost out-of-band (most likely a manual
-- DB edit during the previous fix). This script re-creates the loan as 'active'
-- so servicing + repayment resume; the term ends at started_at_tick + 60.
--
-- Idempotent: only inserts when the accepted request has NO corp_loans row.
-- Self-consistent: principal/term come from the request, apr from the accepted
-- offer, and started_at_tick from when the offer was accepted (≈ T111, so the
-- term ends ≈ T171 — the date you expected, not the T117 bid window).
--
-- balance is reset to the FULL principal: the ~6 ticks of pre-wipe repayments
-- are unrecoverable (they never reached the lender and aren't tracked anywhere),
-- so the cleanest conserving baseline is "borrower owes the full $20M again,
-- repayable to the lender via [Debt Payment]". Adjust the balance line below if
-- you'd rather credit those payments.
--
-- RUN against the game DB (this repo's tooling can't reach it). Review the
-- SELECT first to confirm exactly one deal matches before COMMIT.
-- ============================================================================

BEGIN;

-- Preview the deal that will be repaired (should return exactly 1 row):
--   SELECT r.id AS request_id, b.name AS borrower, l.name AS lender,
--          r.principal, r.term_ticks, o.apr,
--          COALESCE(o.finalized_at_tick, r.finalized_at_tick) AS started_at_tick
--     FROM corp_loan_requests r
--     JOIN corp_loan_offers   o ON o.request_id = r.id AND o.status = 'accepted'
--     JOIN entrepreneur_corps b ON b.id = r.borrower_corp_id
--     JOIN entrepreneur_corps l ON l.id = o.bank_corp_id
--    WHERE r.status = 'accepted'
--      AND b.name = 'Castillo Construction Company'
--      AND l.name = 'Castillo Banking Company'
--      AND NOT EXISTS (SELECT 1 FROM corp_loans cl WHERE cl.request_id = r.id);

WITH deal AS (
    SELECT r.id              AS request_id,
           r.borrower_corp_id,
           o.bank_corp_id    AS lender_corp_id,
           r.principal,
           r.term_ticks,
           o.apr,
           COALESCE(o.finalized_at_tick, r.finalized_at_tick) AS started_at_tick
      FROM corp_loan_requests r
      JOIN corp_loan_offers   o ON o.request_id = r.id AND o.status = 'accepted'
      JOIN entrepreneur_corps b ON b.id = r.borrower_corp_id
      JOIN entrepreneur_corps l ON l.id = o.bank_corp_id
     WHERE r.status = 'accepted'
       AND b.name = 'Castillo Construction Company'
       AND l.name = 'Castillo Banking Company'
       AND NOT EXISTS (SELECT 1 FROM corp_loans cl WHERE cl.request_id = r.id)
)
INSERT INTO corp_loans
    (request_id, borrower_corp_id, lender_corp_id, principal, apr, term_ticks,
     per_tick_payment, payments_remaining, total_paid, status, started_at_tick, balance)
SELECT request_id, borrower_corp_id, lender_corp_id, principal, apr, term_ticks,
       GREATEST(1, ROUND(principal::numeric / term_ticks
                         + principal::numeric * apr / 12))::bigint,  -- per_tick_payment
       term_ticks,        -- payments_remaining
       0,                 -- total_paid
       'active',
       started_at_tick,
       principal          -- balance: full principal owed again (see header note)
  FROM deal;

NOTIFY pgrst, 'reload schema';

COMMIT;
