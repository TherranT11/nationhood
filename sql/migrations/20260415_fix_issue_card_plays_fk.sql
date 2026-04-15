-- Fix bare FK references to factions(id) on tables that survive shard reset.
-- Without ON DELETE SET NULL/CASCADE, deleting factions fails with FK violations.

-- ══ issue_card_plays: played_by_faction_id (nullable → SET NULL) ══
ALTER TABLE issue_card_plays
    DROP CONSTRAINT IF EXISTS issue_card_plays_played_by_faction_id_fkey;
ALTER TABLE issue_card_plays
    ADD CONSTRAINT issue_card_plays_played_by_faction_id_fkey
    FOREIGN KEY (played_by_faction_id) REFERENCES factions(id) ON DELETE SET NULL;

-- ══ wiki_pages: created_by, updated_by, locked_by (all nullable → SET NULL) ══
ALTER TABLE wiki_pages
    DROP CONSTRAINT IF EXISTS wiki_pages_created_by_fkey;
ALTER TABLE wiki_pages
    ADD CONSTRAINT wiki_pages_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE wiki_pages
    DROP CONSTRAINT IF EXISTS wiki_pages_updated_by_fkey;
ALTER TABLE wiki_pages
    ADD CONSTRAINT wiki_pages_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES factions(id) ON DELETE SET NULL;

ALTER TABLE wiki_pages
    DROP CONSTRAINT IF EXISTS wiki_pages_locked_by_fkey;
ALTER TABLE wiki_pages
    ADD CONSTRAINT wiki_pages_locked_by_fkey
    FOREIGN KEY (locked_by) REFERENCES factions(id) ON DELETE SET NULL;
