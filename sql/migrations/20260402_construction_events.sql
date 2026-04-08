-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: Construction Project Events
-- Date: 2026-04-02
--
-- Random events that fire on in_progress construction projects.
-- Players must respond; unresolved events apply inaction penalties.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS construction_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id         UUID NOT NULL REFERENCES construction_contracts(id) ON DELETE CASCADE,
    faction_id          UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id           UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,

    -- Event identity
    event_key           TEXT NOT NULL,           -- template key, e.g. 'heavy_rainfall'
    type                TEXT NOT NULL,           -- WEATHER, SUPPLY, LABOR, REGULATORY, EQUIPMENT
    severity            TEXT NOT NULL,           -- LOW, MODERATE, HIGH, CRITICAL
    title               TEXT NOT NULL,
    description         TEXT NOT NULL,
    impact              TEXT NOT NULL,           -- human-readable impact summary

    -- Response options (JSONB array)
    -- [{ key, label, tag, detail, cost, delay, qualityImpact }]
    responses           JSONB NOT NULL DEFAULT '[]',

    -- Lifecycle
    status              TEXT NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, RESOLVED, EXPIRED
    chosen_response     TEXT,                    -- key of the response the player chose
    resolution          TEXT,                    -- human-readable resolution text
    resolved_at_tick    INT,

    -- Effects applied (written when resolved)
    cost_applied        BIGINT NOT NULL DEFAULT 0,
    delay_applied       INT NOT NULL DEFAULT 0,
    quality_applied     INT NOT NULL DEFAULT 0,

    -- Inaction: if not resolved within this many ticks, auto-apply worst outcome
    expires_at_tick     INT,

    -- Metadata
    fired_at_tick       INT NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ce_contract ON construction_events(contract_id);
CREATE INDEX IF NOT EXISTS idx_ce_faction ON construction_events(faction_id);
CREATE INDEX IF NOT EXISTS idx_ce_status ON construction_events(status);
CREATE INDEX IF NOT EXISTS idx_ce_nation ON construction_events(nation_id);

-- RLS
ALTER TABLE construction_events ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read events (needed to display in project modal)
CREATE POLICY "Events are viewable by all authenticated users"
    ON construction_events FOR SELECT TO authenticated USING (true);

-- Players can update their own events (to submit a response)
CREATE POLICY "Corps can respond to their own events"
    ON construction_events FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM factions
            WHERE id = faction_id AND linked_user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM factions
            WHERE id = faction_id AND linked_user_id = auth.uid()
        )
    );

-- No INSERT/DELETE for clients — events are created by tick processor (service_role)

COMMENT ON TABLE construction_events IS 'Random events that fire on active construction projects. Players choose a response; tick processor applies effects.';
