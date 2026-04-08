-- Add subsector column to corp_properties so subsidiaries can have their own specialization
-- This enables corps to bid on contracts outside their parent subsector via subsidiaries
ALTER TABLE corp_properties ADD COLUMN IF NOT EXISTS subsector TEXT DEFAULT NULL;
