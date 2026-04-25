-- ============================================================
-- Sweep: fix every remaining FK referencing factions(id) that was
-- declared without an explicit ON DELETE clause.
--
-- Background: Postgres defaults FK ON DELETE to NO ACTION, which
-- REJECTS the parent delete when child rows exist. Every Disband
-- Party / Declare Bankruptcy attempt has been hitting a different
-- one of these in turn — faction_deputies, faction_agitators,
-- negotiation_messages, campaign_actions were patched individually.
-- This migration fixes the rest in one pass so we stop reacting
-- table-by-table.
--
-- Classification rule:
--   CASCADE  — child row is an ACTIVE faction-bound state that has
--              no meaning without its parent (membership, role,
--              active application, active claim by claimant).
--   SET NULL — child row is a HISTORICAL audit record that should
--              survive the faction's deletion with identity preserved
--              as null (messages, logs, proposals, historical marks).
--   Special: nations.monarch_faction_id — must be SET NULL.
--            CASCADE would delete the ENTIRE NATION when its monarch
--            faction disbanded. Non-starter.
--
-- Idempotent: DROP CONSTRAINT IF EXISTS + re-add. For columns that
-- need to be nullable for SET NULL to work, DROP NOT NULL is a no-op
-- if already nullable.
-- ============================================================

-- ═════════════════════════════════════════════════════════════
-- CASCADE (active faction-bound state)
-- ═════════════════════════════════════════════════════════════

-- ambassadors — the ambassador IS a faction's representative
ALTER TABLE ambassadors DROP CONSTRAINT IF EXISTS ambassadors_faction_id_fkey;
ALTER TABLE ambassadors ADD CONSTRAINT ambassadors_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;

-- ipo_members — membership row dies with the member
ALTER TABLE ipo_members DROP CONSTRAINT IF EXISTS ipo_members_faction_id_fkey;
ALTER TABLE ipo_members ADD CONSTRAINT ipo_members_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;

-- ipo_invitations.target_faction_id — invitation to a dead party is moot
ALTER TABLE ipo_invitations DROP CONSTRAINT IF EXISTS ipo_invitations_target_faction_id_fkey;
ALTER TABLE ipo_invitations ADD CONSTRAINT ipo_invitations_target_faction_id_fkey
    FOREIGN KEY (target_faction_id) REFERENCES factions(id) ON DELETE CASCADE;

-- shipping_applications.faction_id — application is a pending proposal by the
-- applicant; if applicant disbanded, application is void
ALTER TABLE shipping_applications DROP CONSTRAINT IF EXISTS shipping_applications_faction_id_fkey;
ALTER TABLE shipping_applications ADD CONSTRAINT shipping_applications_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;

-- ═════════════════════════════════════════════════════════════
-- SET NULL (historical / audit records)
-- ═════════════════════════════════════════════════════════════
-- Nullability must be dropped first. DROP NOT NULL is idempotent.

