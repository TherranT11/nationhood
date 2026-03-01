-- ==================== OP-EDS & VALDORIAN ARTICLES ====================
-- Tables for The Valdorian newspaper system: player-authored op-eds
-- and system-generated articles from the template engine.

-- 1. Op-Eds — player-written opinion pieces
CREATE TABLE IF NOT EXISTS op_eds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    author_faction_id UUID REFERENCES public.factions(id) ON DELETE SET NULL,
    author_name     TEXT NOT NULL,            -- byline (leader name or custom)
    headline        TEXT NOT NULL,
    body            TEXT NOT NULL,
    section         TEXT NOT NULL DEFAULT 'opinion',
    topic_tags      JSONB DEFAULT '[]'::jsonb,
    status          TEXT NOT NULL DEFAULT 'draft',  -- 'draft', 'published', 'rejected'
    published_tick  INTEGER,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_op_eds_nation ON op_eds(nation_id);
CREATE INDEX IF NOT EXISTS idx_op_eds_status ON op_eds(status);
CREATE INDEX IF NOT EXISTS idx_op_eds_faction ON op_eds(author_faction_id);

-- 2. Valdorian Articles — system-generated news articles from template engine
CREATE TABLE IF NOT EXISTS valdorian_articles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL,            -- e.g. 'rally', 'crisis_started', 'government_shutdown'
    tier            INTEGER NOT NULL DEFAULT 3,  -- 1-4
    section         TEXT NOT NULL DEFAULT 'politics',
    headline        TEXT NOT NULL,
    subheadline     TEXT,
    lede            TEXT,
    body_paragraphs JSONB DEFAULT '[]'::jsonb,  -- array of paragraph strings
    quotes          JSONB DEFAULT '[]'::jsonb,  -- array of { posture, text }
    byline_reporter TEXT,
    topic_tags      JSONB DEFAULT '[]'::jsonb,
    developing_story JSONB,                   -- { topic, count, since_tick } or null
    source_event_id TEXT,                     -- reference to event_log id or campaign_actions id
    tick            INTEGER NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_valdorian_articles_nation ON valdorian_articles(nation_id);
CREATE INDEX IF NOT EXISTS idx_valdorian_articles_tick ON valdorian_articles(tick);
CREATE INDEX IF NOT EXISTS idx_valdorian_articles_tier ON valdorian_articles(tier);
CREATE INDEX IF NOT EXISTS idx_valdorian_articles_event_type ON valdorian_articles(event_type);
CREATE INDEX IF NOT EXISTS idx_valdorian_articles_section ON valdorian_articles(section);

-- 3. Enable RLS
ALTER TABLE op_eds ENABLE ROW LEVEL SECURITY;
ALTER TABLE valdorian_articles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read articles and op-eds for their nation
CREATE POLICY "Users can read op_eds for their nation"
    ON op_eds FOR SELECT
    USING (true);

CREATE POLICY "Users can insert op_eds"
    ON op_eds FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own op_eds"
    ON op_eds FOR UPDATE
    USING (true);

CREATE POLICY "Users can read valdorian_articles"
    ON valdorian_articles FOR SELECT
    USING (true);

CREATE POLICY "System can insert valdorian_articles"
    ON valdorian_articles FOR INSERT
    WITH CHECK (true);
