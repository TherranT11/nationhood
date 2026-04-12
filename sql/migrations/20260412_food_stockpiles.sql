-- ============================================================
-- Migration: Food Stockpile System
-- ============================================================
-- Adds strategic grain and cash crop reserves for nations.
-- Stockpiles accumulate from production surplus, deplete from
-- shortages, and lose value to spoilage each tick.
-- ============================================================

BEGIN;

-- ============================================================
-- A. STOCKPILE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS food_stockpiles (
    nation_id         UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    sector            TEXT NOT NULL CHECK (sector IN ('grains_staples', 'cash_crops')),
    reserve_value     NUMERIC NOT NULL DEFAULT 0 CHECK (reserve_value >= 0),
    max_capacity      NUMERIC NOT NULL DEFAULT 0 CHECK (max_capacity >= 0),
    last_spoilage     NUMERIC NOT NULL DEFAULT 0,
    last_inflow       NUMERIC NOT NULL DEFAULT 0,
    last_outflow      NUMERIC NOT NULL DEFAULT 0,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (nation_id, sector)
);

-- Enable RLS
ALTER TABLE food_stockpiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY food_stockpiles_read ON food_stockpiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY food_stockpiles_update ON food_stockpiles
    FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- B. SEED INITIAL STOCKPILES (empty reserves for all nations)
-- ============================================================

INSERT INTO food_stockpiles (nation_id, sector, reserve_value, max_capacity)
SELECT n.id, 'grains_staples', 0, 0 FROM nations n
ON CONFLICT (nation_id, sector) DO NOTHING;

INSERT INTO food_stockpiles (nation_id, sector, reserve_value, max_capacity)
SELECT n.id, 'cash_crops', 0, 0 FROM nations n
ON CONFLICT (nation_id, sector) DO NOTHING;

COMMIT;
