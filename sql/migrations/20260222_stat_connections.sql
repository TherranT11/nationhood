-- Stat Connections: threshold-triggered stat-to-stat ripple effects.
-- When a source stat crosses a threshold, the target stat is nudged each tick.

CREATE TABLE IF NOT EXISTS stat_connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_stat     TEXT NOT NULL,
    source_dir      TEXT NOT NULL CHECK (source_dir IN ('above', 'below')),
    threshold       NUMERIC NOT NULL,
    target_stat     TEXT NOT NULL,
    target_dir      TEXT NOT NULL CHECK (target_dir IN ('up', 'down')),
    magnitude       NUMERIC NOT NULL DEFAULT 0.1,
    delay_ticks     INT NOT NULL DEFAULT 0,
    dampening       BOOLEAN NOT NULL DEFAULT true,
    category        TEXT NOT NULL DEFAULT 'economic',
    enabled         BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for tick-time query: only enabled connections
CREATE INDEX IF NOT EXISTS idx_stat_connections_enabled
    ON stat_connections (enabled) WHERE enabled = true;

-- RLS — admin-only writes, public reads
ALTER TABLE stat_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stat_connections_select" ON stat_connections;
CREATE POLICY "stat_connections_select" ON stat_connections
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "stat_connections_insert" ON stat_connections;
CREATE POLICY "stat_connections_insert" ON stat_connections
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "stat_connections_update" ON stat_connections;
CREATE POLICY "stat_connections_update" ON stat_connections
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "stat_connections_delete" ON stat_connections;
CREATE POLICY "stat_connections_delete" ON stat_connections
    FOR DELETE USING (true);
