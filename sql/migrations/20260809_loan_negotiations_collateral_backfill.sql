-- 20260809_loan_negotiations_collateral_backfill.sql
--
-- Defensive: ensure loan_negotiations.collateral and bank_loans.collateral
-- exist. The original add lives in 20260724_loan_negotiation_collateral.sql,
-- but production landed 20260725_loan_negotiations_unify_with_auction.sql
-- without 0724 having been applied — so bank_respond_to_loan_request fails
-- with `column "collateral" of relation "loan_negotiations" does not exist`
-- the moment a bank tries to respond to a loan request.
--
-- Idempotent. No-op if 0724 has already run.

BEGIN;

ALTER TABLE public.loan_negotiations
    ADD COLUMN IF NOT EXISTS collateral JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.bank_loans
    ADD COLUMN IF NOT EXISTS collateral JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMIT;

NOTIFY pgrst, 'reload schema';
