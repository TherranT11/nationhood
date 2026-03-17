-- Allow all authenticated users to read all civic_posts (cross-nation visibility)
-- and allow post authors to delete their own posts.

-- 1. Drop the nation-scoped read policy
DROP POLICY IF EXISTS civic_posts_read ON civic_posts;

-- 2. Create a permissive global read policy for all authenticated users
CREATE POLICY civic_posts_read ON civic_posts FOR SELECT
    USING (true);

-- 3. Allow post authors to delete their own posts (faction_id = auth.uid())
CREATE POLICY civic_posts_delete ON civic_posts FOR DELETE
    USING (faction_id = auth.uid());

-- 4. Also open up civic_comments reads globally (they reference civic_posts)
DROP POLICY IF EXISTS civic_comments_read ON civic_comments;
CREATE POLICY civic_comments_read ON civic_comments FOR SELECT
    USING (true);

-- 5. Update the body length constraint to 400 characters
ALTER TABLE civic_posts DROP CONSTRAINT IF EXISTS civic_posts_body_check;
ALTER TABLE civic_posts ADD CONSTRAINT civic_posts_body_check CHECK (char_length(body) <= 400);

ALTER TABLE civic_comments DROP CONSTRAINT IF EXISTS civic_comments_body_check;
ALTER TABLE civic_comments ADD CONSTRAINT civic_comments_body_check CHECK (char_length(body) <= 400);
