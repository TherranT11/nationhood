-- Add per-tick tracking columns for construction projects.
-- These columns are updated each corp tick to track material consumption,
-- equipment condition, and phase progress.

-- Materials consumed: JSONB tracking how many units of each material have been used
-- e.g. { "steel": 8, "concrete": 6 } out of required_materials { "steel": 15, "concrete": 12 }
ALTER TABLE construction_contracts
  ADD COLUMN IF NOT EXISTS materials_consumed JSONB DEFAULT '{}'::jsonb;

-- Equipment condition: JSONB tracking condition (0-100) of each deployed equipment piece
-- e.g. { "work_trucks": 72, "excavators": 85, "tower_cranes": 90 }
ALTER TABLE construction_contracts
  ADD COLUMN IF NOT EXISTS equipment_condition JSONB DEFAULT '{}'::jsonb;

-- Construction GDP boost: stored on nation, recalculated each corp tick
-- Represents the GDP growth bonus from active construction spending
ALTER TABLE nations
  ADD COLUMN IF NOT EXISTS construction_gdp_boost NUMERIC(5,2) DEFAULT 0;
