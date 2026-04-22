-- Fix: Disband Party blocked by non-cascading FK on campaign_actions.party_id.
--
--   "update or delete on table 'factions' violates foreign key constraint
--    'campaign_actions_party_id_fkey' on table 'campaign_actions'"
--
-- campaign_actions is a historical action log (see create_campaign_actions.sql
-- line 2-3 header: "logs all faction/party actions (policy platform, polls,
-- rallies, etc.) and is used for cooldown enforcement and the Recent Actions
-- feed"). It's an audit record, not per-party state — rows should OUTLIVE
-- the acting party. Same classification as negotiation_messages: SET NULL,
-- not CASCADE.
--
-- Two-step (mirrors 20260422_set_null_negotiation_messages_sender.sql):
--   1. Drop NOT NULL on party_id so the SET NULL action can actually null it.
--   2. Drop + recreate the FK constraint with ON DELETE SET NULL.
--
-- Safe to re-run: all steps idempotent. No data is touched; cooldowns on a
-- dissolved party become moot anyway, and the Recent Actions feed can skip
-- null-party rows (or render them as "[Dissolved party]" — up to the UI).

-- 1. Allow party_id to be NULL (required for the SET NULL FK action)
ALTER TABLE campaign_actions
    ALTER COLUMN party_id DROP NOT NULL;

-- 2. Replace the FK with ON DELETE SET NULL
ALTER TABLE campaign_actions
    DROP CONSTRAINT IF EXISTS campaign_actions_party_id_fkey;

ALTER TABLE campaign_actions
    ADD CONSTRAINT campaign_actions_party_id_fkey
    FOREIGN KEY (party_id)
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
    ON con.conname = 'campaign_actions_party_id_fkey'
WHERE c.table_name = 'campaign_actions'
  AND c.column_name = 'party_id';
