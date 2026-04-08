-- ══════════════════════════════════════════════════════════════════════
-- Corporation Warehouse & Material System
-- Stores material inventory per corporation with three quality tiers
-- (Low, Standard, High). Quality availability is determined at runtime
-- by checking nation stats against thresholds defined in game config.
-- ══════════════════════════════════════════════════════════════════════

-- Per-corporation warehouse inventory.
-- One row per material per quality tier per faction.
CREATE TABLE IF NOT EXISTS corp_warehouse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id UUID NOT NULL REFERENCES nations(id),

    -- Material identity
    material_key TEXT NOT NULL,                -- e.g. "concrete", "steel", "lumber"
    quality_tier TEXT NOT NULL CHECK (quality_tier IN ('LOW', 'STD', 'HIGH')),

    -- Inventory
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    total_value BIGINT NOT NULL DEFAULT 0 CHECK (total_value >= 0),
    -- total_value tracks cumulative purchase cost, so avg cost = total_value / quantity

    -- Metadata
    last_purchased_tick INTEGER,
    last_used_tick INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(faction_id, material_key, quality_tier)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_corp_warehouse_faction ON corp_warehouse(faction_id);
CREATE INDEX IF NOT EXISTS idx_corp_warehouse_nation ON corp_warehouse(nation_id);
CREATE INDEX IF NOT EXISTS idx_corp_warehouse_material ON corp_warehouse(material_key);

-- RLS
ALTER TABLE corp_warehouse ENABLE ROW LEVEL SECURITY;

-- All authenticated can read warehouse data (needed for trade/market views)
CREATE POLICY "Warehouse readable by all authenticated"
    ON corp_warehouse FOR SELECT TO authenticated USING (true);

-- Corporations can manage their own warehouse
CREATE POLICY "Corps can insert own warehouse"
    ON corp_warehouse FOR INSERT TO authenticated
    WITH CHECK (
        faction_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM factions
            WHERE id = faction_id AND linked_user_id = auth.uid()
        )
    );

CREATE POLICY "Corps can update own warehouse"
    ON corp_warehouse FOR UPDATE TO authenticated
    USING (
        faction_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM factions
            WHERE id = faction_id AND linked_user_id = auth.uid()
        )
    );

-- No direct DELETE — materials are consumed by project usage (tick processor)

COMMENT ON TABLE corp_warehouse IS 'Material inventory per corporation. One row per material per quality tier. Avg cost = total_value / quantity.';
