-- ==================== TRADE SYSTEM SCHEMA ====================
-- Organic trade calculation system for Nationhood Alpha.
-- Trade flows are computed once per tick across all nations simultaneously.

-- ==================== TRADE FLOWS ====================
-- Stores the computed trade flows for each nation per tick.
-- One row per nation per trade sector per tick.

CREATE TABLE IF NOT EXISTS trade_flows (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id         UUID NOT NULL REFERENCES nations(id),
    tick              INTEGER NOT NULL,
    sector            TEXT NOT NULL,          -- fuel_energy, minerals, food_agriculture,
                                             -- manufactured_goods, technology, arms,
                                             -- tourism, services_finance
    export_capacity   NUMERIC NOT NULL DEFAULT 0,  -- theoretical max export
    export_volume     NUMERIC NOT NULL DEFAULT 0,  -- actual dollar value of exports
    import_demand     NUMERIC NOT NULL DEFAULT 0,  -- theoretical demand for imports
    import_volume     NUMERIC NOT NULL DEFAULT 0,  -- actual dollar value of imports
    net_flow          NUMERIC NOT NULL DEFAULT 0,  -- export_volume - import_volume
    price_modifier    NUMERIC NOT NULL DEFAULT 1.0, -- supply/demand price adjustment
    created_at        TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT uq_trade_flows UNIQUE(nation_id, tick, sector)
);

CREATE INDEX IF NOT EXISTS idx_trade_flows_nation_tick
    ON trade_flows(nation_id, tick);
CREATE INDEX IF NOT EXISTS idx_trade_flows_tick
    ON trade_flows(tick);

-- ==================== TRADE PARTNERS ====================
-- Stores the bilateral trade relationships computed each tick.
-- One row per exporter-importer-sector-tick tuple.
-- Only stored for active trade flows (volume > 0).

CREATE TABLE IF NOT EXISTS trade_partners (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tick                INTEGER NOT NULL,
    exporter_nation_id  UUID NOT NULL REFERENCES nations(id),
    importer_nation_id  UUID NOT NULL REFERENCES nations(id),
    sector              TEXT NOT NULL,
    trade_volume        NUMERIC NOT NULL DEFAULT 0,  -- dollar value of this bilateral flow
    affinity_score      NUMERIC NOT NULL DEFAULT 0,  -- computed trade affinity
    created_at          TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT uq_trade_partners UNIQUE(tick, exporter_nation_id, importer_nation_id, sector)
);

CREATE INDEX IF NOT EXISTS idx_trade_partners_tick
    ON trade_partners(tick);
CREATE INDEX IF NOT EXISTS idx_trade_partners_exporter
    ON trade_partners(exporter_nation_id, tick);
CREATE INDEX IF NOT EXISTS idx_trade_partners_importer
    ON trade_partners(importer_nation_id, tick);

-- ==================== TRADE SUMMARY ====================
-- Aggregated per-nation per-tick summary.
-- Denormalized for fast frontend queries.

CREATE TABLE IF NOT EXISTS trade_summary (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id           UUID NOT NULL REFERENCES nations(id),
    tick                INTEGER NOT NULL,
    total_exports       NUMERIC NOT NULL DEFAULT 0,
    total_imports       NUMERIC NOT NULL DEFAULT 0,
    trade_surplus       NUMERIC NOT NULL DEFAULT 0,  -- total_exports - total_imports
    trade_balance_index NUMERIC NOT NULL DEFAULT 50,  -- derived 0-100 index
    tariff_revenue      NUMERIC NOT NULL DEFAULT 0,   -- computed tariff revenue from trade
    top_export_sector   TEXT,
    top_import_sector   TEXT,
    dependency_alerts   JSONB DEFAULT '[]'::jsonb,     -- array of alert objects
    created_at          TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT uq_trade_summary UNIQUE(nation_id, tick)
);

CREATE INDEX IF NOT EXISTS idx_trade_summary_nation_tick
    ON trade_summary(nation_id, tick);

-- ==================== PROXIMITY ====================
-- Add geographic proximity to diplomatic_relations for trade affinity.
-- 0 = distant, 50 = same region (default), 100 = neighboring/bordering.

ALTER TABLE diplomatic_relations
    ADD COLUMN IF NOT EXISTS proximity INTEGER NOT NULL DEFAULT 50;
