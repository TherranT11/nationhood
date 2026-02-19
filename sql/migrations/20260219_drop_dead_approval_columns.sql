-- ==================== PHASE 0 CLEANUP ====================
-- Drop orphaned columns from faction_bloc_approval that were
-- never wired up in the application code.
--
--   donor_cooldown_until_tick — old "court donors" cooldown, never queried
--   last_platform / platform_tick — abandoned "policy platform" tracking, never read

ALTER TABLE faction_bloc_approval DROP COLUMN IF EXISTS donor_cooldown_until_tick;
ALTER TABLE faction_bloc_approval DROP COLUMN IF EXISTS last_platform;
ALTER TABLE faction_bloc_approval DROP COLUMN IF EXISTS platform_tick;
