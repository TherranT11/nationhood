-- Add image_url column to civic_posts for optional image attachments.
-- Stores a public Supabase Storage URL (public-assets bucket).

ALTER TABLE civic_posts ADD COLUMN IF NOT EXISTS image_url text;
