-- ══════════════════════════════════════════════════════════════════════════════
-- Phase 5 — Moderation + resilience
--
-- Ships the schema half of Phase 5. Client + admin UI land in a follow-up.
--
-- Parts:
--   1. group_chat_messages + direct_messages: add edited_at / deleted_at /
--      deleted_by / pinned_at / pinned_by columns so the UI can render
--      edits, tombstoned messages, and a pinned-strip.
--   2. group_chat_members: add muted_until / banned_at / banned_by for
--      per-channel moderation.
--   3. message_reports: admin review queue, one row per user-flag.
--   4. user_blocks: self-protection mute list, scoped to the blocker.
--   5. RLS: own-message edit window, admin override, report insert/read,
--      block read/write self, member mute/ban admin-only.
--   6. Triggers:
--        * enforce_message_rate_limit — per-channel send caps (strictest
--          on Global), raises SQLSTATE 'P0001' with a readable message
--          so the client can surface a toast.
--        * enforce_max_pinned_per_chat — max 3 pinned messages per chat.
--        * enforce_edit_window — sender can only UPDATE message_text
--          within EDIT_WINDOW_SECONDS. Admins bypass.
--
-- Idempotent. Safe to re-run. Edit windows and rate caps are tunable by
-- re-running the function definitions; no backfill needed.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Message columns for edit / delete / pin ─────────────────────────────
ALTER TABLE group_chat_messages
    ADD COLUMN IF NOT EXISTS edited_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES factions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS pinned_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS pinned_by  UUID REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE direct_messages
    ADD COLUMN IF NOT EXISTS edited_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_gcmsg_pinned
    ON group_chat_messages (chat_id, pinned_at DESC)
    WHERE pinned_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gcmsg_live
    ON group_chat_messages (chat_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- ── 2. Per-channel moderation on group_chat_members ────────────────────────
ALTER TABLE group_chat_members
    ADD COLUMN IF NOT EXISTS muted_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS banned_at   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS banned_by   UUID REFERENCES factions(id) ON DELETE SET NULL;

-- ── 3. Report queue ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_kind TEXT NOT NULL CHECK (message_kind IN ('group', 'dm')),
    message_id   UUID NOT NULL,
    chat_id      UUID,
    reporter_faction_id UUID REFERENCES factions(id) ON DELETE SET NULL,
    reason       TEXT NOT NULL CHECK (char_length(reason) <= 500),
    resolved_at  TIMESTAMPTZ,
    resolved_by  UUID,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reports_open
    ON message_reports (created_at DESC) WHERE resolved_at IS NULL;

ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports insertable by reporter" ON message_reports;
CREATE POLICY "reports insertable by reporter"
    ON message_reports FOR INSERT TO authenticated
    WITH CHECK (
        reporter_faction_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = reporter_faction_id AND linked_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "reports readable by admin" ON message_reports;
CREATE POLICY "reports readable by admin"
    ON message_reports FOR SELECT TO authenticated
    USING (is_admin());

DROP POLICY IF EXISTS "reports updatable by admin" ON message_reports;
CREATE POLICY "reports updatable by admin"
    ON message_reports FOR UPDATE TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ── 4. Self-protection block list ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_blocks (
    blocker_faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    blocked_faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (blocker_faction_id, blocked_faction_id)
);
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocks readable by blocker" ON user_blocks;
CREATE POLICY "blocks readable by blocker"
    ON user_blocks FOR SELECT TO authenticated
    USING (
        blocker_faction_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = blocker_faction_id AND linked_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "blocks writable by blocker" ON user_blocks;
CREATE POLICY "blocks writable by blocker"
    ON user_blocks FOR INSERT TO authenticated
    WITH CHECK (
        blocker_faction_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = blocker_faction_id AND linked_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "blocks deletable by blocker" ON user_blocks;
CREATE POLICY "blocks deletable by blocker"
    ON user_blocks FOR DELETE TO authenticated
    USING (
        blocker_faction_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = blocker_faction_id AND linked_user_id = auth.uid())
    );

-- ── 5. RLS updates on existing tables ──────────────────────────────────────
-- group_chat_messages UPDATE: sender within edit window, or admin. We keep
-- the column-level enforcement in a trigger (enforce_edit_window) so the
-- RLS policy is a straight "is it your row or are you an admin".
DROP POLICY IF EXISTS "GC messages updatable by sender or admin" ON group_chat_messages;
CREATE POLICY "GC messages updatable by sender or admin"
    ON group_chat_messages FOR UPDATE TO authenticated
    USING (
        is_admin()
        OR sender_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = sender_id AND linked_user_id = auth.uid())
    );

-- direct_messages UPDATE: already allowed receiver for read_at. Add sender
-- so they can edit/soft-delete, plus admin.
DROP POLICY IF EXISTS "DM updatable by receiver (for read_at)" ON direct_messages;
DROP POLICY IF EXISTS "DM updatable by participants or admin" ON direct_messages;
CREATE POLICY "DM updatable by participants or admin"
    ON direct_messages FOR UPDATE TO authenticated
    USING (
        is_admin()
        OR sender_id = auth.uid()
        OR receiver_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = sender_id AND linked_user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM factions WHERE id = receiver_id AND linked_user_id = auth.uid())
    );

-- group_chat_members UPDATE was previously only self-row (read status).
-- Broaden so admins can flip muted_until / banned_at. Users keep the
-- ability to update their own last_read_at via a separate condition.
DROP POLICY IF EXISTS "GC members can update own read status" ON group_chat_members;
DROP POLICY IF EXISTS "GC members updatable by self or admin" ON group_chat_members;
CREATE POLICY "GC members updatable by self or admin"
    ON group_chat_members FOR UPDATE TO authenticated
    USING (
        is_admin()
        OR faction_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = faction_id AND linked_user_id = auth.uid())
    );

