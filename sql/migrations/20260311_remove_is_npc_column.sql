-- Remove legacy is_npc flag from all application tables.
-- This migration is defensive: it only acts where is_npc still exists.

DO $$
DECLARE
  rec record;
  pol record;
  con record;
  idx record;
BEGIN
  FOR rec IN
    SELECT table_schema, table_name
    FROM information_schema.columns
    WHERE column_name = 'is_npc'
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
  LOOP
    -- Drop RLS policies that reference is_npc so policy definitions remain valid.
    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = rec.table_schema
        AND tablename = rec.table_name
        AND (
          coalesce(qual, '') ILIKE '%is_npc%'
          OR coalesce(with_check, '') ILIKE '%is_npc%'
        )
    LOOP
      EXECUTE format(
        'drop policy if exists %I on %I.%I',
        pol.policyname,
        rec.table_schema,
        rec.table_name
      );
    END LOOP;

    -- Drop constraints that depend on is_npc.
    FOR con IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_attribute a ON a.attrelid = t.oid
      WHERE n.nspname = rec.table_schema
        AND t.relname = rec.table_name
        AND a.attname = 'is_npc'
        AND a.attnum = ANY (c.conkey)
    LOOP
      EXECUTE format(
        'alter table %I.%I drop constraint if exists %I',
        rec.table_schema,
        rec.table_name,
        con.conname
      );
    END LOOP;

    -- Drop indexes that include is_npc.
    FOR idx IN
      SELECT i.indexrelid::regclass::text AS index_name
      FROM pg_index i
      JOIN pg_class t ON t.oid = i.indrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_attribute a ON a.attrelid = t.oid
      WHERE n.nspname = rec.table_schema
        AND t.relname = rec.table_name
        AND a.attname = 'is_npc'
        AND a.attnum = ANY (i.indkey)
    LOOP
      EXECUTE format('drop index if exists %s', idx.index_name);
    END LOOP;

    -- Remove default then drop the deprecated column.
    EXECUTE format(
      'alter table %I.%I alter column is_npc drop default',
      rec.table_schema,
      rec.table_name
    );

    EXECUTE format(
      'alter table %I.%I drop column if exists is_npc',
      rec.table_schema,
      rec.table_name
    );
  END LOOP;
END
$$;
