-- ============================================================
-- BILATERAL ISSUES SYSTEM — Phase 1 Schema
-- ============================================================
-- Issues are persistent bilateral disputes between nations.
-- They carry tension (0-10), favor (-5 to +5), and modifiers
-- that bleed stats each tick. At tension 10 the issue escalates
-- to an incident.
--
-- Pipeline: Issue → Incident → Conflict (future)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. bilateral_issues — core issue record
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bilateral_issues (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Type key (e.g. 'maritime_fishing_rights')
    issue_type          TEXT NOT NULL,

    -- The two nations involved
    -- Canonical ordering: nation_a_id < nation_b_id
    nation_a_id         UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    nation_b_id         UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,

    -- Tension: 0-10 integer. Thresholds: Low 0-2, Moderate 3-5, High 6-8, Critical 9-10. At 10 → escalates to incident.
    tension             INTEGER NOT NULL DEFAULT 0 CHECK (tension >= 0 AND tension <= 10),

    -- Favor: -5 to +5. Negative = favors nation_a, positive = favors nation_b. 0 = neutral.
    favor               NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (favor >= -5 AND favor <= 5),

    -- Status lifecycle
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
        'active',           -- ongoing, modifiers ticking
        'partial',          -- 3+ of 5 structural modifiers resolved
        'resolved',         -- all structural modifiers removed
        'escalated',        -- tension hit 10, spawned an incident
        'dormant'           -- archived, can re-emerge
    )),

    -- Link to the incident spawned on escalation (if any)
    escalated_to_incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,

    -- Timing
    created_tick        INTEGER NOT NULL,
    resolved_tick       INTEGER,
    escalated_tick      INTEGER,

    -- Tracks how many ticks have passed with no diplomatic action by either side
    -- Used to auto-spawn competitive modifiers (e.g. Overfishing after 10 idle ticks)
    ticks_without_diplomatic_action INTEGER NOT NULL DEFAULT 0,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_issue_different_nations CHECK (nation_a_id != nation_b_id),
    CONSTRAINT chk_issue_nation_order CHECK (nation_a_id < nation_b_id),
    CONSTRAINT uq_issue_type_pair UNIQUE (issue_type, nation_a_id, nation_b_id)
);

CREATE INDEX idx_bilateral_issues_active
    ON bilateral_issues (status)
    WHERE status IN ('active', 'partial');

CREATE INDEX idx_bilateral_issues_nation_a
    ON bilateral_issues (nation_a_id)
    WHERE status IN ('active', 'partial');

CREATE INDEX idx_bilateral_issues_nation_b
    ON bilateral_issues (nation_b_id)
    WHERE status IN ('active', 'partial');


-- ────────────────────────────────────────────────────────────
-- 2. bilateral_issue_modifiers — active modifiers on an issue
-- ────────────────────────────────────────────────────────────
-- Each modifier bleeds stats per-tick until removed or expired.
-- Modifiers are added at issue creation (structural) or by
-- actions/auto-triggers (competitive/escalation).
CREATE TABLE IF NOT EXISTS bilateral_issue_modifiers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id            UUID NOT NULL REFERENCES bilateral_issues(id) ON DELETE CASCADE,

    -- Modifier identity (e.g. 'no_defined_maritime_territories', 'overfishing')
    modifier_key        TEXT NOT NULL,

    -- Category for display grouping
    category            TEXT NOT NULL CHECK (category IN ('structural', 'competitive', 'escalation')),

    -- Which nation(s) this modifier's stat effects apply to
    -- 'both', 'nation_a', 'nation_b', 'disfavored' (computed at tick time from favor)
    applies_to          TEXT NOT NULL DEFAULT 'both' CHECK (applies_to IN ('both', 'nation_a', 'nation_b', 'disfavored', 'favored')),

    -- Stat effects applied each tick while active
    -- Format: [{ "stat_key": "stability", "delta": -0.1 }, ...]
    stat_effects        JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Duration tracking
    -- NULL = persistent (only removed by action)
    -- > 0 = ticks remaining, decremented each tick, removed at 0
    duration_remaining  INTEGER,

    -- Periodic modifiers (e.g. Seasonal Fishing Conflict)
    -- If set, modifier auto-fires every N ticks for active_duration ticks
    is_periodic         BOOLEAN NOT NULL DEFAULT FALSE,
    periodic_interval   INTEGER,            -- fires every N ticks
    periodic_duration   INTEGER,            -- active for N ticks each firing
    periodic_next_tick  INTEGER,            -- next tick this modifier fires
    is_periodic_active  BOOLEAN NOT NULL DEFAULT FALSE,  -- currently in an active window

    -- Is this modifier currently applying effects?
    -- FALSE for periodic modifiers between active windows, or resolved modifiers kept for history
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,

    -- What created this modifier
    created_by          TEXT,               -- 'issue_creation', 'auto:10_idle_ticks', 'action:expand_fleet', etc.
    created_tick        INTEGER NOT NULL,

    -- What resolved it (NULL if still active)
    resolved_by         TEXT,               -- 'action:negotiate_catch_quotas', 'expiry', etc.
    resolved_tick       INTEGER,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate active modifiers of the same key on the same issue
    CONSTRAINT uq_active_modifier UNIQUE (issue_id, modifier_key)
);

CREATE INDEX idx_issue_modifiers_active
    ON bilateral_issue_modifiers (issue_id, is_active)
    WHERE is_active = TRUE;


