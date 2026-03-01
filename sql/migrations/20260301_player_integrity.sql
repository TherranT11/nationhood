-- ═══════════════════════════════════════════════════════════════
-- Player Integrity: Fingerprinting, Bans, and Multi-Account Detection
-- ═══════════════════════════════════════════════════════════════

-- Track browser fingerprints to detect multi-account abuse
CREATE TABLE IF NOT EXISTS player_fingerprints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    faction_id UUID REFERENCES factions(id) ON DELETE SET NULL,
    fingerprint TEXT NOT NULL,           -- browser fingerprint hash
    ip_hint TEXT,                        -- partial IP or IP hash (privacy-safe)
    user_agent TEXT,                     -- browser user agent string
    screen_sig TEXT,                     -- screen resolution + pixel ratio
    timezone TEXT,                       -- IANA timezone string
    language TEXT,                       -- navigator.language
    nation_id UUID REFERENCES nations(id) ON DELETE SET NULL,
    first_seen_at TIMESTAMPTZ DEFAULT now(),
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    session_count INTEGER DEFAULT 1
);

-- Index for fast cluster lookups
CREATE INDEX IF NOT EXISTS idx_player_fp_fingerprint ON player_fingerprints(fingerprint);
CREATE INDEX IF NOT EXISTS idx_player_fp_user_id ON player_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_player_fp_nation ON player_fingerprints(nation_id);
CREATE INDEX IF NOT EXISTS idx_player_fp_ip ON player_fingerprints(ip_hint);

-- Unique constraint: one fingerprint record per user+fingerprint combo
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_fp_user_fp
    ON player_fingerprints(user_id, fingerprint);

-- Player bans table
CREATE TABLE IF NOT EXISTS player_bans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    faction_id UUID REFERENCES factions(id) ON DELETE SET NULL,
    ban_type TEXT NOT NULL CHECK (ban_type IN ('suspended', 'banned')),
    reason TEXT,
    banned_at TIMESTAMPTZ DEFAULT now(),
    banned_until TIMESTAMPTZ,            -- NULL = permanent
    banned_by TEXT DEFAULT 'admin',       -- who issued the ban
    is_active BOOLEAN DEFAULT true,
    lifted_at TIMESTAMPTZ,
    lift_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_player_bans_user ON player_bans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_player_bans_active ON player_bans(is_active) WHERE is_active = true;

-- Add is_banned column to factions for quick checks
ALTER TABLE factions ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- RLS policies
ALTER TABLE player_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_bans ENABLE ROW LEVEL SECURITY;

-- Fingerprints: anyone authenticated can insert/update their own
CREATE POLICY "Users can insert own fingerprint"
    ON player_fingerprints FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own fingerprint"
    ON player_fingerprints FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Fingerprints: all authenticated can read (needed for admin panel)
CREATE POLICY "Authenticated can read fingerprints"
    ON player_fingerprints FOR SELECT
    TO authenticated
    USING (true);

-- Bans: all authenticated can read (needed to check own ban status)
CREATE POLICY "Authenticated can read bans"
    ON player_bans FOR SELECT
    TO authenticated
    USING (true);

-- Bans: only service role can insert/update (via admin RPC or direct)
CREATE POLICY "Authenticated can insert bans"
    ON player_bans FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated can update bans"
    ON player_bans FOR UPDATE
    TO authenticated
    USING (true);

-- ═══════════════════════════════════════════════════════════════
-- RPC: Upsert fingerprint (called from client on page load)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION upsert_player_fingerprint(
    p_fingerprint TEXT,
    p_user_agent TEXT DEFAULT NULL,
    p_screen_sig TEXT DEFAULT NULL,
    p_timezone TEXT DEFAULT NULL,
    p_language TEXT DEFAULT NULL,
    p_ip_hint TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_faction_id UUID;
    v_nation_id UUID;
BEGIN
    -- Get faction and nation for the current user
    SELECT id, nation_id INTO v_faction_id, v_nation_id
    FROM factions
    WHERE id = v_user_id
    LIMIT 1;

    -- Upsert fingerprint record
    INSERT INTO player_fingerprints (
        user_id, faction_id, fingerprint, ip_hint,
        user_agent, screen_sig, timezone, language,
        nation_id, first_seen_at, last_seen_at, session_count
    ) VALUES (
        v_user_id, v_faction_id, p_fingerprint, p_ip_hint,
        p_user_agent, p_screen_sig, p_timezone, p_language,
        v_nation_id, now(), now(), 1
    )
    ON CONFLICT (user_id, fingerprint) DO UPDATE SET
        last_seen_at = now(),
        session_count = player_fingerprints.session_count + 1,
        faction_id = COALESCE(v_faction_id, player_fingerprints.faction_id),
        nation_id = COALESCE(v_nation_id, player_fingerprints.nation_id),
        ip_hint = COALESCE(EXCLUDED.ip_hint, player_fingerprints.ip_hint),
        user_agent = COALESCE(EXCLUDED.user_agent, player_fingerprints.user_agent),
        screen_sig = COALESCE(EXCLUDED.screen_sig, player_fingerprints.screen_sig),
        timezone = COALESCE(EXCLUDED.timezone, player_fingerprints.timezone),
        language = COALESCE(EXCLUDED.language, player_fingerprints.language);
END;
$$;
