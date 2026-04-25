-- ============================================================
-- Drop shipping_claims.vessel_status — consolidate SSoT
--
-- Prior behaviour: vessel activity state was stored in TWO columns:
--   * corp_vessels.status        (in_port, in_transit, dry_dock, ...)
--   * shipping_claims.vessel_status (loading, in_transit, unloading, idle)
--
-- Every state transition had to write BOTH. When one write succeeded
-- and the other didn't (silent exception mid-tick), vessels got stuck
-- in inconsistent states — "ships sat on LOADING forever" was the
-- symptom traced back to this dual-write pattern multiple times.
--
-- Fix: corp_vessels.status becomes the single source of truth. The
-- display "loading" value is now derived at render time from
--   claim.status='active' AND vessel.status='in_port'
-- and "in_transit" maps directly to vessel.status='in_transit'. No
-- stored copy on the claim, so no drift possible.
--
-- Order matters in this migration:
--   1. Recreate claim_shipping_route + release_shipping_route WITHOUT
--      the vessel_status column references. Until step 2 runs, the
--      column still exists with DEFAULT 'loading' so rows inserted
--      without it get a value automatically; rows updated without it
--      keep their current value. RPCs are safe to call in this window.
--   2. Drop the column.
--
-- If the order were flipped (drop column first, then recreate RPCs),
-- a player calling either RPC in the gap between the two statements
-- would hit "column vessel_status does not exist" → claim/release
-- broken until the migration finished.
--
-- Safe to re-run: CREATE OR REPLACE + IF EXISTS guards.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Step 1a: recreate claim_shipping_route without vessel_status.
-- Body copied from 20260422_remove_shipping_fleet_cap.sql (latest
-- version) with the vessel_status column removed from the INSERT.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION claim_shipping_route(
    p_faction_id UUID,
    p_route_id UUID,
    p_current_tick INT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $fn$
DECLARE
    v_faction RECORD;
    v_route RECORD;
    v_existing_claim UUID;
    v_competition INT;
    v_market_share NUMERIC;
    v_revenue NUMERIC;
    v_claim_id UUID;
BEGIN
    SELECT id, corp_sector, corp_subsector, nation_id, shipping_fleet_capacity, shipping_fleet_deployed
    INTO v_faction FROM factions WHERE id = p_faction_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Faction not found.'); END IF;
    IF v_faction.corp_sector != 'Shipping' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only shipping corporations can claim routes.');
    END IF;

    SELECT * INTO v_route FROM shipping_routes WHERE id = p_route_id AND status = 'active';
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Route not found or no longer active.');
    END IF;

    IF v_route.shipping_subsector != (
        CASE v_faction.corp_subsector
            WHEN 'Bulk Cargo' THEN 'bulk_cargo'
            WHEN 'Container Freight' THEN 'container_freight'
            WHEN 'Specialized Transport' THEN 'specialized_transport'
            ELSE ''
        END
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Route requires a different shipping subsector.');
    END IF;

    -- Fleet-capacity gate removed — shipping corps can operate
    -- unlimited simultaneous routes. Counter still maintained below.

    SELECT id INTO v_existing_claim FROM shipping_claims
    WHERE route_id = p_route_id AND faction_id = p_faction_id AND status = 'active';
    IF FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already operating on this route.');
    END IF;

    SELECT COUNT(*) INTO v_competition FROM shipping_claims
    WHERE route_id = p_route_id AND status = 'active';
    v_market_share := ROUND(100.0 / (v_competition + 1), 1);

    v_revenue := ROUND(v_route.estimated_revenue * (v_market_share / 100));

    -- Insert claim. vessel_status omitted — corp_vessels.status is the
    -- SSoT for vessel activity now, derived at read time as
    -- "loading" iff vessel.status='in_port' AND claim.status='active'.
    INSERT INTO shipping_claims (
        route_id, faction_id, nation_id,
        transit_started_tick, transit_arrives_tick,
        revenue_per_transit, market_share_pct,
        claimed_at_tick, status
    ) VALUES (
        p_route_id, p_faction_id, v_faction.nation_id,
        p_current_tick, p_current_tick + v_route.transit_ticks,
        v_revenue, v_market_share,
        p_current_tick, 'active'
    ) RETURNING id INTO v_claim_id;

    UPDATE factions SET shipping_fleet_deployed = shipping_fleet_deployed + 1
    WHERE id = p_faction_id;

    UPDATE shipping_routes SET competition_count = v_competition + 1
    WHERE id = p_route_id;

    UPDATE shipping_claims SET
        market_share_pct = ROUND(100.0 / (v_competition + 1), 1),
        revenue_per_transit = ROUND(v_route.estimated_revenue * (ROUND(100.0 / (v_competition + 1), 1) / 100))
    WHERE route_id = p_route_id AND status = 'active';

    RETURN jsonb_build_object(
        'success', true,
        'claim_id', v_claim_id,
        'revenue_per_transit', v_revenue,
        'market_share', v_market_share,
        'transit_ticks', v_route.transit_ticks,
        'competition', v_competition + 1
    );
END;
$fn$;

-- ─────────────────────────────────────────────────────────────
-- Step 1b: recreate release_shipping_route without vessel_status.
-- Body copied from 20260412_shipping_claims_fleet.sql with the
-- vessel_status='idle' assignment removed from the UPDATE.
-- ─────────────────────────────────────────────────────────────
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

    -- Release the claim. vessel_status omitted — column is being
    -- dropped in step 2 below. claim.status='released' alone is
    -- the canonical signal that the claim is no longer active.
    UPDATE shipping_claims SET
        status = 'released', released_at_tick = p_current_tick
    WHERE id = p_claim_id;

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

-- ─────────────────────────────────────────────────────────────
-- Step 2: drop the column. Both RPCs above no longer reference it,
-- so this is now safe.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE shipping_claims DROP COLUMN IF EXISTS vessel_status;

-- Verify
SELECT column_name FROM information_schema.columns
 WHERE table_name = 'shipping_claims' AND column_name = 'vessel_status';
-- Expected: 0 rows
