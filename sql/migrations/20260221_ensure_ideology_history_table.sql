-- Ensure ideology_history table exists for tracking per-tick ideology snapshots.
-- Each tick, all faction_ideology rows are snapshotted here so the parties page
-- can compute "Changes last tick" deltas.
-- Safe to re-run (uses IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS ideology_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    tick INTEGER NOT NULL,
    liberty_equality NUMERIC DEFAULT 0,
    tradition_progress NUMERIC DEFAULT 0,
    security_freedom NUMERIC DEFAULT 0,
    globalism_nationalism NUMERIC DEFAULT 0,
    individualism_collectivism NUMERIC DEFAULT 0,
    UNIQUE(faction_id, tick)
);
