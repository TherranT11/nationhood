-- Clean up ghost diplomatic_proposals that are "active" but have no
-- activated_at_tick (never properly enacted). These show as empty cards
-- in the Agreements tab with "Signed: —  Expires: —" and no useful info.

-- First, log what we're about to delete (visible in query results if run manually)
-- SELECT id, proposal_type, status, proposal_data->>'name', proposing_nation_id, target_nation_id, activated_at_tick
-- FROM diplomatic_proposals
-- WHERE status = 'active' AND activated_at_tick IS NULL;

-- Mark them as expired rather than deleting, to preserve history
UPDATE diplomatic_proposals
SET status = 'expired',
    terminated_at_tick = 0,
    updated_at = now()
WHERE status = 'active'
  AND activated_at_tick IS NULL;

-- Also clean up any "active" proposals that DO have an activated_at_tick
-- but have zero articles and no meaningful proposal_data (empty shells)
UPDATE diplomatic_proposals
SET status = 'expired',
    terminated_at_tick = 0,
    updated_at = now()
WHERE status = 'active'
  AND (proposal_data IS NULL
       OR proposal_data = '{}'::jsonb
       OR (NOT proposal_data ? 'articles' AND NOT proposal_data ? 'name'));