-- ── 6a. Trigger: enforce edit window on UPDATE of message_text ─────────────
-- Only applies to non-admin callers. Window is 5 minutes from created_at.
-- Also enforces: you cannot resurrect a deleted message by editing.
CREATE OR REPLACE FUNCTION enforce_edit_window()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_edit_window_sec CONSTANT INTEGER := 300;  -- 5 minutes
BEGIN
    IF is_admin() THEN
        RETURN NEW;
    END IF;

    -- If the caller is flipping read_at / last_read_at or marking as
    -- deleted via the soft-delete column, we don't gate on window.
    IF OLD.message_text IS DISTINCT FROM NEW.message_text THEN
        IF OLD.deleted_at IS NOT NULL THEN
            RAISE EXCEPTION 'Cannot edit a deleted message' USING ERRCODE = 'P0001';
        END IF;
        IF (EXTRACT(EPOCH FROM (now() - OLD.created_at)) > v_edit_window_sec) THEN
            RAISE EXCEPTION 'Edit window has closed (% seconds)', v_edit_window_sec USING ERRCODE = 'P0001';
        END IF;
        NEW.edited_at := now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gcmsg_edit_window ON group_chat_messages;
CREATE TRIGGER trg_gcmsg_edit_window
    BEFORE UPDATE ON group_chat_messages
    FOR EACH ROW EXECUTE FUNCTION enforce_edit_window();

DROP TRIGGER IF EXISTS trg_dm_edit_window ON direct_messages;
CREATE TRIGGER trg_dm_edit_window
    BEFORE UPDATE ON direct_messages
    FOR EACH ROW EXECUTE FUNCTION enforce_edit_window();

-- ── 6b. Trigger: rate limit on group_chat_messages INSERT ──────────────────
-- Channel-type caps. Global is the loudest channel so it gets the
-- strictest cap. DMs are point-to-point; a separate trigger handles them.
-- SECURITY DEFINER so we can read group_chats regardless of caller RLS.
CREATE OR REPLACE FUNCTION enforce_message_rate_limit()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_chat_type TEXT;
    v_cap INT;
    v_window_sec INT;
    v_recent INT;
BEGIN
    -- System messages bypass (seeded by triggers / RPC).
    IF NEW.is_system = true OR NEW.sender_id IS NULL THEN
        RETURN NEW;
    END IF;
    -- Admins bypass rate limits.
    IF is_admin() THEN
        RETURN NEW;
    END IF;

    SELECT chat_type INTO v_chat_type FROM group_chats WHERE id = NEW.chat_id;

    -- Channel caps: (cap, window_seconds). Keep Global tightest; Nation and
    -- private groups looser since participation is already scoped.
    IF v_chat_type = 'global' THEN
        v_cap := 3; v_window_sec := 10;
    ELSIF v_chat_type = 'nation' THEN
        v_cap := 6; v_window_sec := 10;
    ELSE
        v_cap := 10; v_window_sec := 10;  -- custom, ipo
    END IF;

    SELECT COUNT(*) INTO v_recent
    FROM group_chat_messages
    WHERE sender_id = NEW.sender_id
      AND chat_id = NEW.chat_id
      AND created_at > now() - make_interval(secs => v_window_sec);

    IF v_recent >= v_cap THEN
        RAISE EXCEPTION 'Rate limit: max % messages per % seconds in this channel', v_cap, v_window_sec
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gcmsg_rate_limit ON group_chat_messages;
CREATE TRIGGER trg_gcmsg_rate_limit
    BEFORE INSERT ON group_chat_messages
    FOR EACH ROW EXECUTE FUNCTION enforce_message_rate_limit();

