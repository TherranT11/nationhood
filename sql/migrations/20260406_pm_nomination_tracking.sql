-- PM Nomination Tracking for Semi-Presidential systems
-- After a presidential election or PM vacancy, the President nominates a PM candidate.
-- Parliament votes on confirmation (simple majority). Max 3 attempts before emergency fallback.

-- Track how many PM nominations have been rejected in the current vacancy cycle
ALTER TABLE nations ADD COLUMN IF NOT EXISTS pm_nomination_attempts INT DEFAULT 0;
