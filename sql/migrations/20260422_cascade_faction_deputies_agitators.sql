-- Fix: Disband Party blocked by non-cascading FKs on faction_deputies
-- and faction_agitators.
--
-- Both were created with `REFERENCES factions(id)` (no ON DELETE CASCADE),
-- so DELETE FROM factions (via disband_party RPC or any other path) is
-- rejected with:
--   "update or delete on table 'factions' violates foreign key constraint
--    'faction_deputies_faction_id_fkey' on table 'faction_deputies'"
--
-- These two join tables are strictly owned by their parent faction — a
-- deputy / agitator with no faction is meaningless — so CASCADE is the
-- correct semantics. This migration drops and recreates both constraints
-- with ON DELETE CASCADE.
--
-- Safe to re-run: DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT with the
-- same name is idempotent; no data is touched.

-- ==================== faction_deputies ====================

ALTER TABLE faction_deputies
    DROP CONSTRAINT IF EXISTS faction_deputies_faction_id_fkey;

ALTER TABLE faction_deputies
    ADD CONSTRAINT faction_deputies_faction_id_fkey
    FOREIGN KEY (faction_id)
    REFERENCES factions(id)
    ON DELETE CASCADE;

-- ==================== faction_agitators ====================

ALTER TABLE faction_agitators
    DROP CONSTRAINT IF EXISTS faction_agitators_faction_id_fkey;

ALTER TABLE faction_agitators
    ADD CONSTRAINT faction_agitators_faction_id_fkey
    FOREIGN KEY (faction_id)
    REFERENCES factions(id)
    ON DELETE CASCADE;

-- ==================== VERIFY ====================
-- Both rows should show confdeltype = 'c' (CASCADE).
SELECT
    conname,
    conrelid::regclass AS table_name,
    CASE confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE confdeltype::text
    END AS on_delete
FROM pg_constraint
WHERE conname IN (
    'faction_deputies_faction_id_fkey',
    'faction_agitators_faction_id_fkey'
)
ORDER BY conname;
