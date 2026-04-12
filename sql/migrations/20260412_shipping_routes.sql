-- ════════════════════════════════════════════════════════════════════════════════
-- Shipping Routes — Phase 1: Schema + Route Generation
--
-- Routes are auto-generated from bilateral trade_partners data each tick.
-- When two nations trade above a volume threshold in a sector, a shipping
-- route appears connecting their ports. Routes expire when trade drops
-- below threshold or trade agreements end.
--
-- Subsector gating:
--   Bulk Cargo:            fuel_energy, minerals, grains_staples, livestock_dairy, cash_crops
--   Container Freight:     manufactured_goods, technology, fruits_vegetables
--   Specialized Transport: arms (+ government contracts)
-- ════════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════
-- 1. SHIPPING ROUTES TABLE
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS shipping_routes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Route endpoints
    origin_nation_id    UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    destination_nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    origin_port         TEXT NOT NULL,           -- derived from nation capital or profile
    destination_port    TEXT NOT NULL,

    -- Cargo classification
    trade_sector        TEXT NOT NULL,           -- e.g. 'fuel_energy', 'grains_staples', 'arms'
    cargo_category      TEXT NOT NULL,           -- FUEL, MINERALS, FOOD, MFG, TECH, ARMS
    shipping_subsector  TEXT NOT NULL,           -- bulk_cargo, container_freight, specialized_transport
    scope               TEXT NOT NULL DEFAULT 'INTERNATIONAL' CHECK (scope IN ('COASTAL', 'INTERNATIONAL', 'GOVERNMENT')),

    -- Cargo details
    goods_name          TEXT NOT NULL,           -- e.g. 'Refined Petroleum', 'Grains & Staples'
    goods_description   TEXT,                    -- sub-description
    vessel_class        TEXT NOT NULL,           -- e.g. 'Tanker', 'Bulk Carrier', 'Container Ship'
    vessel_note         TEXT,                    -- special requirements

    -- Economics
    trade_volume        NUMERIC NOT NULL DEFAULT 0,     -- dollar value of bilateral trade this tick
    estimated_revenue   NUMERIC NOT NULL DEFAULT 0,     -- what a shipping corp earns per transit
    volume_physical     NUMERIC NOT NULL DEFAULT 0,     -- physical units (tons, TEU)
    volume_unit         TEXT NOT NULL DEFAULT 'tons',    -- 'tons' or 'TEU'

    -- Route characteristics
    transit_ticks       INT NOT NULL DEFAULT 2,         -- how long a transit takes
    proximity           INT NOT NULL DEFAULT 50,        -- 0-100 from diplomatic_relations
    tariff_rate         NUMERIC NOT NULL DEFAULT 0,     -- importer's tariff stat

    -- Competition
    competition_count   INT NOT NULL DEFAULT 0,         -- how many corps are running this route

    -- Demand signal
    demand_level        TEXT CHECK (demand_level IN ('CRITICAL', 'HIGH', 'MODERATE', 'LOW')),

    -- Trade agreement backing
    trade_agreement_id  UUID REFERENCES trade_agreements(id) ON DELETE SET NULL,
    trade_agreement_name TEXT,

    -- Government contract (scope=GOVERNMENT only)
    gov_issuer          TEXT,                    -- e.g. 'Ministry of Defense'
    gov_contract_value  NUMERIC,
    gov_contract_duration INT,                   -- ticks

    -- Lifecycle
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'claimed')),
    generated_at_tick   INT NOT NULL,
    expires_at_tick     INT,                     -- NULL = refreshed each tick
    last_refreshed_tick INT NOT NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One active route per origin-destination-sector combination
    CONSTRAINT uq_shipping_route UNIQUE (origin_nation_id, destination_nation_id, trade_sector, status)
);

