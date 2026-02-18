-- Fix nations_history columns that were created as INTEGER to NUMERIC.
-- NUMERIC handles any size value. Safe to re-run (no-ops on already-NUMERIC columns).
-- Run this in Supabase SQL editor.

DO $$
DECLARE
    col RECORD;
BEGIN
    FOR col IN
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'nations_history'
          AND table_schema = 'public'
          AND data_type IN ('integer', 'bigint', 'smallint', 'real', 'double precision')
          AND column_name NOT IN ('id', 'tick')
    LOOP
        EXECUTE format('ALTER TABLE nations_history ALTER COLUMN %I TYPE NUMERIC', col.column_name);
        RAISE NOTICE 'Converted % to NUMERIC', col.column_name;
    END LOOP;
END $$;
