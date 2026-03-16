-- Migration: Simplify Minister & Government Approval System
--
-- Drops columns made redundant by the "Drift-to-Performance" approval model:
--   - embattled_since_tick: no longer tracked (embattled/crisis badges removed)
--   - gov_approval_institutional: 3-pillar composite replaced by simple avg
--   - gov_approval_outcomes: 3-pillar composite replaced by simple avg
--
-- Keeps:
--   - gov_approval (nations): the composite government approval score
--   - gov_approval_events (nations): transient event modifier (decays 10%/tick)
--   - minister_approval (ministries): per-minister approval rating
--   - gov_approval_log: audit trail for event modifier changes
--   - stat_history: still used by three-pillar voter preference engine

-- Drop embattled tracking from ministries
ALTER TABLE ministries DROP COLUMN IF EXISTS embattled_since_tick;

-- Drop 3-pillar component columns from nations (no longer computed)
ALTER TABLE nations DROP COLUMN IF EXISTS gov_approval_institutional;
ALTER TABLE nations DROP COLUMN IF EXISTS gov_approval_outcomes;

-- Drop 3-pillar component columns from nations_history if they exist
ALTER TABLE nations_history DROP COLUMN IF EXISTS gov_approval_institutional;
ALTER TABLE nations_history DROP COLUMN IF EXISTS gov_approval_outcomes;

-- Reset all minister approvals to 40 (new default under drift model)
UPDATE ministries SET minister_approval = 40 WHERE minister_approval IS NOT NULL;
