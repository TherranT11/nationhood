-- ══════════════════════════════════════════════════════════════════════════
-- Rule: one faction per user per nation.
--
-- A user may own at most ONE active faction (party OR corporation) per
-- nation. This prevents:
--   • Founding a party in nation X, then a corporation in the same nation X.
--   • Founding a corporation in nation X, then another corporation in the
--     same nation X.
--   • (And, by symmetry, any other same-user / same-nation stacking.)
--
-- A user MAY still own factions in DIFFERENT nations (e.g., a party in
-- nation A and a corporation in nation B).
--
-- Identity: a user owns a faction via ONE of two routes:
--   • PRIMARY   — factions.id = auth.uid() (legacy "your main faction")
--   • LINKED    — factions.linked_user_id = auth.uid() (secondary faction)
-- So the canonical "owner id" per row is COALESCE(linked_user_id, id).
--
-- Scope: only active factions count. If a user abandons their faction
-- (abandoned_at IS NOT NULL), they're free to create a new one in that
-- nation.
--
-- Enforcement: partial unique index. Any INSERT or UPDATE that would
-- produce two active rows with the same (owner, nation) pair raises a
-- unique_violation error at the DB layer. Client-side pre-checks
-- (corp-nation-select.html, createparty.html) surface a friendly
-- message before the write lands; this index is the hard guarantee.
--
-- Idempotent.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Diagnostic: if existing rows already violate the rule, the CREATE
-- UNIQUE INDEX below will fail with a clear error listing the
-- duplicate (owner, nation) pair. Run this SELECT first if you want to
-- see conflicts before the migration attempts to apply:
--
--   SELECT COALESCE(linked_user_id, id) AS owner_uid,
--          nation_id,
--          COUNT(*)                    AS faction_count,
--          ARRAY_AGG(faction_name)     AS faction_names
--   FROM factions
--   WHERE abandoned_at IS NULL
--     AND nation_id IS NOT NULL
--   GROUP BY COALESCE(linked_user_id, id), nation_id
--   HAVING COUNT(*) > 1;
--
-- Expected: zero rows. If any return, resolve before applying (abandon
-- one of the factions, or null out nation_id).

CREATE UNIQUE INDEX IF NOT EXISTS idx_factions_one_per_user_per_nation
    ON factions (COALESCE(linked_user_id, id), nation_id)
    WHERE abandoned_at IS NULL AND nation_id IS NOT NULL;

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- Verification
-- ══════════════════════════════════════════════════════════════════════════
-- 1. Index exists:
--      SELECT indexname, indexdef FROM pg_indexes
--      WHERE tablename = 'factions'
--        AND indexname = 'idx_factions_one_per_user_per_nation';
--    Expected: one row with a "WHERE ((abandoned_at IS NULL) AND
--    (nation_id IS NOT NULL))" predicate in indexdef.
--
-- 2. Negative smoke — insert two active factions for the same
--    (owner, nation) pair. Second insert should fail with
--    "duplicate key value violates unique constraint
--    idx_factions_one_per_user_per_nation". Example:
--
--      -- First succeeds:
--      INSERT INTO factions (id, nation_id, faction_type, faction_name,
--                            abbreviation, seats, action_points)
--      VALUES ('00000000-0000-0000-0000-000000000aaa'::uuid,
--              '<some-nation-id>', 'party', 'Test Party', 'TP1', 0, 5);
--
--      -- Second fails:
--      INSERT INTO factions (id, linked_user_id, nation_id, faction_type,
--                            faction_name, abbreviation, seats, action_points)
--      VALUES (gen_random_uuid(),
--              '00000000-0000-0000-0000-000000000aaa'::uuid,
--              '<same-nation-id>', 'corporation', 'Test Corp', 'TCP',
--              0, 0);
--      -- Expect ERROR: duplicate key ... idx_factions_one_per_user_per_nation
--
--    Cleanup:
--      DELETE FROM factions WHERE faction_name IN ('Test Party', 'Test Corp');
--
-- 3. Positive smoke — abandoning a faction lifts the constraint for
--    a new faction in the same nation:
--
--      UPDATE factions SET abandoned_at = NOW() WHERE id = '<your-faction-id>';
--      -- Now INSERT of a new faction for the same (owner, nation) succeeds.
