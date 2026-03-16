-- Store leader's personal ideology and traits on the faction,
-- so the main politics page and Party Leadership tab show consistent data.

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS leader_ideology TEXT,
    ADD COLUMN IF NOT EXISTS leader_positive_traits JSONB DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS leader_negative_traits JSONB DEFAULT '[]'::JSONB;

-- Table to persist generated leadership candidates so they don't regenerate on every page load.
CREATE TABLE IF NOT EXISTS leadership_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('leader', 'deputy', 'whip')),
    candidates JSONB NOT NULL DEFAULT '[]'::JSONB,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (faction_id, role)
);

-- RLS: players can read/write their own faction's candidates
ALTER TABLE leadership_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY leadership_candidates_select ON leadership_candidates
    FOR SELECT USING (true);

CREATE POLICY leadership_candidates_insert ON leadership_candidates
    FOR INSERT WITH CHECK (true);

CREATE POLICY leadership_candidates_update ON leadership_candidates
    FOR UPDATE USING (true);

CREATE POLICY leadership_candidates_delete ON leadership_candidates
    FOR DELETE USING (true);
