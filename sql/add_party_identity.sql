-- ==================== PARTY IDENTITY COLUMNS ====================
-- Adds visual/cosmetic identity fields to the factions table:
--   party_color: hex color code for UI display
--   party_logo: icon identifier from predefined icon set
--   party_description: short flavor text (max 200 chars)

ALTER TABLE factions ADD COLUMN IF NOT EXISTS party_color VARCHAR(7);
ALTER TABLE factions ADD COLUMN IF NOT EXISTS party_logo VARCHAR(50);
ALTER TABLE factions ADD COLUMN IF NOT EXISTS party_description TEXT;
