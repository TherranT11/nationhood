-- Migration: Player articles table + Op-Ed front page feature
-- Safe to re-run.

-- Add new columns to op_eds (if they don't exist)
DO $$ BEGIN
  ALTER TABLE op_eds ADD COLUMN is_front_page BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE op_eds ADD COLUMN reward_ap INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE op_eds ADD COLUMN reward_granted BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Player articles table
CREATE TABLE IF NOT EXISTS player_articles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    author_faction_id UUID REFERENCES public.factions(id) ON DELETE SET NULL,
    author_name     TEXT NOT NULL,
    headline        TEXT NOT NULL,
    body            TEXT NOT NULL,
    category        TEXT NOT NULL DEFAULT 'politics'
                    CHECK (category IN ('politics', 'sports', 'weather', 'science', 'entertainment')),
    image_url       TEXT,
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'rejected')),
    published_tick  INTEGER,
    reward_ap       INTEGER DEFAULT 0,
    reward_granted  BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_player_articles_nation ON player_articles(nation_id);
CREATE INDEX IF NOT EXISTS idx_player_articles_status ON player_articles(status);
CREATE INDEX IF NOT EXISTS idx_player_articles_faction ON player_articles(author_faction_id);
CREATE INDEX IF NOT EXISTS idx_player_articles_category ON player_articles(category);

-- RLS
ALTER TABLE player_articles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can read player_articles" ON player_articles
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert player_articles" ON player_articles
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own player_articles" ON player_articles
    FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
