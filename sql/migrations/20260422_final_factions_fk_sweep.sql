-- ============================================================
-- FINAL sweep: patch every remaining FK referencing factions(id)
-- that still has on_delete = NO ACTION.
--
-- Built from a live-DB pg_constraint enumeration, not a file scan —
-- so it catches every constraint regardless of whether its origin
-- migration made it into the branch. Supersedes the earlier sweep
-- file that was never fully applied to production.
--
-- Classification:
--   CASCADE   — ephemeral per-faction state (memberships, pending
--               requests, invitations) with no meaning without the
--               parent.
--   SET NULL  — historical / audit / role records that should
--               survive the faction's deletion with identity
--               nulled out.
--
-- Critical overrides:
--   nations.monarch_faction_id — SET NULL (CASCADE would delete
--                                 the entire nation).
--   nations.ruling_faction_id  — same reasoning, SET NULL.
--   active_coalitions.lead_party_id — SET NULL (PM-resign-first
--                                     guard on disband_party blocks
--                                     the common-case; SET NULL is
--                                     the graceful fallback for
--                                     historical rows).
--
-- Idempotent: all DROP CONSTRAINT IF EXISTS + optional DROP NOT NULL
-- (no-op when column is already nullable) + re-add.
-- ============================================================

-- ═════════════════════════════════════════════════════════════
-- CASCADE (active state, dies with the faction)
-- ═════════════════════════════════════════════════════════════

ALTER TABLE ambassadors DROP CONSTRAINT IF EXISTS ambassadors_faction_id_fkey;
ALTER TABLE ambassadors ADD CONSTRAINT ambassadors_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;

ALTER TABLE ipo_members DROP CONSTRAINT IF EXISTS ipo_members_faction_id_fkey;
ALTER TABLE ipo_members ADD CONSTRAINT ipo_members_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;

ALTER TABLE ipo_invitations DROP CONSTRAINT IF EXISTS ipo_invitations_target_faction_id_fkey;
ALTER TABLE ipo_invitations ADD CONSTRAINT ipo_invitations_target_faction_id_fkey
    FOREIGN KEY (target_faction_id) REFERENCES factions(id) ON DELETE CASCADE;

ALTER TABLE ministry_requests DROP CONSTRAINT IF EXISTS ministry_requests_faction_id_fkey;
ALTER TABLE ministry_requests ADD CONSTRAINT ministry_requests_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;

ALTER TABLE bill_amendment_requests DROP CONSTRAINT IF EXISTS bill_amendment_requests_faction_id_fkey;
ALTER TABLE bill_amendment_requests ADD CONSTRAINT bill_amendment_requests_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;

-- ═════════════════════════════════════════════════════════════
-- SET NULL (historical / audit / role preservation)
-- ═════════════════════════════════════════════════════════════
-- DROP NOT NULL before SET NULL FK (no-op when already nullable).

