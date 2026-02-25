-- Stewards: non-ruling faction leaders in autocracies.
-- Each steward is tied to a pillar (via pillar_key) and has a generated identity
-- plus private stats that evolve each tick (Standing, Power Base, True Loyalty, Coup Readiness).
-- One steward per faction, one faction per pillar.

CREATE TABLE IF NOT EXISTS stewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    pillar_key TEXT NOT NULL,              -- e.g. 'military', 'security', 'party', 'oligarchs', 'bureaucracy', 'media'
    steward_type TEXT NOT NULL,            -- 'technocrat','general','party_chairman','oligarch','security_chief','propaganda_chief'
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    standing INTEGER NOT NULL DEFAULT 40,  -- 0-100: political influence within the regime
    power_base INTEGER NOT NULL DEFAULT 30, -- 0-100: institutional support and resources
    true_loyalty INTEGER NOT NULL DEFAULT 50, -- 0-100: actual loyalty to the strongman (hidden from strongman)
    coup_readiness INTEGER NOT NULL DEFAULT 0, -- 0-100: preparedness to seize power
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(nation_id, faction_id)
);

CREATE INDEX IF NOT EXISTS idx_stewards_nation ON stewards(nation_id);
CREATE INDEX IF NOT EXISTS idx_stewards_faction ON stewards(faction_id);

-- RLS (open like other game tables)
ALTER TABLE stewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stewards_select" ON stewards FOR SELECT USING (true);
CREATE POLICY "stewards_insert" ON stewards FOR INSERT WITH CHECK (true);
CREATE POLICY "stewards_update" ON stewards FOR UPDATE USING (true);
CREATE POLICY "stewards_delete" ON stewards FOR DELETE USING (true);
