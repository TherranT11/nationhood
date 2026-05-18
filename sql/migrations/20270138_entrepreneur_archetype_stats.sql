-- ═══════════════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR ARCHETYPE + STATS — columns on factions
-- ═══════════════════════════════════════════════════════════════════════════════
-- The Entrepreneur setup's final page lets the player pick an archetype
-- (THE HEIR / THE FOUNDER), which assigns a fixed stat block + starting
-- cash. These columns persist that choice. All nullable — only
-- entrepreneur factions set them; every other faction leaves them NULL.
--
-- Money: the live spendable balance stays in the existing party_funds
-- column (single source of truth for faction money, same as army).
-- ent_starting_cash is the immutable record of what they began with.
--
-- Total is intentionally NOT stored — it is always ambition + cunning +
-- reputation + vision and is derived wherever shown (one source).
-- Additive + idempotent; RLS unaffected (row policies still govern).
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE factions ADD COLUMN IF NOT EXISTS entrepreneur_archetype text;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS ent_ambition   smallint;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS ent_cunning    smallint;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS ent_reputation smallint;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS ent_vision     smallint;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS ent_starting_cash bigint;

COMMENT ON COLUMN factions.entrepreneur_archetype IS
    'Entrepreneur only: ''heir'' | ''founder''. Set on the setup archetype page; NULL for all other faction types.';
COMMENT ON COLUMN factions.ent_starting_cash IS
    'Entrepreneur only: immutable starting cash (raw dollars). The live balance lives in party_funds.';
