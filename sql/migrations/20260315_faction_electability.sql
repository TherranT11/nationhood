-- Add electability column to factions table.
-- Stores the current party leader's electability score (0-100).
-- Seeded deterministically from faction UUID for existing leaders,
-- then updated when new leaders are appointed via Party Leadership.

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS electability INTEGER DEFAULT 50;

-- Seed electability for all existing factions from their UUID.
-- Formula mirrors seedElectability() in politics.js:
--   hex = UUID without dashes
--   seed = parseInt(hex[16..24], 16)
--   base = 20 + (seed % 51)       → 20-70
--   result = max(0, base - 10)    → 10-60
UPDATE factions
SET electability = GREATEST(0, 20 + (('x' || SUBSTRING(REPLACE(id::TEXT, '-', '') FROM 17 FOR 8))::BIT(32)::BIGINT % 51)::INT - 10)
WHERE electability IS NULL OR electability = 50;
