-- Normalize active finance loan status when payment state indicates current.
-- Safeguard: any active row with payments_missed = 0 cannot remain late/delinquent.

CREATE OR REPLACE FUNCTION normalize_finance_active_loan_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Keep completed/defaulted states untouched.
    IF NEW.status IN ('current', 'late', 'delinquent')
       AND COALESCE(NEW.payments_missed, 0) = 0
       AND COALESCE(NEW.remaining_principal, 0) > 0 THEN
        NEW.status := 'current';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_finance_active_loan_status ON finance_active_loans;
CREATE TRIGGER trg_normalize_finance_active_loan_status
    BEFORE INSERT OR UPDATE ON finance_active_loans
    FOR EACH ROW
    EXECUTE FUNCTION normalize_finance_active_loan_status();

-- One-time repair: loans marked late/delinquent even though payment state is current.
UPDATE finance_active_loans
SET status = 'current'
WHERE status IN ('late', 'delinquent')
  AND COALESCE(payments_missed, 0) = 0
  AND COALESCE(remaining_principal, 0) > 0;
