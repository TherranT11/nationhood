-- ==================== CRISIS SYSTEM TABLES ====================
-- Persistent crises that activate when multiple nation stats reach critical thresholds,
-- apply cascading effects every tick while active, and resolve when stats recover.

-- 1. Master crisis definitions
CREATE TABLE IF NOT EXISTS crisis_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crisis_templates_active ON crisis_templates(is_active);

-- 2. Activation triggers (up to 7 per crisis — ALL must be met)
CREATE TABLE IF NOT EXISTS crisis_triggers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crisis_id       UUID NOT NULL REFERENCES crisis_templates(id) ON DELETE CASCADE,
    stat_key        TEXT NOT NULL,
    operator        TEXT NOT NULL DEFAULT 'gte',   -- 'gte' (>=) or 'lte' (<=)
    threshold       NUMERIC NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_crisis_triggers_crisis ON crisis_triggers(crisis_id);

-- 3. Effects applied every tick while crisis is active (up to 7)
CREATE TABLE IF NOT EXISTS crisis_effects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crisis_id       UUID NOT NULL REFERENCES crisis_templates(id) ON DELETE CASCADE,
    target          TEXT NOT NULL DEFAULT 'nation',
        -- 'nation'              → change nation stat (uses stat_key)
        -- 'government_approval' → change approval_rating for all coalition parties
        -- 'minister_approval'   → change minister_approval for specific minister (uses minister_key)
        -- 'coalition_approval'  → change approval_rating for all coalition parties
    stat_key        TEXT,           -- required when target = 'nation'
    minister_key    TEXT,           -- required when target = 'minister_approval'
    change_per_tick NUMERIC NOT NULL DEFAULT 0,
    stat_floor      NUMERIC DEFAULT NULL   -- floor (if change negative) or ceiling (if change positive); NULL = no limit (uses 0-100)
);

CREATE INDEX IF NOT EXISTS idx_crisis_effects_crisis ON crisis_effects(crisis_id);

-- 4. Recovery / end triggers (ALL must be met to resolve the crisis)
CREATE TABLE IF NOT EXISTS crisis_end_triggers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crisis_id       UUID NOT NULL REFERENCES crisis_templates(id) ON DELETE CASCADE,
    stat_key        TEXT NOT NULL,
    operator        TEXT NOT NULL DEFAULT 'lte',   -- 'gte' (>=) or 'lte' (<=)
    threshold       NUMERIC NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_crisis_end_triggers_crisis ON crisis_end_triggers(crisis_id);

-- 5. Runtime tracking — which crises are currently active per nation
CREATE TABLE IF NOT EXISTS active_crises (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crisis_id       UUID NOT NULL REFERENCES crisis_templates(id) ON DELETE CASCADE,
    nation_id       UUID NOT NULL,
    started_at_tick INT NOT NULL,
    effects_applied_log JSONB DEFAULT '[]'::jsonb,

    UNIQUE(crisis_id, nation_id)
);

CREATE INDEX IF NOT EXISTS idx_active_crises_nation ON active_crises(nation_id);
CREATE INDEX IF NOT EXISTS idx_active_crises_crisis ON active_crises(crisis_id);