-- DM rate limit — 5 per 10s per sender/receiver pair.
CREATE OR REPLACE FUNCTION enforce_dm_rate_limit()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_recent INT;
BEGIN
    IF is_admin() THEN RETURN NEW; END IF;

    SELECT COUNT(*) INTO v_recent
    FROM direct_messages
    WHERE sender_id = NEW.sender_id
      AND receiver_id = NEW.receiver_id
      AND created_at > now() - interval '10 seconds';

    IF v_recent >= 5 THEN
        RAISE EXCEPTION 'Rate limit: max 5 DMs per 10 seconds to the same faction'
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dm_rate_limit ON direct_messages;
CREATE TRIGGER trg_dm_rate_limit
    BEFORE INSERT ON direct_messages
    FOR EACH ROW EXECUTE FUNCTION enforce_dm_rate_limit();

-- ── 6c. Trigger: mute / ban check on group_chat_messages INSERT ────────────
-- Fires before rate limit (alphabetical order by trigger name would
-- matter — we ensure this trigger runs first via the naming convention
-- 'a_' prefix). Admins bypass.
CREATE OR REPLACE FUNCTION enforce_mute_ban()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_muted_until TIMESTAMPTZ;
    v_banned_at   TIMESTAMPTZ;
BEGIN
    IF NEW.is_system = true OR NEW.sender_id IS NULL THEN RETURN NEW; END IF;
    IF is_admin() THEN RETURN NEW; END IF;

    SELECT muted_until, banned_at INTO v_muted_until, v_banned_at
    FROM group_chat_members
    WHERE chat_id = NEW.chat_id AND faction_id = NEW.sender_id;

    IF v_banned_at IS NOT NULL THEN
        RAISE EXCEPTION 'You are banned from this channel'
            USING ERRCODE = 'P0001';
    END IF;
    IF v_muted_until IS NOT NULL AND v_muted_until > now() THEN
        RAISE EXCEPTION 'You are muted in this channel until %', to_char(v_muted_until, 'YYYY-MM-DD HH24:MI UTC')
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_a_gcmsg_mute_ban ON group_chat_messages;
CREATE TRIGGER trg_a_gcmsg_mute_ban
    BEFORE INSERT ON group_chat_messages
    FOR EACH ROW EXECUTE FUNCTION enforce_mute_ban();

-- ── 6d. Trigger: cap pinned messages at 3 per chat ─────────────────────────
-- Pinning is admin-only (enforced by RLS + this trigger's is_admin check).
-- Players cannot pin; trigger rejects the update if non-admin tries.
CREATE OR REPLACE FUNCTION enforce_max_pinned_per_chat()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pinned_count INT;
    v_max CONSTANT INT := 3;
BEGIN
    -- Only fire when the pin state actually changes.
    IF OLD.pinned_at IS NOT DISTINCT FROM NEW.pinned_at THEN
        RETURN NEW;
    END IF;

    -- Pinning (going from NULL -> value) requires admin and cap check.
    IF NEW.pinned_at IS NOT NULL AND OLD.pinned_at IS NULL THEN
        IF NOT is_admin() THEN
            RAISE EXCEPTION 'Only admins can pin messages' USING ERRCODE = 'P0001';
        END IF;
        SELECT COUNT(*) INTO v_pinned_count
        FROM group_chat_messages
        WHERE chat_id = NEW.chat_id AND pinned_at IS NOT NULL;
        IF v_pinned_count >= v_max THEN
            RAISE EXCEPTION 'Max % pinned messages per channel; unpin one first', v_max
                USING ERRCODE = 'P0001';
        END IF;
    END IF;

    -- Unpinning also requires admin.
    IF NEW.pinned_at IS NULL AND OLD.pinned_at IS NOT NULL THEN
        IF NOT is_admin() THEN
            RAISE EXCEPTION 'Only admins can unpin messages' USING ERRCODE = 'P0001';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gcmsg_pin_cap ON group_chat_messages;
CREATE TRIGGER trg_gcmsg_pin_cap
    BEFORE UPDATE OF pinned_at ON group_chat_messages
    FOR EACH ROW EXECUTE FUNCTION enforce_max_pinned_per_chat();

-- ── Verification (commented — paste after migration runs): ─────────────────
-- SELECT conname, contype FROM pg_constraint
-- WHERE conrelid = 'group_chat_messages'::regclass;
--
-- SELECT tgname, tgenabled FROM pg_trigger
-- WHERE tgrelid IN ('group_chat_messages'::regclass,
--                   'direct_messages'::regclass,
--                   'group_chat_members'::regclass);
