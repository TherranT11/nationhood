-- ═══════════════════════════════════════════════════════════════════════════════
-- TARGET-BASED POLICIES PHASE 1.6 — sector_weight_targets column
-- ═══════════════════════════════════════════════════════════════════════════════
-- Adds a fourth effect type to target-based policy options: per-sector
-- weight modifiers. When a target-based option is active in a nation,
-- the engine reads sector_weight_targets at election time and adds
-- each entry's delta to the sector's weight for that election:
--
--     effective_weight(sector) = stored_weight + Σ(option deltas for sector)
--
-- The delta is transient — it's only applied at election-time TWP
-- calculation, not stored in sectors.weight. Multiple active options
-- on the same sector sum their deltas. Floored at 1 (a weight of 0
-- would zero out the sector's contribution to TWP).
--
-- Use case: a "Special Industry Zone" option with delta=+2 on
-- TECH_ENGINEERING_CLASS amplifies that sector's election-day
-- influence by ~2x while the option is active.
--
-- Coexists with stat_targets, sector_rapport_targets, and
-- sector_turnout_targets — same shape conventions, same
-- is_target_based gate.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.policy_options
    ADD COLUMN IF NOT EXISTS sector_weight_targets JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.policy_options.sector_weight_targets IS
    'Per-sector weight modifiers. JSONB array of {sector_key: text, delta: integer -5..+5}. Engine reads at election time and adds each delta to sectors.weight for the matching sector while this option is active. Floored at 1. Empty array = no weight effect. Coexists with stat_targets, sector_rapport_targets, and sector_turnout_targets.';

NOTIFY pgrst, 'reload schema';

COMMIT;
