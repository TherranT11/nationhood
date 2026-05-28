-- ═══════════════════════════════════════════════════════════════════════════════
-- POLITICIAN CAREER — factions.politician_career
-- ═══════════════════════════════════════════════════════════════════════════════
-- The politician topbar displays a "Career" pill (Independent by default; later
-- can be a party affiliation, a labor movement, etc.). The home page reads this
-- column straight off the politician's faction row — no hardcoded literal in
-- the UI.
--
-- The column lives on `factions` (rather than a separate politicians table) to
-- match the existing pattern of polymorphic per-faction-type columns
-- (ent_archetype, branch, etc.). Non-politician rows ignore it but harmlessly
-- carry the 'Independent' default — no behaviour drift, no nullability
-- complexity in the renderer.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS politician_career TEXT NOT NULL DEFAULT 'Independent';

COMMENT ON COLUMN factions.politician_career IS
    'Politician affiliation displayed on politician-home.html. Defaults to'
    ' Independent on new politicians; future code that adds party-joining,'
    ' union leadership, etc. updates this column. Ignored for non-politician'
    ' factions.';

COMMIT;
