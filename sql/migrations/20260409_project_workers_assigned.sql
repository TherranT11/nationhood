-- Per-project worker assignment tracking.
-- Stores how many workers the player has assigned to each project.
-- The tick processor checks this against required_workforce to determine staffing.

ALTER TABLE construction_contracts
    ADD COLUMN IF NOT EXISTS workers_assigned JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN construction_contracts.workers_assigned IS
    'Player-assigned workers: { general: N, skilled: N, innovative: N }. Tick processor checks this against required_workforce.';
