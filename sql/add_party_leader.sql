-- ==================== PARTY LEADER + FOUNDED DATE COLUMNS ====================
-- Adds leader identity fields and founding data to the factions table:
--   leader_first_name: party leader's first name
--   leader_last_name:  party leader's last name
--   leader_age:        party leader's age (integer)
--   created_at:        faction founding real timestamp
--   founded_tick:      in-game tick when the party was founded

ALTER TABLE factions ADD COLUMN IF NOT EXISTS leader_first_name VARCHAR(50);
ALTER TABLE factions ADD COLUMN IF NOT EXISTS leader_last_name  VARCHAR(50);
ALTER TABLE factions ADD COLUMN IF NOT EXISTS leader_age        INT;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS created_at        TIMESTAMPTZ DEFAULT now();
ALTER TABLE factions ADD COLUMN IF NOT EXISTS founded_tick      INT;
