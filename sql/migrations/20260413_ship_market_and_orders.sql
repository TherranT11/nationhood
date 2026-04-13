-- ════════════════════════════════════════════════════════════════════════════════
-- Ship Market Listings — vessels available for purchase
-- Vessel Orders — commissioned ships being built at shipyards
-- ════════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════
-- 1. SHIP MARKET LISTINGS
-- ═══════════════════════════════════════════════════
-- NPC-generated vessels appear every 8 ticks (1 per nation).
-- Player-sold vessels also appear here.

CREATE TABLE IF NOT EXISTS ship_market_listings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id           UUID NOT NULL REFERENCES nations(id),

    -- Vessel details
    vessel_name         TEXT NOT NULL,
    vessel_class        TEXT NOT NULL CHECK (vessel_class IN ('Coastal', 'Container', 'Bulk', 'Tanker', 'Reefer', 'LNG')),
    capacity_dwt        INT NOT NULL DEFAULT 10000,
    capacity_unit       TEXT NOT NULL DEFAULT 'DWT',
    condition           INT NOT NULL DEFAULT 70 CHECK (condition >= 0 AND condition <= 100),
    fuel                INT NOT NULL DEFAULT 50 CHECK (fuel >= 0 AND fuel <= 100),
    age_ticks           INT NOT NULL DEFAULT 0,          -- how old the ship is in ticks
    fuel_capacity       INT NOT NULL DEFAULT 1000,
    base_maintenance    INT NOT NULL DEFAULT 200000,

    -- Pricing
    asking_price        BIGINT NOT NULL,                  -- price in dollars
    purchase_price_new  BIGINT NOT NULL DEFAULT 0,        -- original new price (for reference)

    -- Seller
    seller_type         TEXT NOT NULL DEFAULT 'LOCAL' CHECK (seller_type IN ('CORP', 'LOCAL')),
    seller_name         TEXT NOT NULL DEFAULT 'Port Authority',
    seller_faction_id   UUID REFERENCES factions(id) ON DELETE SET NULL,  -- null for NPC sellers
    sale_reason         TEXT,                              -- narrative context for UI

    -- Lifecycle
    status              TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'expired')),
    listed_at_tick      INT NOT NULL DEFAULT 0,
    expires_at_tick     INT,                               -- null = no expiry (player listings persist)
    purchased_by        UUID REFERENCES factions(id) ON DELETE SET NULL,
    purchased_at_tick   INT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ship_market_status ON ship_market_listings(status) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_ship_market_nation ON ship_market_listings(nation_id, status);

-- RLS
ALTER TABLE ship_market_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ship_market_read ON ship_market_listings FOR SELECT TO authenticated USING (true);
CREATE POLICY ship_market_insert ON ship_market_listings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY ship_market_update ON ship_market_listings FOR UPDATE TO authenticated USING (true);


-- ═══════════════════════════════════════════════════
-- 2. VESSEL ORDERS (commissioned builds)
-- ═══════════════════════════════════════════════════
-- Player commissions a new vessel at a shipyard.
-- 50% deposit paid immediately. 50% balance on delivery.
-- Tick processor creates the vessel on delivery tick.

CREATE TABLE IF NOT EXISTS vessel_orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id          UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,

    -- What's being built
    vessel_name         TEXT NOT NULL,
    vessel_class        TEXT NOT NULL CHECK (vessel_class IN ('Coastal', 'Container', 'Bulk', 'Tanker', 'Reefer', 'LNG')),
    capacity_dwt        INT NOT NULL DEFAULT 10000,
    capacity_unit       TEXT NOT NULL DEFAULT 'DWT',
    base_maintenance    INT NOT NULL DEFAULT 200000,
    fuel_capacity       INT NOT NULL DEFAULT 1000,
    purchase_price      BIGINT NOT NULL,                  -- total cost (before deposit split)

    -- Shipyard
    shipyard_nation_id  UUID NOT NULL REFERENCES nations(id),
    shipyard_nation     TEXT NOT NULL,                     -- name for display
    cost_modifier       NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    build_modifier      NUMERIC(4,2) NOT NULL DEFAULT 1.0,

    -- Financials
    total_cost          BIGINT NOT NULL,                   -- purchase_price × cost_modifier
    deposit_paid        BIGINT NOT NULL,                   -- 50% paid upfront
    balance_due         BIGINT NOT NULL,                   -- 50% on delivery

    -- Timeline
    ordered_at_tick     INT NOT NULL,
    delivery_tick       INT NOT NULL,                      -- when the vessel is ready
    build_ticks         INT NOT NULL,                      -- how many ticks to build

    -- Status
    status              TEXT NOT NULL DEFAULT 'building' CHECK (status IN ('building', 'delivered', 'cancelled')),
    delivered_at_tick   INT,
    cancelled_at_tick   INT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vessel_orders_faction ON vessel_orders(faction_id);
CREATE INDEX IF NOT EXISTS idx_vessel_orders_status ON vessel_orders(status) WHERE status = 'building';
CREATE INDEX IF NOT EXISTS idx_vessel_orders_delivery ON vessel_orders(delivery_tick) WHERE status = 'building';

-- RLS
ALTER TABLE vessel_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY vessel_orders_read ON vessel_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY vessel_orders_insert ON vessel_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY vessel_orders_update ON vessel_orders FOR UPDATE TO authenticated USING (true);

COMMIT;
