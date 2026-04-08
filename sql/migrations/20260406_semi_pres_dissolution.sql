-- Semi-Presidential Dissolution Tracking
-- Tracks when the President last dissolved parliament (for cooldown enforcement)
-- and when the current parliament was formed (for minimum-age check).

ALTER TABLE nations ADD COLUMN IF NOT EXISTS last_dissolution_tick INT DEFAULT NULL;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS parliament_formed_tick INT DEFAULT NULL;