-- ────────────────────────────────────────────────────────────
-- 3. bilateral_issue_actions_taken — log of actions used
-- ────────────────────────────────────────────────────────────
-- Each action is ONE-TIME USE per issue per nation.
-- Diplomatic actions have a pending/accepted/rejected flow.
CREATE TABLE IF NOT EXISTS bilateral_issue_actions_taken (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id            UUID NOT NULL REFERENCES bilateral_issues(id) ON DELETE CASCADE,

    -- Which nation took (or proposed) the action
    acting_nation_id    UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,

    -- Which faction initiated it (for role validation / AP deduction)
    acting_faction_id   UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,

    -- Action identity (e.g. 'propose_shared_maritime_survey')
    action_key          TEXT NOT NULL,

    -- Category
    action_category     TEXT NOT NULL CHECK (action_category IN ('diplomatic', 'unilateral', 'threatening')),

    -- Tick the action was submitted
    submitted_tick      INTEGER NOT NULL,

    -- For diplomatic actions: pending until other side responds
    status              TEXT NOT NULL DEFAULT 'executed' CHECK (status IN (
        'pending',          -- diplomatic proposal awaiting response
        'accepted',         -- diplomatic proposal accepted
        'rejected',         -- diplomatic proposal rejected
        'executed'          -- unilateral/threatening: immediate effect
    )),

    -- The nation that needs to respond (for diplomatic actions)
    target_nation_id    UUID REFERENCES nations(id) ON DELETE CASCADE,

    -- Tick the response was given (for diplomatic actions)
    response_tick       INTEGER,

    -- Which faction responded (for diplomatic actions)
    responding_faction_id UUID REFERENCES factions(id) ON DELETE CASCADE,

    -- AP spent
    ap_spent            INTEGER NOT NULL DEFAULT 0,

    -- Treasury cost (if any, e.g. $15M for Subsidize Fleet)
    treasury_cost       NUMERIC(12,2) NOT NULL DEFAULT 0,

    -- Effects that were actually applied (snapshot for history)
    effects_applied     JSONB,

    -- Modifiers added/removed by this action
    modifiers_added     JSONB DEFAULT '[]'::jsonb,    -- ['domestic_fleet_expansion']
    modifiers_removed   JSONB DEFAULT '[]'::jsonb,    -- ['no_defined_quotas', 'overfishing']

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One-time use: each action_key can only be used once per nation per issue
    CONSTRAINT uq_action_per_nation UNIQUE (issue_id, acting_nation_id, action_key)
);

CREATE INDEX idx_issue_actions_issue
    ON bilateral_issue_actions_taken (issue_id, submitted_tick DESC);

CREATE INDEX idx_issue_actions_pending
    ON bilateral_issue_actions_taken (target_nation_id, status)
    WHERE status = 'pending';


-- ────────────────────────────────────────────────────────────
-- 4. bilateral_issue_history — timeline of events
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bilateral_issue_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id            UUID NOT NULL REFERENCES bilateral_issues(id) ON DELETE CASCADE,
    tick                INTEGER NOT NULL,

    event_type          TEXT NOT NULL CHECK (event_type IN (
        'created',              -- issue spawned
        'modifier_added',       -- modifier appeared (auto or action)
        'modifier_removed',     -- modifier resolved/expired
        'modifier_fired',       -- periodic modifier activated
        'action_proposed',      -- diplomatic proposal submitted
        'action_accepted',      -- diplomatic proposal accepted
        'action_rejected',      -- diplomatic proposal rejected
        'action_executed',      -- unilateral/threatening action taken
        'tension_changed',      -- tension level shifted
        'favor_changed',        -- favor shifted
        'status_changed',       -- partial, resolved, escalated
        'escalated'             -- became an incident
    )),

    -- Human-readable event description
    event_text          TEXT NOT NULL,

    -- Optional structured metadata
    -- e.g. { "action_key": "deploy_cutters", "tension_before": 6, "tension_after": 8 }
    metadata            JSONB,

    -- Which nation caused this event (NULL for auto/system events)
    caused_by_nation_id UUID REFERENCES nations(id) ON DELETE SET NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_issue_history_timeline
    ON bilateral_issue_history (issue_id, tick DESC);


-- ────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

-- bilateral_issues: everyone can read, service_role writes
ALTER TABLE bilateral_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bilateral_issues_select"
    ON bilateral_issues FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "bilateral_issues_service_insert"
    ON bilateral_issues FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "bilateral_issues_service_update"
    ON bilateral_issues FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- bilateral_issue_modifiers: everyone can read, service_role writes
ALTER TABLE bilateral_issue_modifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bilateral_issue_modifiers_select"
    ON bilateral_issue_modifiers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "bilateral_issue_modifiers_service_insert"
    ON bilateral_issue_modifiers FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "bilateral_issue_modifiers_service_update"
    ON bilateral_issue_modifiers FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "bilateral_issue_modifiers_service_delete"
    ON bilateral_issue_modifiers FOR DELETE
    TO service_role
    USING (true);

-- bilateral_issue_actions_taken: everyone can read, authenticated can insert (player actions), service_role can update
ALTER TABLE bilateral_issue_actions_taken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bilateral_issue_actions_select"
    ON bilateral_issue_actions_taken FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "bilateral_issue_actions_insert"
    ON bilateral_issue_actions_taken FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "bilateral_issue_actions_service_update"
    ON bilateral_issue_actions_taken FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- bilateral_issue_history: everyone can read, service_role writes
ALTER TABLE bilateral_issue_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bilateral_issue_history_select"
    ON bilateral_issue_history FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "bilateral_issue_history_service_insert"
    ON bilateral_issue_history FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Allow authenticated to insert history (for player action events)
CREATE POLICY "bilateral_issue_history_auth_insert"
    ON bilateral_issue_history FOR INSERT
    TO authenticated
    WITH CHECK (true);
