-- Minister & Government Approval System
-- Adds per-tick stat-driven minister approval, composite government approval,
-- and embattled tracking for the minister firing mechanic.

-- Track when a minister first dropped below the embattled threshold
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS embattled_since_tick INT DEFAULT NULL;

-- Live government approval score (composite of minister approvals + PM stats + trajectory)
-- Already exists in nations_history for snapshots; this adds it to nations for live access.
ALTER TABLE nations ADD COLUMN IF NOT EXISTS national_approval NUMERIC DEFAULT 50;
