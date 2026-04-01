-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: Remove Autocracy System
-- Date: 2026-04-01
--
-- Converts Sangreza from Autocracy to Parliamentary Democracy.
-- Disbands all factions and schedules a fresh election.
-- Drops all autocracy-specific tables, functions, and columns.
-- ════════════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. CONVERT: Autocracy → Parliamentary Democracy
UPDATE nations
SET government_type                      = 'Democracy',
    ruling_faction_id                    = NULL,
    designated_successor_faction_id      = NULL,
    revolution_started_tick              = NULL,
    revolution_duration                  = NULL,
    authoritarianism_seize_available_tick = NULL
WHERE government_type = 'Autocracy';

-- 2. DISBAND SANGREZA FACTIONS
CREATE TEMP TABLE _sz_factions AS
    SELECT id FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza');

-- Diplomacy tables
DELETE FROM ambassadors WHERE faction_id IN (SELECT id FROM _sz_factions);
DELETE FROM diplomatic_messages WHERE from_faction_id IN (SELECT id FROM _sz_factions);
DELETE FROM diplomatic_action_log WHERE faction_id IN (SELECT id FROM _sz_factions);
UPDATE bills SET diplomatic_proposal_id = NULL
    WHERE diplomatic_proposal_id IN (
        SELECT id FROM diplomatic_proposals WHERE proposed_by_faction_id IN (SELECT id FROM _sz_factions)
    );
DELETE FROM diplomatic_proposals WHERE proposed_by_faction_id IN (SELECT id FROM _sz_factions);

-- Government tables
DELETE FROM impeachment_proceedings WHERE initiated_by_faction_id IN (SELECT id FROM _sz_factions);
DELETE FROM ministries WHERE party_id IN (SELECT id FROM _sz_factions);
UPDATE presidents SET faction_id = NULL WHERE faction_id IN (SELECT id FROM _sz_factions);

-- IPO tables (some may not exist yet — use DO blocks)
DO $$ BEGIN
  DELETE FROM ipo_fund_transactions WHERE faction_id IN (SELECT id FROM _sz_factions);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  DELETE FROM ipo_solidarity_requests WHERE requesting_faction_id IN (SELECT id FROM _sz_factions);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  DELETE FROM ipo_solidarity_requests WHERE target_faction_id IN (SELECT id FROM _sz_factions);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  DELETE FROM ipo_policy_proposals WHERE proposed_by IN (SELECT id FROM _sz_factions);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  DELETE FROM ipo_vote_log WHERE faction_id IN (SELECT id FROM _sz_factions);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  DELETE FROM ipo_invitations WHERE invited_by IN (SELECT id FROM _sz_factions);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  DELETE FROM ipo_invitations WHERE target_faction_id IN (SELECT id FROM _sz_factions);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  DELETE FROM ipo_chat_messages WHERE faction_id IN (SELECT id FROM _sz_factions);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  DELETE FROM ipo_members WHERE faction_id IN (SELECT id FROM _sz_factions);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  UPDATE international_orgs SET founding_party_id = NULL WHERE founding_party_id IN (SELECT id FROM _sz_factions);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  UPDATE international_orgs SET president_id = NULL WHERE president_id IN (SELECT id FROM _sz_factions);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Wiki
UPDATE wiki_pages SET created_by = NULL WHERE created_by IN (SELECT id FROM _sz_factions);
UPDATE wiki_pages SET updated_by = NULL WHERE updated_by IN (SELECT id FROM _sz_factions);
UPDATE wiki_pages SET locked_by = NULL WHERE locked_by IN (SELECT id FROM _sz_factions);

-- Delete all factions
DELETE FROM factions
WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza');

DROP TABLE _sz_factions;

-- 3. DROP AUTOCRACY-SPECIFIC TABLES
DROP TABLE IF EXISTS pyrrhic_window CASCADE;
DROP TABLE IF EXISTS vulnerability_window CASCADE;
DROP TABLE IF EXISTS putsch_state CASCADE;
DROP TABLE IF EXISTS silent_coup_votes CASCADE;
DROP TABLE IF EXISTS silent_coup_offers CASCADE;
DROP TABLE IF EXISTS coup_attempt_log CASCADE;
DROP TABLE IF EXISTS autocracy_action_log CASCADE;
DROP TABLE IF EXISTS faction_pillar_state CASCADE;
DROP TABLE IF EXISTS autocracy_tracker CASCADE;

-- 4. DROP AUTOCRACY RPC FUNCTIONS
DROP FUNCTION IF EXISTS get_tracker_word(UUID);
DROP FUNCTION IF EXISTS get_faction_power(UUID);
DROP FUNCTION IF EXISTS get_power_delta(INTEGER);

-- 5. DROP AUTOCRACY-SPECIFIC COLUMNS
ALTER TABLE nations DROP COLUMN IF EXISTS designated_successor_faction_id;
ALTER TABLE nations DROP COLUMN IF EXISTS revolution_started_tick;
ALTER TABLE nations DROP COLUMN IF EXISTS revolution_duration;
ALTER TABLE nations DROP COLUMN IF EXISTS authoritarianism_seize_available_tick;

-- 6. SCHEDULE PARLIAMENTARY ELECTION FOR SANGREZA
INSERT INTO elections (nation_id, election_tick, election_type, status)
SELECT
    n.id,
    s.current_tick + 5,
    'parliamentary',
    'scheduled'
FROM nations n
JOIN shard s ON s.id = n.shard_id
WHERE n.name = 'Sangreza';

COMMIT;
