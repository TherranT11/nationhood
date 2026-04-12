-- ============================================================
-- Migration: Food & Agriculture — 4-Sector Split (Phase 1)
-- ============================================================
-- Splits the single "Food & Agriculture" trade sector into four
-- distinct sub-sectors, each competing for arable land:
--
--   1. Grains & Staples       — survival sector, stockpilable
--   2. Livestock & Dairy      — middle-class diet, wealth-scaled demand
--   3. Fruits, Veg & Perish.  — infrastructure-dependent, spoilage mechanic
--   4. Cash Crops & Plantation — export revenue vs food security tension
--
-- This migration:
--   a) Updates arable_land for 6 nations
--   b) Creates food_land_allocation table
--   c) Seeds initial allocation splits for all 9 nations
-- ============================================================

BEGIN;

-- ============================================================
-- A. UPDATE ARABLE LAND VALUES
-- ============================================================

-- Sierramar: small island nation, very limited farmland
UPDATE nations SET arable_land = 18 WHERE name = 'Sierramar';

-- Montequilla: fertile agricultural heartland
UPDATE nations SET arable_land = 74 WHERE name = 'Montequilla';

-- Flandis: large population, limited arable land relative to size
UPDATE nations SET arable_land = 34 WHERE name = 'Flandis';

-- Avelia: wealthy developed nation, limited farmland
UPDATE nations SET arable_land = 29 WHERE name = 'Avelia';

-- Sangreza: large diverse economy with substantial farmland
UPDATE nations SET arable_land = 61 WHERE name = 'Sangreza';

-- San Estrella: island archipelago, moderate farmland
UPDATE nations SET arable_land = 42 WHERE name = 'San Estrella';

-- Also update seed_stats for nations that store them
UPDATE nations SET seed_stats = jsonb_set(seed_stats, '{arable_land}', '18')
WHERE name = 'Sierramar' AND seed_stats IS NOT NULL;

UPDATE nations SET seed_stats = jsonb_set(seed_stats, '{arable_land}', '34')
WHERE name = 'Flandis' AND seed_stats IS NOT NULL;

-- ============================================================
-- B. CREATE FOOD LAND ALLOCATION TABLE
-- ============================================================
-- Each nation divides its arable land among 4 food sub-sectors.
-- Percentages must sum to 100. Players can adjust allocations
-- through policy actions (future phases).

CREATE TABLE IF NOT EXISTS food_land_allocation (
    nation_id     UUID PRIMARY KEY REFERENCES nations(id) ON DELETE CASCADE,
    grains_pct    NUMERIC NOT NULL DEFAULT 40 CHECK (grains_pct >= 0 AND grains_pct <= 100),
    livestock_pct NUMERIC NOT NULL DEFAULT 20 CHECK (livestock_pct >= 0 AND livestock_pct <= 100),
    perishables_pct NUMERIC NOT NULL DEFAULT 20 CHECK (perishables_pct >= 0 AND perishables_pct <= 100),
    cash_crops_pct  NUMERIC NOT NULL DEFAULT 20 CHECK (cash_crops_pct >= 0 AND cash_crops_pct <= 100),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT food_allocation_sums_to_100
        CHECK (grains_pct + livestock_pct + perishables_pct + cash_crops_pct = 100)
);

-- Enable RLS
ALTER TABLE food_land_allocation ENABLE ROW LEVEL SECURITY;

-- Read policy: authenticated users can read all allocations (needed for trade calculations)
CREATE POLICY food_land_allocation_read ON food_land_allocation
    FOR SELECT TO authenticated USING (true);

-- Update policy: authenticated users can update their own nation's allocation
-- (Authorization is enforced at the application layer via nation ownership checks)
CREATE POLICY food_land_allocation_update ON food_land_allocation
    FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- C. SEED INITIAL ALLOCATIONS
-- ============================================================
-- Allocations reflect each nation's economic character, geography,
-- and development level. These are starting positions — players
-- can shift allocations through policy.
--
-- Design constraint: global demand should exceed supply by ~20%
-- to create natural scarcity and trade pressure.

