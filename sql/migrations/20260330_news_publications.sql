-- Add publication column to news tables.
-- 'cruceran' = The Cruceran (default, Cruceran continent nations)
-- 'continental' = The Continental (Meridian continent nations)

ALTER TABLE player_articles ADD COLUMN IF NOT EXISTS publication TEXT NOT NULL DEFAULT 'cruceran';
ALTER TABLE op_eds ADD COLUMN IF NOT EXISTS publication TEXT NOT NULL DEFAULT 'cruceran';
ALTER TABLE valdorian_articles ADD COLUMN IF NOT EXISTS publication TEXT NOT NULL DEFAULT 'cruceran';

CREATE INDEX IF NOT EXISTS idx_player_articles_publication ON player_articles(publication);
CREATE INDEX IF NOT EXISTS idx_op_eds_publication ON op_eds(publication);
CREATE INDEX IF NOT EXISTS idx_valdorian_articles_publication ON valdorian_articles(publication);
