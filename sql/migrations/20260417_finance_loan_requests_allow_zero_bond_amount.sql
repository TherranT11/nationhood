-- Allow government bond issuances to set amount = 0.
--
-- Bonds don't have a fixed face amount — investment banks buy whatever
-- portion they want from the open offering. The original CHECK enforces
-- amount > 0 which blocks bond inserts.
--
-- Fix: drop the strict check and replace with a typed rule:
--   * For bonds, amount must be >= 0 (0 means no target, banks set the size).
--   * For all other request types, keep the strict amount > 0 check.

ALTER TABLE finance_loan_requests
    DROP CONSTRAINT IF EXISTS finance_loan_requests_amount_check;

ALTER TABLE finance_loan_requests
    ADD CONSTRAINT finance_loan_requests_amount_check CHECK (
        (request_type = 'bond' AND amount >= 0)
        OR
        (request_type <> 'bond' AND amount > 0)
    );
