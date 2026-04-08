-- Fix: add ON DELETE CASCADE to all IPO table foreign keys referencing factions(id)
-- so that deleting a faction does not violate FK constraints.

-- ipo_invitations.target_faction_id
ALTER TABLE ipo_invitations
    DROP CONSTRAINT IF EXISTS ipo_invitations_target_faction_id_fkey,
    ADD CONSTRAINT ipo_invitations_target_faction_id_fkey
        FOREIGN KEY (target_faction_id) REFERENCES factions(id) ON DELETE CASCADE;

-- ipo_invitations.invited_by
ALTER TABLE ipo_invitations
    DROP CONSTRAINT IF EXISTS ipo_invitations_invited_by_fkey,
    ADD CONSTRAINT ipo_invitations_invited_by_fkey
        FOREIGN KEY (invited_by) REFERENCES factions(id) ON DELETE CASCADE;

-- ipo_members.faction_id
ALTER TABLE ipo_members
    DROP CONSTRAINT IF EXISTS ipo_members_faction_id_fkey,
    ADD CONSTRAINT ipo_members_faction_id_fkey
        FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;

-- ipo_votes.proposed_by
ALTER TABLE ipo_votes
    DROP CONSTRAINT IF EXISTS ipo_votes_proposed_by_fkey,
    ADD CONSTRAINT ipo_votes_proposed_by_fkey
        FOREIGN KEY (proposed_by) REFERENCES factions(id) ON DELETE CASCADE;

-- ipo_ballots.faction_id
ALTER TABLE ipo_ballots
    DROP CONSTRAINT IF EXISTS ipo_ballots_faction_id_fkey,
    ADD CONSTRAINT ipo_ballots_faction_id_fkey
        FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;

-- ipo_actions.faction_id
ALTER TABLE ipo_actions
    DROP CONSTRAINT IF EXISTS ipo_actions_faction_id_fkey,
    ADD CONSTRAINT ipo_actions_faction_id_fkey
        FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;

-- ipo_actions.target_faction_id
ALTER TABLE ipo_actions
    DROP CONSTRAINT IF EXISTS ipo_actions_target_faction_id_fkey,
    ADD CONSTRAINT ipo_actions_target_faction_id_fkey
        FOREIGN KEY (target_faction_id) REFERENCES factions(id) ON DELETE CASCADE;

-- ipo_chat.faction_id
ALTER TABLE ipo_chat
    DROP CONSTRAINT IF EXISTS ipo_chat_faction_id_fkey,
    ADD CONSTRAINT ipo_chat_faction_id_fkey
        FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;

-- international_orgs.founding_party_id (allow null so SET NULL works)
ALTER TABLE international_orgs ALTER COLUMN founding_party_id DROP NOT NULL;
ALTER TABLE international_orgs
    DROP CONSTRAINT IF EXISTS international_orgs_founding_party_id_fkey,
    ADD CONSTRAINT international_orgs_founding_party_id_fkey
        FOREIGN KEY (founding_party_id) REFERENCES factions(id) ON DELETE SET NULL;

-- international_orgs.president_id (allow null so SET NULL works)
ALTER TABLE international_orgs ALTER COLUMN president_id DROP NOT NULL;
ALTER TABLE international_orgs
    DROP CONSTRAINT IF EXISTS international_orgs_president_id_fkey,
    ADD CONSTRAINT international_orgs_president_id_fkey
        FOREIGN KEY (president_id) REFERENCES factions(id) ON DELETE SET NULL;

-- ipo_amendment_history.faction_id
ALTER TABLE ipo_amendment_history
    DROP CONSTRAINT IF EXISTS ipo_amendment_history_faction_id_fkey,
    ADD CONSTRAINT ipo_amendment_history_faction_id_fkey
        FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;
