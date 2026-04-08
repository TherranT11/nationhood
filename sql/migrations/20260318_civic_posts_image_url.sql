-- Add image_url column to civic_posts for optional image attachments.
-- Stores a public Supabase Storage URL (public-assets bucket, civic/ folder).

ALTER TABLE civic_posts ADD COLUMN IF NOT EXISTS image_url text;

-- Storage policy: allow authenticated users to upload to civic/ folder
DO $$ BEGIN
  CREATE POLICY "Allow authenticated uploads to civic"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'public-assets'
      AND (storage.foldername(name))[1] = 'civic'
      AND auth.role() = 'authenticated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Storage policy: allow overwriting own uploads in civic/ folder (for upsert)
DO $$ BEGIN
  CREATE POLICY "Allow authenticated updates in civic"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'public-assets'
      AND (storage.foldername(name))[1] = 'civic'
      AND auth.role() = 'authenticated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
