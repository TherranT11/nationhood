-- ════════════════════════════════════════════════════════════════════
-- FIX: faction deletion blocked by alliance_interest_votes FK
-- ════════════════════════════════════════════════════════════════════
-- alliance_interest_votes.initiator_faction_id (20260942) was created
-- REFERENCES factions(id) ON DELETE RESTRICT — but the table landed AFTER
-- the faction-deletion RPCs (declare_corp_bankruptcy 20260816, disband
-- party, inactivity disband), none of which clean it up. So when a faction
-- that initiated an alliance interest-rate vote (e.g. a banking corp in a
-- lending alliance) is deleted, the RESTRICT blocks it:
--   "update or delete on table factions violates foreign key constraint
--    alliance_interest_votes_initiator_faction_id_fkey"
-- (reported when declaring corporate bankruptcy).
--
-- An interest vote cannot exist without its initiator (the column is
-- NOT NULL), and the vote carries no financial settlement that bankruptcy
-- needs to unwind (unlike loans/equity, which stay RESTRICT and are paid
-- back explicitly in the RPC). So the correct fix is to CASCADE: deleting
-- the initiating faction voids its vote. This fixes EVERY faction-deletion
-- path at the schema level rather than duplicating a DELETE into each RPC.
-- Ballots already cascade on vote_id, so they clean up with the vote.
--
-- Idempotent: drop the constraint if present, re-add with ON DELETE CASCADE
-- under the same (auto-generated) name.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE alliance_interest_votes
    DROP CONSTRAINT IF EXISTS alliance_interest_votes_initiator_faction_id_fkey;

ALTER TABLE alliance_interest_votes
    ADD CONSTRAINT alliance_interest_votes_initiator_faction_id_fkey
    FOREIGN KEY (initiator_faction_id) REFERENCES factions(id) ON DELETE CASCADE;

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- ALTER TABLE alliance_interest_votes
--   DROP CONSTRAINT IF EXISTS alliance_interest_votes_initiator_faction_id_fkey;
-- ALTER TABLE alliance_interest_votes
--   ADD CONSTRAINT alliance_interest_votes_initiator_faction_id_fkey
--   FOREIGN KEY (initiator_faction_id) REFERENCES factions(id) ON DELETE RESTRICT;
-- COMMIT;