-- diplomatic_messages — chat history, survives party dissolution
ALTER TABLE diplomatic_messages ALTER COLUMN from_faction_id DROP NOT NULL;
ALTER TABLE diplomatic_messages DROP CONSTRAINT IF EXISTS diplomatic_messages_from_faction_id_fkey;
ALTER TABLE diplomatic_messages ADD CONSTRAINT diplomatic_messages_from_faction_id_fkey
    FOREIGN KEY (from_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- diplomatic_proposals — proposal record should survive
ALTER TABLE diplomatic_proposals ALTER COLUMN proposed_by_faction_id DROP NOT NULL;
ALTER TABLE diplomatic_proposals DROP CONSTRAINT IF EXISTS diplomatic_proposals_proposed_by_faction_id_fkey;
ALTER TABLE diplomatic_proposals ADD CONSTRAINT diplomatic_proposals_proposed_by_faction_id_fkey
    FOREIGN KEY (proposed_by_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- diplomatic_action_log — audit log
ALTER TABLE diplomatic_action_log ALTER COLUMN faction_id DROP NOT NULL;
ALTER TABLE diplomatic_action_log DROP CONSTRAINT IF EXISTS diplomatic_action_log_faction_id_fkey;
ALTER TABLE diplomatic_action_log ADD CONSTRAINT diplomatic_action_log_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- faction_coalitions.proposed_by_faction_id — coalition proposal history
ALTER TABLE faction_coalitions ALTER COLUMN proposed_by_faction_id DROP NOT NULL;
ALTER TABLE faction_coalitions DROP CONSTRAINT IF EXISTS faction_coalitions_proposed_by_faction_id_fkey;
ALTER TABLE faction_coalitions ADD CONSTRAINT faction_coalitions_proposed_by_faction_id_fkey
    FOREIGN KEY (proposed_by_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- impeachment_proceedings.initiated_by_faction_id — historical record
ALTER TABLE impeachment_proceedings ALTER COLUMN initiated_by_faction_id DROP NOT NULL;
ALTER TABLE impeachment_proceedings DROP CONSTRAINT IF EXISTS impeachment_proceedings_initiated_by_faction_id_fkey;
ALTER TABLE impeachment_proceedings ADD CONSTRAINT impeachment_proceedings_initiated_by_faction_id_fkey
    FOREIGN KEY (initiated_by_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- wiki_pages — authorship / locking preserved
ALTER TABLE wiki_pages ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE wiki_pages DROP CONSTRAINT IF EXISTS wiki_pages_created_by_fkey;
ALTER TABLE wiki_pages ADD CONSTRAINT wiki_pages_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE wiki_pages ALTER COLUMN updated_by DROP NOT NULL;
ALTER TABLE wiki_pages DROP CONSTRAINT IF EXISTS wiki_pages_updated_by_fkey;
ALTER TABLE wiki_pages ADD CONSTRAINT wiki_pages_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES factions(id) ON DELETE SET NULL;

-- locked_by is already nullable (optional lock)
ALTER TABLE wiki_pages DROP CONSTRAINT IF EXISTS wiki_pages_locked_by_fkey;
ALTER TABLE wiki_pages ADD CONSTRAINT wiki_pages_locked_by_fkey
    FOREIGN KEY (locked_by) REFERENCES factions(id) ON DELETE SET NULL;

-- IPO (International Party Org) historical records
ALTER TABLE international_orgs ALTER COLUMN founding_party_id DROP NOT NULL;
ALTER TABLE international_orgs DROP CONSTRAINT IF EXISTS international_orgs_founding_party_id_fkey;
ALTER TABLE international_orgs ADD CONSTRAINT international_orgs_founding_party_id_fkey
    FOREIGN KEY (founding_party_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE international_orgs ALTER COLUMN president_id DROP NOT NULL;
ALTER TABLE international_orgs DROP CONSTRAINT IF EXISTS international_orgs_president_id_fkey;
ALTER TABLE international_orgs ADD CONSTRAINT international_orgs_president_id_fkey
    FOREIGN KEY (president_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE ipo_chat ALTER COLUMN faction_id DROP NOT NULL;
ALTER TABLE ipo_chat DROP CONSTRAINT IF EXISTS ipo_chat_faction_id_fkey;
ALTER TABLE ipo_chat ADD CONSTRAINT ipo_chat_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE ipo_votes ALTER COLUMN proposed_by DROP NOT NULL;
ALTER TABLE ipo_votes DROP CONSTRAINT IF EXISTS ipo_votes_proposed_by_fkey;
ALTER TABLE ipo_votes ADD CONSTRAINT ipo_votes_proposed_by_fkey
    FOREIGN KEY (proposed_by) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE ipo_ballots ALTER COLUMN faction_id DROP NOT NULL;
ALTER TABLE ipo_ballots DROP CONSTRAINT IF EXISTS ipo_ballots_faction_id_fkey;
ALTER TABLE ipo_ballots ADD CONSTRAINT ipo_ballots_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE ipo_action_log ALTER COLUMN faction_id DROP NOT NULL;
ALTER TABLE ipo_action_log DROP CONSTRAINT IF EXISTS ipo_action_log_faction_id_fkey;
ALTER TABLE ipo_action_log ADD CONSTRAINT ipo_action_log_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- target_faction_id is already nullable per the column comment
ALTER TABLE ipo_action_log DROP CONSTRAINT IF EXISTS ipo_action_log_target_faction_id_fkey;
ALTER TABLE ipo_action_log ADD CONSTRAINT ipo_action_log_target_faction_id_fkey
    FOREIGN KEY (target_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE ipo_fund_transactions ALTER COLUMN faction_id DROP NOT NULL;
ALTER TABLE ipo_fund_transactions DROP CONSTRAINT IF EXISTS ipo_fund_transactions_faction_id_fkey;
ALTER TABLE ipo_fund_transactions ADD CONSTRAINT ipo_fund_transactions_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE ipo_invitations ALTER COLUMN invited_by DROP NOT NULL;
ALTER TABLE ipo_invitations DROP CONSTRAINT IF EXISTS ipo_invitations_invited_by_fkey;
ALTER TABLE ipo_invitations ADD CONSTRAINT ipo_invitations_invited_by_fkey
    FOREIGN KEY (invited_by) REFERENCES factions(id) ON DELETE SET NULL;

-- Issue cards — history of card plays survives party dissolution
-- (played_by_faction_id already nullable per column comment)
ALTER TABLE issue_card_plays DROP CONSTRAINT IF EXISTS issue_card_plays_played_by_faction_id_fkey;
ALTER TABLE issue_card_plays ADD CONSTRAINT issue_card_plays_played_by_faction_id_fkey
    FOREIGN KEY (played_by_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- Shipping applications' reviewer (distinct from applicant above which CASCADEs)
ALTER TABLE shipping_applications ALTER COLUMN reviewed_by_faction_id DROP NOT NULL;
ALTER TABLE shipping_applications DROP CONSTRAINT IF EXISTS shipping_applications_reviewed_by_faction_id_fkey;
ALTER TABLE shipping_applications ADD CONSTRAINT shipping_applications_reviewed_by_faction_id_fkey
    FOREIGN KEY (reviewed_by_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- Insurance claims — preserve historical claim records with null parties
ALTER TABLE insurance_claims ALTER COLUMN claimant_faction_id DROP NOT NULL;
ALTER TABLE insurance_claims DROP CONSTRAINT IF EXISTS insurance_claims_claimant_faction_id_fkey;
ALTER TABLE insurance_claims ADD CONSTRAINT insurance_claims_claimant_faction_id_fkey
    FOREIGN KEY (claimant_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE insurance_claims ALTER COLUMN insurer_faction_id DROP NOT NULL;
ALTER TABLE insurance_claims DROP CONSTRAINT IF EXISTS insurance_claims_insurer_faction_id_fkey;
ALTER TABLE insurance_claims ADD CONSTRAINT insurance_claims_insurer_faction_id_fkey
    FOREIGN KEY (insurer_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- presidents — preserve historical presidency record
ALTER TABLE presidents ALTER COLUMN faction_id DROP NOT NULL;
ALTER TABLE presidents DROP CONSTRAINT IF EXISTS presidents_faction_id_fkey;
ALTER TABLE presidents ADD CONSTRAINT presidents_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- ═════════════════════════════════════════════════════════════
-- CRITICAL: nations.monarch_faction_id
-- ═════════════════════════════════════════════════════════════
-- CASCADE here would DELETE THE ENTIRE NATION when its monarch
-- faction disbanded. Absolutely not. SET NULL — the monarch seat
-- vacates, the nation persists, admins can reinstall a dynasty.

ALTER TABLE nations DROP CONSTRAINT IF EXISTS nations_monarch_faction_id_fkey;
ALTER TABLE nations ADD CONSTRAINT nations_monarch_faction_id_fkey
    FOREIGN KEY (monarch_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- ==================== VERIFY ====================
-- Every FK referencing factions(id) should report CASCADE or SET NULL.
SELECT
    conrelid::regclass AS child_table,
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
WHERE contype = 'f'
  AND confrelid = 'factions'::regclass
ORDER BY conrelid::regclass::text, conname;
