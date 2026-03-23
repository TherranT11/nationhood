-- Volbal Ligue Nationale — persistent league state
-- Stores one row per shard containing full season state as JSONB.

CREATE TABLE IF NOT EXISTS vln_state (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shard_name  TEXT NOT NULL DEFAULT 'Alpha Shard' UNIQUE,
    season      INT NOT NULL DEFAULT 0,
    matchweek   INT NOT NULL DEFAULT 0,
    active      BOOLEAN NOT NULL DEFAULT FALSE,
    fixtures    JSONB NOT NULL DEFAULT '[]'::jsonb,
    standings   JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_results JSONB NOT NULL DEFAULT '[]'::jsonb,
    match_of_week JSONB,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial row for Alpha Shard
INSERT INTO vln_state (shard_name) VALUES ('Alpha Shard')
ON CONFLICT (shard_name) DO NOTHING;
