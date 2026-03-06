-- Add floor_tick column to bills table to track when a bill was moved to the floor.
-- Used by budget bills to determine how long they've been on the floor without passing.
ALTER TABLE bills ADD COLUMN IF NOT EXISTS floor_tick INT;

-- Backfill: for bills currently on the floor, estimate floor_tick from proposed_tick + committee expiry
UPDATE bills
SET floor_tick = proposed_tick + 3
WHERE status = 'floor'
  AND floor_tick IS NULL;
