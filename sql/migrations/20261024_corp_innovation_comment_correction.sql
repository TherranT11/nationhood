-- ════════════════════════════════════════════════════════════════
-- Phase A correction: corp_innovation COMMENT was misleading.
--
-- 20261022_aviation_manufacturing_schema.sql added a COMMENT to
-- corp_innovation claiming it was "Aviation Manufacturing only."
-- It isn't — the column was added in 20260430_corp_simplify_v2 as
-- NUMERIC(4,2) and is seeded by Construction (5), Finance (5), and
-- Airline (5) founding flows. Phase A's ADD COLUMN IF NOT EXISTS
-- was a no-op for this column (it already existed); only the
-- COMMENT actually changed, and it changed to a wrong description.
--
-- This corrects the COMMENT to describe corp_innovation as the
-- shared cross-sector innovation stat that it actually is, with
-- per-sector founding values noted. The CHECK BETWEEN 0 AND 10 from
-- Phase A is fine — every existing seeded value (0, 1, 5) satisfies
-- it. The columns corp_production_capacity and corp_quality_control
-- ARE genuinely Aviation-Manufacturing-only and their COMMENTs
-- stay as-is.
-- ════════════════════════════════════════════════════════════════

BEGIN;

COMMENT ON COLUMN factions.corp_innovation IS
    'Cross-sector corporate innovation stat. NUMERIC(4,2) on the schema, used as a 0-10 integer in practice. Construction / Finance / Airline founding flows seed 5; Aviation Manufacturing founding seeds 1. Drives sector-specific design / R&D / production effects (the precise meaning is sector-resolved by the consuming RPC, not centrally defined here).';

NOTIFY pgrst, 'reload schema';

COMMIT;
