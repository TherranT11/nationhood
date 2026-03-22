-- Add is_landlocked flag to nations table.
-- Landlocked nations cannot adopt Navy doctrines.

ALTER TABLE nations ADD COLUMN IF NOT EXISTS is_landlocked BOOLEAN NOT NULL DEFAULT FALSE;

-- Montequilla is landlocked
UPDATE nations SET is_landlocked = TRUE WHERE name ILIKE 'Montequilla';
