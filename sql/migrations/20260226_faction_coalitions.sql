-- Faction Coalitions: Public and Secret alliances between stewards in autocracy.
-- Uses canonical ordering (faction_a_id < faction_b_id) to prevent duplicate pairs,
-- matching the diplomatic_relations pattern.

CREATE TABLE IF NOT EXISTS faction_coalitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    faction_a_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    faction_b_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    coalition_type TEXT NOT NULL,  -- 'public' or 'secret'
    status TEXT NOT NULL DEFAULT 'pending',
    -- pending: request sent, awaiting response
    -- active: both parties agreed
    -- declined: target declined (or target betrayed, from proposer's POV)
    -- betrayed: target reported to strongman (internal status)
    -- dissolved: one party left
    -- detected: secret coalition discovered by strongman
    proposed_by_faction_id UUID NOT NULL REFERENCES factions(id),
    proposed_at_tick INT NOT NULL,
    resolved_at_tick INT,
    detected_at_tick INT,         -- for secret coalitions: when strongman discovered it
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_coalition_faction_order CHECK (faction_a_id < faction_b_id),
    CONSTRAINT chk_coalition_type CHECK (coalition_type IN ('public', 'secret')),
    CONSTRAINT chk_coalition_status CHECK (status IN ('pending', 'active', 'declined', 'betrayed', 'dissolved', 'detected'))
);

-- Partial unique index: only one pending or active coalition per faction pair
CREATE UNIQUE INDEX IF NOT EXISTS uq_coalition_active_pair
    ON faction_coalitions (nation_id, faction_a_id, faction_b_id)
    WHERE status IN ('pending', 'active', 'detected');

CREATE INDEX IF NOT EXISTS idx_coalitions_nation ON faction_coalitions(nation_id, status);
CREATE INDEX IF NOT EXISTS idx_coalitions_faction_a ON faction_coalitions(faction_a_id, status);
CREATE INDEX IF NOT EXISTS idx_coalitions_faction_b ON faction_coalitions(faction_b_id, status);

-- Coalition messages: simple chat between coalition partners.
-- Follows the admin_chat pattern. Visible only to the two coalition members.
CREATE TABLE IF NOT EXISTS coalition_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coalition_id UUID NOT NULL REFERENCES faction_coalitions(id) ON DELETE CASCADE,
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    tick_posted INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coalition_messages_coalition
    ON coalition_messages(coalition_id, created_at DESC);

-- RLS: permissive for now (matches existing pattern)
ALTER TABLE faction_coalitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coalition_select" ON faction_coalitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "coalition_insert" ON faction_coalitions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "coalition_update" ON faction_coalitions FOR UPDATE TO authenticated USING (true);

ALTER TABLE coalition_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coalition_messages_select" ON coalition_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "coalition_messages_insert" ON coalition_messages FOR INSERT TO authenticated WITH CHECK (true);
