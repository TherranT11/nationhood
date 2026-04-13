-- Add corp_reputation column to factions table.
-- Used by corporate actions (Restructure, Rebrand) and displayed on dashboard.
-- Default 65 matches the client-side fallback.

ALTER TABLE factions ADD COLUMN IF NOT EXISTS corp_reputation INTEGER DEFAULT 65;
