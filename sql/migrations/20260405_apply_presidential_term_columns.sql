-- Fix: Apply missing columns from 20260315_presidential_term_foundational.sql
-- These columns were defined but never applied to the database, causing PGRST204
-- errors when submitting "Head of Government Term Length" foundational bills.

-- Nations table: per-nation presidential term configuration (NULL = use GAME_CONFIG default)
ALTER TABLE nations ADD COLUMN IF NOT EXISTS presidential_term_ticks INT DEFAULT NULL;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS presidential_term_limit INT DEFAULT NULL;

-- Bills table: proposed values for foundational term bills
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_term_length INT DEFAULT NULL;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_term_limit INT DEFAULT NULL;
