-- Add fiscal_category column to policies table
-- Maps policies to budget expenditure categories on the Economy page
ALTER TABLE policies ADD COLUMN IF NOT EXISTS fiscal_category TEXT DEFAULT NULL;

-- Also add to nation_policies so it's carried through when activated
ALTER TABLE nation_policies ADD COLUMN IF NOT EXISTS fiscal_category TEXT DEFAULT NULL;
