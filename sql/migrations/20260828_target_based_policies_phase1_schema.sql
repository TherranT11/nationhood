-- ═══════════════════════════════════════════════════════════════════════════════
-- TARGET-BASED POLICIES PHASE 1 — schema additions (additive, non-breaking)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Goal:
--   Set up storage for the new target-based policy model. Each option declares
--   per-stat target values (0-10) with pull strengths (0-1) and per-sector
--   rapport targets (-10..+10). Engine (Phase 3) will compute weighted
--   equilibrium per stat across active options:
--
--     stat_equilibrium = Σ(target × pull) / Σ(pull)
--
--   and converge the actual stat toward equilibrium each tick at a global
--   convergence rate (~10% of remaining gap / tick — exact value tunable).
--
--   Sector rapport targets apply to the governing faction's
--   faction_sector_popularity in that sector when the option is active.
--
-- Coexistence:
--   The legacy stat_effects column on policy_options stays. is_target_based
--   determines which path the engine takes for a given option. Phase 5 will
--   migrate / replace legacy options and drop the old columns.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.policy_options
    ADD COLUMN IF NOT EXISTS spectrum_position      SMALLINT,
    ADD COLUMN IF NOT EXISTS stat_targets           JSONB   NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS sector_rapport_targets JSONB   NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS is_target_based        BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.policy_options.spectrum_position IS
    'Position 1..N on the multi-option spectrum (e.g. 1=Closed, 5=Open). Used by the builder UI to order options. NULL on legacy non-spectrum options.';

COMMENT ON COLUMN public.policy_options.stat_targets IS
    'Target-based stat effects. JSONB array of {stat_key: text, target: number 0-10, pull: number 0-1}. Engine (Phase 3) computes weighted equilibrium per stat across all active target-based options in a nation. Coexists with legacy stat_effects until Phase 5.';

COMMENT ON COLUMN public.policy_options.sector_rapport_targets IS
    'Per-sector rapport targets. JSONB array of {sector_key: text, rapport: number -10..+10}. Applied to the governing faction''s faction_sector_popularity in the matching sector when this option is active.';

COMMENT ON COLUMN public.policy_options.is_target_based IS
    'TRUE = engine reads stat_targets + sector_rapport_targets. FALSE = legacy rate/duration model via stat_effects. Lets old + new policies coexist while Phase 2-4 ship.';

NOTIFY pgrst, 'reload schema';

COMMIT;
