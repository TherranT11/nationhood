-- Create ideology_history table for tracking faction ideology shifts over time.
-- Each row is a snapshot of a faction's ideology scores at a given tick,
-- recorded whenever processIdeologyShifts applies changes.

CREATE TABLE IF NOT EXISTS ideology_history (
    id              BIGSERIAL PRIMARY KEY,
    faction_id      UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id       UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    tick            INTEGER NOT NULL,
    liberty_equality        INTEGER NOT NULL DEFAULT 0,
    tradition_progress      INTEGER NOT NULL DEFAULT 0,
    security_freedom        INTEGER NOT NULL DEFAULT 0,
    globalism_nationalism   INTEGER NOT NULL DEFAULT 0,
    individualism_collectivism INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient lookups by faction over time
CREATE INDEX IF NOT EXISTS idx_ideology_history_faction_tick
    ON ideology_history (faction_id, tick);

-- Index for nation-wide queries (e.g., all parties' history for a nation)
CREATE INDEX IF NOT EXISTS idx_ideology_history_nation_tick
    ON ideology_history (nation_id, tick);

-- RLS: allow authenticated users to read, server (service_role) to write
ALTER TABLE ideology_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "ideology_history_select"
    ON ideology_history FOR SELECT
    USING (true);

CREATE POLICY IF NOT EXISTS "ideology_history_insert"
    ON ideology_history FOR INSERT
    WITH CHECK (true);
