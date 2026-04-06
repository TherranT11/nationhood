-- Track stalled ticks on construction contracts.
-- Projects stall when the corporation lacks enough workforce to staff them.
-- Effective progress = (currentTick - awarded_at_tick) - stalled_ticks

ALTER TABLE construction_contracts
    ADD COLUMN IF NOT EXISTS stalled_ticks INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN construction_contracts.stalled_ticks IS 'Number of ticks this project was stalled due to insufficient workforce.';
