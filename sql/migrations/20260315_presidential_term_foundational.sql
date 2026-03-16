-- ==================== PRESIDENTIAL TERM LENGTH & TERM LIMITS (Foundational Laws) ====================
-- Adds per-nation overrideable presidential term length and term limit columns.
-- These are set via foundational law bills and override the global GAME_CONFIG defaults.

-- ── Nations table: per-nation presidential term configuration ──
-- NULL means "use GAME_CONFIG default"
ALTER TABLE nations ADD COLUMN IF NOT EXISTS presidential_term_ticks INT DEFAULT NULL;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS presidential_term_limit INT DEFAULT NULL;

-- ── Bills table: proposed values for foundational term bills ──
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_term_length INT DEFAULT NULL;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_term_limit INT DEFAULT NULL;
