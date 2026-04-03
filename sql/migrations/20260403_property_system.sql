-- ============================================================
-- Property System — Phase 1: Schema + Catalog
-- ============================================================

-- 1. Property catalog — 40+ templates defining available property types
CREATE TABLE IF NOT EXISTS property_catalog (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,                               -- e.g., 'Downtown Office Tower'
    type            TEXT NOT NULL DEFAULT 'office',              -- 'office', 'regional_hq', 'warehouse', 'factory', 'retail', 'campus'
    style           TEXT NOT NULL DEFAULT 'Basic',               -- Basic, Modern, Sustainable, Innovative, Heritage, Premium
    base_cost       BIGINT NOT NULL,                             -- base purchase price in dollars
    capacity        INT NOT NULL DEFAULT 500,                    -- max employees it can house
    base_maintenance BIGINT NOT NULL DEFAULT 10000,              -- monthly maintenance in dollars
    size_class      TEXT NOT NULL DEFAULT 'small',               -- small, medium, large, campus
    description     TEXT,
    city_template   TEXT,                                        -- e.g., 'capital', 'port', 'industrial', 'coastal' — resolved to actual city per nation
    min_gdp_growth  INT DEFAULT 0,                              -- minimum gdp_growth stat to appear on market
    min_sol         INT DEFAULT 0,                              -- minimum standard_of_living to appear
    sector_affinity TEXT DEFAULT 'any',                          -- 'construction', 'finance', 'tech', 'any'
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Owned properties — tracks which corporations own which properties
CREATE TABLE IF NOT EXISTS corp_properties (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id      UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id       UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    catalog_id      UUID REFERENCES property_catalog(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,                               -- display name (from catalog or custom for built properties)
    type            TEXT NOT NULL DEFAULT 'office',
    style           TEXT NOT NULL DEFAULT 'Basic',
    capacity        INT NOT NULL DEFAULT 500,
    purchase_price  BIGINT NOT NULL DEFAULT 0,                  -- what was paid
    monthly_maintenance BIGINT NOT NULL DEFAULT 10000,
    condition       INT NOT NULL DEFAULT 100 CHECK (condition BETWEEN 0 AND 100),
    city            TEXT,
    purchased_at_tick INT,
    built_via_contract_id UUID REFERENCES construction_contracts(id) ON DELETE SET NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add issuer_faction_id to construction_contracts for PRIVATE projects
ALTER TABLE construction_contracts
    ADD COLUMN IF NOT EXISTS issuer_faction_id UUID REFERENCES factions(id) ON DELETE SET NULL;

-- ============================================================
-- SEED: 40 Property Templates
-- ============================================================

INSERT INTO property_catalog (name, type, style, base_cost, capacity, base_maintenance, size_class, description, city_template, min_gdp_growth, min_sol) VALUES
-- ── SMALL OFFICES (capacity 200-800, $1M-$4M) ──
('Starter Office Suite',           'office', 'Basic',       1200000,  200,   8000,  'small',  'A modest office space for a small team. Functional but no frills.', 'capital', 0, 0),
('Commercial Loft Space',          'office', 'Basic',       1500000,  300,  10000,  'small',  'Open-plan loft in a converted commercial building.', 'capital', 0, 0),
('Business Center Unit',           'office', 'Basic',       1800000,  400,  12000,  'small',  'Professional office in a shared business center with meeting rooms.', 'capital', 0, 10),
('Suburban Office Park — Unit A',  'office', 'Basic',       2000000,  500,  14000,  'small',  'Ground-floor unit in a suburban office park with parking.', 'suburban', 0, 0),
('Harbour View Office',            'office', 'Modern',      2800000,  400,  18000,  'small',  'Modern waterfront office with harbour views.', 'port', 15, 20),
('Historic Quarter Suite',         'office', 'Heritage',    2400000,  300,  20000,  'small',  'Charming office in a restored heritage building. High character.', 'capital', 10, 25),
('Green Start Office',             'office', 'Sustainable', 2600000,  350,  11000,  'small',  'Energy-efficient small office with solar panels and rainwater collection.', 'capital', 20, 20),
('Innovation Pod',                 'office', 'Innovative',  3200000,  250,  16000,  'small',  'High-tech small workspace designed for creative teams.', 'capital', 30, 30),

-- ── MEDIUM OFFICES (capacity 800-2500, $4M-$12M) ──
('Downtown Office Tower — Floor 6', 'office', 'Modern',     4800000, 1200,  32000,  'medium', 'Full floor in a modern downtown tower. Glass facades, open plan.', 'capital', 20, 20),
('Plaza Central Commercial Suite',  'office', 'Basic',      3800000,  800,  22000,  'medium', 'Professional suite in a central plaza. Good transport links.', 'capital', 10, 10),
('Riverside Business Park',         'office', 'Basic',      5200000, 2000,  38000,  'medium', 'Large business park unit with warehouse access.', 'industrial', 15, 10),
('Midtown Professional Centre',     'office', 'Modern',     6200000, 1500,  36000,  'medium', 'Mid-rise professional centre in the commercial district.', 'capital', 25, 25),
('Lakeside Corporate Office',       'office', 'Sustainable',7500000, 1800,  28000,  'medium', 'Eco-certified lakeside office. LEED Gold equivalent.', 'coastal', 30, 30),
('Executive Business Centre',       'office', 'Premium',    9500000, 1200,  52000,  'medium', 'Premium executive suites with concierge service and private dining.', 'capital', 35, 40),
('Tech Hub Workspace',              'office', 'Innovative', 8200000, 1600,  44000,  'medium', 'Purpose-built tech workspace with server rooms and lab space.', 'capital', 35, 35),
('Heritage Commercial Building',    'office', 'Heritage',   5800000, 1000,  42000,  'medium', 'Fully restored 19th-century commercial building.', 'capital', 20, 30),

-- ── LARGE OFFICES (capacity 2500-6000, $12M-$30M) ──
('Corporate Tower — Floors 8-12',   'office', 'Modern',    14000000, 3000,  72000,  'large',  'Five floors in a prime corporate tower. Commanding city views.', 'capital', 30, 30),
('National Business Campus',        'office', 'Basic',     12000000, 4000,  55000,  'large',  'Sprawling business campus with cafeteria and gym facilities.', 'suburban', 25, 20),
('Waterfront Commercial Complex',   'office', 'Modern',    18000000, 3500,  82000,  'large',  'Multi-building waterfront complex with retail podium.', 'port', 35, 35),
('Sustainable Campus East',         'office', 'Sustainable',20000000, 4500,  52000,  'large',  'Net-zero energy campus. Living walls, geothermal, on-site food production.', 'suburban', 40, 40),
('Prestige Tower — Upper Floors',   'office', 'Premium',   28000000, 2500, 120000,  'large',  'The top floors of the city\'s most prestigious address.', 'capital', 45, 50),
('Innovation District Hub',         'office', 'Innovative', 22000000, 3500,  95000,  'large',  'Anchor tenant space in a purpose-built innovation district.', 'capital', 40, 40),
('Grand Heritage Complex',          'office', 'Heritage',  16000000, 2800, 105000,  'large',  'Landmark heritage complex spanning an entire city block.', 'capital', 30, 35),

-- ── CAMPUS (capacity 6000-18000, $30M-$120M) ──
('Corporate Headquarters Campus',   'campus', 'Modern',    45000000, 8000, 180000,  'campus', 'Full corporate campus with multiple buildings, parking, and amenities.', 'capital', 40, 35),
('Global Operations Centre',        'campus', 'Premium',   85000000,12000, 350000,  'campus', 'World-class operations centre. Helipad, executive suites, auditorium.', 'capital', 50, 50),
('Sustainable Mega Campus',         'campus', 'Sustainable',65000000,10000, 160000,  'campus', 'Carbon-negative campus powered entirely by renewables.', 'suburban', 45, 45),
('Innovation Mega Hub',             'campus', 'Innovative', 95000000,15000, 420000,  'campus', 'Research-grade campus with labs, clean rooms, and prototyping facilities.', 'capital', 55, 50),

-- ── REGIONAL HQ (unlocks a nation for operations) ──
('Regional Headquarters — Standard','regional_hq', 'Basic',     8000000, 800,  45000, 'medium', 'Standard regional HQ. Unlocks this nation for contract bidding and subsidiary ops.', 'capital', 0, 0),
('Regional Headquarters — Modern',  'regional_hq', 'Modern',   12000000,1200,  55000, 'medium', 'Modern regional HQ with conference facilities and comms centre.', 'capital', 20, 20),
('Regional Headquarters — Premium', 'regional_hq', 'Premium',  22000000,2000,  95000, 'large',  'Flagship regional presence. Executive floors, private boardrooms.', 'capital', 35, 40),

-- ── WAREHOUSES (capacity 50-200 office + storage) ──
('Industrial Warehouse Unit',       'warehouse', 'Basic',    1500000,  100,  8000,  'small',  'Basic warehouse with loading dock. Suitable for materials storage.', 'industrial', 0, 0),
('Logistics Distribution Centre',   'warehouse', 'Basic',    4500000,  200, 22000,  'medium', 'Large distribution centre near major transport routes.', 'industrial', 15, 10),
('Cold Storage Facility',           'warehouse', 'Modern',   6000000,  150, 35000,  'medium', 'Temperature-controlled storage for sensitive materials.', 'port', 25, 20),
('Automated Fulfilment Centre',     'warehouse', 'Innovative',12000000, 300, 45000,  'large',  'High-tech automated warehouse with robotic picking.', 'industrial', 40, 35),

-- ── FACTORIES (capacity 500-3000 + manufacturing) ──
('Light Manufacturing Plant',       'factory', 'Basic',     5000000,  500, 28000,  'medium', 'Basic manufacturing facility for light assembly work.', 'industrial', 10, 0),
('Advanced Manufacturing Hub',      'factory', 'Modern',   15000000, 1500, 65000,  'large',  'Modern manufacturing with CNC, 3D printing, and QA labs.', 'industrial', 30, 25),
('Heavy Industry Complex',          'factory', 'Basic',    25000000, 3000, 95000,  'large',  'Heavy industrial complex for steel, concrete, or chemical processing.', 'industrial', 35, 15),
('Clean Tech Factory',              'factory', 'Sustainable',18000000, 1200, 48000,  'large',  'Zero-emission manufacturing facility with solar roof.', 'industrial', 40, 35),

-- ── RETAIL / SHOWROOM ──
('Street-Level Showroom',           'retail', 'Modern',     2200000,  100, 15000,  'small',  'High-visibility street-level showroom in commercial district.', 'capital', 15, 20),
('Shopping District Outlet',        'retail', 'Basic',      1800000,  150, 12000,  'small',  'Retail outlet in a busy shopping district.', 'capital', 10, 15),
('Premium Brand Flagship',          'retail', 'Premium',    8000000,  200, 55000,  'medium', 'Flagship retail presence on the nation\'s premier commercial street.', 'capital', 40, 45)

ON CONFLICT DO NOTHING;
