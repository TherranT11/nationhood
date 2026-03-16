-- Migration: Add storage policies for 'wiki-images' bucket
-- Allows authenticated users to upload/read/update wiki images.
-- Safe to re-run.

-- Allow anyone to read wiki images (public bucket)
DO $$ BEGIN
  CREATE POLICY "Public read access on wiki-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'wiki-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow authenticated users to upload wiki images
DO $$ BEGIN
  CREATE POLICY "Allow authenticated uploads to wiki-images"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'wiki-images'
      AND auth.role() = 'authenticated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow authenticated users to overwrite wiki images (for upsert: true)
DO $$ BEGIN
  CREATE POLICY "Allow authenticated updates on wiki-images"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'wiki-images'
      AND auth.role() = 'authenticated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
