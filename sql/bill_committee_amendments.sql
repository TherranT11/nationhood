-- Add target_article_id column to bill_amendment_requests for "strike article" conditional support.
-- When a non-sponsor requests an article be removed, this column references the specific
-- bill_articles row they want struck. ON DELETE CASCADE ensures cleanup if the article
-- is rescinded by the sponsor independently.

ALTER TABLE bill_amendment_requests
  ADD COLUMN IF NOT EXISTS target_article_id UUID REFERENCES bill_articles(id) ON DELETE CASCADE;
