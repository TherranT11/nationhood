-- Party Leadership: Add party whip columns to factions
-- Deputy Leader was removed in 20260316_remove_deputy_leader.sql

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS whip_first_name TEXT,
    ADD COLUMN IF NOT EXISTS whip_last_name TEXT,
    ADD COLUMN IF NOT EXISTS whip_age INTEGER;

-- RLS: These columns inherit the existing factions RLS policies.
-- Players can only update their own faction's leadership fields.
