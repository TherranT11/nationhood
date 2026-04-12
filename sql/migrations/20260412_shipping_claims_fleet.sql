-- ════════════════════════════════════════════════════════════════════════════════
-- Shipping Phase 2: Route Claims & Fleet System
--
-- Corps claim routes to earn revenue. Fleet capacity limits simultaneous
-- routes. Revenue collected each tick based on transit cycles.
-- ════════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════
-- 1. SHIPPING CLAIMS TABLE
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS shipping_claims (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id            UUID NOT NULL REFERENCES shipping_routes(id) ON DELETE CASCADE,
    faction_id          UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id           UUID NOT NULL REFERENCES nations(id),

    -- Vessel assignment
    vessel_status       TEXT NOT NULL DEFAULT 'loading' CHECK (vessel_status IN ('loading', 'in_transit', 'unloading', 'idle')),
    transit_started_tick INT,                    -- when current transit began
    transit_arrives_tick INT,                    -- when vessel reaches destination
    transits_completed  INT NOT NULL DEFAULT 0,  -- total completed round trips

    -- Revenue
    revenue_per_transit NUMERIC NOT NULL DEFAULT 0, -- revenue earned each completed transit
    total_revenue       NUMERIC NOT NULL DEFAULT 0, -- lifetime revenue from this claim
    market_share_pct    NUMERIC NOT NULL DEFAULT 100, -- 0-100% share of route volume

    -- Lifecycle
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'released')),
    claimed_at_tick     INT NOT NULL,
    released_at_tick    INT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One active claim per corp per route
    CONSTRAINT uq_shipping_claim UNIQUE (route_id, faction_id, status)
);

CREATE INDEX IF NOT EXISTS idx_shipping_claims_faction ON shipping_claims(faction_id);
CREATE INDEX IF NOT EXISTS idx_shipping_claims_route ON shipping_claims(route_id);
CREATE INDEX IF NOT EXISTS idx_shipping_claims_status ON shipping_claims(status) WHERE status = 'active';

-- RLS
ALTER TABLE shipping_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY shipping_claims_read ON shipping_claims
    FOR SELECT TO authenticated USING (true);

CREATE POLICY shipping_claims_insert ON shipping_claims
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY shipping_claims_update ON shipping_claims
    FOR UPDATE TO authenticated USING (true);


-- ═══════════════════════════════════════════════════
-- 2. FLEET CAPACITY (on factions table)
-- ═══════════════════════════════════════════════════
-- Fleet capacity = max simultaneous routes a shipping corp can operate.
-- Starts at 2, upgradeable by spending capital.

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS shipping_fleet_capacity INT NOT NULL DEFAULT 2,
    ADD COLUMN IF NOT EXISTS shipping_fleet_deployed INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN factions.shipping_fleet_capacity IS 'Max simultaneous shipping routes. Starts at 2 for Shipping corps, 0 for others.';
COMMENT ON COLUMN factions.shipping_fleet_deployed IS 'Currently deployed vessels (active claims count).';


-- ═══════════════════════════════════════════════════
-- 3. RPC: CLAIM SHIPPING ROUTE
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION claim_shipping_route(
    p_faction_id UUID,
    p_route_id UUID,
    p_current_tick INT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_faction RECORD;
    v_route RECORD;
    v_fleet_cap INT;
    v_fleet_deployed INT;
    v_existing_claim UUID;
    v_competition INT;
    v_market_share NUMERIC;
    v_revenue NUMERIC;
    v_claim_id UUID;
BEGIN
    -- 1. Validate faction is a shipping corp
    SELECT id, corp_sector, corp_subsector, nation_id, shipping_fleet_capacity, shipping_fleet_deployed
    INTO v_faction FROM factions WHERE id = p_faction_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Faction not found.');  END IF;
    IF v_faction.corp_sector != 'Shipping' THEN RETURN jsonb_build_object('success', false, 'error', 'Only shipping corporations can claim routes.'); END IF;

    -- 2. Validate route exists and is active
    SELECT * INTO v_route FROM shipping_routes WHERE id = p_route_id AND status = 'active';
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Route not found or no longer active.'); END IF;

    -- 3. Validate subsector match
    IF v_route.shipping_subsector != (
        CASE v_faction.corp_subsector
            WHEN 'Bulk Cargo' THEN 'bulk_cargo'
            WHEN 'Container Freight' THEN 'container_freight'
            WHEN 'Specialized Transport' THEN 'specialized_transport'
            ELSE ''
        END
    ) THEN RETURN jsonb_build_object('success', false, 'error', 'Route requires a different shipping subsector.'); END IF;

    -- 4. Check fleet capacity
    v_fleet_cap := v_faction.shipping_fleet_capacity;
    v_fleet_deployed := v_faction.shipping_fleet_deployed;
    IF v_fleet_deployed >= v_fleet_cap THEN
        RETURN jsonb_build_object('success', false, 'error', 'No available vessels. Fleet capacity: ' || v_fleet_cap || ', deployed: ' || v_fleet_deployed || '.');
    END IF;

    -- 5. Check for duplicate claim
    SELECT id INTO v_existing_claim FROM shipping_claims
    WHERE route_id = p_route_id AND faction_id = p_faction_id AND status = 'active';
    IF FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Already operating on this route.'); END IF;

    -- 6. Calculate market share (split evenly among all active claimants + this one)
    SELECT COUNT(*) INTO v_competition FROM shipping_claims
    WHERE route_id = p_route_id AND status = 'active';
    v_market_share := ROUND(100.0 / (v_competition + 1), 1);

    -- 7. Calculate revenue per transit (trade_volume * revenue_rate * market_share)
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

    -- 9. Update fleet deployed count
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
$$;


-- ═══════════════════════════════════════════════════
-- 4. RPC: RELEASE SHIPPING ROUTE
-- ═══════════════════════════════════════════════════

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
    -- 1. Validate claim
    SELECT * INTO v_claim FROM shipping_claims
    WHERE id = p_claim_id AND faction_id = p_faction_id AND status = 'active';
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Claim not found.'); END IF;

    -- 2. Release the claim
    UPDATE shipping_claims SET
        status = 'released', released_at_tick = p_current_tick,
        vessel_status = 'idle'
    WHERE id = p_claim_id;

    -- 3. Free up fleet slot
    UPDATE factions SET shipping_fleet_deployed = GREATEST(0, shipping_fleet_deployed - 1)
    WHERE id = p_faction_id;

    -- 4. Update route competition count
    SELECT COUNT(*) INTO v_remaining FROM shipping_claims
    WHERE route_id = v_claim.route_id AND status = 'active';
    UPDATE shipping_routes SET competition_count = v_remaining
    WHERE id = v_claim.route_id;

    -- 5. Recalculate market share for remaining claimants
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

COMMIT;
