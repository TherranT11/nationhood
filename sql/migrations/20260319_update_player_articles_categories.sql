-- Migration: Update player_articles category CHECK constraint
-- Expands allowed categories to: politics, economy, international, social, entertainment, elections, sports
-- Safe to re-run.

-- Drop the old CHECK constraint if it exists
DO $$ BEGIN
    ALTER TABLE player_articles DROP CONSTRAINT IF EXISTS player_articles_category_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Add the updated CHECK constraint
ALTER TABLE player_articles
    ADD CONSTRAINT player_articles_category_check
    CHECK (category IN ('politics', 'economy', 'international', 'social', 'entertainment', 'elections', 'sports'));
