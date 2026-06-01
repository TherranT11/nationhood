-- Grant $200,000,000 to entrepreneur Gavrilo Zlatković.
--
-- Increments party_funds (the entrepreneur's personal liquid cash —
-- the column is shared with parties despite the name). One-shot
-- adjustment, not a migration. Run against the target shard via
-- Supabase SQL editor or psql; the RETURNING confirms which row(s)
-- got touched and the new balance.

UPDATE factions
   SET party_funds = COALESCE(party_funds, 0) + 200000000
 WHERE faction_type     = 'entrepreneur'
   AND leader_first_name = 'Gavrilo'
   AND leader_last_name  = 'Zlatković'
   AND abandoned_at IS NULL
RETURNING id, leader_first_name, leader_last_name, party_funds;
