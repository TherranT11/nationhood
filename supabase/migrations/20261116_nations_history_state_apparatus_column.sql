-- Mirror of sql/migrations/20261116_nations_history_state_apparatus_column.sql.
-- Unblocks snapshotNationHistory after the control → state_apparatus rename.

BEGIN;

ALTER TABLE public.nations_history
    ADD COLUMN IF NOT EXISTS state_apparatus NUMERIC;

COMMIT;

NOTIFY pgrst, 'reload schema';
