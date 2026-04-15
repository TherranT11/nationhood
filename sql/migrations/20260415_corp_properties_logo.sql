-- Add logo_url column to corp_properties for subsidiary logos
ALTER TABLE corp_properties ADD COLUMN IF NOT EXISTS logo_url TEXT;
