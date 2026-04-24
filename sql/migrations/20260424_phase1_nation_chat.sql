-- ═══════════════════════════════════════════════════════════════════════════════
-- Phase 1 — Nation Chat: seed + enroll factions + trigger
--
-- The group_chats schema (migration 20260329_messaging_system.sql) already
-- supports chat_type='nation' with a UNIQUE(nation_id) constraint. Nothing
-- had ever seeded those rows though, so the "Nation" group in
-- js/messaging.js always rendered empty even though the render path was
-- there. js/messaging.js already filters group chats the caller is a
-- member of and already renders the sender's full faction_name on every
-- message, so once this migration runs the UI just lights up.
--
-- This migration:
--
--   1. Seeds one group_chats row per nation. Name = "<Nation> National Chat".
--   2. Backfills group_chat_members for every active party/corporation
--      faction so they appear in their nation's chat on next page load.
--   3. Installs trg_enroll_nation_chat on factions so new and
--      moved factions auto-enroll on INSERT or nation_id change, and
--      lose old-nation membership on a move.
--
-- Nation scoping rules (matches the Phase 1 spec):
--   - Party faction   → enrolled in its nation_id's nation chat.
--   - Corporation     → enrolled in its nation_id's nation chat (HQ nation).
--   - Other types     → no enrollment. Nation Chat is party/corp only.
--
-- Idempotent: all writes guarded by WHERE NOT EXISTS or ON CONFLICT.
-- SECURITY DEFINER on the trigger so it bypasses RLS on
-- group_chat_members (same pattern as the workforce audit trigger).
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. One group_chats row per nation, chat_type='nation'.
INSERT INTO group_chats (id, name, chat_type, nation_id, created_by, created_at)
SELECT gen_random_uuid(), n.name || ' National Chat', 'nation', n.id, NULL, now()
FROM nations n
WHERE NOT EXISTS (
    SELECT 1 FROM group_chats gc
    WHERE gc.nation_id = n.id AND gc.chat_type = 'nation'
);

-- 2. Backfill membership for every active party/corp faction.
INSERT INTO group_chat_members (chat_id, faction_id, joined_at, last_read_at)
SELECT gc.id, f.id, now(), NULL
FROM factions f
JOIN group_chats gc
  ON gc.nation_id = f.nation_id
 AND gc.chat_type = 'nation'
WHERE f.nation_id IS NOT NULL
  AND f.abandoned_at IS NULL
  AND f.faction_type IN ('party', 'corporation')
  AND NOT EXISTS (
      SELECT 1 FROM group_chat_members m
      WHERE m.chat_id = gc.id AND m.faction_id = f.id
  );

-- 3. Trigger: auto-enroll on faction INSERT or nation_id change.
--    SECURITY DEFINER so the INSERT clears RLS on group_chat_members.
--    search_path = public locks the function's schema resolution.
CREATE OR REPLACE FUNCTION enroll_faction_in_nation_chat()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_chat_id UUID;
BEGIN
    -- Only party and corporation factions get a Nation Chat seat.
    -- Skip if no nation or the faction has been abandoned.
    IF NEW.nation_id IS NULL
       OR NEW.abandoned_at IS NOT NULL
       OR NEW.faction_type NOT IN ('party', 'corporation') THEN
        -- If a faction was just abandoned, drop it from any nation chats
        -- so their seat isn't held open.
        IF TG_OP = 'UPDATE' AND NEW.abandoned_at IS NOT NULL AND OLD.abandoned_at IS NULL THEN
            DELETE FROM group_chat_members m
            USING group_chats gc
            WHERE m.chat_id = gc.id
              AND gc.chat_type = 'nation'
              AND m.faction_id = NEW.id;
        END IF;
        RETURN NEW;
    END IF;

    SELECT id INTO v_new_chat_id
    FROM group_chats
    WHERE nation_id = NEW.nation_id AND chat_type = 'nation'
    LIMIT 1;

    IF v_new_chat_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Faction moved to a different nation → drop old nation chat membership.
    IF TG_OP = 'UPDATE' AND OLD.nation_id IS DISTINCT FROM NEW.nation_id AND OLD.nation_id IS NOT NULL THEN
        DELETE FROM group_chat_members m
        USING group_chats gc
        WHERE m.chat_id = gc.id
          AND gc.chat_type = 'nation'
          AND gc.nation_id = OLD.nation_id
          AND m.faction_id = NEW.id;
    END IF;

    -- Idempotent enrollment.
    INSERT INTO group_chat_members (chat_id, faction_id, joined_at)
    VALUES (v_new_chat_id, NEW.id, now())
    ON CONFLICT (chat_id, faction_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enroll_nation_chat ON factions;
CREATE TRIGGER trg_enroll_nation_chat
    AFTER INSERT OR UPDATE OF nation_id, abandoned_at ON factions
    FOR EACH ROW
    EXECUTE FUNCTION enroll_faction_in_nation_chat();

-- ─────────────────────────────────────────────────────────────────────────
-- Verification queries (read-only, commented — paste into SQL editor to
-- sanity-check after the migration runs):
-- ─────────────────────────────────────────────────────────────────────────
--
-- SELECT n.name, gc.name AS chat_name,
--        COUNT(m.faction_id) AS members
-- FROM nations n
-- LEFT JOIN group_chats gc ON gc.nation_id = n.id AND gc.chat_type = 'nation'
-- LEFT JOIN group_chat_members m ON m.chat_id = gc.id
-- GROUP BY n.name, gc.name
-- ORDER BY n.name;
--
-- SELECT n.name AS nation, f.faction_type, f.faction_name
-- FROM factions f
-- JOIN nations n ON n.id = f.nation_id
-- LEFT JOIN group_chat_members m ON m.faction_id = f.id
-- LEFT JOIN group_chats gc ON gc.id = m.chat_id AND gc.chat_type = 'nation'
-- WHERE f.faction_type IN ('party', 'corporation')
--   AND f.abandoned_at IS NULL
--   AND gc.id IS NULL
-- ORDER BY n.name, f.faction_name;
-- -- (Should return zero rows — everyone enrolled.)
