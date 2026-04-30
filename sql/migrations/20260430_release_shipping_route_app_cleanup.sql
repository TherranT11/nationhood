-- =========================================================================
-- release_shipping_route — clear pending/approved applications too
--
-- BUG
-- ---
-- The current release_shipping_route RPC (last reissued in
-- 20260425_drop_shipping_claims_vessel_status.sql) flips
-- shipping_claims.status to 'released' but doesn't touch the
-- corresponding shipping_applications row. The app stays at
-- status='approved' indefinitely.
--
-- The corp UI loads `_myShippingApps` with `.in('status', ['pending',
-- 'approved'])` (js/corp-shipping-data.js:97) and uses it to dedup
-- "Apply to Service" clicks (corp-operations.html:6840). That stale
-- 'approved' row makes the front-end refuse every reapplication with
-- "You have already applied for this route. Status: approved", even
-- though the claim is gone and the route is unstaffed.
--
-- FIX
-- ---
-- Update release_shipping_route so that the same transaction also marks
-- any pending/approved application by this faction on this route as
-- 'released'. The unique index `idx_shipping_applications_unique` is
-- partial WHERE status IN ('pending', 'approved'), so flipping to
-- 'released' clears the way for a fresh INSERT without violating the
-- constraint.
--
-- Body is otherwise identical to the 20260425 version. Idempotent.
-- =========================================================================

CREATE OR REPLACE FUNCTION release_shipping_route(
    p_faction_id UUID,
    p_claim_id UUID,
    p_current_tick INT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_claim RECORD;
    v_remaining INT;
BEGIN
    SELECT * INTO v_claim FROM shipping_claims
    WHERE id = p_claim_id AND faction_id = p_faction_id AND status = 'active';
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Claim not found.'); END IF;

    UPDATE shipping_claims SET
        status = 'released', released_at_tick = p_current_tick
    WHERE id = p_claim_id;

    -- Clear the lingering application so the corp can reapply later.
    -- Scoped to this faction + this route so other corps' applications
    -- on the same route are untouched.
    UPDATE shipping_applications SET
        status = 'released',
        reviewed_at_tick = p_current_tick
    WHERE route_id = v_claim.route_id
      AND faction_id = p_faction_id
      AND status IN ('pending', 'approved');

    UPDATE factions SET shipping_fleet_deployed = GREATEST(0, shipping_fleet_deployed - 1)
    WHERE id = p_faction_id;

    SELECT COUNT(*) INTO v_remaining FROM shipping_claims
    WHERE route_id = v_claim.route_id AND status = 'active';
    UPDATE shipping_routes SET competition_count = v_remaining
    WHERE id = v_claim.route_id;

    IF v_remaining > 0 THEN
        UPDATE shipping_claims SET
            market_share_pct = ROUND(100.0 / v_remaining, 1),
            revenue_per_transit = ROUND(
                (SELECT estimated_revenue FROM shipping_routes WHERE id = v_claim.route_id)
                * (ROUND(100.0 / v_remaining, 1) / 100)
            )
        WHERE route_id = v_claim.route_id AND status = 'active';
    END IF;

    RETURN jsonb_build_object('success', true, 'released', v_claim.route_id);
END;
$$;

-- One-shot cleanup for existing stuck rows. Scoped narrowly to avoid
-- destroying legitimately in-flight applications:
--
--   * Only `approved` apps are touched. `pending` apps with no claim are
--     normal — they're awaiting government approval. Leaving them alone.
--   * Requires evidence of a released claim on the same (route, faction).
--     "Approved app with NO claim at all" could be a transient race
--     during the approval RPC and should not be auto-released.
--   * Skips any (route, faction) that still has an active claim, in case
--     the corp re-claimed after release before this migration ran.
UPDATE shipping_applications app
SET status = 'released',
    reviewed_at_tick = COALESCE(app.reviewed_at_tick, app.applied_at_tick)
WHERE app.status = 'approved'
  AND EXISTS (
    SELECT 1 FROM shipping_claims c
    WHERE c.route_id = app.route_id
      AND c.faction_id = app.faction_id
      AND c.status = 'released'
  )
  AND NOT EXISTS (
    SELECT 1 FROM shipping_claims c
    WHERE c.route_id = app.route_id
      AND c.faction_id = app.faction_id
      AND c.status = 'active'
  );

-- Verify: list any approved apps still orphaned after cleanup. Expected
-- to be empty for the bug we're fixing. Anything left is a pre-existing
-- anomaly (claim deleted without going through release flow) that needs
-- a manual admin look — the cleanup deliberately won't touch those.
SELECT app.id, app.faction_id, app.route_id, app.status
FROM shipping_applications app
WHERE app.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM shipping_claims c
    WHERE c.route_id = app.route_id
      AND c.faction_id = app.faction_id
      AND c.status = 'active'
  );
