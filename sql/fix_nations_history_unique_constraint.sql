-- Ensure nations_history has a unique constraint on (nation_id, tick).
-- Required for the snapshotNationHistory upsert to work correctly.
-- Without this constraint, the upsert fails and no history data is stored,
-- which breaks the stat change indicators (▲/▼) on the Nation dashboard.
-- Safe to re-run (uses IF NOT EXISTS).
-- Run this in Supabase SQL editor.

DO $$
BEGIN
    -- Check if the unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'nations_history_nation_id_tick_key'
          AND conrelid = 'public.nations_history'::regclass
    ) THEN
        ALTER TABLE nations_history
            ADD CONSTRAINT nations_history_nation_id_tick_key
            UNIQUE (nation_id, tick);
        RAISE NOTICE 'Created unique constraint on nations_history(nation_id, tick)';
    ELSE
        RAISE NOTICE 'Unique constraint nations_history_nation_id_tick_key already exists';
    END IF;
END $$;
