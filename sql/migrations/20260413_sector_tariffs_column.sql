-- Add sector_tariffs jsonb column to nations table.
-- Stores per-sector tariff rates set via Universal Tariff Act bills.
-- Format: { "grains_staples": 22, "minerals": 10, "technology": 0 }
-- Null = no sector-specific tariffs (use global tariffs stat instead).

ALTER TABLE nations ADD COLUMN IF NOT EXISTS sector_tariffs JSONB DEFAULT NULL;
