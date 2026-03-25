-- Add optional custom logo image URL to international_orgs
ALTER TABLE international_orgs
    ADD COLUMN IF NOT EXISTS logo_image_url TEXT;

-- Remove the strict symbol constraint so orgs with custom images
-- can still have a fallback symbol
-- (constraint already allows the 6 known symbols; no change needed there)
