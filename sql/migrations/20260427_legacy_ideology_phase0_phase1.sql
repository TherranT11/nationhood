-- ─────────────────────────────────────────────────────────────
-- Legacy ideology cleanup — Phase 0 + Phase 1
-- ─────────────────────────────────────────────────────────────
-- The factions table previously had ideology_value_1 / ideology_value_2
-- (free-text ideology tags). Those columns were dropped from prod at
-- some point but live across ~12 client files + the advance-tick edge
-- function as embedded SELECTs. The mismatch surfaced as
-- "Could not find the 'ideology_value_1' column of 'factions' in the
-- schema cache" when starting a new corp.
--
-- Source-of-truth replacement is the faction_ideology table (numeric
-- per-axis values), but converting tag-based reads to axis-based
-- derivations is a semantic refactor across many files. That's Phase 2,
-- deferred.
--
-- This migration:
--
-- Phase 0 (immediate unblock):
--   Re-add factions.ideology_value_1 / ideology_value_2 as nullable
--   text. Existing rows are null — same effect as the columns being
--   missing, except the schema cache stops complaining.
--
-- Phase 1 (delete dead infrastructure):
--   Five SQL functions reference these columns and aren't called from
--   any client or edge code. They go now.
--   Three tables (interest_groups, npc_party_names, parties) are also
--   uncalled. The single remaining read of `parties` in
--   nation-info.html was redundant with the already-loaded `factions`
--   query and was inlined out in the same commit.
--   Three columns on factions (is_npc, ideology_value_3,
--   ideology_value_4) have zero readers anywhere in the codebase.
-- ─────────────────────────────────────────────────────────────

-- Phase 0: re-add columns so the schema cache stops 404'ing
ALTER TABLE factions ADD COLUMN IF NOT EXISTS ideology_value_1 text;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS ideology_value_2 text;

-- Phase 1: drop dead SQL functions (none are called from client or edge)
DROP FUNCTION IF EXISTS calculate_value_conflicts(uuid[]);
DROP FUNCTION IF EXISTS calculate_election_results(uuid);
DROP FUNCTION IF EXISTS generate_npc_parties_for_nation(uuid);
DROP FUNCTION IF EXISTS action_lobby_interest_group(uuid, uuid);
DROP FUNCTION IF EXISTS process_npc_committee_votes(uuid);

-- Phase 1: drop dead tables (zero references)
DROP TABLE IF EXISTS interest_groups CASCADE;
DROP TABLE IF EXISTS npc_party_names CASCADE;
DROP TABLE IF EXISTS parties           CASCADE;

-- Phase 1: drop dead columns on factions
ALTER TABLE factions DROP COLUMN IF EXISTS is_npc;
ALTER TABLE factions DROP COLUMN IF EXISTS ideology_value_3;
ALTER TABLE factions DROP COLUMN IF EXISTS ideology_value_4;

-- Force PostgREST to refresh its schema view immediately so the new
-- column shape is visible without a service restart.
NOTIFY pgrst, 'reload schema';
