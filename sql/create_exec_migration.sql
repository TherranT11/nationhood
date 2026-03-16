-- Helper RPC to execute arbitrary SQL from the migrate-work.js script.
-- Install once in the Work Supabase SQL Editor before running npm run migrate:work.
-- SECURITY DEFINER so it can run DDL (CREATE TABLE, ALTER TABLE, etc.).

CREATE OR REPLACE FUNCTION exec_migration(sql_text TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql_text;
END;
$$;