-- Vostia (arable=62, pop=22.5M)
-- Large agricultural nation, breadbasket of Meridian
INSERT INTO food_land_allocation (nation_id, grains_pct, livestock_pct, perishables_pct, cash_crops_pct)
SELECT id, 45, 20, 15, 20 FROM nations WHERE name = 'Vostia'
ON CONFLICT (nation_id) DO NOTHING;

-- Montequilla (arable=74, pop=4.2M)
-- Fertile heartland, agricultural powerhouse for its size
INSERT INTO food_land_allocation (nation_id, grains_pct, livestock_pct, perishables_pct, cash_crops_pct)
SELECT id, 35, 25, 15, 25 FROM nations WHERE name = 'Montequilla'
ON CONFLICT (nation_id) DO NOTHING;

-- Sangreza (arable=61, pop=12.5M)
-- Large diversified economy, substantial agricultural base
INSERT INTO food_land_allocation (nation_id, grains_pct, livestock_pct, perishables_pct, cash_crops_pct)
SELECT id, 40, 20, 15, 25 FROM nations WHERE name = 'Sangreza'
ON CONFLICT (nation_id) DO NOTHING;

-- Melizea (arable=50, pop=5.8M)
-- Autocracy: food security focus + plantation cash crops
INSERT INTO food_land_allocation (nation_id, grains_pct, livestock_pct, perishables_pct, cash_crops_pct)
SELECT id, 40, 15, 15, 30 FROM nations WHERE name = 'Melizea'
ON CONFLICT (nation_id) DO NOTHING;

-- San Estrella (arable=42, pop=~8M)
-- Island nation: tropical cash crops and fishing
INSERT INTO food_land_allocation (nation_id, grains_pct, livestock_pct, perishables_pct, cash_crops_pct)
SELECT id, 35, 15, 20, 30 FROM nations WHERE name = 'San Estrella'
ON CONFLICT (nation_id) DO NOTHING;

-- Flandis (arable=34, pop=15.9M)
-- Limited land, huge population: prioritize staples
INSERT INTO food_land_allocation (nation_id, grains_pct, livestock_pct, perishables_pct, cash_crops_pct)
SELECT id, 50, 15, 15, 20 FROM nations WHERE name = 'Flandis'
ON CONFLICT (nation_id) DO NOTHING;

-- Avelia (arable=29, pop=9.5M)
-- Wealthy developed nation: diverse diet, less cash crop dependency
INSERT INTO food_land_allocation (nation_id, grains_pct, livestock_pct, perishables_pct, cash_crops_pct)
SELECT id, 40, 20, 25, 15 FROM nations WHERE name = 'Avelia'
ON CONFLICT (nation_id) DO NOTHING;

-- Palvera (arable=25, pop=6.65M)
-- Limited land, moderate economy: staple-focused with some export crops
INSERT INTO food_land_allocation (nation_id, grains_pct, livestock_pct, perishables_pct, cash_crops_pct)
SELECT id, 45, 15, 15, 25 FROM nations WHERE name = 'Palvera'
ON CONFLICT (nation_id) DO NOTHING;

-- Calveth (arable=19, pop=13M)
-- Constitutional monarchy, minimal land: staples and imports
INSERT INTO food_land_allocation (nation_id, grains_pct, livestock_pct, perishables_pct, cash_crops_pct)
SELECT id, 45, 20, 20, 15 FROM nations WHERE name = 'Calveth'
ON CONFLICT (nation_id) DO NOTHING;

-- Sierramar (arable=18, pop=3.8M)
-- Tiny island: fishing, tropical fruits, coffee/sugarcane
INSERT INTO food_land_allocation (nation_id, grains_pct, livestock_pct, perishables_pct, cash_crops_pct)
SELECT id, 30, 10, 30, 30 FROM nations WHERE name = 'Sierramar'
ON CONFLICT (nation_id) DO NOTHING;

COMMIT;
