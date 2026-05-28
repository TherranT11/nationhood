-- ═══════════════════════════════════════════════════════════════════════════════
-- NEPTUNE NATION FLAG — nations.is_neptune_nation
-- ═══════════════════════════════════════════════════════════════════════════════
-- A nation created via the admin "Add Nation" tool is part of the Project
-- Neptune era: it should be visible/joinable to Politicians, Entrepreneurs,
-- and Military factions, but NOT to Political Parties (which are being
-- sunsetted in favour of the Politician archetype).
--
-- This migration adds the flag column with a safe FALSE default, so every
-- existing pre-Neptune nation continues to be joinable by Parties exactly
-- as before. The companion change to admin_create_nation (20270349) sets
-- this column to TRUE on insert, and the select-nation party-flow filter
-- hides any row where this column is TRUE.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE nations
    ADD COLUMN IF NOT EXISTS is_neptune_nation BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN nations.is_neptune_nation IS
    'TRUE for nations created via the admin "Add Nation" tool (Project Neptune era).'
    ' Visible to Politicians/Entrepreneurs/Military; hidden from the Party founding'
    ' flow in select-nation.html. Pre-Neptune rows default to FALSE.';

COMMIT;
