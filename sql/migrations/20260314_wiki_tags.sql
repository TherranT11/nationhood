-- Add tags column to wiki_pages table
ALTER TABLE wiki_pages ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- GIN index for fast tag search (@> and && operators)
CREATE INDEX IF NOT EXISTS wiki_pages_tags_idx ON wiki_pages USING GIN(tags);

-- Function: Get tag suggestions matching a prefix
CREATE OR REPLACE FUNCTION get_tag_suggestions(prefix_query text, max_results int DEFAULT 8)
RETURNS TABLE(tag text, usage_count bigint) AS $$
    SELECT t AS tag, COUNT(*) AS usage_count
    FROM wiki_pages, unnest(tags) AS t
    WHERE t ILIKE prefix_query || '%'
    GROUP BY t
    ORDER BY usage_count DESC
    LIMIT max_results;
$$ LANGUAGE sql STABLE;

-- Function: Get popular tags (most used across all articles)
CREATE OR REPLACE FUNCTION get_popular_tags(max_results int DEFAULT 10)
RETURNS TABLE(tag text, count bigint) AS $$
    SELECT t AS tag, COUNT(*) AS count
    FROM wiki_pages, unnest(tags) AS t
    GROUP BY t
    ORDER BY count DESC
    LIMIT max_results;
$$ LANGUAGE sql STABLE;
