-- Add locked_by column for page protection
ALTER TABLE wiki_pages ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES factions(id);
