-- ==================== WIKI PAGES TABLE ====================
-- Player-editable wiki for each nation. Pages identified by slug, unique per nation.

CREATE TABLE IF NOT EXISTS wiki_pages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       UUID NOT NULL REFERENCES nations(id),
    slug            TEXT NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT NOT NULL DEFAULT '',
    template_type   TEXT,          -- NULL, 'nation', 'person', 'corporation', 'religion', 'culture'
    template_data   JSONB DEFAULT '[]'::JSONB,   -- array of {label, value} rows for infobox
    infobox_image   TEXT,          -- Supabase Storage public URL
    created_by      UUID REFERENCES factions(id),
    updated_by      UUID REFERENCES factions(id),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(nation_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_wiki_pages_nation ON wiki_pages(nation_id);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_slug ON wiki_pages(nation_id, slug);

-- ==================== RLS POLICIES ====================
ALTER TABLE wiki_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY wiki_pages_select ON wiki_pages
    FOR SELECT TO authenticated
    USING (nation_id IN (SELECT nation_id FROM factions WHERE id = auth.uid()));

CREATE POLICY wiki_pages_insert ON wiki_pages
    FOR INSERT TO authenticated
    WITH CHECK (nation_id IN (SELECT nation_id FROM factions WHERE id = auth.uid()));

CREATE POLICY wiki_pages_update ON wiki_pages
    FOR UPDATE TO authenticated
    USING (nation_id IN (SELECT nation_id FROM factions WHERE id = auth.uid()));

CREATE POLICY wiki_pages_delete ON wiki_pages
    FOR DELETE TO authenticated
    USING (nation_id IN (SELECT nation_id FROM factions WHERE id = auth.uid()));
