-- Migration: Add funding_data JSONB column to bill_articles
-- Enables "Funding Article" type: adjust ministry funding_level via legislation.
--
-- funding_data schema:
-- {
--   "ministry_key": "education",
--   "action": "increase" | "decrease" | "discretionary",
--   "current_level": 1.0,
--   "proposed_level": 1.3,        -- for increase/decrease
--   "grant_amount": null           -- for discretionary (treasury lump sum)
-- }

ALTER TABLE bill_articles ADD COLUMN IF NOT EXISTS funding_data JSONB DEFAULT NULL;

COMMENT ON COLUMN bill_articles.funding_data IS 'Ministry funding article data: action (increase/decrease/discretionary), ministry_key, proposed_level or grant_amount.';
