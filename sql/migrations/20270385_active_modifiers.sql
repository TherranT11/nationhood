-- ════════════════════════════════════════════════════════════════════
-- active_modifiers — runtime state for the National Modifiers system
-- ════════════════════════════════════════════════════════════════════
-- One row per (nation, modifier_template) pair currently active.
-- Inserted by processNationalModifiers (js/game/modifiers.js) at tick
-- when ALL of a template's modifier_triggers evaluate true against
-- the nation's stats. Deleted by the same processor when ALL of the
-- template's modifier_end_triggers evaluate true.
--
-- Why persisted (vs evaluated stateless on every page load):
-- Modifier templates support END TRIGGERS with DIFFERENT thresholds
-- from activation triggers (hysteresis — e.g. trigger at GDP >= 6,
-- end at GDP <= 3). End-triggers only do useful work when there's
-- prior active-state to flip. Without persistence, end-triggers
-- would be dead schema.
--
-- Why no effects-applied log (compare active_crises.effects_applied_log):
-- Modifiers do NOT apply per-tick stat changes — they're a pure
-- characterization layer. There's nothing to log per tick.
--
-- Mirrors active_crises in shape; modifier_id is UUID-FK with
-- ON DELETE CASCADE so deleting a template auto-cleans its rows.

CREATE TABLE IF NOT EXISTS active_modifiers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modifier_id     UUID NOT NULL REFERENCES modifier_templates(id) ON DELETE CASCADE,
    nation_id       UUID NOT NULL,
    started_at_tick INT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (modifier_id, nation_id)
);

CREATE INDEX IF NOT EXISTS idx_active_modifiers_nation   ON active_modifiers(nation_id);
CREATE INDEX IF NOT EXISTS idx_active_modifiers_modifier ON active_modifiers(modifier_id);
