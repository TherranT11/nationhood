-- ==================== LEGISLATIVE TERM LENGTH (Foundational Law) ====================
-- Adds per-nation parliamentary_term_ticks column and proposed_parliamentary_term_length on bills.
-- Controls how often parliamentary/legislative elections occur.
-- Autocracies cannot vote on this law.

-- ── Nations table: per-nation parliamentary term configuration ──
ALTER TABLE nations ADD COLUMN IF NOT EXISTS parliamentary_term_ticks INT DEFAULT NULL;

-- ── Bills table: proposed value for foundational legislative term bills ──
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_parliamentary_term_length INT DEFAULT NULL;

-- ── Set initial values per nation ──
-- Melizea (Autocracy): 48 ticks (4 years)
UPDATE nations SET parliamentary_term_ticks = 48 WHERE name = 'Melizea';
-- Avelia (Parliamentary): 48 ticks (4 years)
UPDATE nations SET parliamentary_term_ticks = 48 WHERE name = 'Avelia';
-- Palvera (Presidential): 48 ticks (4 years)
UPDATE nations SET parliamentary_term_ticks = 48 WHERE name = 'Palvera';
-- Montequilla (Parliamentary): 48 ticks (4 years)
UPDATE nations SET parliamentary_term_ticks = 48 WHERE name = 'Montequilla';
-- San Estrella: 48 ticks (4 years)
UPDATE nations SET parliamentary_term_ticks = 48 WHERE name = 'San Estrella';
-- Sangreza (Autocracy): no elections — NULL
UPDATE nations SET parliamentary_term_ticks = NULL WHERE name = 'Sangreza';
-- Valdoria (Parliamentary): 48 ticks (4 years)
UPDATE nations SET parliamentary_term_ticks = 48 WHERE name = 'Valdoria';
