-- Add effect_data column to bill_articles for tax rate change articles.
-- Without this column, the TAX_RATE_CHANGE effect_data written by the
-- economy.html tax reform flow was silently dropped on insert.
-- The tick processor's backward-compat text parser still handled it,
-- but this makes the data pipeline explicit and reliable.

ALTER TABLE bill_articles
ADD COLUMN IF NOT EXISTS effect_data JSONB DEFAULT NULL;
