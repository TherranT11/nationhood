-- Allow authenticated users to upload IPO logos to public-assets bucket
CREATE POLICY "IPO logo upload"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'public-assets'
        AND (storage.foldername(name))[1] = 'ipo-logos'
    );

-- Allow overwriting IPO logos (for upsert)
CREATE POLICY "IPO logo update"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'public-assets'
        AND (storage.foldername(name))[1] = 'ipo-logos'
    );
