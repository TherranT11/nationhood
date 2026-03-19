-- Protest System — core tables and faction columns
-- Manages protest actions, endorsements, crisis tracking, and cooldowns.

-- ═══════════════════════════════════════════════════════════════════
-- 1. Protest Log — one row per protest action
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS protest_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    faction_id      UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    tick_called     INTEGER NOT NULL,
    tick_resolved   INTEGER,            -- NULL while resolving
    status          TEXT NOT NULL DEFAULT 'resolving'
                    CHECK (status IN ('resolving','resolved','crisis_active','called_off','expired','election_ended')),

    -- Grievance target
    grievance_type  TEXT NOT NULL CHECK (grievance_type IN ('minister','activePolicy','statFailure')),
    grievance_data  JSONB NOT NULL DEFAULT '{}',
    demand_label    TEXT,

    -- Turnout result (filled on resolution)
    condition_score REAL,
    turnout_score   REAL,
    tier            INTEGER CHECK (tier BETWEEN 1 AND 7),

    -- Roll breakdown for transparency
    roll_breakdown  JSONB,              -- { base, civil_unrest, happiness, ... }

    -- Effects applied
    effects_applied JSONB DEFAULT '[]',

    -- AP cost paid
    ap_cost         INTEGER NOT NULL DEFAULT 2,

    -- Use counter at time of call (for audit)
    use_count_at_call INTEGER NOT NULL DEFAULT 0,

    -- Tier 6/7 crisis tracking
    crisis_started_tick  INTEGER,
    crisis_duration      INTEGER,       -- max ticks for crisis
    crisis_ended_tick    INTEGER,

    -- Tier 7 demand
    tier7_demand    JSONB,              -- { type, stat, magnitude, direction, label } or { type:'minister', target, label }
    tier7_demand_met BOOLEAN DEFAULT FALSE,

    -- Public Address tracking
    public_address_last_tick INTEGER,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_protest_log_nation ON protest_log(nation_id);
CREATE INDEX IF NOT EXISTS idx_protest_log_faction ON protest_log(faction_id);
CREATE INDEX IF NOT EXISTS idx_protest_log_status ON protest_log(nation_id, status);
CREATE INDEX IF NOT EXISTS idx_protest_log_tick ON protest_log(nation_id, tick_called);

-- ═══════════════════════════════════════════════════════════════════
-- 2. Protest Endorsements — one row per endorsing party per protest
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS protest_endorsements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protest_id      UUID NOT NULL REFERENCES protest_log(id) ON DELETE CASCADE,
    faction_id      UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    tick_endorsed   INTEGER NOT NULL,
    ap_cost         INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (protest_id, faction_id)
);

CREATE INDEX IF NOT EXISTS idx_protest_endorsements_protest ON protest_endorsements(protest_id);
CREATE INDEX IF NOT EXISTS idx_protest_endorsements_faction ON protest_endorsements(faction_id);

-- ═══════════════════════════════════════════════════════════════════
-- 3. Faction columns for protest state
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE factions ADD COLUMN IF NOT EXISTS protest_use_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS protest_last_use_tick INTEGER;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS protest_cooldown_until_tick INTEGER;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS protest_locked_by TEXT;  -- NULL, or protest_log.id::text of locking T6/T7
ALTER TABLE factions ADD COLUMN IF NOT EXISTS pyrrhic_victory_until_tick INTEGER;  -- Tick when pyrrhic victory commitment expires

-- ═══════════════════════════════════════════════════════════════════
-- 4. RLS — public read, system write
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE protest_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE protest_endorsements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS protest_log_select ON protest_log;
CREATE POLICY protest_log_select ON protest_log FOR SELECT USING (true);

DROP POLICY IF EXISTS protest_endorsements_select ON protest_endorsements;
CREATE POLICY protest_endorsements_select ON protest_endorsements FOR SELECT USING (true);

