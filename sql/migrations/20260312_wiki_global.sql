-- Make wiki global: all authenticated users can read/write all wiki pages
-- (not scoped to a single nation)

-- Drop old nation-scoped RLS policies
DROP POLICY IF EXISTS wiki_pages_select ON wiki_pages;
DROP POLICY IF EXISTS wiki_pages_insert ON wiki_pages;
DROP POLICY IF EXISTS wiki_pages_update ON wiki_pages;
DROP POLICY IF EXISTS wiki_pages_delete ON wiki_pages;

-- New global RLS policies: any authenticated user can CRUD wiki pages
CREATE POLICY wiki_pages_select ON wiki_pages
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY wiki_pages_insert ON wiki_pages
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY wiki_pages_update ON wiki_pages
    FOR UPDATE TO authenticated
    USING (true);

CREATE POLICY wiki_pages_delete ON wiki_pages
    FOR DELETE TO authenticated
    USING (true);

-- Change unique constraint from (nation_id, slug) to just (slug)
-- since slugs are now globally unique
ALTER TABLE wiki_pages DROP CONSTRAINT IF EXISTS wiki_pages_nation_id_slug_key;
ALTER TABLE wiki_pages ADD CONSTRAINT wiki_pages_slug_key UNIQUE (slug);
