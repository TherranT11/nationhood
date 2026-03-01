-- Player Integrity System
-- Tracks browser fingerprints to detect multi-accounting and enables banning.

-- ==================== PLAYER FINGERPRINTS ====================

CREATE TABLE IF NOT EXISTS player_fingerprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fingerprint TEXT NOT NULL,
    components JSONB DEFAULT '{}',          -- raw fingerprint components (screen, timezone, etc.)
    ip_address TEXT,                         -- optional, from request headers
    user_agent TEXT,
    first_seen_at TIMESTAMPTZ DEFAULT now(),
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    visit_count INT DEFAULT 1,
    UNIQUE(user_id, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_fingerprints_user ON player_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_fingerprints_fp ON player_fingerprints(fingerprint);
CREATE INDEX IF NOT EXISTS idx_fingerprints_first_seen ON player_fingerprints(first_seen_at);

-- ==================== PLAYER BANS ====================

CREATE TABLE IF NOT EXISTS player_bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fingerprint TEXT,                        -- optional: ban a specific fingerprint too
    reason TEXT DEFAULT 'Multi-accounting',
    banned_at TIMESTAMPTZ DEFAULT now(),
    banned_by TEXT,                           -- admin who issued the ban
    expires_at TIMESTAMPTZ,                  -- NULL = permanent
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_bans_user ON player_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_bans_fingerprint ON player_bans(fingerprint);
CREATE INDEX IF NOT EXISTS idx_bans_active ON player_bans(is_active) WHERE is_active = true;

-- ==================== FACTION BAN FLAG ====================

ALTER TABLE factions ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- ==================== RLS POLICIES ====================

ALTER TABLE player_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_bans ENABLE ROW LEVEL SECURITY;

-- Fingerprints: users can only insert/update their own; admins can read all
CREATE POLICY "Users can read own fingerprints"
    ON player_fingerprints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to fingerprints"
    ON player_fingerprints FOR ALL USING (true);

-- Bans: read-only for users (to check own ban status); admins manage
CREATE POLICY "Users can read own bans"
    ON player_bans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to bans"
    ON player_bans FOR ALL USING (true);

-- Grant anon/authenticated the ability to call the upsert RPC
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ==================== UPSERT RPC ====================
-- Called on every page load to record/update the player's fingerprint.

CREATE OR REPLACE FUNCTION upsert_player_fingerprint(
    p_fingerprint TEXT,
    p_components JSONB DEFAULT '{}',
    p_user_agent TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO player_fingerprints (user_id, fingerprint, components, user_agent)
    VALUES (auth.uid(), p_fingerprint, p_components, p_user_agent)
    ON CONFLICT (user_id, fingerprint) DO UPDATE SET
        last_seen_at = now(),
        visit_count = player_fingerprints.visit_count + 1,
        components = COALESCE(NULLIF(p_components::text, '{}')::jsonb, player_fingerprints.components),
        user_agent = COALESCE(p_user_agent, player_fingerprints.user_agent);
END;
$$;

-- Allow authenticated users to call the RPC
GRANT EXECUTE ON FUNCTION upsert_player_fingerprint(TEXT, JSONB, TEXT) TO authenticated;
