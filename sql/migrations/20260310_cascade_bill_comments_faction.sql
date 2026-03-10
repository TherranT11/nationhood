-- Make bill_comments.faction_id cascade on faction deletion.
-- Bill comments from a deleted faction have no standalone value,
-- so Postgres should clean them up automatically as a safety net.

ALTER TABLE bill_comments
  DROP CONSTRAINT IF EXISTS bill_comments_faction_id_fkey,
  ADD CONSTRAINT bill_comments_faction_id_fkey
    FOREIGN KEY (faction_id) REFERENCES factions(id)
    ON DELETE CASCADE;
