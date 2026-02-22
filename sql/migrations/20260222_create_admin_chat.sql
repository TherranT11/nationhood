-- Administrative Communications Chat
-- Allows any political party in a nation to chat within their nation's government page

CREATE TABLE IF NOT EXISTS admin_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    tick_posted INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_chat_nation ON admin_chat(nation_id, created_at DESC);

-- RLS Policies
ALTER TABLE admin_chat ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read messages in any nation
CREATE POLICY "admin_chat_select" ON admin_chat FOR SELECT TO authenticated USING (true);

-- Authenticated users can insert messages for their own faction
CREATE POLICY "admin_chat_insert" ON admin_chat FOR INSERT TO authenticated
    WITH CHECK (faction_id = auth.uid());
