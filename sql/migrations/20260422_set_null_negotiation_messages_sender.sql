-- Fix: Disband Party blocked by non-cascading FK on negotiation_messages.
--
--   "update or delete on table 'factions' violates foreign key constraint
--    'negotiation_messages_sender_faction_id_fkey' on table
--    'negotiation_messages'"
--
-- negotiation_messages are historical chat records for trade negotiations.
-- They should OUTLIVE the sending faction — the UI renders from the
-- denormalized `sender_display_name` column (see migration
-- 20260416_negotiation_messages.sql line 8-9: "denormalized ... to preserve
-- historical accuracy if ministers change"). So the correct semantic is
-- ON DELETE SET NULL, not CASCADE — keep the message, null out the FK.
--
-- Two-step:
--   1. Drop the NOT NULL constraint on sender_faction_id so the FK can
--      actually null it out on parent delete.
--   2. Drop + recreate the FK constraint with ON DELETE SET NULL.
--
-- Safe to re-run: DROP CONSTRAINT IF EXISTS + ALTER COLUMN DROP NOT NULL
-- (idempotent on columns already nullable) + ADD CONSTRAINT with same name.
-- No data is touched; messages retain their sender_display_name for the UI.

-- 1. Allow sender_faction_id to be NULL (required for the SET NULL FK action)
ALTER TABLE negotiation_messages
    ALTER COLUMN sender_faction_id DROP NOT NULL;

-- 2. Replace the FK with ON DELETE SET NULL
ALTER TABLE negotiation_messages
    DROP CONSTRAINT IF EXISTS negotiation_messages_sender_faction_id_fkey;

ALTER TABLE negotiation_messages
    ADD CONSTRAINT negotiation_messages_sender_faction_id_fkey
    FOREIGN KEY (sender_faction_id)
    REFERENCES factions(id)
    ON DELETE SET NULL;

-- ==================== VERIFY ====================
-- Expect: is_nullable = 'YES', on_delete = 'SET NULL'
SELECT
    c.column_name,
    c.is_nullable,
    con.conname,
    CASE con.confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE con.confdeltype::text
    END AS on_delete
FROM information_schema.columns c
LEFT JOIN pg_constraint con
    ON con.conname = 'negotiation_messages_sender_faction_id_fkey'
WHERE c.table_name = 'negotiation_messages'
  AND c.column_name = 'sender_faction_id';
