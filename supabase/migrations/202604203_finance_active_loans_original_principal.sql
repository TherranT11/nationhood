-- Canonical original principal tracking for active finance loans.
-- The tick processor (advance-corp-tick/index.ts:3192) and subsidiary
-- payment path (js/game/subsidiary-payments.js) both compute per-tick
-- interest as `original_principal * monthlyRate`. The column has been
-- referenced by code since those paths landed but was never defined by
-- a migration. Reads silently fell back to `principal`; writes would
-- fail on any env that hadn't added the column out of band.

ALTER TABLE finance_active_loans
    ADD COLUMN IF NOT EXISTS original_principal BIGINT;

-- Backfill: original_principal = principal at origination for every
-- existing row. This is correct because `principal` has never been
-- mutated after insert.
UPDATE finance_active_loans
SET original_principal = principal
WHERE original_principal IS NULL;

ALTER TABLE finance_active_loans
    ALTER COLUMN original_principal SET NOT NULL;

-- Postgres defaults cannot reference another column directly.
-- Mirror the remaining_principal trigger pattern so omitted values
-- default to `principal` on insert.
CREATE OR REPLACE FUNCTION set_finance_active_loans_original_principal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.original_principal IS NULL THEN
        NEW.original_principal := NEW.principal;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_finance_active_loans_original_principal ON finance_active_loans;
CREATE TRIGGER trg_set_finance_active_loans_original_principal
    BEFORE INSERT ON finance_active_loans
    FOR EACH ROW
    EXECUTE FUNCTION set_finance_active_loans_original_principal();
