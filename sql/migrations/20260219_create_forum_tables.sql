-- Forum Tables Migration
-- Creates forum_categories, forum_subcategories, forum_threads, forum_replies

-- ===== TABLES =====

CREATE TABLE IF NOT EXISTS forum_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    nation_id UUID REFERENCES nations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id UUID NOT NULL REFERENCES forum_subcategories(id) ON DELETE CASCADE,
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    tick_posted INTEGER NOT NULL,
    last_activity_tick INTEGER NOT NULL,
    reply_count INTEGER NOT NULL DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    tick_posted INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== INDEXES =====

CREATE INDEX IF NOT EXISTS idx_forum_threads_subcategory ON forum_threads(subcategory_id, last_activity_tick DESC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_thread ON forum_replies(thread_id, created_at ASC);

-- ===== SEED DATA: Categories =====

INSERT INTO forum_categories (name, description, sort_order, is_enabled) VALUES
    ('Nations', 'Discuss the politics, policies, and events of each nation. Praise, criticize, or threaten — it''s all public.', 1, TRUE),
    ('Organizations', 'Debate the merits and failures of international organizations. Lobby for membership or call for dissolution.', 2, FALSE),
    ('Conflicts', 'War declarations, peace proposals, and the fog of diplomacy. When words fail, this is where it starts.', 3, FALSE)
ON CONFLICT DO NOTHING;

-- ===== SEED DATA: Subcategories (one per nation under Nations) =====

INSERT INTO forum_subcategories (category_id, nation_id, name, description, sort_order, is_enabled)
SELECT
    c.id,
    n.id,
    n.name,
    '',
    ROW_NUMBER() OVER (ORDER BY n.name),
    TRUE
FROM forum_categories c
CROSS JOIN nations n
WHERE c.name = 'Nations'
  AND NOT EXISTS (
      SELECT 1 FROM forum_subcategories fs
      WHERE fs.category_id = c.id AND fs.nation_id = n.id
  );

-- ===== TRIGGER: Auto-update thread reply_count and last_activity_tick =====

CREATE OR REPLACE FUNCTION forum_update_thread_on_reply()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_threads
        SET reply_count = (SELECT COUNT(*) FROM forum_replies WHERE thread_id = NEW.thread_id),
            last_activity_tick = NEW.tick_posted,
            updated_at = NOW()
        WHERE id = NEW.thread_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_threads
        SET reply_count = (SELECT COUNT(*) FROM forum_replies WHERE thread_id = OLD.thread_id),
            updated_at = NOW()
        WHERE id = OLD.thread_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_forum_reply_count
    AFTER INSERT OR DELETE ON forum_replies
    FOR EACH ROW
    EXECUTE FUNCTION forum_update_thread_on_reply();

-- ===== RLS POLICIES =====

ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read everything
CREATE POLICY "forum_categories_select" ON forum_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "forum_subcategories_select" ON forum_subcategories FOR SELECT TO authenticated USING (true);
CREATE POLICY "forum_threads_select" ON forum_threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "forum_replies_select" ON forum_replies FOR SELECT TO authenticated USING (true);

-- Authenticated users can create threads
CREATE POLICY "forum_threads_insert" ON forum_threads FOR INSERT TO authenticated
    WITH CHECK (faction_id = auth.uid());

-- Authenticated users can update their own threads
CREATE POLICY "forum_threads_update" ON forum_threads FOR UPDATE TO authenticated
    USING (faction_id = auth.uid());

-- Authenticated users can delete their own threads (only if no replies)
CREATE POLICY "forum_threads_delete" ON forum_threads FOR DELETE TO authenticated
    USING (faction_id = auth.uid() AND reply_count = 0);

-- Authenticated users can create replies
CREATE POLICY "forum_replies_insert" ON forum_replies FOR INSERT TO authenticated
    WITH CHECK (faction_id = auth.uid());

-- Authenticated users can update their own replies
CREATE POLICY "forum_replies_update" ON forum_replies FOR UPDATE TO authenticated
    USING (faction_id = auth.uid());
