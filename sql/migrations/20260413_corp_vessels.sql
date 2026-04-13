-- ════════════════════════════════════════════════════════════════════════════════
-- Corp Vessels — Individual ships owned by shipping corporations
--
-- Each vessel has a class, condition, fuel level, and status.
-- Ships are assigned to routes (shipping_claims) and generate revenue.
-- Condition decays each tick. Fuel burns faster in transit.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS corp_vessels (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id          UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id           UUID NOT NULL REFERENCES nations(id),

    -- Identity
    vessel_name         TEXT NOT NULL,
    vessel_class        TEXT NOT NULL CHECK (vessel_class IN ('Coastal', 'Container', 'Bulk', 'Tanker', 'Reefer', 'LNG')),

    -- State
    condition           INT NOT NULL DEFAULT 100 CHECK (condition >= 0 AND condition <= 100),
    fuel                INT NOT NULL DEFAULT 100 CHECK (fuel >= 0 AND fuel <= 100),
    status              TEXT NOT NULL DEFAULT 'in_port' CHECK (status IN ('in_port', 'in_transit', 'dry_dock', 'anchored', 'for_sale')),

    -- Specs (set by vessel class at creation, don't change)
    capacity_dwt        INT NOT NULL DEFAULT 10000,         -- deadweight tonnage (or TEU for containers)
    capacity_unit       TEXT NOT NULL DEFAULT 'DWT',         -- 'DWT' or 'TEU'
    base_maintenance    INT NOT NULL DEFAULT 200000,         -- base maintenance cost per tick in dollars
    fuel_capacity       INT NOT NULL DEFAULT 1000,           -- fuel capacity in tons
    purchase_price      INT NOT NULL DEFAULT 3000000,        -- what the ship cost when new

    -- Age
    built_at_tick       INT NOT NULL DEFAULT 0,              -- tick when purchased/built
    last_refurbish_tick INT,                                  -- tick when last refurbished

    -- Dry dock
    drydock_until_tick  INT,                                  -- null = not in dry dock

    -- Route assignment
    active_claim_id     UUID REFERENCES shipping_claims(id) ON DELETE SET NULL,
    current_port_nation_id UUID REFERENCES nations(id),      -- nation where ship is docked (null if in transit)

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corp_vessels_faction ON corp_vessels(faction_id);
CREATE INDEX IF NOT EXISTS idx_corp_vessels_status ON corp_vessels(faction_id, status);

-- RLS
ALTER TABLE corp_vessels ENABLE ROW LEVEL SECURITY;
CREATE POLICY corp_vessels_read ON corp_vessels FOR SELECT TO authenticated USING (true);
CREATE POLICY corp_vessels_insert ON corp_vessels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY corp_vessels_update ON corp_vessels FOR UPDATE TO authenticated USING (true);
CREATE POLICY corp_vessels_delete ON corp_vessels FOR DELETE TO authenticated USING (true);
