-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: Political Party Registration Act
-- Date: 2026-04-01
--
-- Adds tracking columns for the Political Party Registration Act foundational law.
-- When active, parties below a chosen seat threshold (<5%, <10%, or <15%)
-- have their seats reallocated to other parties after elections.
-- Affected parties cannot sponsor bills, vote, or hold ministries.
-- ════════════════════════════════════════════════════════════════════════════════

-- Nation flag: threshold percentage (0 = not active, 5/10/15 = active with that threshold)
ALTER TABLE nations ADD COLUMN IF NOT EXISTS party_registration_threshold INT DEFAULT 0;

-- Bill proposal field: the chosen threshold (5, 10, or 15)
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_party_registration_threshold INT DEFAULT NULL;

-- Faction flags for tracking disbanded status and popup dismissal
ALTER TABLE factions ADD COLUMN IF NOT EXISTS registration_act_disbanded BOOLEAN DEFAULT FALSE;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS registration_act_dismissed BOOLEAN DEFAULT FALSE;
