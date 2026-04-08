-- Add momentum column to factions for the 3-pillar election system.
-- Momentum: 0-100, decays 8%/tick, resets to 0 after elections.
-- Replaces the old party_approval system on faction_electoral_standing.

ALTER TABLE factions
ADD COLUMN IF NOT EXISTS momentum NUMERIC DEFAULT 0;

-- Ensure momentum is clamped between 0 and 100
ALTER TABLE factions
ADD CONSTRAINT factions_momentum_range CHECK (momentum >= 0 AND momentum <= 100);

COMMENT ON COLUMN factions.momentum IS '3-pillar election system: campaign energy score (0-100). Decays 8%/tick. Resets to 0 after elections.';
