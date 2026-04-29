-- =========================================================================
-- Reconcile policy_options.sort_order vs option_order.
--
-- An earlier iteration of policy_options used `sort_order` as the ordering
-- column. The Phase 1 migration created `option_order`, but on environments
-- where the table pre-existed, sort_order is still around as a NOT NULL
-- column without a default — so application inserts (which only write
-- option_order) hit "null value in column sort_order violates not-null
-- constraint".
--
-- This patch is idempotent:
--
--   * sort_order present, option_order missing → rename sort_order to
--     option_order (preserves any existing ordering data).
--   * Both present → drop sort_order (the application uses option_order).
--   * Only option_order present → no-op.
-- =========================================================================

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'policy_options' AND column_name = 'sort_order'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'policy_options' AND column_name = 'option_order'
    ) THEN
        ALTER TABLE policy_options RENAME COLUMN sort_order TO option_order;
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'policy_options' AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE policy_options DROP COLUMN sort_order;
    END IF;
END $$;

COMMIT;
