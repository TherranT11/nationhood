-- ==================== PARTY LEADER COLUMNS ====================
-- Adds leader identity fields to the factions table:
--   leader_first_name: party leader's first name
--   leader_last_name:  party leader's last name
--   leader_age:        party leader's age (integer)

ALTER TABLE factions ADD COLUMN IF NOT EXISTS leader_first_name VARCHAR(50);
ALTER TABLE factions ADD COLUMN IF NOT EXISTS leader_last_name  VARCHAR(50);
ALTER TABLE factions ADD COLUMN IF NOT EXISTS leader_age        INT;
