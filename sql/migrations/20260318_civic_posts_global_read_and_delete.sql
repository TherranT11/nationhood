-- Allow all authenticated users to read all civic_posts (cross-nation visibility),
-- allow post authors to delete their own posts, and update body limit to 400.

-- 1. Drop the nation-scoped read policy
DROP POLICY IF EXISTS civic_posts_read ON civic_posts;

-- 2. Create a permissive global read policy for all authenticated users
CREATE POLICY civic_posts_read ON civic_posts FOR SELECT
    USING (true);

-- 3. Allow post authors to delete their own posts (faction_id = auth.uid())
CREATE POLICY civic_posts_delete ON civic_posts FOR DELETE
    USING (faction_id = auth.uid());

-- 4. Broaden UPDATE policy to allow cross-nation likes/shares
--    (reads are now global, so players from other nations can see and interact with posts)
DROP POLICY IF EXISTS civic_posts_update ON civic_posts;
CREATE POLICY civic_posts_update ON civic_posts FOR UPDATE
    USING (true);

-- 5. Also open up civic_comments reads globally (they reference civic_posts)
DROP POLICY IF EXISTS civic_comments_read ON civic_comments;
CREATE POLICY civic_comments_read ON civic_comments FOR SELECT
    USING (true);

-- 6. Update the body length constraint to 400 characters.
--    Inline CHECK constraints get auto-generated names that may vary;
--    dynamically drop ALL check constraints on the body column to be safe.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid
            AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'civic_posts'::regclass
            AND con.contype = 'c'
            AND att.attname = 'body'
    LOOP
        EXECUTE format('ALTER TABLE civic_posts DROP CONSTRAINT %I', r.conname);
    END LOOP;

    FOR r IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid
            AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'civic_comments'::regclass
            AND con.contype = 'c'
            AND att.attname = 'body'
    LOOP
        EXECUTE format('ALTER TABLE civic_comments DROP CONSTRAINT %I', r.conname);
    END LOOP;
END $$;

ALTER TABLE civic_posts ADD CONSTRAINT civic_posts_body_check CHECK (char_length(body) <= 400);
ALTER TABLE civic_comments ADD CONSTRAINT civic_comments_body_check CHECK (char_length(body) <= 400);
