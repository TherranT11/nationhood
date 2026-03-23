-- Education Ministry: Curriculum drift tracking
-- Each row is one Standardised Curriculum activation.
-- Drift is delayed 160 ticks, then applies +0.2/tick for 12 ticks.

CREATE TABLE IF NOT EXISTS curriculum_drift (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    faction_id      UUID NOT NULL,
    axis            TEXT NOT NULL,       -- e.g. 'individualism_collectivism'
    direction       INT NOT NULL,        -- +1 or -1
    direction_label TEXT NOT NULL,       -- e.g. 'Collectivism'
    set_at_tick     INT NOT NULL,        -- tick when curriculum was confirmed
    activates_at_tick INT NOT NULL,      -- set_at_tick + 160
    drift_ticks_remaining INT NOT NULL DEFAULT 12,
    drift_per_tick  NUMERIC(4,2) NOT NULL DEFAULT 0.2,
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_drift_active
ON curriculum_drift (nation_id)
WHERE completed = false;

-- Nation-level ideological centre — stores cumulative drift per axis.
-- This is what curriculum drift modifies over time.
-- If this column doesn't exist on nations yet, we add it as JSONB.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'nations' AND column_name = 'ideological_centre'
    ) THEN
        ALTER TABLE nations ADD COLUMN ideological_centre JSONB NOT NULL DEFAULT '{
            "individualism_collectivism": 0,
            "tradition_progress": 0,
            "liberty_equality": 0,
            "freedom_security": 0,
            "globalism_nationalism": 0
        }'::jsonb;
    END IF;
END
$$;
