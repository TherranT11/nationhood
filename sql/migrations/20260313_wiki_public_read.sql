-- Allow anonymous (unauthenticated) users to read wiki pages and faction names.
-- This enables the public wiki at /wiki without requiring login.

-- Anonymous SELECT on wiki_pages
DO $$ BEGIN
  CREATE POLICY wiki_pages_anon_select ON wiki_pages
    FOR SELECT TO anon
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Anonymous SELECT on factions (for attribution — "Created by ...")
DO $$ BEGIN
  CREATE POLICY factions_anon_select ON factions
    FOR SELECT TO anon
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
