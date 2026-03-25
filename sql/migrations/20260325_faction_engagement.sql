-- ============================================================
-- Engagement Score: Legislative Activity & Voter Accountability
-- ============================================================

CREATE TABLE IF NOT EXISTS faction_engagement (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id              UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id               UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,

    -- Composite score (0-100)
    engagement_score        DECIMAL(5,2) DEFAULT 50,

    -- Sub-component scores (0-100)
    initiative_score        DECIMAL(5,2) DEFAULT 50,
    constructive_score      DECIMAL(5,2) DEFAULT 50,
    positioning_score       DECIMAL(5,2) DEFAULT 50,

    -- Rolling window counts (last 20 ticks)
    bills_to_floor_count    INT DEFAULT 0,
    yes_vote_count          INT DEFAULT 0,
    no_vote_count           INT DEFAULT 0,
    abstain_vote_count      INT DEFAULT 0,
    total_votes_possible    INT DEFAULT 0,

    -- Tick tracking
    updated_at_tick         INT DEFAULT 0,
    first_seated_tick       INT DEFAULT 0,

    CONSTRAINT uq_faction_engagement UNIQUE (faction_id, nation_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_faction_engagement_nation
    ON faction_engagement(nation_id);
CREATE INDEX IF NOT EXISTS idx_faction_engagement_faction
    ON faction_engagement(faction_id);

-- RLS
ALTER TABLE faction_engagement ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read engagement scores (public data)
CREATE POLICY "faction_engagement_select" ON faction_engagement
    FOR SELECT TO authenticated USING (true);

-- Only service role writes (tick processor), no client writes needed
-- The upsert happens in the edge function which runs with service role
