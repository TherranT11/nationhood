-- ==================== IMPEACHMENT SYSTEM ====================
-- Adds formal impeachment process for presidential democracies.
-- Uses the existing bills pipeline (committee → floor) for voting.

-- ==================== IMPEACHMENT PROCEEDINGS TABLE ====================
-- Tracks the overall impeachment process across both phases.
-- Phase 1 uses a bill with bill_type = 'impeachment_motion'.
-- Phase 2 uses a bill with bill_type = 'impeachment_conviction'.

CREATE TABLE IF NOT EXISTS impeachment_proceedings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id               UUID NOT NULL REFERENCES nations(id),
    president_id            UUID NOT NULL,  -- references presidents(id)
    initiated_by_faction_id UUID NOT NULL REFERENCES factions(id),

    -- Charges (JSONB array of { type, label, has_evidence })
    charges                 JSONB NOT NULL DEFAULT '[]'::JSONB,

    -- Phase tracking
    -- 'motion_committee'  → debate period (2 ticks)
    -- 'motion_floor'      → impeachment vote on the floor
    -- 'trial'             → president impeached, conviction bill on floor (3 ticks)
    -- 'resolved'          → concluded (passed or failed)
    phase                   TEXT NOT NULL DEFAULT 'motion_committee'
                            CHECK (phase IN ('motion_committee', 'motion_floor', 'trial', 'resolved')),

    -- Linked bill IDs
    motion_bill_id          UUID,  -- bill with bill_type = 'impeachment_motion'
    conviction_bill_id      UUID,  -- bill with bill_type = 'impeachment_conviction'

    -- Results
    motion_result           TEXT CHECK (motion_result IN ('passed', 'failed')),
    conviction_result       TEXT CHECK (conviction_result IN ('convicted', 'acquitted')),

    -- Timeline
    created_at_tick         INT NOT NULL,
    resolved_at_tick        INT,

    created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_impeachment_nation ON impeachment_proceedings(nation_id);
CREATE INDEX IF NOT EXISTS idx_impeachment_active ON impeachment_proceedings(nation_id)
    WHERE phase != 'resolved';

-- ==================== NATION-LEVEL COOLDOWN ====================
-- Blocks new impeachment motions until this tick passes.

ALTER TABLE nations ADD COLUMN IF NOT EXISTS impeachment_cooldown_until_tick INT;

-- ==================== BILLS TABLE — IMPEACHMENT LINK ====================
-- Links impeachment bills back to the proceeding record.

ALTER TABLE bills ADD COLUMN IF NOT EXISTS impeachment_id UUID;

-- ==================== PRESIDENTS TABLE — REMOVAL REASON ====================
-- Tracks why a president left office.

ALTER TABLE presidents ADD COLUMN IF NOT EXISTS removal_reason TEXT;
-- Values: NULL (normal term end), 'impeached', 'resigned'
