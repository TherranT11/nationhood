-- ============================================================
-- Voter Bloc Approval System — Phase 1 Schema
-- ============================================================
-- Adds per-bloc ideology scores, population weights, and
-- priority issues to voter_blocs. Creates faction_bloc_approval
-- table for per-party, per-bloc approval ratings.
-- ============================================================

-- 1. Extend voter_blocs with new columns
ALTER TABLE voter_blocs ADD COLUMN IF NOT EXISTS population_weight NUMERIC(5,2) DEFAULT 0;

-- Ideology scores on each axis (0–100 scale, 50 = neutral)
-- 0 = full Pole A, 100 = full Pole B
ALTER TABLE voter_blocs ADD COLUMN IF NOT EXISTS axis_liberty_equality INTEGER DEFAULT 50;
ALTER TABLE voter_blocs ADD COLUMN IF NOT EXISTS axis_tradition_progress INTEGER DEFAULT 50;
ALTER TABLE voter_blocs ADD COLUMN IF NOT EXISTS axis_security_freedom INTEGER DEFAULT 50;
ALTER TABLE voter_blocs ADD COLUMN IF NOT EXISTS axis_globalism_nationalism INTEGER DEFAULT 50;
ALTER TABLE voter_blocs ADD COLUMN IF NOT EXISTS axis_individualism_collectivism INTEGER DEFAULT 50;

-- Priority issues — 1-2 stat categories this bloc cares about most
ALTER TABLE voter_blocs ADD COLUMN IF NOT EXISTS priority_issues JSONB DEFAULT '[]'::JSONB;

-- 2. Create faction_bloc_approval table
CREATE TABLE IF NOT EXISTS faction_bloc_approval (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    bloc_id UUID NOT NULL REFERENCES voter_blocs(id) ON DELETE CASCADE,
    approval INTEGER NOT NULL DEFAULT 40 CHECK (approval >= 0 AND approval <= 100),
    last_platform JSONB,
    platform_tick INTEGER,
    UNIQUE(faction_id, bloc_id)
);

CREATE INDEX IF NOT EXISTS idx_fba_faction ON faction_bloc_approval(faction_id);
CREATE INDEX IF NOT EXISTS idx_fba_bloc ON faction_bloc_approval(bloc_id);
