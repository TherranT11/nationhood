-- ─────────────────────────────────────────────────────────────
-- claim_shipping_route — destination-nation MoT enforcement
-- ─────────────────────────────────────────────────────────────
-- The MoT check previously lived only on the client (band-aid noted
-- in diplomacy.html:724-728 added after the 9733595 refactor broke
-- diplomaticRoles). With RLS on shipping_claims wide-open, any
-- authenticated user could call this RPC and create an active
-- claim — which is how SHIPZ ended up servicing Port of Al-Madinah
-- → Port of Avelon for Avelia without an explicit accept click.
--
-- Body matches 20260425_drop_shipping_claims_vessel_status.sql with
-- one new authorization block inserted between the route fetch and
-- the subsector check. auth.uid() → faction mapping uses the same
-- (id OR linked_user_id) pattern as 20260424_phase5_moderation.sql.
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

    -- Caller must be the active Minister of Trade of the destination
    -- (buying) nation. The buyer's MoT is the only one with authority
    -- to enter the nation into a shipping agreement.
    IF NOT EXISTS (
        SELECT 1
          FROM ministries m
          JOIN factions f ON f.id = m.party_id
         WHERE m.nation_id    = v_route.destination_nation_id
           AND m.ministry_key = 'trade'
           AND m.is_active    = TRUE
           AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only the Minister of Trade of the destination nation can authorize a shipping contract.'
        );
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

    SELECT id INTO v_existing_claim FROM shipping_claims
    WHERE route_id = p_route_id AND faction_id = p_faction_id AND status = 'active';
    IF FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already operating on this route.');
    END IF;

    SELECT COUNT(*) INTO v_competition FROM shipping_claims
    WHERE route_id = p_route_id AND status = 'active';
    v_market_share := ROUND(100.0 / (v_competition + 1), 1);

    v_revenue := ROUND(v_route.estimated_revenue * (v_market_share / 100));

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

-- Verify
SELECT 'claim_shipping_route updated with destination-MoT check' AS status;
