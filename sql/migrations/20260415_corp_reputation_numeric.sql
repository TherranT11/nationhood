-- Change corp_reputation from INTEGER to NUMERIC to support 0.25/tick decay.
-- INTEGER silently rounds 64.75 → 65, making fractional decay ineffective.
ALTER TABLE factions ALTER COLUMN corp_reputation TYPE NUMERIC(6,2);
