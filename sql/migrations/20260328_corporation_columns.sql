-- Add corporation-specific columns to the factions table.
-- These are NULL for political parties and populated for corporation faction types.

ALTER TABLE factions ADD COLUMN IF NOT EXISTS corp_sector TEXT;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS corp_subsector TEXT;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS corp_company_type TEXT;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS corp_ticker VARCHAR(4);

COMMENT ON COLUMN factions.corp_sector IS 'Corporation sector (e.g. Construction). NULL for parties.';
COMMENT ON COLUMN factions.corp_subsector IS 'Corporation subsector (e.g. Light Infrastructure). NULL for parties.';
COMMENT ON COLUMN factions.corp_company_type IS 'Public or Private. NULL for parties.';
COMMENT ON COLUMN factions.corp_ticker IS 'Stock ticker symbol, 2-4 uppercase letters. NULL for parties.';
