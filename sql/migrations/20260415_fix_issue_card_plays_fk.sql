-- Fix issue_card_plays FK to factions: add ON DELETE SET NULL
-- Without this, shard reset fails to delete factions that have played issue cards.
-- The column is nullable, so SET NULL is the correct cascade behavior.

ALTER TABLE issue_card_plays
    DROP CONSTRAINT IF EXISTS issue_card_plays_played_by_faction_id_fkey;

ALTER TABLE issue_card_plays
    ADD CONSTRAINT issue_card_plays_played_by_faction_id_fkey
    FOREIGN KEY (played_by_faction_id) REFERENCES factions(id) ON DELETE SET NULL;
