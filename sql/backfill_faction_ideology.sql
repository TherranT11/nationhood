-- Backfill faction_ideology rows for factions that don't have one.
-- All axes start at 0 (neutral). Run in Supabase SQL editor.

INSERT INTO faction_ideology (faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism)
SELECT f.id, 0, 0, 0, 0, 0
FROM factions f
LEFT JOIN faction_ideology fi ON fi.faction_id = f.id
WHERE fi.faction_id IS NULL
  AND f.faction_type = 'party';
