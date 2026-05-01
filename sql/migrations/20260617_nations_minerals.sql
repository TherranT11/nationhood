-- ══════════════════════════════════════════════════════════════
-- Add Minerals stat to nations.
--
-- New column nations.minerals (INT, default 50). Backfills every
-- existing row to 50 so the dashboard never sees NULL.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE nations
    ADD COLUMN IF NOT EXISTS minerals INT NOT NULL DEFAULT 50;

UPDATE nations SET minerals = 50 WHERE minerals IS DISTINCT FROM 50;

COMMENT ON COLUMN nations.minerals IS
    'National minerals stat. Founding default = 50.';

NOTIFY pgrst, 'reload schema';
