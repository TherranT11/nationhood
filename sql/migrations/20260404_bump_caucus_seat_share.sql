-- Bump all caucus factions from the old 0.05 minimum to the new 0.12 minimum
-- so each caucus represents ~10-15% of party seats instead of ~5%

UPDATE caucus_factions
SET seat_share = 0.120
WHERE seat_share < 0.120
  AND is_active = true;
