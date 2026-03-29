-- ══════════════════════════════════════════════════════════════════════
-- Corporation Equipment System
-- Per-type equipment inventory with condition tracking, deployment,
-- and maintenance costs. Equipment degrades 2%/tick when deployed
-- and is destroyed at 0% condition.
-- ══════════════════════════════════════════════════════════════════════

-- Per-corporation equipment inventory (one row per equipment type per faction)
CREATE TABLE IF NOT EXISTS corp_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id UUID NOT NULL REFERENCES nations(id),

    -- Equipment identity
    equipment_key TEXT NOT NULL,               -- e.g. "trucks", "excavators", "cranes"
    tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),

    -- Inventory
    owned INTEGER NOT NULL DEFAULT 0 CHECK (owned >= 0),
    deployed INTEGER NOT NULL DEFAULT 0 CHECK (deployed >= 0),

    -- Condition (0-100, average across all units of this type)
    condition INTEGER NOT NULL DEFAULT 100 CHECK (condition >= 0 AND condition <= 100),

    -- Maintenance cost per tick (total for all owned units of this type)
    maintenance_per_tick BIGINT NOT NULL DEFAULT 0,

    -- Assigned projects (JSONB array of { contract_id, contract_name, units })
    assigned_projects JSONB DEFAULT '[]'::jsonb,

    -- Purchase tracking
    last_purchased_tick INTEGER,
    purchase_price_avg BIGINT DEFAULT 0,       -- average purchase price per unit

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(faction_id, equipment_key)
);

-- Pending equipment deliveries (for non-immediate purchases)
CREATE TABLE IF NOT EXISTS corp_equipment_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    equipment_key TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    condition INTEGER NOT NULL DEFAULT 100 CHECK (condition >= 0 AND condition <= 100),
    delivery_tick INTEGER NOT NULL,            -- tick when delivery arrives
    source_nation_id UUID REFERENCES nations(id),
    seller_name TEXT,
    price_paid BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_corp_equipment_faction ON corp_equipment(faction_id);
CREATE INDEX IF NOT EXISTS idx_corp_equipment_key ON corp_equipment(equipment_key);
CREATE INDEX IF NOT EXISTS idx_corp_equipment_deliveries_faction ON corp_equipment_deliveries(faction_id);
CREATE INDEX IF NOT EXISTS idx_corp_equipment_deliveries_tick ON corp_equipment_deliveries(delivery_tick);

-- RLS
ALTER TABLE corp_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE corp_equipment_deliveries ENABLE ROW LEVEL SECURITY;

-- Equipment: readable by all authenticated (for market/trade views)
CREATE POLICY "Equipment readable by all authenticated"
    ON corp_equipment FOR SELECT TO authenticated USING (true);

CREATE POLICY "Corps can manage own equipment"
    ON corp_equipment FOR INSERT TO authenticated
    WITH CHECK (
        faction_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = faction_id AND linked_user_id = auth.uid())
    );

CREATE POLICY "Corps can update own equipment"
    ON corp_equipment FOR UPDATE TO authenticated
    USING (
        faction_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = faction_id AND linked_user_id = auth.uid())
    );

-- Deliveries: same pattern
CREATE POLICY "Deliveries readable by owner"
    ON corp_equipment_deliveries FOR SELECT TO authenticated
    USING (
        faction_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = faction_id AND linked_user_id = auth.uid())
    );

CREATE POLICY "Deliveries insertable by owner"
    ON corp_equipment_deliveries FOR INSERT TO authenticated
    WITH CHECK (
        faction_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = faction_id AND linked_user_id = auth.uid())
    );

-- Service role handles delivery processing and deletion
-- No DELETE policy for authenticated — tick processor (service_role) handles cleanup

COMMENT ON TABLE corp_equipment IS 'Equipment inventory per corporation. One row per equipment type. Condition degrades 2%/tick when deployed, destroyed at 0%.';
COMMENT ON TABLE corp_equipment_deliveries IS 'Pending equipment deliveries. Tick processor moves these to corp_equipment on delivery_tick.';
