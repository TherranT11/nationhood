-- Ensure the bills table has repeal_active_law_id for whole-bill repeal bills.
-- The original migration (20260227_bill_article_repeal.sql) only added this to bill_articles.
-- The rescindLaw() UI writes this field on the bills row, and enactBill() reads it from there.
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS repeal_active_law_id UUID DEFAULT NULL;
