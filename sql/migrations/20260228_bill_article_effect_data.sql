-- Add effect_data JSONB column to bill_articles.
-- Used to store machine-readable effect parameters for articles
-- that directly mutate game state (e.g. tax rate changes).
--
-- Example: { "type": "TAX_RATE_CHANGE", "tax_key": "income_tax", "old_rate": 20, "new_rate": 18 }

ALTER TABLE bill_articles
  ADD COLUMN IF NOT EXISTS effect_data JSONB DEFAULT NULL;
