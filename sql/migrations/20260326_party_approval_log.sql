-- Party-level approval change log.
-- Every nudgeApproval() call writes here so players can see
-- exactly what moved their party approval and when.

CREATE TABLE IF NOT EXISTS party_approval_log (
    id          BIGSERIAL PRIMARY KEY,
    faction_id  UUID NOT NULL,
    nation_id   UUID NOT NULL,
    amount      REAL NOT NULL,
    source      TEXT NOT NULL,
    tick        INTEGER NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_party_approval_log_faction_tick
    ON party_approval_log(faction_id, nation_id, tick);

-- RLS: anyone can read (public data), only service role writes
ALTER TABLE party_approval_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "party_approval_log_select"
    ON party_approval_log FOR SELECT TO authenticated
    USING (true);
