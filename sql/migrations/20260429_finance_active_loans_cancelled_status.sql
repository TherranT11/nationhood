-- =========================================================================
-- Allow 'cancelled' as a finance_active_loans.status value.
--
-- Insurance policies need a manual termination path so an insurer can
-- pull the plug on a chronically-non-paying policyholder. The existing
-- CHECK constraint only permits ('current', 'late', 'delinquent',
-- 'defaulted', 'repaid') — none of which fit "the insurer chose to
-- cancel". 'defaulted' is wrong (it implies collateral recovery), and
-- 'repaid' is wrong (it implies the term completed naturally).
--
-- Adding 'cancelled' as a sixth allowed value. The frontend filter
-- on 'current' / 'late' / 'delinquent' already excludes terminal
-- states, so cancelled policies drop off the active portfolio
-- automatically.
--
-- Idempotent: re-runs no-op when the constraint already includes
-- 'cancelled'.
-- =========================================================================

DO $$
DECLARE
    constraint_name TEXT;
    constraint_def  TEXT;
BEGIN
    -- Find the existing CHECK constraint on the status column.
    SELECT con.conname, pg_get_constraintdef(con.oid)
    INTO constraint_name, constraint_def
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'finance_active_loans'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%'
      AND pg_get_constraintdef(con.oid) ILIKE '%current%';

    IF constraint_name IS NULL THEN
        RAISE NOTICE 'No status CHECK constraint found on finance_active_loans — nothing to do';
        RETURN;
    END IF;

    IF constraint_def ILIKE '%cancelled%' THEN
        RAISE NOTICE 'Constraint % already permits cancelled — no change', constraint_name;
        RETURN;
    END IF;

    EXECUTE format('ALTER TABLE finance_active_loans DROP CONSTRAINT %I', constraint_name);
    ALTER TABLE finance_active_loans
        ADD CONSTRAINT finance_active_loans_status_check
        CHECK (status IN ('current', 'late', 'delinquent', 'defaulted', 'repaid', 'cancelled'));
    RAISE NOTICE 'Replaced % with widened CHECK including cancelled', constraint_name;
END $$;
