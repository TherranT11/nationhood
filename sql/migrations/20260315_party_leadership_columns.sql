-- Party Leadership: Add deputy leader and party whip columns to factions
-- These columns store the deputy leader and party whip for each party,
-- mirroring the existing leader_first_name/leader_last_name/leader_age pattern.

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS deputy_first_name TEXT,
    ADD COLUMN IF NOT EXISTS deputy_last_name TEXT,
    ADD COLUMN IF NOT EXISTS deputy_age INTEGER,
    ADD COLUMN IF NOT EXISTS whip_first_name TEXT,
    ADD COLUMN IF NOT EXISTS whip_last_name TEXT,
    ADD COLUMN IF NOT EXISTS whip_age INTEGER;

-- RLS: These columns inherit the existing factions RLS policies.
-- Players can only update their own faction's leadership fields.
