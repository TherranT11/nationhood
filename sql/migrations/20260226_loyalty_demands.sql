-- Loyalty Demands: Strongman can demand loyalty from subordinate factions.
-- Target must Comply or Refuse within 2 ticks, or it auto-expires as Refuse.

CREATE TABLE IF NOT EXISTS loyalty_demands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    strongman_faction_id UUID NOT NULL,
    target_faction_id UUID NOT NULL,
    demanded_at_tick INT NOT NULL,
    deadline_tick INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    resolved_at_tick INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_demands_nation ON loyalty_demands(nation_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_demands_target ON loyalty_demands(target_faction_id, status);

ALTER TABLE loyalty_demands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loyalty_demands_select" ON loyalty_demands FOR SELECT USING (true);
CREATE POLICY "loyalty_demands_insert" ON loyalty_demands FOR INSERT WITH CHECK (true);
CREATE POLICY "loyalty_demands_update" ON loyalty_demands FOR UPDATE USING (true);
