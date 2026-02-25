-- Regime Pillars: the six institutional pillars of an autocratic state.
-- Each pillar has a support value (0-100) that decays each tick and can be
-- boosted when the strongman satisfies that pillar's wants.
-- The average of all pillar support values = Grip on Power.

CREATE TABLE IF NOT EXISTS regime_pillars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    pillar_key TEXT NOT NULL,            -- e.g. 'military', 'security', 'party', 'oligarchs', 'bureaucracy', 'media'
    pillar_name TEXT NOT NULL,           -- display name
    support INTEGER NOT NULL DEFAULT 70, -- 0-100
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(nation_id, pillar_key)
);

CREATE INDEX IF NOT EXISTS idx_regime_pillars_nation ON regime_pillars(nation_id);

-- RLS
ALTER TABLE regime_pillars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regime_pillars_select" ON regime_pillars FOR SELECT USING (true);
CREATE POLICY "regime_pillars_update" ON regime_pillars FOR UPDATE USING (true);
CREATE POLICY "regime_pillars_insert" ON regime_pillars FOR INSERT WITH CHECK (true);
CREATE POLICY "regime_pillars_delete" ON regime_pillars FOR DELETE USING (true);

-- Seed pillars for all existing autocracy nations that don't already have them.
-- Each pillar starts with a random support value between 55 and 85.
INSERT INTO regime_pillars (nation_id, pillar_key, pillar_name, support)
SELECT n.id, p.pillar_key, p.pillar_name,
       55 + floor(random() * 31)::int  -- random 55-85
FROM nations n
CROSS JOIN (VALUES
    ('military',    'The Military'),
    ('security',    'Security Services'),
    ('party',       'The Party'),
    ('oligarchs',   'Oligarchs'),
    ('bureaucracy', 'Bureaucracy'),
    ('media',       'State Media')
) AS p(pillar_key, pillar_name)
WHERE n.government_type ILIKE '%autocra%'
   OR n.government_type ILIKE '%authoritarian%'
   OR n.government_type ILIKE '%dictat%'
   OR n.government_type ILIKE '%junta%'
ON CONFLICT (nation_id, pillar_key) DO NOTHING;
