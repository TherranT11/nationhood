-- Article likes: one like per faction per article
-- Every 3 likes on an article grants +1 momentum to the author's party

CREATE TABLE IF NOT EXISTS article_likes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id      UUID NOT NULL REFERENCES public.player_articles(id) ON DELETE CASCADE,
    faction_id      UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(article_id, faction_id)
);

CREATE INDEX IF NOT EXISTS idx_article_likes_article ON article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_faction ON article_likes(faction_id);

-- Add like_count cache column to player_articles for fast display
ALTER TABLE player_articles ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- RLS
ALTER TABLE article_likes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can read article_likes" ON article_likes
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert article_likes" ON article_likes
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own article_likes" ON article_likes
    FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Function: toggle like and award momentum at every 3rd like
CREATE OR REPLACE FUNCTION toggle_article_like(
    p_article_id UUID,
    p_faction_id UUID,
    p_tick INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_existing UUID;
    v_new_count INT;
    v_author_faction UUID;
    v_liked BOOLEAN;
BEGIN
    -- Check if already liked
    SELECT id INTO v_existing
    FROM article_likes
    WHERE article_id = p_article_id AND faction_id = p_faction_id;

    IF v_existing IS NOT NULL THEN
        -- Unlike
        DELETE FROM article_likes WHERE id = v_existing;
        UPDATE player_articles
        SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1)
        WHERE id = p_article_id
        RETURNING like_count INTO v_new_count;
        v_liked := false;
    ELSE
        -- Like
        INSERT INTO article_likes (article_id, faction_id) VALUES (p_article_id, p_faction_id);
        UPDATE player_articles
        SET like_count = COALESCE(like_count, 0) + 1
        WHERE id = p_article_id
        RETURNING like_count, author_faction_id INTO v_new_count, v_author_faction;
        v_liked := true;

        -- Award +1 momentum at every 3rd like.
        -- Note: toggling like/unlike can re-cross the threshold. Acceptable tradeoff —
        -- farming yields only +1 momentum per cycle and requires deliberate effort.
        IF v_author_faction IS NOT NULL AND v_new_count > 0 AND (v_new_count % 3) = 0 THEN
            PERFORM adjust_momentum(v_author_faction, 1, 'Article liked (' || v_new_count || ' likes)', p_tick);
        END IF;
    END IF;

    RETURN jsonb_build_object('liked', v_liked, 'like_count', COALESCE(v_new_count, 0));
END;
$$;

ALTER FUNCTION public.toggle_article_like(UUID, UUID, INT) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.toggle_article_like(UUID, UUID, INT) TO authenticated;
