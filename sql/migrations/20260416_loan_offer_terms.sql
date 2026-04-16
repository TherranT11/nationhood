-- Add offer_terms column to finance_loan_offers.
-- Banking corporations can now specify collateral requirements and
-- attach written terms when making loan offers.

ALTER TABLE finance_loan_offers
    ADD COLUMN IF NOT EXISTS offer_terms TEXT;

COMMENT ON COLUMN finance_loan_offers.offer_terms IS
    'Free-text terms/conditions set by the lender when offering a loan.';
