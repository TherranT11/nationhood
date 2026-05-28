-- ═══════════════════════════════════════════════════════════════════════════════
-- POLITICIAN INFLUENCE — factions.politician_influence
-- ═══════════════════════════════════════════════════════════════════════════════
-- The politician topbar's right-side pill is changing from a cash display
-- ("POL CASH: $0") to a politician-specific influence score ("INFLUENCE: 0").
-- This column is the source of truth for that score: an INT NOT NULL DEFAULT 0
-- on every faction row, ignored by non-politician factions, updated in place
-- by future progression mechanics (rallies, scandals, leadership wins, etc.).
--
-- Distinct from factions.party_funds. Politicians today carry party_funds = 0
-- (set at first-steps.html creation), and there is no cash mechanic for
-- politicians. Reusing party_funds for "influence" would conflate dollars and
-- score across faction types; a dedicated column keeps each surface honest.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS politician_influence INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN factions.politician_influence IS
    'Politician influence score (was displayed as POL CASH). Starts at 0;'
    ' future progression code updates it. Ignored for non-politician factions.';

COMMIT;