CREATE INDEX IF NOT EXISTS idx_shipping_routes_status ON shipping_routes(status);
CREATE INDEX IF NOT EXISTS idx_shipping_routes_subsector ON shipping_routes(shipping_subsector);
CREATE INDEX IF NOT EXISTS idx_shipping_routes_origin ON shipping_routes(origin_nation_id);
CREATE INDEX IF NOT EXISTS idx_shipping_routes_destination ON shipping_routes(destination_nation_id);

-- RLS
ALTER TABLE shipping_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY shipping_routes_read ON shipping_routes
    FOR SELECT TO authenticated USING (true);

-- Only tick processor (service_role) writes routes
-- No INSERT/UPDATE/DELETE policies for authenticated — routes are system-generated


-- ═══════════════════════════════════════════════════
-- 2. PORT NAMES TABLE (lightweight lookup)
-- ═══════════════════════════════════════════════════
-- Maps nations to their primary port names. Landlocked nations have no entry.

CREATE TABLE IF NOT EXISTS nation_ports (
    nation_id   UUID PRIMARY KEY REFERENCES nations(id) ON DELETE CASCADE,
    port_name   TEXT NOT NULL,
    port_type   TEXT NOT NULL DEFAULT 'commercial' CHECK (port_type IN ('commercial', 'deep_water', 'military', 'fishing')),
    capacity    TEXT NOT NULL DEFAULT 'medium' CHECK (capacity IN ('small', 'medium', 'large', 'major'))
);

ALTER TABLE nation_ports ENABLE ROW LEVEL SECURITY;
CREATE POLICY nation_ports_read ON nation_ports
    FOR SELECT TO authenticated USING (true);

-- Seed port names for all coastal nations (Montequilla excluded — landlocked)
INSERT INTO nation_ports (nation_id, port_name, port_type, capacity)
SELECT id, 'Port of Melisar', 'commercial', 'large' FROM nations WHERE name = 'Melizea'
ON CONFLICT (nation_id) DO NOTHING;

INSERT INTO nation_ports (nation_id, port_name, port_type, capacity)
SELECT id, 'Port of Avelon', 'deep_water', 'major' FROM nations WHERE name = 'Avelia'
ON CONFLICT (nation_id) DO NOTHING;

INSERT INTO nation_ports (nation_id, port_name, port_type, capacity)
SELECT id, 'San Marcos Harbor', 'commercial', 'large' FROM nations WHERE name = 'Sangreza'
ON CONFLICT (nation_id) DO NOTHING;

INSERT INTO nation_ports (nation_id, port_name, port_type, capacity)
SELECT id, 'Porto Serrano', 'fishing', 'small' FROM nations WHERE name = 'Sierramar'
ON CONFLICT (nation_id) DO NOTHING;

INSERT INTO nation_ports (nation_id, port_name, port_type, capacity)
SELECT id, 'San Estrella Deep Port', 'deep_water', 'large' FROM nations WHERE name = 'San Estrella'
ON CONFLICT (nation_id) DO NOTHING;

INSERT INTO nation_ports (nation_id, port_name, port_type, capacity)
SELECT id, 'Valcosta Port', 'commercial', 'medium' FROM nations WHERE name = 'Palvera'
ON CONFLICT (nation_id) DO NOTHING;

INSERT INTO nation_ports (nation_id, port_name, port_type, capacity)
SELECT id, 'Port of Flandis', 'deep_water', 'major' FROM nations WHERE name = 'Flandis'
ON CONFLICT (nation_id) DO NOTHING;

INSERT INTO nation_ports (nation_id, port_name, port_type, capacity)
SELECT id, 'Calveth Royal Port', 'deep_water', 'major' FROM nations WHERE name = 'Calveth'
ON CONFLICT (nation_id) DO NOTHING;

INSERT INTO nation_ports (nation_id, port_name, port_type, capacity)
SELECT id, 'Port of Vostia', 'commercial', 'large' FROM nations WHERE name = 'Vostia'
ON CONFLICT (nation_id) DO NOTHING;

-- Montequilla: no port (landlocked)

COMMIT;