-- Nations — CRITICAL: never CASCADE these, they'd delete the nation.
ALTER TABLE nations DROP CONSTRAINT IF EXISTS nations_monarch_faction_id_fkey;
ALTER TABLE nations ADD CONSTRAINT nations_monarch_faction_id_fkey
    FOREIGN KEY (monarch_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE nations DROP CONSTRAINT IF EXISTS nations_ruling_faction_id_fkey;
ALTER TABLE nations ADD CONSTRAINT nations_ruling_faction_id_fkey
    FOREIGN KEY (ruling_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- Coalition records (historical + active — governing flow has its own guards)
ALTER TABLE coalition_proposals ALTER COLUMN proposer_party_id DROP NOT NULL;
ALTER TABLE coalition_proposals DROP CONSTRAINT IF EXISTS coalition_proposals_proposer_party_id_fkey;
ALTER TABLE coalition_proposals ADD CONSTRAINT coalition_proposals_proposer_party_id_fkey
    FOREIGN KEY (proposer_party_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE coalition_votes ALTER COLUMN party_id DROP NOT NULL;
ALTER TABLE coalition_votes DROP CONSTRAINT IF EXISTS coalition_votes_party_id_fkey;
ALTER TABLE coalition_votes ADD CONSTRAINT coalition_votes_party_id_fkey
    FOREIGN KEY (party_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE active_coalitions ALTER COLUMN lead_party_id DROP NOT NULL;
ALTER TABLE active_coalitions DROP CONSTRAINT IF EXISTS active_coalitions_lead_party_id_fkey;
ALTER TABLE active_coalitions ADD CONSTRAINT active_coalitions_lead_party_id_fkey
    FOREIGN KEY (lead_party_id) REFERENCES factions(id) ON DELETE SET NULL;

-- Government formation flow (historical)
ALTER TABLE government_formations ALTER COLUMN proposed_by DROP NOT NULL;
ALTER TABLE government_formations DROP CONSTRAINT IF EXISTS government_formations_proposed_by_fkey;
ALTER TABLE government_formations ADD CONSTRAINT government_formations_proposed_by_fkey
    FOREIGN KEY (proposed_by) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE government_formation_chat ALTER COLUMN faction_id DROP NOT NULL;
ALTER TABLE government_formation_chat DROP CONSTRAINT IF EXISTS government_formation_chat_faction_id_fkey;
ALTER TABLE government_formation_chat ADD CONSTRAINT government_formation_chat_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- Ministries — ministry persists with NULL party (vacant seat)
ALTER TABLE ministries DROP CONSTRAINT IF EXISTS ministries_party_id_fkey;
ALTER TABLE ministries ADD CONSTRAINT ministries_party_id_fkey
    FOREIGN KEY (party_id) REFERENCES factions(id) ON DELETE SET NULL;

-- Legislative records (historical)
ALTER TABLE active_laws DROP CONSTRAINT IF EXISTS active_laws_proposed_by_fkey;
ALTER TABLE active_laws ADD CONSTRAINT active_laws_proposed_by_fkey
    FOREIGN KEY (proposed_by) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_proposed_by_fkey;
ALTER TABLE bills ADD CONSTRAINT bills_proposed_by_fkey
    FOREIGN KEY (proposed_by) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE bill_articles DROP CONSTRAINT IF EXISTS bill_articles_added_by_fkey;
ALTER TABLE bill_articles ADD CONSTRAINT bill_articles_added_by_fkey
    FOREIGN KEY (added_by) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE amendment_requests DROP CONSTRAINT IF EXISTS amendment_requests_requested_by_fkey;
ALTER TABLE amendment_requests ADD CONSTRAINT amendment_requests_requested_by_fkey
    FOREIGN KEY (requested_by) REFERENCES factions(id) ON DELETE SET NULL;

-- Shakeups (historical reshuffle records)
ALTER TABLE shakeups DROP CONSTRAINT IF EXISTS shakeups_initiated_by_fkey;
ALTER TABLE shakeups ADD CONSTRAINT shakeups_initiated_by_fkey
    FOREIGN KEY (initiated_by) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE shakeups DROP CONSTRAINT IF EXISTS shakeups_ruling_faction_id_fkey;
ALTER TABLE shakeups ADD CONSTRAINT shakeups_ruling_faction_id_fkey
    FOREIGN KEY (ruling_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- NPC party actions (historical AI log)
ALTER TABLE npc_party_actions ALTER COLUMN npc_party_id DROP NOT NULL;
ALTER TABLE npc_party_actions DROP CONSTRAINT IF EXISTS npc_party_actions_npc_party_id_fkey;
ALTER TABLE npc_party_actions ADD CONSTRAINT npc_party_actions_npc_party_id_fkey
    FOREIGN KEY (npc_party_id) REFERENCES factions(id) ON DELETE SET NULL;

-- Pending actions log
ALTER TABLE pending_actions DROP CONSTRAINT IF EXISTS pending_actions_faction_id_fkey;
ALTER TABLE pending_actions ADD CONSTRAINT pending_actions_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- Event comments (chat)
ALTER TABLE event_comments ALTER COLUMN faction_id DROP NOT NULL;
ALTER TABLE event_comments DROP CONSTRAINT IF EXISTS event_comments_faction_id_fkey;
ALTER TABLE event_comments ADD CONSTRAINT event_comments_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- Ministry action log
ALTER TABLE ministry_action_log ALTER COLUMN faction_id DROP NOT NULL;
ALTER TABLE ministry_action_log DROP CONSTRAINT IF EXISTS ministry_action_log_faction_id_fkey;
ALTER TABLE ministry_action_log ADD CONSTRAINT ministry_action_log_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE ministry_action_log DROP CONSTRAINT IF EXISTS ministry_action_log_target_faction_id_fkey;
ALTER TABLE ministry_action_log ADD CONSTRAINT ministry_action_log_target_faction_id_fkey
    FOREIGN KEY (target_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- Diplomacy (chat, proposals, audit)
ALTER TABLE diplomatic_messages ALTER COLUMN from_faction_id DROP NOT NULL;
ALTER TABLE diplomatic_messages DROP CONSTRAINT IF EXISTS diplomatic_messages_from_faction_id_fkey;
ALTER TABLE diplomatic_messages ADD CONSTRAINT diplomatic_messages_from_faction_id_fkey
    FOREIGN KEY (from_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE diplomatic_proposals ALTER COLUMN proposed_by_faction_id DROP NOT NULL;
ALTER TABLE diplomatic_proposals DROP CONSTRAINT IF EXISTS diplomatic_proposals_proposed_by_faction_id_fkey;
ALTER TABLE diplomatic_proposals ADD CONSTRAINT diplomatic_proposals_proposed_by_faction_id_fkey
    FOREIGN KEY (proposed_by_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE diplomatic_action_log ALTER COLUMN faction_id DROP NOT NULL;
ALTER TABLE diplomatic_action_log DROP CONSTRAINT IF EXISTS diplomatic_action_log_faction_id_fkey;
ALTER TABLE diplomatic_action_log ADD CONSTRAINT diplomatic_action_log_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- Executive history
ALTER TABLE presidents ALTER COLUMN faction_id DROP NOT NULL;
ALTER TABLE presidents DROP CONSTRAINT IF EXISTS presidents_faction_id_fkey;
ALTER TABLE presidents ADD CONSTRAINT presidents_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE impeachment_proceedings ALTER COLUMN initiated_by_faction_id DROP NOT NULL;
ALTER TABLE impeachment_proceedings DROP CONSTRAINT IF EXISTS impeachment_proceedings_initiated_by_faction_id_fkey;
ALTER TABLE impeachment_proceedings ADD CONSTRAINT impeachment_proceedings_initiated_by_faction_id_fkey
    FOREIGN KEY (initiated_by_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- International Party Orgs (historical / audit)
ALTER TABLE international_orgs ALTER COLUMN founding_party_id DROP NOT NULL;
ALTER TABLE international_orgs DROP CONSTRAINT IF EXISTS international_orgs_founding_party_id_fkey;
ALTER TABLE international_orgs ADD CONSTRAINT international_orgs_founding_party_id_fkey
    FOREIGN KEY (founding_party_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE international_orgs ALTER COLUMN president_id DROP NOT NULL;
ALTER TABLE international_orgs DROP CONSTRAINT IF EXISTS international_orgs_president_id_fkey;
ALTER TABLE international_orgs ADD CONSTRAINT international_orgs_president_id_fkey
    FOREIGN KEY (president_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE ipo_chat DROP CONSTRAINT IF EXISTS ipo_chat_faction_id_fkey;
ALTER TABLE ipo_chat ADD CONSTRAINT ipo_chat_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE ipo_votes ALTER COLUMN proposed_by DROP NOT NULL;
ALTER TABLE ipo_votes DROP CONSTRAINT IF EXISTS ipo_votes_proposed_by_fkey;
ALTER TABLE ipo_votes ADD CONSTRAINT ipo_votes_proposed_by_fkey
    FOREIGN KEY (proposed_by) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE ipo_ballots DROP CONSTRAINT IF EXISTS ipo_ballots_faction_id_fkey;
ALTER TABLE ipo_ballots ADD CONSTRAINT ipo_ballots_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE ipo_action_log ALTER COLUMN faction_id DROP NOT NULL;
ALTER TABLE ipo_action_log DROP CONSTRAINT IF EXISTS ipo_action_log_faction_id_fkey;
ALTER TABLE ipo_action_log ADD CONSTRAINT ipo_action_log_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE ipo_action_log DROP CONSTRAINT IF EXISTS ipo_action_log_target_faction_id_fkey;
ALTER TABLE ipo_action_log ADD CONSTRAINT ipo_action_log_target_faction_id_fkey
    FOREIGN KEY (target_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE ipo_fund_transactions DROP CONSTRAINT IF EXISTS ipo_fund_transactions_faction_id_fkey;
ALTER TABLE ipo_fund_transactions ADD CONSTRAINT ipo_fund_transactions_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE ipo_invitations ALTER COLUMN invited_by DROP NOT NULL;
ALTER TABLE ipo_invitations DROP CONSTRAINT IF EXISTS ipo_invitations_invited_by_fkey;
ALTER TABLE ipo_invitations ADD CONSTRAINT ipo_invitations_invited_by_fkey
    FOREIGN KEY (invited_by) REFERENCES factions(id) ON DELETE SET NULL;

-- Agitator pool — agitator returns to pool with null hire
ALTER TABLE agitator_pool DROP CONSTRAINT IF EXISTS agitator_pool_hired_by_faction_id_fkey;
ALTER TABLE agitator_pool ADD CONSTRAINT agitator_pool_hired_by_faction_id_fkey
    FOREIGN KEY (hired_by_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- Lawsuits — historical legal record survives party dissolution
ALTER TABLE lawsuits ALTER COLUMN faction_id DROP NOT NULL;
ALTER TABLE lawsuits DROP CONSTRAINT IF EXISTS lawsuits_faction_id_fkey;
ALTER TABLE lawsuits ADD CONSTRAINT lawsuits_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- ═════════════════════════════════════════════════════════════
-- VERIFY — zero rows should remain with on_delete = 'NO ACTION'
-- ═════════════════════════════════════════════════════════════
SELECT
    conrelid::regclass AS child_table,
    a.attname AS child_column,
    conname,
    CASE confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE confdeltype::text
    END AS on_delete
FROM pg_constraint
JOIN pg_attribute a
    ON a.attrelid = conrelid AND a.attnum = conkey[1]
WHERE contype = 'f'
  AND confrelid = 'factions'::regclass
  AND confdeltype = 'a'
ORDER BY child_table, child_column;
