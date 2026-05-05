-- ═══════════════════════════════════════════════════════════════════════════════
-- TARGET-BASED POLICIES PHASE 1.5 — sector_turnout_targets column
-- ═══════════════════════════════════════════════════════════════════════════════
-- Adds a third effect type to target-based policy options: per-sector
-- turnout modifiers. When a target-based option is active in a nation,
-- the engine reads sector_turnout_targets at election time and adds
-- each entry's delta to the sector's base_turnout for that election:
--
--     effective_turnout(sector) = base_turnout + Σ(option deltas for sector)
--
-- The delta is transient — it's only applied at election-time turnout
-- calculation, not stored in sectors.base_turnout. Multiple active
-- options on the same sector sum their deltas.
--
-- Use case: a "Drop Voting Age to 16" option with delta=+0.10 on
-- STUDENTS_YOUNG_PRECARIAT means that sector's effective turnout is
-- base_turnout + 0.10 while the option is active.
--
-- Coexists with stat_targets (Phase 1) and sector_rapport_targets
-- (Phase 1) — same shape conventions, same is_target_based gate.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.policy_options
    ADD COLUMN IF NOT EXISTS sector_turnout_targets JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.policy_options.sector_turnout_targets IS
    'Per-sector turnout modifiers. JSONB array of {sector_key: text, delta: number -0.30..+0.30}. Engine reads at election time and adds each delta to sectors.base_turnout for the matching sector while this option is active. Empty array = no turnout effect. Coexists with stat_targets and sector_rapport_targets.';

NOTIFY pgrst, 'reload schema';

COMMIT;
