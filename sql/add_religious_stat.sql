-- Adds a first-class religiosity stat to nations so policy effects using
-- stat_key = 'religious' are persisted during tick processing.

ALTER TABLE nations
ADD COLUMN IF NOT EXISTS religious NUMERIC;

-- Keep gameplay in the 0-100 range baseline used by other soft stats.
ALTER TABLE nations
ALTER COLUMN religious SET DEFAULT 50;

UPDATE nations
SET religious = 50
WHERE religious IS NULL;

-- Optional hard clamp; uncomment if you want DB-enforced range safety.
-- ALTER TABLE nations
-- ADD CONSTRAINT nations_religious_range CHECK (religious >= 0 AND religious <= 100);
