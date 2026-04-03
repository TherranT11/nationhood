-- Add workforce headcount columns to factions for corporations
ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS corp_general_workforce INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corp_skilled_workforce INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corp_innovative_workforce INTEGER DEFAULT 0;

-- Seed existing corporations with default workforce (matches old hardcoded 3000 split)
UPDATE factions
SET corp_general_workforce = 2250,
    corp_skilled_workforce = 600,
    corp_innovative_workforce = 150
WHERE faction_type = 'corporation'
  AND corp_general_workforce = 0
  AND corp_skilled_workforce = 0
  AND corp_innovative_workforce = 0;
