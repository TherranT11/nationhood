-- ==================== CONSTITUTIONAL REFERENDUM ====================
-- Phase 1: Add referendum fields to bills table.
-- Foundational bills that pass the floor vote enter a popular referendum
-- before enactment. The electorate votes YES/NO over 1 tick.

ALTER TABLE bills ADD COLUMN IF NOT EXISTS referendum_status TEXT DEFAULT NULL;
-- Values: 'pending' (awaiting resolution), 'resolved' (vote completed), 'skipped' (override)

ALTER TABLE bills ADD COLUMN IF NOT EXISTS referendum_start_tick INT DEFAULT NULL;
-- Tick when the referendum began (resolves at referendum_start_tick + 1)

ALTER TABLE bills ADD COLUMN IF NOT EXISTS referendum_yes_pct NUMERIC DEFAULT NULL;
-- Percentage of referendum voters who voted YES (0-100)

ALTER TABLE bills ADD COLUMN IF NOT EXISTS referendum_no_pct NUMERIC DEFAULT NULL;
-- Percentage of referendum voters who voted NO (0-100)

ALTER TABLE bills ADD COLUMN IF NOT EXISTS referendum_turnout_pct NUMERIC DEFAULT NULL;
-- Percentage of eligible population that voted (typically 20-45%)

COMMENT ON COLUMN bills.referendum_status IS 'Constitutional referendum state: pending, resolved, skipped';
COMMENT ON COLUMN bills.referendum_start_tick IS 'Tick when referendum started — resolves next tick';
COMMENT ON COLUMN bills.referendum_yes_pct IS 'Percentage YES in referendum (0-100)';
COMMENT ON COLUMN bills.referendum_no_pct IS 'Percentage NO in referendum (0-100)';
COMMENT ON COLUMN bills.referendum_turnout_pct IS 'Voter turnout percentage (typically 20-45%)';
