-- =========================================================================
-- Fix: rename policy_options.option_label → option_name
--
-- An earlier iteration of the multi-option work created policy_options with
-- option_label as the display column. The Phase 1 migration's
-- CREATE TABLE IF NOT EXISTS therefore skipped re-creating the table, which
-- means option_name never landed even though the application code (Phase
-- 2.5 onward) writes to it. This patch is idempotent:
--
--   * If option_label exists and option_name doesn't → rename.
--   * If neither exists → add option_name.
--   * If option_name already exists → no-op.
-- =========================================================================

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'policy_options'
          AND column_name = 'option_label'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'policy_options'
          AND column_name = 'option_name'
    ) THEN
        ALTER TABLE policy_options RENAME COLUMN option_label TO option_name;
    END IF;
END $$;

-- Belt-and-suspenders: add option_name if the table was created without
-- either column. This is a no-op when option_name already exists.
ALTER TABLE policy_options ADD COLUMN IF NOT EXISTS option_name text;

-- Backfill any nulls introduced by the rename / add, then enforce NOT NULL
-- to match the schema's intent (every option must have a name).
UPDATE policy_options SET option_name = 'Untitled Option' WHERE option_name IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'policy_options'
          AND column_name = 'option_name'
          AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE policy_options ALTER COLUMN option_name SET NOT NULL;
    END IF;
END $$;

COMMIT;
