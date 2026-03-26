-- ==================== CREDIBILITY LOG ====================
-- Audit trail for credibility_modifier changes, mirroring party_approval_log.

CREATE TABLE IF NOT EXISTS credibility_log (
    id          BIGSERIAL PRIMARY KEY,
    faction_id  UUID NOT NULL,
    nation_id   UUID NOT NULL,
    amount      REAL NOT NULL,
    source      TEXT NOT NULL,
    tick        INTEGER NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credibility_log_faction_nation_tick
    ON credibility_log (faction_id, nation_id, tick DESC);

-- RLS: all authenticated users can read, only service role writes
ALTER TABLE credibility_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credibility_log_select" ON credibility_log
    FOR SELECT TO authenticated USING (true);
