-- Canonical outstanding principal tracking for active finance loans.

ALTER TABLE finance_active_loans
    ADD COLUMN IF NOT EXISTS remaining_principal BIGINT;

-- Backfill from historical totals:
-- remaining principal = principal - principal repaid,
-- where principal repaid = total_paid - total_interest_paid.
UPDATE finance_active_loans
SET remaining_principal = GREATEST(
    0,
    principal - GREATEST(0, total_paid - total_interest_paid)
)
WHERE remaining_principal IS NULL;

-- Safety backfill for any rows with missing payment metadata.
UPDATE finance_active_loans
SET remaining_principal = principal
WHERE remaining_principal IS NULL;

ALTER TABLE finance_active_loans
    ALTER COLUMN remaining_principal SET NOT NULL;

-- Postgres defaults cannot reference another column directly.
-- Use a BEFORE INSERT trigger so omitted remaining_principal defaults to principal.
CREATE OR REPLACE FUNCTION set_finance_active_loans_remaining_principal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.remaining_principal IS NULL THEN
        NEW.remaining_principal := NEW.principal;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_finance_active_loans_remaining_principal ON finance_active_loans;
CREATE TRIGGER trg_set_finance_active_loans_remaining_principal
    BEFORE INSERT ON finance_active_loans
    FOR EACH ROW
    EXECUTE FUNCTION set_finance_active_loans_remaining_principal();
