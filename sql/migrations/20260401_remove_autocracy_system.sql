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
--    Comprehensive FK cleanup from admin_delete_party + all known FK tables.
--    Each table wrapped in its own DO block so missing tables don't block others.

DO $$ DECLARE _nid UUID; _fids UUID[]; BEGIN
  SELECT id INTO _nid FROM nations WHERE name = 'Sangreza';
  SELECT array_agg(id) INTO _fids FROM factions WHERE nation_id = _nid;
  IF _fids IS NULL THEN RETURN; END IF;

  -- Diplomacy
  DELETE FROM ambassadors WHERE faction_id = ANY(_fids);
  DELETE FROM diplomatic_messages WHERE from_faction_id = ANY(_fids);
  DELETE FROM diplomatic_action_log WHERE faction_id = ANY(_fids);
  UPDATE bills SET diplomatic_proposal_id = NULL
    WHERE diplomatic_proposal_id IN (SELECT id FROM diplomatic_proposals WHERE proposed_by_faction_id = ANY(_fids));
  DELETE FROM diplomatic_proposals WHERE proposed_by_faction_id = ANY(_fids);

  -- Government
  DELETE FROM impeachment_proceedings WHERE initiated_by_faction_id = ANY(_fids);
  DELETE FROM ministries WHERE party_id = ANY(_fids);
  UPDATE presidents SET faction_id = NULL WHERE faction_id = ANY(_fids);
  DELETE FROM donor_trust WHERE party_id = ANY(_fids);
  UPDATE administrations SET pm_party_id = NULL WHERE pm_party_id = ANY(_fids);
  DELETE FROM election_candidates WHERE faction_id = ANY(_fids);
  DELETE FROM presidential_candidates WHERE faction_id = ANY(_fids);
  UPDATE protests SET faction_id = NULL WHERE faction_id = ANY(_fids);
  UPDATE protest_log SET faction_id = NULL WHERE faction_id = ANY(_fids);
  UPDATE event_log SET faction_id = NULL WHERE faction_id = ANY(_fids);

  -- Electoral / standing
  DELETE FROM faction_electoral_standing WHERE faction_id = ANY(_fids);
  DELETE FROM faction_issue_stance WHERE faction_id = ANY(_fids);
  DELETE FROM ideology_shift_actions WHERE faction_id = ANY(_fids);
  DELETE FROM party_approval_log WHERE faction_id = ANY(_fids);
  DELETE FROM credibility_log WHERE faction_id = ANY(_fids);

  -- Wiki
  UPDATE wiki_pages SET created_by = NULL WHERE created_by = ANY(_fids);
  UPDATE wiki_pages SET updated_by = NULL WHERE updated_by = ANY(_fids);
  UPDATE wiki_pages SET locked_by = NULL WHERE locked_by = ANY(_fids);
END $$;

-- IPO tables — separate DO blocks (some tables may not exist)
DO $$ DECLARE _fids UUID[]; BEGIN SELECT array_agg(id) INTO _fids FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza'); IF _fids IS NULL THEN RETURN; END IF; DELETE FROM ipo_votes WHERE proposed_by = ANY(_fids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $$;
DO $$ DECLARE _fids UUID[]; BEGIN SELECT array_agg(id) INTO _fids FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza'); IF _fids IS NULL THEN RETURN; END IF; DELETE FROM ipo_action_log WHERE faction_id = ANY(_fids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $$;
DO $$ DECLARE _fids UUID[]; BEGIN SELECT array_agg(id) INTO _fids FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza'); IF _fids IS NULL THEN RETURN; END IF; DELETE FROM ipo_amendment_history WHERE faction_id = ANY(_fids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $$;
DO $$ DECLARE _fids UUID[]; BEGIN SELECT array_agg(id) INTO _fids FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza'); IF _fids IS NULL THEN RETURN; END IF; DELETE FROM ipo_actions WHERE faction_id = ANY(_fids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $$;
DO $$ DECLARE _fids UUID[]; BEGIN SELECT array_agg(id) INTO _fids FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza'); IF _fids IS NULL THEN RETURN; END IF; DELETE FROM ipo_actions WHERE target_faction_id = ANY(_fids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $$;
DO $$ DECLARE _fids UUID[]; BEGIN SELECT array_agg(id) INTO _fids FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza'); IF _fids IS NULL THEN RETURN; END IF; DELETE FROM ipo_ballots WHERE faction_id = ANY(_fids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $$;
DO $$ DECLARE _fids UUID[]; BEGIN SELECT array_agg(id) INTO _fids FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza'); IF _fids IS NULL THEN RETURN; END IF; DELETE FROM ipo_chat WHERE faction_id = ANY(_fids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $$;
DO $$ DECLARE _fids UUID[]; BEGIN SELECT array_agg(id) INTO _fids FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza'); IF _fids IS NULL THEN RETURN; END IF; DELETE FROM ipo_invitations WHERE target_faction_id = ANY(_fids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $$;
DO $$ DECLARE _fids UUID[]; BEGIN SELECT array_agg(id) INTO _fids FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza'); IF _fids IS NULL THEN RETURN; END IF; DELETE FROM ipo_invitations WHERE invited_by_faction_id = ANY(_fids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $$;
DO $$ DECLARE _fids UUID[]; BEGIN SELECT array_agg(id) INTO _fids FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza'); IF _fids IS NULL THEN RETURN; END IF; DELETE FROM ipo_members WHERE faction_id = ANY(_fids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $$;
DO $$ DECLARE _fids UUID[]; BEGIN SELECT array_agg(id) INTO _fids FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza'); IF _fids IS NULL THEN RETURN; END IF; UPDATE ipo_organisations SET president_id = NULL WHERE president_id = ANY(_fids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $$;
DO $$ DECLARE _fids UUID[]; BEGIN SELECT array_agg(id) INTO _fids FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza'); IF _fids IS NULL THEN RETURN; END IF; UPDATE international_orgs SET founding_party_id = NULL WHERE founding_party_id = ANY(_fids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $$;
DO $$ DECLARE _fids UUID[]; BEGIN SELECT array_agg(id) INTO _fids FROM factions WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza'); IF _fids IS NULL THEN RETURN; END IF; UPDATE international_orgs SET president_id = NULL WHERE president_id = ANY(_fids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $$;

-- Delete all factions
DELETE FROM factions
WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza');

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
