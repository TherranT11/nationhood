-- Add project_type and project_subtype to construction_contracts
-- These store the building type (Office Building, Branch Office, Trading Floor, etc.)
-- and style (Modern, Premium, etc.) for custom-built projects.

ALTER TABLE construction_contracts
    ADD COLUMN IF NOT EXISTS project_type TEXT;

ALTER TABLE construction_contracts
    ADD COLUMN IF NOT EXISTS project_subtype TEXT;
