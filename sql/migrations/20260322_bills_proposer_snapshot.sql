-- Store proposer name/color at bill creation time so historical bills
-- display the correct faction name even after the faction is disbanded/renamed.
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposer_name text;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposer_color text;

-- Backfill existing bills from current faction data
UPDATE bills b
SET proposer_name = f.faction_name,
    proposer_color = f.party_color
FROM factions f
WHERE b.proposed_by = f.id
  AND b.proposer_name IS NULL;
