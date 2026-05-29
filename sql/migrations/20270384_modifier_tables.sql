-- ════════════════════════════════════════════════════════════════════
-- National Modifiers — schema (templates, triggers, end-triggers)
-- ════════════════════════════════════════════════════════════════════
-- Modifiers are a CHARACTERIZATION layer for nations. Each modifier is
-- a named, categorized situation a nation can be in — like "Booming
-- Economy" or "Civil Unrest" — surfaced on politician-modifiers.html
-- whenever the nation's current stat values satisfy the modifier's
-- trigger conditions. Eight fixed categories cover the playing field:
-- Economy, Standard of Living, Public Order, Industry & Resources,
-- Workforce, Military, Politics, Diplomacy. Each modifier has a
-- severity (green/yellow/red) used purely for color-coding.
--
-- WHAT MODIFIERS DON'T DO
-- ───────────────────────
-- Unlike crises (see create_crisis_tables.sql), modifiers do NOT
-- apply per-tick stat changes. There is no modifier_effects-as-deltas
-- table, no crisis_effects analogue, no active-modifier tick logic.
-- The `effects` column on modifier_templates is a free-text array of
-- prose labels (e.g. "+ foreign investment from non-democracies")
-- that render as descriptive chips on the modifiers page. Whether
-- those labels later acquire mechanical effects is a future decision.
--
-- TABLES
-- ──────
--   modifier_templates       master rows; one per modifier definition
--   modifier_triggers        activation conditions; ALL must match
--   modifier_end_triggers    deactivation conditions; semantics
--                            (ALL vs ANY) decided in commit 3 when
--                            the evaluator lands. Stored shape is
--                            identical to triggers either way.
--
-- TRIGGER STAT KEYS
-- ─────────────────
-- Triggers reference the canonical alpha-28 stat columns on the
-- nations table (see js/game/stats.js NATION_STAT_COLUMNS). Stats
-- the Alpha refactor deleted (inflation, foreign_investment, etc.)
-- are NOT triggerable — they'd never evaluate. The admin UI
-- restricts the stat-picker to the live column list to keep this
-- contract explicit.
--
-- NO RLS
-- ──────
-- Modifier definitions are global game content, not per-user data.
-- Matches the crisis_templates pattern. RLS off here is intentional.

CREATE TABLE IF NOT EXISTS modifier_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    category        TEXT NOT NULL CHECK (category IN (
        'Economy',
        'Standard of Living',
        'Public Order',
        'Industry & Resources',
        'Workforce',
        'Military',
        'Politics',
        'Diplomacy'
    )),
    severity        TEXT NOT NULL CHECK (severity IN ('green', 'yellow', 'red')),
    description     TEXT NOT NULL DEFAULT '',
    effects         TEXT[] NOT NULL DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_modifier_templates_active   ON modifier_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_modifier_templates_category ON modifier_templates(category);

-- Activation triggers — ALL rows for a given modifier must evaluate
-- true against the nation's current stats for the modifier to surface.
-- Operator strings match the crisis_triggers convention ('gte'/'lte').
CREATE TABLE IF NOT EXISTS modifier_triggers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modifier_id     UUID NOT NULL REFERENCES modifier_templates(id) ON DELETE CASCADE,
    stat_key        TEXT NOT NULL,
    operator        TEXT NOT NULL DEFAULT 'gte' CHECK (operator IN ('gte', 'lte')),
    threshold       NUMERIC NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_modifier_triggers_modifier ON modifier_triggers(modifier_id);

-- End triggers — conditions that take the modifier OFF a nation.
-- Stored shape is identical to triggers; combination semantics
-- (ALL vs ANY) belong to the runtime evaluator in commit 3.
CREATE TABLE IF NOT EXISTS modifier_end_triggers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modifier_id     UUID NOT NULL REFERENCES modifier_templates(id) ON DELETE CASCADE,
    stat_key        TEXT NOT NULL,
    operator        TEXT NOT NULL DEFAULT 'lte' CHECK (operator IN ('gte', 'lte')),
    threshold       NUMERIC NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_modifier_end_triggers_modifier ON modifier_end_triggers(modifier_id);
