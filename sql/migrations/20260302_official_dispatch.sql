-- Migration: Official Dispatch support for autocracy op-eds
-- Adds is_official_dispatch flag to op_eds table.

DO $$ BEGIN
  ALTER TABLE op_eds ADD COLUMN is_official_dispatch BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
