-- Add early resolution columns to bills table.
-- Used by the checkEarlyMajority system to lock bill outcomes when a
-- definitive majority (for or against) is reached before the voting window expires.

ALTER TABLE bills ADD COLUMN IF NOT EXISTS early_resolution_status TEXT DEFAULT NULL;
-- NULL            = no early majority detected (normal voting)
-- 'majority_reached' = YES votes meet required threshold; bill passes after grace tick
-- 'majority_opposed' = NO votes make it impossible for YES to reach threshold; bill fails after grace tick

ALTER TABLE bills ADD COLUMN IF NOT EXISTS early_resolution_tick INTEGER DEFAULT NULL;
-- The tick at which the early majority was detected.
-- Resolution happens at early_resolution_tick + 1 (one grace tick).
