-- Add previous-tick standing columns for delta arrows on the Voters tab
-- These are written by tickElectorate() each tick before updating to new values

ALTER TABLE faction_electoral_standing
    ADD COLUMN IF NOT EXISTS prev_ideological_alignment NUMERIC,
    ADD COLUMN IF NOT EXISTS prev_platform_appeal NUMERIC,
    ADD COLUMN IF NOT EXISTS prev_party_approval NUMERIC,
    ADD COLUMN IF NOT EXISTS prev_visibility NUMERIC,
    ADD COLUMN IF NOT EXISTS prev_credibility_modifier NUMERIC;
