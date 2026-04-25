-- ══════════════════════════════════════════════════════════════
-- Absolute Monarchy — Phase 1: Schema additions
-- ══════════════════════════════════════════════════════════════

-- Add monarchy columns to nations table
ALTER TABLE nations ADD COLUMN IF NOT EXISTS monarch_faction_id uuid REFERENCES factions(id);
ALTER TABLE nations ADD COLUMN IF NOT EXISTS monarch_title text DEFAULT 'King';
ALTER TABLE nations ADD COLUMN IF NOT EXISTS dynasty_name text;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS monarch_name text;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS heir_name text;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS heir_age integer DEFAULT 16;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS monarch_crowned_tick integer;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS legitimacy numeric DEFAULT 50;
