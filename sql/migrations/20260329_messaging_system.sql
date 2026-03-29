-- ══════════════════════════════════════════════════════════════════════
-- Messaging System — DMs, Group Chats, IPO Auto-Chats
-- ══════════════════════════════════════════════════════════════════════

-- ── 1. Direct Messages ──
-- One row per message between two factions (any faction type, any nation)
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL CHECK (char_length(message_text) <= 2000),
    sent_at_tick INTEGER,
    read_at TIMESTAMPTZ,                      -- NULL = unread
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_dm_pair ON direct_messages(
    LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at DESC
);
CREATE INDEX IF NOT EXISTS idx_dm_unread ON direct_messages(receiver_id) WHERE read_at IS NULL;

-- ── 2. Group Chats ──
-- Each group chat has a type: 'custom' (player-created), 'ipo' (auto from IPO), 'nation' (nation-wide)
CREATE TABLE IF NOT EXISTS group_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(name) <= 100),
    chat_type TEXT NOT NULL DEFAULT 'custom' CHECK (chat_type IN ('custom', 'ipo', 'nation')),

    -- For IPO auto-chats: link to the org (NULL for custom/nation chats)
    ipo_org_id UUID REFERENCES international_orgs(id) ON DELETE CASCADE,

    -- For nation chats: link to the nation (NULL for custom/ipo chats)
    nation_id UUID REFERENCES nations(id) ON DELETE CASCADE,

    -- Creator (NULL for auto-generated chats)
    created_by UUID REFERENCES factions(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(ipo_org_id),   -- one chat per IPO org
    UNIQUE(nation_id)     -- one chat per nation
);

CREATE INDEX IF NOT EXISTS idx_group_chats_type ON group_chats(chat_type);
CREATE INDEX IF NOT EXISTS idx_group_chats_ipo ON group_chats(ipo_org_id) WHERE ipo_org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_group_chats_nation ON group_chats(nation_id) WHERE nation_id IS NOT NULL;

-- ── 3. Group Chat Members ──
-- Junction table: which factions are in which group chats
CREATE TABLE IF NOT EXISTS group_chat_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_read_at TIMESTAMPTZ,                 -- for unread count per member

    UNIQUE(chat_id, faction_id)
);

CREATE INDEX IF NOT EXISTS idx_gcm_chat ON group_chat_members(chat_id);
CREATE INDEX IF NOT EXISTS idx_gcm_faction ON group_chat_members(faction_id);

-- ── 4. Group Chat Messages ──
-- Messages within a group chat
CREATE TABLE IF NOT EXISTS group_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES factions(id) ON DELETE SET NULL,  -- NULL = system message
    is_system BOOLEAN NOT NULL DEFAULT false,
    message_text TEXT NOT NULL CHECK (char_length(message_text) <= 2000),
    sent_at_tick INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gcmsg_chat ON group_chat_messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gcmsg_sender ON group_chat_messages(sender_id);

-- ══════════════════════════════════════════════════════════════════════
-- RLS Policies
-- ══════════════════════════════════════════════════════════════════════

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;

-- ── Direct Messages: only sender and receiver can see/write ──

CREATE POLICY "DM visible to sender and receiver"
    ON direct_messages FOR SELECT TO authenticated
    USING (
        sender_id = auth.uid()
        OR receiver_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = sender_id AND linked_user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM factions WHERE id = receiver_id AND linked_user_id = auth.uid())
    );

CREATE POLICY "DM sendable by own faction"
    ON direct_messages FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = sender_id AND linked_user_id = auth.uid())
    );

CREATE POLICY "DM updatable by receiver (for read_at)"
    ON direct_messages FOR UPDATE TO authenticated
    USING (
        receiver_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = receiver_id AND linked_user_id = auth.uid())
    );

-- ── Group Chats: visible to members ──

CREATE POLICY "Group chats visible to members"
    ON group_chats FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM group_chat_members
            WHERE chat_id = id AND (
                faction_id = auth.uid()
                OR EXISTS (SELECT 1 FROM factions WHERE id = faction_id AND linked_user_id = auth.uid())
            )
        )
        -- Also allow system to see all for IPO/nation auto-creation
        OR created_by = auth.uid()
    );

CREATE POLICY "Group chats creatable by authenticated"
    ON group_chats FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Group chats updatable by creator"
    ON group_chats FOR UPDATE TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = created_by AND linked_user_id = auth.uid())
    );

-- ── Group Chat Members: visible to co-members ──

CREATE POLICY "GC members visible to co-members"
    ON group_chat_members FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM group_chat_members gcm2
            WHERE gcm2.chat_id = chat_id AND (
                gcm2.faction_id = auth.uid()
                OR EXISTS (SELECT 1 FROM factions WHERE id = gcm2.faction_id AND linked_user_id = auth.uid())
            )
        )
    );

CREATE POLICY "GC members joinable"
    ON group_chat_members FOR INSERT TO authenticated
    WITH CHECK (
        faction_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = faction_id AND linked_user_id = auth.uid())
        -- Allow adding others if you created the chat
        OR EXISTS (
            SELECT 1 FROM group_chats gc
            WHERE gc.id = chat_id AND (
                gc.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM factions WHERE id = gc.created_by AND linked_user_id = auth.uid())
            )
        )
    );

CREATE POLICY "GC members can update own read status"
    ON group_chat_members FOR UPDATE TO authenticated
    USING (
        faction_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = faction_id AND linked_user_id = auth.uid())
    );

CREATE POLICY "GC members can leave"
    ON group_chat_members FOR DELETE TO authenticated
    USING (
        faction_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = faction_id AND linked_user_id = auth.uid())
    );

-- ── Group Chat Messages: visible to chat members, sendable by members ──

CREATE POLICY "GC messages visible to members"
    ON group_chat_messages FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM group_chat_members
            WHERE chat_id = group_chat_messages.chat_id AND (
                faction_id = auth.uid()
                OR EXISTS (SELECT 1 FROM factions WHERE id = faction_id AND linked_user_id = auth.uid())
            )
        )
    );

CREATE POLICY "GC messages sendable by members"
    ON group_chat_messages FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        OR EXISTS (SELECT 1 FROM factions WHERE id = sender_id AND linked_user_id = auth.uid())
        OR is_system = true
    );

-- ══════════════════════════════════════════════════════════════════════
-- Comments
-- ══════════════════════════════════════════════════════════════════════

COMMENT ON TABLE direct_messages IS 'Private messages between two factions. Any faction can DM any other faction across nations.';
COMMENT ON TABLE group_chats IS 'Group conversations. Types: custom (player-created), ipo (auto-generated from IPO membership), nation (all parties in a nation).';
COMMENT ON TABLE group_chat_members IS 'Junction table for group chat membership. Tracks last_read_at for unread counts.';
COMMENT ON TABLE group_chat_messages IS 'Messages within group chats. sender_id NULL + is_system true for system messages.';
