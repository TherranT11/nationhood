-- Create ideology_history table for tracking faction ideology shifts over time.
-- Each row is a snapshot of a faction's ideology scores at a given tick,
-- recorded whenever processIdeologyShifts applies changes.
--
-- Uses DROP + CREATE because an older empty version of this table may exist.

DROP TABLE IF EXISTS ideology_history CASCADE;

CREATE TABLE ideology_history (
    id              BIGSERIAL PRIMARY KEY,
    faction_id      UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id       UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    tick            INTEGER NOT NULL,
    liberty_equality        NUMERIC NOT NULL DEFAULT 0,
    tradition_progress      NUMERIC NOT NULL DEFAULT 0,
    security_freedom        NUMERIC NOT NULL DEFAULT 0,
    globalism_nationalism   NUMERIC NOT NULL DEFAULT 0,
    individualism_collectivism NUMERIC NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient lookups by faction over time
CREATE INDEX idx_ideology_history_faction_tick
    ON ideology_history (faction_id, tick);

-- Index for nation-wide queries (e.g., all parties' history for a nation)
CREATE INDEX idx_ideology_history_nation_tick
    ON ideology_history (nation_id, tick);

-- RLS: allow authenticated users to read, server (service_role) to write
ALTER TABLE ideology_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ideology_history_select"
    ON ideology_history FOR SELECT
    USING (true);

CREATE POLICY "ideology_history_insert"
    ON ideology_history FOR INSERT
    WITH CHECK (true);
