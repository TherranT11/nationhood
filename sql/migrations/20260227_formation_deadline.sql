-- Government formation deadline & escalation system.
-- Tracks failed formation attempts for the snap→minority escalation,
-- and flags emergency minority governments for the legislative penalty.

-- Nations: count consecutive failed formation windows (resets to 0 when a government forms)
ALTER TABLE nations ADD COLUMN IF NOT EXISTS failed_formation_attempts INT DEFAULT 0;

-- Government formations: distinguish normal coalitions from emergency minority governments
ALTER TABLE government_formations ADD COLUMN IF NOT EXISTS formation_type TEXT DEFAULT 'coalition';
-- Valid values: 'coalition' (normal player-formed), 'emergency_minority' (auto-installed)
