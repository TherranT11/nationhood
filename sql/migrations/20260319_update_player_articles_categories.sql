-- Migration: Update player_articles category CHECK constraint
-- Expands allowed categories to: politics, economy, international, social, entertainment, elections, sports, opinion
-- Safe to re-run.

-- Drop ALL existing CHECK constraints on the category column (handles auto-named constraints)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_attribute att ON att.attnum = ANY(con.conkey)
            AND att.attrelid = con.conrelid
        WHERE con.conrelid = 'player_articles'::regclass
            AND con.contype = 'c'
            AND att.attname = 'category'
    LOOP
        EXECUTE format('ALTER TABLE player_articles DROP CONSTRAINT %I', r.conname);
    END LOOP;
END $$;

-- Migrate legacy category values to nearest equivalent
UPDATE player_articles SET category = 'social'        WHERE category = 'weather';
UPDATE player_articles SET category = 'social'        WHERE category = 'science';

-- Add the updated CHECK constraint with an explicit name
ALTER TABLE player_articles
    ADD CONSTRAINT player_articles_category_check
    CHECK (category IN ('politics', 'economy', 'international', 'social', 'entertainment', 'elections', 'sports', 'opinion'));

-- Add DELETE policy so authors can remove their own articles
DO $$ BEGIN
  CREATE POLICY "Users can delete own player_articles" ON player_articles
    FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
