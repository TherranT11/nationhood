-- Add steward_faction_id column to regime_pillars if it doesn't exist.
-- A steward is a non-ruling faction that has claimed responsibility for a pillar.
ALTER TABLE regime_pillars
    ADD COLUMN IF NOT EXISTS steward_faction_id UUID REFERENCES factions(id) ON DELETE SET NULL;
