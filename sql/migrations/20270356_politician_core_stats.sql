-- ═══════════════════════════════════════════════════════════════════════════════
-- POLITICIAN CORE STATS — charisma / reputation / credibility
-- ═══════════════════════════════════════════════════════════════════════════════
-- politician-home.html renders four stat cards mirroring the entrepreneur
-- dashboard's AMBITION / CUNNING / REPUTATION / VISION row. The three numerical
-- politician stats live as INT NOT NULL columns on the factions row, defaulting
-- to 1; the 4th card (Career) reads the already-existing factions.politician_career.
--
-- Stat names align with the design ideation (Charisma/Reputation/Credibility);
-- future progression code (rallies, scandals, leadership challenges) updates
-- these columns in place. They live on factions to match the polymorphic
-- per-faction-type column pattern (ent_ambition / ent_cunning / etc. for
-- entrepreneurs, politician_career for politicians).
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS politician_charisma     INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS politician_reputation   INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS politician_credibility  INT NOT NULL DEFAULT 1;

COMMENT ON COLUMN factions.politician_charisma    IS 'Politician stat: 1 at creation, grows via rallies / public speeches / leadership wins.';
COMMENT ON COLUMN factions.politician_reputation  IS 'Politician stat: 1 at creation, grows via positive press / completed promises / clean wins.';
COMMENT ON COLUMN factions.politician_credibility IS 'Politician stat: 1 at creation, falls with broken promises / scandals / flip-flopping.';

COMMIT;
