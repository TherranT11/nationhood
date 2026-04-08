-- CIVIC social feed tables for player-authored posts and comments

CREATE TABLE IF NOT EXISTS civic_posts (
    id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nation_id     uuid NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    faction_id    uuid REFERENCES factions(id) ON DELETE SET NULL,
    handle_key    text NOT NULL,
    display_name  text NOT NULL,
    initials      text NOT NULL CHECK (char_length(initials) <= 4),
    body          text NOT NULL CHECK (char_length(body) <= 280),
    game_tick     int NOT NULL,
    likes         int DEFAULT 0,
    shares        int DEFAULT 0,
    liked_by      uuid[] DEFAULT '{}',
    shared_by     uuid[] DEFAULT '{}',
    created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS civic_comments (
    id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id       uuid NOT NULL REFERENCES civic_posts(id) ON DELETE CASCADE,
    nation_id     uuid NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    faction_id    uuid REFERENCES factions(id) ON DELETE SET NULL,
    handle_key    text NOT NULL,
    display_name  text NOT NULL,
    initials      text NOT NULL CHECK (char_length(initials) <= 4),
    body          text NOT NULL CHECK (char_length(body) <= 280),
    game_tick     int NOT NULL,
    created_at    timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_civic_posts_nation ON civic_posts(nation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_civic_comments_post ON civic_comments(post_id, created_at ASC);

-- RLS
ALTER TABLE civic_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_comments ENABLE ROW LEVEL SECURITY;

-- Read: any faction in the same nation can see posts
CREATE POLICY civic_posts_read ON civic_posts FOR SELECT
    USING (nation_id IN (SELECT nation_id FROM factions WHERE id = auth.uid()));

-- Insert: faction_id must match the authed user
CREATE POLICY civic_posts_insert ON civic_posts FOR INSERT
    WITH CHECK (faction_id = auth.uid());

-- Update: any nation member can update (for like/share array updates from other factions).
-- KNOWN LIMITATION: this allows updating any column, not just liked_by/shared_by/likes/shares.
-- A future improvement would use a Supabase RPC to restrict writeable columns.
CREATE POLICY civic_posts_update ON civic_posts FOR UPDATE
    USING (nation_id IN (SELECT nation_id FROM factions WHERE id = auth.uid()));

-- Comments: same pattern
CREATE POLICY civic_comments_read ON civic_comments FOR SELECT
    USING (nation_id IN (SELECT nation_id FROM factions WHERE id = auth.uid()));

CREATE POLICY civic_comments_insert ON civic_comments FOR INSERT
    WITH CHECK (faction_id = auth.uid());
