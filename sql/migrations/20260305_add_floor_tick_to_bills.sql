-- Add floor_tick to bills table
-- Tracks the tick at which a bill was moved from committee to floor vote.
-- Used for budget forced resolution timing.
ALTER TABLE bills ADD COLUMN IF NOT EXISTS floor_tick INT DEFAULT NULL;

-- Backfill: for bills currently on the floor, approximate floor_tick from proposed_tick + committee expiry
UPDATE bills
SET floor_tick = proposed_tick + 4
WHERE status = 'floor' AND floor_tick IS NULL AND proposed_tick IS NOT NULL;
