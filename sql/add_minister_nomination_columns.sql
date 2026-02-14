-- Add missing columns for Presidential minister nomination flow.
-- Run in Supabase SQL editor.

-- bills: link confirmation bills to their ministry slot
ALTER TABLE bills ADD COLUMN IF NOT EXISTS ministry_key TEXT;

-- ministries: JSONB blob for pending nominee (used by nominateMinister)
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS pending_minister JSONB;

-- ministries: track which parties have been rejected per slot
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS rejected_parties JSONB DEFAULT '[]'::JSONB;
