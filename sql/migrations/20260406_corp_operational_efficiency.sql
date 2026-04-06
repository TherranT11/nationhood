-- Add operational efficiency column to factions for corporations.
-- Calculated per corp-tick as: total_workforce / total_property_capacity * 100
-- Clamped to 0-100. Represents how well-staffed the corporation's properties are.
ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS corp_operational_efficiency INTEGER DEFAULT 50;

-- Seed existing corporations with default 50 (will be recalculated next corp tick)
UPDATE factions
SET corp_operational_efficiency = 50
WHERE faction_type = 'corporation'
  AND corp_operational_efficiency IS NULL;
