-- Migration flows table: tracks actual movement of people between nations per tick.
-- Each row represents one category of migration from one nation to another in a single tick.

CREATE TABLE IF NOT EXISTS migration_flows (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tick            INT NOT NULL,
    origin_nation_id UUID NOT NULL REFERENCES nations(id),
    dest_nation_id   UUID NOT NULL REFERENCES nations(id),
    category        TEXT NOT NULL CHECK (category IN ('legal', 'illegal', 'academic')),
    flow_count      INT NOT NULL DEFAULT 0,       -- number of people in this flow
    pull_score      NUMERIC(8,3) DEFAULT 0,       -- destination's pull score relative to origin
    reasons         JSONB DEFAULT '[]'::jsonb,     -- top push/pull reasons for UI display
    created_at      TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT migration_flows_no_self CHECK (origin_nation_id != dest_nation_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_migration_flows_tick ON migration_flows(tick);
CREATE INDEX IF NOT EXISTS idx_migration_flows_dest ON migration_flows(dest_nation_id, tick);
CREATE INDEX IF NOT EXISTS idx_migration_flows_origin ON migration_flows(origin_nation_id, tick);

-- Only keep last 24 ticks of migration data (2 years game time) to prevent bloat.
-- Old data can be cleaned up by a scheduled job or at tick time.

-- RLS: anyone can read migration flows (public data)
ALTER TABLE migration_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY migration_flows_read ON migration_flows FOR SELECT USING (true);
