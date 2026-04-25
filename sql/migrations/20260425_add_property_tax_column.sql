-- ============================================================
-- Add nations.property_tax column
--
-- Property tax becomes the fourth tax type wired into the Tax
-- Article system. Column shape matches the existing income_tax /
-- corporate_tax / sales_tax columns: NUMERIC NOT NULL DEFAULT 50.
--
-- The Tax Article enactment handler writes to this column via the
-- standard taxUpdates path; calculateNationalBudget reads it to
-- compute property tax revenue (multiplier 0.08, see budget.js).
--
-- Safe to re-run: ADD COLUMN IF NOT EXISTS.
-- ============================================================

ALTER TABLE nations
  ADD COLUMN IF NOT EXISTS property_tax NUMERIC NOT NULL DEFAULT 50;

-- Verify
SELECT column_name, data_type, column_default
  FROM information_schema.columns
 WHERE table_name = 'nations' AND column_name = 'property_tax';
