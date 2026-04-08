-- Expire diplomatic proposals stuck in pending states (proposed, revised, fm_review, ratification)
-- for 6+ ticks with no activity. These are proposals that got stuck due to bugs
-- (e.g. ratification bill never created, FM never acted, etc.)
--
-- Uses proposed_at_tick as the baseline since we don't have a status_changed_at column.
-- Any proposal older than 6 ticks in a non-terminal state gets expired.

UPDATE diplomatic_proposals
SET status = 'expired'
WHERE status IN ('proposed', 'revised', 'fm_review', 'ratification')
  AND proposal_type != 'state_visit'
  AND proposed_at_tick IS NOT NULL
  AND proposed_at_tick + 6 <= (SELECT current_tick FROM shard WHERE name = 'Alpha Shard');
