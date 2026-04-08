-- Add project_code column to construction_contracts for human-readable IDs
-- e.g., GOV-C1-2014, GOV-I2-2014, PVT-M1-2014
ALTER TABLE construction_contracts
    ADD COLUMN IF NOT EXISTS project_code TEXT;
