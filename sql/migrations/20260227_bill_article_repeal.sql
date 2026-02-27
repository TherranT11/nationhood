-- Allow bill articles to mark a repeal of an active law.
-- When a bill with repeal articles passes, those active laws are reversed and deleted.
ALTER TABLE bill_articles
ADD COLUMN IF NOT EXISTS repeal_active_law_id UUID DEFAULT NULL;
