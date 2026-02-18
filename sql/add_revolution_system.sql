-- Democratic Revolution system columns
-- revolution_started_tick: tick when the revolution crisis started (NULL = no active crisis)
-- revolution_duration: random 13-22, set when crisis starts
-- needs_rebuild: flag on factions after revolution, prompts party rebuild on createparty.html

ALTER TABLE nations ADD COLUMN IF NOT EXISTS revolution_started_tick INT DEFAULT NULL;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS revolution_duration INT DEFAULT NULL;

ALTER TABLE factions ADD COLUMN IF NOT EXISTS needs_rebuild BOOLEAN DEFAULT FALSE;
