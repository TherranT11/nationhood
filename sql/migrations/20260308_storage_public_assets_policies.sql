-- Migration: Add storage policies for 'public-assets' bucket
-- Allows authenticated and anon users to upload/read player article images.
-- Safe to re-run.

-- Allow anyone to read files (public bucket)
DO $$ BEGIN
  CREATE POLICY "Public read access on public-assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'public-assets');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow authenticated and anon users to upload to player-articles folder
DO $$ BEGIN
  CREATE POLICY "Allow uploads to player-articles"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'public-assets'
      AND (storage.foldername(name))[1] = 'player-articles'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow overwriting own uploads (for upsert: true)
DO $$ BEGIN
  CREATE POLICY "Allow update in player-articles"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'public-assets'
      AND (storage.foldername(name))[1] = 'player-articles'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
