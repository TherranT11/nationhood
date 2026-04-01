-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: Remove Autocracy System
-- Date: 2026-04-01
--
-- The autocracy government type is being completely removed from the game.
-- Melizea (the only autocracy nation) is converted to a Parliamentary Democracy.
--
-- This migration:
--   1. Clears autocracy-specific columns on the nations table for Melizea
--   2. Converts Melizea's government_type from 'Autocracy' to 'Democracy'
--   3. Removes all factions in Melizea (the NPC seed factions: Ruling Junta,
--      Reform Movement, Traditionalist Guard) — players will create new parties
--   4. Clears faction_id on any player profiles that were in Melizea factions
--   5. Drops all autocracy-specific tables
--   6. Drops autocracy RPC functions
--   7. Schedules a parliamentary election for Melizea so new parties can form
-- ════════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CONVERT MELIZEA: Autocracy → Parliamentary Democracy
--    Clear all autocracy-specific columns on the nations row.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE nations
SET government_type                   = 'Democracy',
    ruling_faction_id                 = NULL,
    designated_successor_faction_id   = NULL,
    revolution_started_tick           = NULL,
    revolution_duration               = NULL,
    authoritarianism_seize_available_tick = NULL
WHERE government_type = 'Autocracy';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. DISBAND MELIZEA FACTIONS
--    Remove all factions in the former autocracy nation. The entire political
--    structure is being reset — players will need to create new parties.
--
--    Many tables have ON DELETE CASCADE for faction_id, so deleting factions
--    will automatically clean up:
--      - faction_pillar_state (autocracy table, also being dropped below)
--      - coup_attempt_log, silent_coup_offers, silent_coup_votes, etc.
--      - forum_threads, forum_replies (faction_id CASCADE)
--      - admin_chat (faction_id CASCADE)
--      - stewards (faction_id CASCADE)
--      - faction_bloc_approval, ideology_history, etc.
--
--    For tables with ON DELETE SET NULL (e.g. civic_posts, contracts),
--    the faction_id will simply become NULL, which is acceptable.
--
--    We must first NULL out profile references since profiles.faction_id
--    may not have ON DELETE CASCADE.
-- ─────────────────────────────────────────────────────────────────────────────

-- Clear faction_id on player profiles that belonged to Melizea factions
UPDATE profiles
SET faction_id = NULL
WHERE faction_id IN (
    SELECT f.id FROM factions f
    JOIN nations n ON f.nation_id = n.id
    WHERE n.name = 'Melizea'
);

-- Clean up non-CASCADE foreign key references to Melizea factions before deletion.
-- These tables have FK constraints that would block DELETE FROM factions.
DELETE FROM ambassadors WHERE faction_id IN (
    SELECT id FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Melizea')
);
DELETE FROM diplomatic_messages WHERE from_faction_id IN (
    SELECT id FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Melizea')
);
DELETE FROM diplomatic_proposals WHERE proposed_by_faction_id IN (
    SELECT id FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Melizea')
);
DELETE FROM diplomatic_action_log WHERE faction_id IN (
    SELECT id FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Melizea')
);
DELETE FROM faction_coalitions WHERE proposed_by_faction_id IN (
    SELECT id FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Melizea')
);
DELETE FROM impeachment_proceedings WHERE initiated_by_faction_id IN (
    SELECT id FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Melizea')
);
UPDATE presidents SET faction_id = NULL WHERE faction_id IN (
    SELECT id FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Melizea')
);
UPDATE wiki_pages SET created_by = NULL WHERE created_by IN (
    SELECT id FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Melizea')
);
UPDATE wiki_pages SET updated_by = NULL WHERE updated_by IN (
    SELECT id FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Melizea')
);
UPDATE wiki_pages SET locked_by = NULL WHERE locked_by IN (
    SELECT id FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Melizea')
);

-- Delete all factions in Melizea
DELETE FROM factions
WHERE nation_id = (SELECT id FROM nations WHERE name = 'Melizea');

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DROP AUTOCRACY-SPECIFIC TABLES
--    These tables were created in 20260320_autocracy_v5_phase1_schema.sql
--    and are no longer needed.
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS pyrrhic_window CASCADE;
DROP TABLE IF EXISTS vulnerability_window CASCADE;
DROP TABLE IF EXISTS putsch_state CASCADE;
DROP TABLE IF EXISTS silent_coup_votes CASCADE;
DROP TABLE IF EXISTS silent_coup_offers CASCADE;
DROP TABLE IF EXISTS coup_attempt_log CASCADE;
DROP TABLE IF EXISTS autocracy_action_log CASCADE;
DROP TABLE IF EXISTS faction_pillar_state CASCADE;
DROP TABLE IF EXISTS autocracy_tracker CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. DROP AUTOCRACY RPC FUNCTIONS
--    These were created in the phase 1 schema migration and are only used
--    by the autocracy system.
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS get_tracker_word(UUID);
DROP FUNCTION IF EXISTS get_faction_power(UUID);
DROP FUNCTION IF EXISTS get_power_delta(INTEGER);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. DROP AUTOCRACY-SPECIFIC COLUMNS FROM NATIONS TABLE
--    These columns were added for the autocracy system and are no longer
--    needed by any government type.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE nations DROP COLUMN IF EXISTS designated_successor_faction_id;
ALTER TABLE nations DROP COLUMN IF EXISTS revolution_started_tick;
ALTER TABLE nations DROP COLUMN IF EXISTS revolution_duration;
ALTER TABLE nations DROP COLUMN IF EXISTS authoritarianism_seize_available_tick;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SCHEDULE PARLIAMENTARY ELECTION FOR MELIZEA
--    With all factions disbanded, Melizea needs a fresh election so players
--    can create new parties and compete democratically.
--    Scheduled 5 ticks from the current shard tick to give players time.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO elections (nation_id, election_tick, election_type, status)
SELECT
    n.id,
    s.current_tick + 5,
    'parliamentary',
    'scheduled'
FROM nations n
JOIN shard s ON s.id = n.shard_id
WHERE n.name = 'Melizea';

COMMIT;
