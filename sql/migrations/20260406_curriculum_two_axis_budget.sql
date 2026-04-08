-- Standardised Curriculum redesign: pick two ideology directions, 0.1/tick drift,
-- cost ~$1M per million pop per year (÷12 for per-tick cost).

-- Add second axis columns
ALTER TABLE curriculum_drift ADD COLUMN IF NOT EXISTS axis2 TEXT;
ALTER TABLE curriculum_drift ADD COLUMN IF NOT EXISTS direction2 INT;
ALTER TABLE curriculum_drift ADD COLUMN IF NOT EXISTS direction_label2 TEXT;

-- Add budget cost tracking
ALTER TABLE curriculum_drift ADD COLUMN IF NOT EXISTS budget_per_tick NUMERIC(18,2) NOT NULL DEFAULT 0;

-- Update default drift_per_tick for new activations (existing rows keep 0.2)
ALTER TABLE curriculum_drift ALTER COLUMN drift_per_tick SET DEFAULT 0.1;

-- Remove 160-tick delay default (new activations start immediately)
-- activates_at_tick will now be set to currentTick (immediate)
