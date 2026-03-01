-- Add ideology_drift column to faction_bloc_approval
-- Tracks the per-tick ideology decay applied to preference_score
-- for blocs where the faction has low ideological alignment.
ALTER TABLE faction_bloc_approval
ADD COLUMN IF NOT EXISTS ideology_drift NUMERIC(6,2) DEFAULT 0;
