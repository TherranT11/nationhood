-- Re-apply storage bucket + RLS policies for party-logos.
--
-- The Modernize Image action uploads to the `party-logos` storage bucket and
-- saves the public URL to factions.custom_logo_url. Users are hitting
-- "new row violates row-level security policy" on upload, which means either
-- the bucket was never created or the INSERT policy wasn't installed in
-- this environment. This script is idempotent — re-run at any time.

-- Ensure the bucket exists with the expected quota + MIME whitelist.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'party-logos',
    'party-logos',
    true,
    2097152, -- 2MB
    ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop and recreate the three storage.objects policies so we know the
-- canonical versions are in place. Dropping an absent policy is a no-op
-- with IF EXISTS, so re-running is safe.
DROP POLICY IF EXISTS "Users can upload party logos"      ON storage.objects;
DROP POLICY IF EXISTS "Users can update their party logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view party logos"        ON storage.objects;

CREATE POLICY "Users can upload party logos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'party-logos');

CREATE POLICY "Users can update their party logos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'party-logos');

CREATE POLICY "Anyone can view party logos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'party-logos');

-- Verify the bucket + policies are live.
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'party-logos';
SELECT policyname, cmd, roles
  FROM pg_policies
 WHERE schemaname = 'storage'
   AND tablename  = 'objects'
   AND policyname IN (
       'Users can upload party logos',
       'Users can update their party logos',
       'Anyone can view party logos'
   )
 ORDER BY policyname;
