-- ==================== CUSTOM LOGO URL ====================
-- Adds a column to store a URL for user-uploaded custom party logos
-- (stored in Supabase Storage 'public-assets' bucket).
-- When set, this takes priority over the icon-based party_logo field.

ALTER TABLE factions ADD COLUMN IF NOT EXISTS custom_logo_url TEXT;
