-- ============================================================
-- Remove autocratic factions from all IPOs
-- ============================================================
-- Autocratic factions (identified by having a row in faction_pillar_state)
-- are internal regime wings, not independent political parties.
-- Only the strongman faction may participate in IPOs going forward.

-- 1. Deactivate all autocratic faction memberships EXCEPT strongman factions
UPDATE ipo_members
SET is_active = false, left_at_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard')
WHERE is_active = true
  AND faction_id IN (
    SELECT fps.faction_id FROM faction_pillar_state fps
    WHERE fps.is_strongman = false
  );

-- 2. Cancel any open votes proposed by non-strongman autocratic factions
UPDATE ipo_votes
SET status = 'failed'
WHERE status = 'open'
  AND proposed_by IN (
    SELECT fps.faction_id FROM faction_pillar_state fps
    WHERE fps.is_strongman = false
  );

-- 3. Cancel pending invitations to non-strongman autocratic factions
UPDATE ipo_invitations
SET status = 'declined'
WHERE status = 'pending'
  AND target_faction_id IN (
    SELECT fps.faction_id FROM faction_pillar_state fps
    WHERE fps.is_strongman = false
  );
