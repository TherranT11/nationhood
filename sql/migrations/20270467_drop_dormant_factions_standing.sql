-- Drop dormant factions.standing + last_standing_action_tick.
--
-- factions.standing was added 2026-03-05 in
-- 20260305_autocracy_v2_phase1_schema.sql as a party-level institutional
-- reputation stat, backfilled from the (since-dismantled) stewards
-- system. The Autocracy v2 framework that gave it life was pulled
-- apart in the alpha refactor; the column is still SELECTed by
-- js/politics.js but never displayed, compared, or written. The
-- documented mechanics (damaged by failed attacks / lost lawsuits /
-- embezzlement / betrayed coalitions; drives endorsements + foundational
-- law thresholds) never got rewired — pure ghost state.
--
-- last_standing_action_tick was the relevance-decay timer for the same
-- system. Same fate: added, never written.
--
-- Embezzled_funds, consecutive_embezzle_ticks, last_action_type, and
-- coup_lockout_until_tick from the same 2026-03-05 migration are NOT
-- touched here — those concepts may still have wiring; separate cull
-- if/when audited.
--
-- After this drops:
--   - js/politics.js needs `standing` removed from its faction SELECT
--   - how-to.html sections describing Standing get retired
--   - sql/work_schema.sql snapshot loses both columns from the CREATE
--
-- All handled in the matching JS/HTML/snapshot edits in this commit.

BEGIN;

ALTER TABLE public.factions DROP COLUMN IF EXISTS standing;
ALTER TABLE public.factions DROP COLUMN IF EXISTS last_standing_action_tick;

NOTIFY pgrst, 'reload schema';

COMMIT;
