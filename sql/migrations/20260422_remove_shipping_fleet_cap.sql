-- ============================================================
-- SHIPPING: remove the simultaneous-route cap
--
-- Drops the `shipping_fleet_deployed >= shipping_fleet_capacity`
-- check from claim_shipping_route(). Shipping corporations can now
-- operate as many routes concurrently as they like — capped only by
-- the existing "one claim per (route, faction, status='active')"
-- unique index in shipping_claims.
--
-- Kept intact:
--   * subsector match gate (Bulk Cargo / Container Freight /
--     Specialized Transport must match the route's subsector)
--   * duplicate-claim guard (uq_shipping_claim)
--   * shipping_fleet_deployed counter increment — column still
--     tracks active-claim count for display / future use; we just
--     stopped enforcing a ceiling on it
--   * release_shipping_route() — unchanged
--
-- Safe to re-run (CREATE OR REPLACE).
-- ============================================================

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
    -- 1. Validate faction is a shipping corp
    SELECT id, corp_sector, corp_subsector, nation_id, shipping_fleet_capacity, shipping_fleet_deployed
    INTO v_faction FROM factions WHERE id = p_faction_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Faction not found.'); END IF;
    IF v_faction.corp_sector != 'Shipping' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only shipping corporations can claim routes.');
    END IF;

    -- 2. Validate route exists and is active
    SELECT * INTO v_route FROM shipping_routes WHERE id = p_route_id AND status = 'active';
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Route not found or no longer active.');
    END IF;

    -- 3. Validate subsector match
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

    -- 4. Fleet-capacity gate removed — shipping corps can operate
    --    unlimited simultaneous routes. Counter still maintained below.

    -- 5. Check for duplicate claim (one active claim per corp per route)
    SELECT id INTO v_existing_claim FROM shipping_claims
    WHERE route_id = p_route_id AND faction_id = p_faction_id AND status = 'active';
    IF FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already operating on this route.');
    END IF;

    -- 6. Calculate market share (split evenly among all active claimants + this one)
    SELECT COUNT(*) INTO v_competition FROM shipping_claims
    WHERE route_id = p_route_id AND status = 'active';
    v_market_share := ROUND(100.0 / (v_competition + 1), 1);

    -- 7. Calculate revenue per transit
    v_revenue := ROUND(v_route.estimated_revenue * (v_market_share / 100));

    -- 8. Insert claim
    INSERT INTO shipping_claims (
        route_id, faction_id, nation_id,
        vessel_status, transit_started_tick, transit_arrives_tick,
        revenue_per_transit, market_share_pct,
        claimed_at_tick, status
    ) VALUES (
        p_route_id, p_faction_id, v_faction.nation_id,
        'loading', p_current_tick, p_current_tick + v_route.transit_ticks,
        v_revenue, v_market_share,
        p_current_tick, 'active'
    ) RETURNING id INTO v_claim_id;

    -- 9. Update fleet deployed count (informational only now that cap is removed)
    UPDATE factions SET shipping_fleet_deployed = shipping_fleet_deployed + 1
    WHERE id = p_faction_id;

    -- 10. Update route competition count
    UPDATE shipping_routes SET competition_count = v_competition + 1
    WHERE id = p_route_id;

    -- 11. Recalculate market share for ALL claimants on this route
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

-- Verify
SELECT 'claim_shipping_route RPC' AS object,
       COUNT(*) AS present
FROM pg_proc WHERE proname = 'claim_shipping_route';
