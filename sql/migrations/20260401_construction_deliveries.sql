-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: Construction Deliveries & Inspection Reports
-- Date: 2026-04-01
--
-- Stores inspection results when construction projects complete.
-- Quality scores per category, financial summary, material impact.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS construction_deliveries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id         UUID NOT NULL REFERENCES construction_contracts(id) ON DELETE CASCADE,
    faction_id          UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id           UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,

    -- Result
    result              TEXT NOT NULL,  -- DISTINCTION, PASS, CONDITIONAL, FAIL
    quality_score       INT NOT NULL,   -- 0-100 overall
    rep_change          INT NOT NULL DEFAULT 0,

    -- Inspection breakdown (JSONB for flexibility)
    inspection          JSONB NOT NULL DEFAULT '{}',
    -- { materials: { score, issues[] }, structural: { score, issues[] },
    --   systems: { score, issues[] }, permits: { passed, issues[] } }

    -- Material quality impact
    materials_used      JSONB NOT NULL DEFAULT '[]',
    -- [{ name, grade, impact }]

    -- Financial summary
    contract_value      BIGINT NOT NULL DEFAULT 0,
    quality_bonus       BIGINT NOT NULL DEFAULT 0,
    penalties           BIGINT NOT NULL DEFAULT 0,
    payment_received    BIGINT NOT NULL DEFAULT 0,
    total_cost          BIGINT NOT NULL DEFAULT 0,
    net_profit          BIGINT NOT NULL DEFAULT 0,

    -- Timeline
    timeline_expected   INT NOT NULL DEFAULT 0,
    timeline_actual     INT NOT NULL DEFAULT 0,
    on_time             BOOLEAN DEFAULT TRUE,

    -- Metadata
    delivered_at_tick   INT NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cd_faction ON construction_deliveries(faction_id);
CREATE INDEX IF NOT EXISTS idx_cd_nation ON construction_deliveries(nation_id);
