-- Add custom_logo_url column to factions table for uploaded party logos
-- and rebrand_cooldown_until_tick for the 120-tick rebrand cooldown

ALTER TABLE factions ADD COLUMN IF NOT EXISTS custom_logo_url text;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS rebrand_cooldown_until_tick integer;

-- Create storage bucket for party logos (2MB max, public access for display)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'party-logos',
    'party-logos',
    true,
    2097152, -- 2MB
    ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload to their faction's folder
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
