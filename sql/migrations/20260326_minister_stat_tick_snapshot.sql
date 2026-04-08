-- Add stat_tick_snapshot column to ministries table.
-- This stores the stat values from the PREVIOUS tick, used by updateMinisterApprovals()
-- for tick-to-tick delta calculation.
--
-- Previously, stat_baselines was overwritten every tick for this purpose,
-- which destroyed the original appointment-time snapshot and caused the UI
-- to always show "—" for minister stat changes.
--
-- stat_baselines: appointment-time snapshot (set once, never overwritten by tick processing)
-- stat_tick_snapshot: last-tick snapshot (updated every tick for incremental delta calc)

ALTER TABLE ministries
ADD COLUMN IF NOT EXISTS stat_tick_snapshot jsonb DEFAULT NULL;

COMMENT ON COLUMN ministries.stat_tick_snapshot IS
  'Stat values from the previous tick. Used by updateMinisterApprovals() for tick-to-tick delta calculation. Unlike stat_baselines, which is the appointment-time snapshot shown in the UI.';