-- Service role can do everything (advance-tick, RPCs)
DROP POLICY IF EXISTS protest_log_service ON protest_log;
CREATE POLICY protest_log_service ON protest_log FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS protest_endorsements_service ON protest_endorsements;
CREATE POLICY protest_endorsements_service ON protest_endorsements FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════
-- 5. RPC: execute_protest — atomic AP deduction + log insertion
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION execute_protest(
    p_faction_id UUID,
    p_nation_id UUID,
    p_ap_cost INTEGER,
    p_grievance_type TEXT,
    p_grievance_data JSONB,
    p_demand_label TEXT,
    p_use_count INTEGER,
    p_tick INTEGER
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_ap INTEGER;
    v_protest_id UUID;
BEGIN
    -- Atomic AP check and deduction
    SELECT action_points INTO v_current_ap
    FROM factions WHERE id = p_faction_id FOR UPDATE;

    IF v_current_ap IS NULL THEN
        RAISE EXCEPTION 'Faction not found';
    END IF;
    IF v_current_ap < p_ap_cost THEN
        RAISE EXCEPTION 'Insufficient AP: have %, need %', v_current_ap, p_ap_cost;
    END IF;

    UPDATE factions SET
        action_points = action_points - p_ap_cost,
        protest_use_count = p_use_count + 1,
        protest_last_use_tick = p_tick,
        last_action_tick = p_tick
    WHERE id = p_faction_id;

    INSERT INTO protest_log (
        nation_id, faction_id, tick_called, status,
        grievance_type, grievance_data, demand_label,
        ap_cost, use_count_at_call
    ) VALUES (
        p_nation_id, p_faction_id, p_tick, 'resolving',
        p_grievance_type, p_grievance_data, p_demand_label,
        p_ap_cost, p_use_count
    ) RETURNING id INTO v_protest_id;

    RETURN v_protest_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 6. RPC: endorse_protest — atomic AP deduction + endorsement
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION endorse_protest(
    p_faction_id UUID,
    p_protest_id UUID,
    p_tick INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_ap INTEGER;
BEGIN
    SELECT action_points INTO v_current_ap
    FROM factions WHERE id = p_faction_id FOR UPDATE;

    IF v_current_ap IS NULL THEN
        RAISE EXCEPTION 'Faction not found';
    END IF;
    IF v_current_ap < 1 THEN
        RAISE EXCEPTION 'Insufficient AP: have %, need 1', v_current_ap;
    END IF;

    UPDATE factions SET
        action_points = action_points - 1,
        last_action_tick = p_tick
    WHERE id = p_faction_id;

    INSERT INTO protest_endorsements (protest_id, faction_id, tick_endorsed, ap_cost)
    VALUES (p_protest_id, p_faction_id, p_tick, 1)
    ON CONFLICT (protest_id, faction_id) DO NOTHING;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 7. RPC: protest_update — generic protest_log update + lockout clearing
--    Used by client-side government response actions (PA, EPO, NE, call-off)
--    that cannot write to protest_log directly due to RLS.
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION protest_update(
    p_protest_id UUID,
    p_updates JSONB,
    p_clear_lockouts BOOLEAN DEFAULT FALSE,
    p_cooldown_faction_id UUID DEFAULT NULL,
    p_cooldown_until INTEGER DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Apply updates to the protest_log row
    -- Only allow known safe columns
    UPDATE protest_log SET
        status = COALESCE((p_updates->>'status')::TEXT, status),
        tick_resolved = COALESCE((p_updates->>'tick_resolved')::INTEGER, tick_resolved),
        crisis_ended_tick = COALESCE((p_updates->>'crisis_ended_tick')::INTEGER, crisis_ended_tick),
        public_address_last_tick = COALESCE((p_updates->>'public_address_last_tick')::INTEGER, public_address_last_tick),
        tier = COALESCE((p_updates->>'tier')::INTEGER, tier),
        crisis_started_tick = COALESCE((p_updates->>'crisis_started_tick')::INTEGER, crisis_started_tick),
        crisis_duration = COALESCE((p_updates->>'crisis_duration')::INTEGER, crisis_duration),
        tier7_demand = COALESCE((p_updates->'tier7_demand')::JSONB, tier7_demand),
        effects_applied = COALESCE((p_updates->'effects_applied')::JSONB, effects_applied)
    WHERE id = p_protest_id;

    -- Clear lockouts on all factions locked by this protest
    IF p_clear_lockouts THEN
        UPDATE factions SET protest_locked_by = NULL
        WHERE protest_locked_by = p_protest_id::TEXT;
    END IF;

    -- Set cooldown on a specific faction
    IF p_cooldown_faction_id IS NOT NULL AND p_cooldown_until IS NOT NULL THEN
        UPDATE factions SET protest_cooldown_until_tick = p_cooldown_until
        WHERE id = p_cooldown_faction_id;
    END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 8. Crisis templates for Tier 6 and Tier 7
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO crisis_templates (id, name, description, is_active, crisis_type)
VALUES (
    '00000000-0000-0000-0000-000000000020',
    'Historic Protest',
    'A historic protest grips the nation. Government approval and stability erode each day as protesters demand change.',
    false,
    'stat'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO crisis_templates (id, name, description, is_active, crisis_type)
VALUES (
    '00000000-0000-0000-0000-000000000021',
    'Nationwide Protest',
    'Nationwide protests have paralyzed the country. The economy suffers as millions take to the streets demanding immediate government action.',
    false,
    'stat'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Display effects for crisis cards (nation.html "Rising" section)
INSERT INTO crisis_effects (crisis_id, target, stat_key, change_per_tick)
VALUES
    ('00000000-0000-0000-0000-000000000020', 'government_approval', 'gov_approval', -2),
    ('00000000-0000-0000-0000-000000000020', 'nation', 'civil_unrest', 2),
    ('00000000-0000-0000-0000-000000000020', 'nation', 'happiness', -1),
    ('00000000-0000-0000-0000-000000000021', 'government_approval', 'gov_approval', -3),
    ('00000000-0000-0000-0000-000000000021', 'nation', 'civil_unrest', 3),
    ('00000000-0000-0000-0000-000000000021', 'nation', 'happiness', -1),
    ('00000000-0000-0000-0000-000000000021', 'nation', 'political_violence', 1)
ON CONFLICT DO NOTHING;
