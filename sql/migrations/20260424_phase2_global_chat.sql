-- ═══════════════════════════════════════════════════════════════════════════════
-- Phase 2 — Global Chat: one shard-wide channel, every player enrolled
--
-- Parallel to Phase 1's Nation Chat. The same group_chats schema carries
-- a new chat_type='global' value and js/messaging.js already iterates
-- _groupChats filtered by the caller's membership, so once this migration
-- runs the Global section shows up in the chat panel.
--
-- Steps:
--
--   1. Widen the group_chats.chat_type CHECK to include 'global'.
--   2. Seed a single global chat (guarded by WHERE NOT EXISTS — only one
--      global channel per shard).
--   3. Backfill group_chat_members for every active party/corp faction.
--   4. Install enroll_faction_in_global_chat() trigger on factions —
--      parallel to Phase 1's nation-chat trigger, same shape. New and
--      un-abandoned party/corp factions auto-enroll.
--
-- Rate limiting / slow mode is NOT included here — that lands in Phase 5
-- (moderation hardening) once we have real traffic to tune against.
--
-- Idempotent. SECURITY DEFINER on the trigger for the same reason as
-- Phase 1: the INSERT on group_chat_members must bypass RLS regardless
-- of which role fired the faction update.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Widen the chat_type CHECK constraint.
ALTER TABLE group_chats DROP CONSTRAINT IF EXISTS group_chats_chat_type_check;
ALTER TABLE group_chats
    ADD CONSTRAINT group_chats_chat_type_check
    CHECK (chat_type IN ('custom', 'ipo', 'nation', 'global'));

-- 2. Seed one global chat.
INSERT INTO group_chats (id, name, chat_type, created_by, created_at)
SELECT gen_random_uuid(), 'Global Chat', 'global', NULL, now()
WHERE NOT EXISTS (
    SELECT 1 FROM group_chats WHERE chat_type = 'global'
);

-- 3. Backfill membership for every active party/corp faction.
INSERT INTO group_chat_members (chat_id, faction_id, joined_at, last_read_at)
SELECT gc.id, f.id, now(), NULL
FROM factions f
JOIN group_chats gc ON gc.chat_type = 'global'
WHERE f.abandoned_at IS NULL
  AND f.faction_type IN ('party', 'corporation')
  AND NOT EXISTS (
      SELECT 1 FROM group_chat_members m
      WHERE m.chat_id = gc.id AND m.faction_id = f.id
  );

-- 4. Auto-enroll trigger — parallel to Phase 1's nation-chat trigger.
--    Handles INSERT, un-abandon transitions, and drops membership when
--    a faction is abandoned (so the chat doesn't hold zombies).
CREATE OR REPLACE FUNCTION enroll_faction_in_global_chat()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_chat_id UUID;
BEGIN
    -- Only party and corporation factions get a Global Chat seat.
    IF NEW.faction_type NOT IN ('party', 'corporation') THEN
        RETURN NEW;
    END IF;

    -- Abandoned → drop membership.
    IF NEW.abandoned_at IS NOT NULL THEN
        IF TG_OP = 'UPDATE' AND OLD.abandoned_at IS NULL THEN
            DELETE FROM group_chat_members m
            USING group_chats gc
            WHERE m.chat_id = gc.id
              AND gc.chat_type = 'global'
              AND m.faction_id = NEW.id;
        END IF;
        RETURN NEW;
    END IF;

    SELECT id INTO v_chat_id
    FROM group_chats
    WHERE chat_type = 'global'
    LIMIT 1;

    IF v_chat_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO group_chat_members (chat_id, faction_id, joined_at)
    VALUES (v_chat_id, NEW.id, now())
    ON CONFLICT (chat_id, faction_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enroll_global_chat ON factions;
CREATE TRIGGER trg_enroll_global_chat
    AFTER INSERT OR UPDATE OF abandoned_at ON factions
    FOR EACH ROW
    EXECUTE FUNCTION enroll_faction_in_global_chat();

-- ─────────────────────────────────────────────────────────────────────────
-- Verification (commented — paste into SQL editor after running):
-- ─────────────────────────────────────────────────────────────────────────
-- SELECT gc.name, COUNT(m.faction_id) AS members
-- FROM group_chats gc
-- LEFT JOIN group_chat_members m ON m.chat_id = gc.id
-- WHERE gc.chat_type = 'global'
-- GROUP BY gc.name;
-- -- Expected: exactly one row, members = number of active party/corp factions.
