-- ============================================================
-- Phase 1: Incidents & Conflicts — Core Schema
-- ============================================================
-- Creates all tables for the Incidents system:
--   incidents, incident_events, incident_actions_available,
--   incident_actions_taken, incident_mediation, incident_chat_messages,
--   incident_escalation_log, incident_event_pool, incident_cooldowns
-- Also adds border_types JSONB to diplomatic_relations.
-- ============================================================


-- ==================== TABLE 1: incidents ====================

CREATE TABLE IF NOT EXISTS incidents (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Crisis identity
    incident_type           TEXT NOT NULL
                            CHECK (incident_type IN (
                                'fishing_dispute', 'border_incursion',
                                'dam_water', 'trade_war', 'spy_arrest'
                            )),
    status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN (
                                'active', 'mediating', 'resolving',
                                'resolved', 'war', 'decayed'
                            )),

    -- Participants (canonical ordering: nation_a_id < nation_b_id is NOT enforced
    -- here because role assignment matters — nation_a is always a specific role)
    nation_a_id             UUID NOT NULL REFERENCES nations(id),
    nation_b_id             UUID NOT NULL REFERENCES nations(id),
    nation_a_role           TEXT NOT NULL,
    nation_b_role           TEXT NOT NULL,
    nation_a_gov_type       TEXT NOT NULL,
    nation_b_gov_type       TEXT NOT NULL,

    -- Leverage track (0-10 each, blowback above 10 handled in code)
    leverage_a              INTEGER NOT NULL DEFAULT 0,
    leverage_b              INTEGER NOT NULL DEFAULT 0,

    -- Timing
    started_tick            INTEGER NOT NULL,
    resolved_tick           INTEGER,
    resolution_type         TEXT
                            CHECK (resolution_type IS NULL OR resolution_type IN (
                                'concession_a', 'concession_b',
                                'forced_a', 'forced_b',
                                'mediation', 'negotiated',
                                'war', 'decay',
                                'trial_conviction', 'trial_acquittal',
                                'dam_strike', 'partial_deescalation'
                            )),

    -- Start event reference
    start_event_id          TEXT,

    -- Inaction tracking (ticks since last non-Wait action per side)
    inaction_a_ticks        INTEGER NOT NULL DEFAULT 0,
    inaction_b_ticks        INTEGER NOT NULL DEFAULT 0,

    -- Dam / Water Diversion specific
    water_flow_pct          INTEGER CHECK (water_flow_pct IS NULL OR (water_flow_pct >= 0 AND water_flow_pct <= 100)),
    seasonal_modifier       FLOAT DEFAULT 1.0,
    seasonal_expires_tick   INTEGER,

    -- Border Incursion specific
    occupation_depth_km     INTEGER,
    war_risk_pct            INTEGER DEFAULT 0 CHECK (war_risk_pct IS NULL OR (war_risk_pct >= 0 AND war_risk_pct <= 100)),

    -- Trade War specific
    trade_dependence_a      FLOAT CHECK (trade_dependence_a IS NULL OR (trade_dependence_a >= 0.0 AND trade_dependence_a <= 1.0)),
    trade_dependence_b      FLOAT CHECK (trade_dependence_b IS NULL OR (trade_dependence_b >= 0.0 AND trade_dependence_b <= 1.0)),
    tariff_expansion_count_a INTEGER DEFAULT 0,
    tariff_expansion_count_b INTEGER DEFAULT 0,

    -- Spy Arrest specific
    evidence_level          INTEGER CHECK (evidence_level IS NULL OR (evidence_level >= 1 AND evidence_level <= 5)),
    operative_resilience    INTEGER CHECK (operative_resilience IS NULL OR (operative_resilience >= 1 AND operative_resilience <= 9)),
    remaining_agents        INTEGER CHECK (remaining_agents IS NULL OR (remaining_agents >= 0 AND remaining_agents <= 3)),

    -- Mediation state
    mediation_active        BOOLEAN NOT NULL DEFAULT FALSE,
    mediation_start_tick    INTEGER,
    mediation_end_tick      INTEGER,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_different_nations CHECK (nation_a_id != nation_b_id)
);

CREATE INDEX IF NOT EXISTS idx_incidents_status
    ON incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_nation_a
    ON incidents (nation_a_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_nation_b
    ON incidents (nation_b_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_active
    ON incidents (status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_incidents_type_pair
    ON incidents (incident_type, nation_a_id, nation_b_id) WHERE status IN ('active', 'mediating');


-- ==================== TABLE 2: incident_events ====================

CREATE TABLE IF NOT EXISTS incident_events (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id             UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    tick                    INTEGER NOT NULL,

    event_type              TEXT NOT NULL
                            CHECK (event_type IN (
                                'start_event', 'random_tick', 'player_action',
                                'escalation_threshold', 'blowback', 'resolution',
                                'mediation_proposal', 'mediation_result',
                                'inaction_penalty', 'continuous_effect',
                                'seasonal_change', 'evidence_change', 'mole_event'
                            )),

    event_key               TEXT,
    source_nation_id        UUID REFERENCES nations(id),
    source_role             TEXT,

    -- Leverage shifts applied by this event
    leverage_shift_a        INTEGER NOT NULL DEFAULT 0,
    leverage_shift_b        INTEGER NOT NULL DEFAULT 0,

    -- Display
    event_text              TEXT NOT NULL,
    event_source_label      TEXT,

    -- Action metadata (for player_action events)
    is_action               BOOLEAN NOT NULL DEFAULT FALSE,
    action_style            TEXT CHECK (action_style IS NULL OR action_style IN (
                                'hostile', 'peaceful', 'pressure', 'neutral'
                            )),

    -- Effects
    stat_effects            JSONB,
    metadata                JSONB,

    -- Visibility
    visibility              TEXT NOT NULL DEFAULT 'both'
                            CHECK (visibility IN ('both', 'nation_a', 'nation_b', 'world')),

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_events_incident_tick
    ON incident_events (incident_id, tick DESC);
CREATE INDEX IF NOT EXISTS idx_incident_events_incident_type
    ON incident_events (incident_id, event_type);


-- ==================== TABLE 3: incident_actions_available ====================
-- Reference table — seeded at initialization, not modified at runtime.

CREATE TABLE IF NOT EXISTS incident_actions_available (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type           TEXT NOT NULL,
    nation_role             TEXT NOT NULL,
    gov_type                TEXT NOT NULL,
    action_key              TEXT NOT NULL,
    action_name             TEXT NOT NULL,
    action_description      TEXT NOT NULL,
    required_role           TEXT NOT NULL,
    ap_cost                 INTEGER NOT NULL,
    leverage_min            INTEGER NOT NULL,
    leverage_max            INTEGER NOT NULL,
    cooldown_ticks          INTEGER NOT NULL DEFAULT 0,
    is_one_time             BOOLEAN NOT NULL DEFAULT FALSE,
    requires_action_key     TEXT,
    effects_template        JSONB NOT NULL,
    risk_description        TEXT,
    backfire_chance         FLOAT CHECK (backfire_chance IS NULL OR (backfire_chance >= 0.0 AND backfire_chance <= 1.0)),
    backfire_effects        JSONB,
    escalation_color        TEXT NOT NULL
                            CHECK (escalation_color IN (
                                'escalate', 'pressure', 'diplomatic', 'concede', 'wait'
                            )),

    CONSTRAINT uq_incident_action
        UNIQUE (incident_type, nation_role, gov_type, action_key)
);


-- ==================== TABLE 4: incident_actions_taken ====================

CREATE TABLE IF NOT EXISTS incident_actions_taken (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id             UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    nation_id               UUID NOT NULL REFERENCES nations(id),
    action_key              TEXT NOT NULL,
    tick                    INTEGER NOT NULL,
    ap_spent                INTEGER NOT NULL,
    leverage_rolled         INTEGER NOT NULL,
    backfired               BOOLEAN NOT NULL DEFAULT FALSE,
    effects_applied         JSONB NOT NULL,
    cooldown_until_tick     INTEGER,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_actions_taken_incident_nation
    ON incident_actions_taken (incident_id, nation_id, tick);
CREATE INDEX IF NOT EXISTS idx_incident_actions_taken_action_key
    ON incident_actions_taken (incident_id, action_key);


-- ==================== TABLE 5: incident_mediation ====================

CREATE TABLE IF NOT EXISTS incident_mediation (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id             UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    tick                    INTEGER NOT NULL,
    nation_a_proposed       BOOLEAN NOT NULL DEFAULT FALSE,
    nation_b_proposed       BOOLEAN NOT NULL DEFAULT FALSE,
    outcome                 TEXT CHECK (outcome IS NULL OR outcome IN (
                                'both_proposed', 'a_only', 'b_only', 'neither'
                            )),
    mediation_roll          INTEGER,
    compromise_position     INTEGER,
    resolved                BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_incident_mediation_tick
        UNIQUE (incident_id, tick)
);


-- ==================== TABLE 6: incident_chat_messages ====================

CREATE TABLE IF NOT EXISTS incident_chat_messages (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id             UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    nation_id               UUID NOT NULL REFERENCES nations(id),
    sender_role             TEXT NOT NULL,
    message_text            TEXT NOT NULL,
    tick                    INTEGER NOT NULL,
    is_system               BOOLEAN NOT NULL DEFAULT FALSE,
    chat_context            TEXT NOT NULL DEFAULT 'internal'
                            CHECK (chat_context IN ('internal', 'public')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_chat_context
    ON incident_chat_messages (incident_id, chat_context, created_at);


-- ==================== TABLE 7: incident_escalation_log ====================

CREATE TABLE IF NOT EXISTS incident_escalation_log (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id             UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    threshold               INTEGER NOT NULL,
    nation_side             TEXT NOT NULL CHECK (nation_side IN ('a', 'b')),
    event_key               TEXT NOT NULL,
    tick                    INTEGER NOT NULL,
    effects_applied         JSONB NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_incident_escalation
        UNIQUE (incident_id, threshold, nation_side)
);


-- ==================== TABLE 8: incident_event_pool ====================
-- Reference table — seeded at initialization, not modified at runtime.

CREATE TABLE IF NOT EXISTS incident_event_pool (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type           TEXT NOT NULL,
    event_key               TEXT NOT NULL,
    category                TEXT NOT NULL
                            CHECK (category IN ('start', 'low', 'moderate', 'high')),
    event_text_template     TEXT NOT NULL,
    source_label_template   TEXT,
    leverage_shift_a        INTEGER NOT NULL DEFAULT 0,
    leverage_shift_b        INTEGER NOT NULL DEFAULT 0,
    stat_effects_template   JSONB,
    side_effects            JSONB,
    conditions              JSONB,
    metadata_template       JSONB,

    CONSTRAINT uq_incident_event_pool
        UNIQUE (incident_type, event_key)
);


-- ==================== TABLE 9: incident_cooldowns ====================
-- Tracks per-crisis-type global cooldown (18 ticks between same type)
-- and initial staggered delay (1d15 at system init).

CREATE TABLE IF NOT EXISTS incident_cooldowns (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type           TEXT NOT NULL UNIQUE
                            CHECK (incident_type IN (
                                'fishing_dispute', 'border_incursion',
                                'dam_water', 'trade_war', 'spy_arrest'
                            )),
    last_fired_tick         INTEGER NOT NULL DEFAULT -99,
    cooldown_ticks          INTEGER NOT NULL DEFAULT 18,
    initial_delay_until     INTEGER NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed cooldown rows with staggered initial delays (1d15 = random 1-15).
-- Use generate_series + random to create deterministic but staggered starts.
INSERT INTO incident_cooldowns (incident_type, last_fired_tick, cooldown_ticks, initial_delay_until)
VALUES
    ('fishing_dispute',   -99, 18, floor(random() * 15 + 1)::int),
    ('border_incursion',  -99, 18, floor(random() * 15 + 1)::int),
    ('dam_water',         -99, 18, floor(random() * 15 + 1)::int),
    ('trade_war',         -99, 18, floor(random() * 15 + 1)::int),
    ('spy_arrest',        -99, 18, floor(random() * 15 + 1)::int)
ON CONFLICT (incident_type) DO NOTHING;


-- ==================== BORDER TYPES ====================
-- Add border_types JSONB column to diplomatic_relations.
-- Array of strings: 'land', 'maritime', 'mountain', 'river', 'distant_sea_route'

ALTER TABLE diplomatic_relations
    ADD COLUMN IF NOT EXISTS border_types JSONB DEFAULT '[]'::jsonb;

-- Seed border types for all 15 known pairs (Calveth TBD).
-- Uses LEAST/GREATEST to match the canonical nation_a_id < nation_b_id ordering.

-- Melizea-Avelia: Land, Maritime
UPDATE diplomatic_relations SET border_types = '["land", "maritime"]'::jsonb
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'melizea'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'melizea'));

-- Melizea-Montequilla: Land, Mountain
UPDATE diplomatic_relations SET border_types = '["land", "mountain"]'::jsonb
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'));

-- Melizea-Palvera: Land, Maritime
UPDATE diplomatic_relations SET border_types = '["land", "maritime"]'::jsonb
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'));

-- Melizea-San Estrella: Distant Sea Route
UPDATE diplomatic_relations SET border_types = '["distant_sea_route"]'::jsonb
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'));

-- Melizea-Sangreza: Maritime
UPDATE diplomatic_relations SET border_types = '["maritime"]'::jsonb
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'));

-- Avelia-Montequilla: Land
UPDATE diplomatic_relations SET border_types = '["land"]'::jsonb
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'));

-- Avelia-San Estrella: Land
UPDATE diplomatic_relations SET border_types = '["land"]'::jsonb
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'));

-- Avelia-Palvera: Distant Sea Route
UPDATE diplomatic_relations SET border_types = '["distant_sea_route"]'::jsonb
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'));

-- Avelia-Sangreza: Distant Sea Route
UPDATE diplomatic_relations SET border_types = '["distant_sea_route"]'::jsonb
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'));

-- San Estrella-Montequilla: Land, Maritime
UPDATE diplomatic_relations SET border_types = '["land", "maritime"]'::jsonb
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'montequilla'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'montequilla'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'));

-- San Estrella-Palvera: Distant Sea Route
UPDATE diplomatic_relations SET border_types = '["distant_sea_route"]'::jsonb
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'palvera'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'palvera'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'));

-- San Estrella-Sangreza: Maritime
UPDATE diplomatic_relations SET border_types = '["maritime"]'::jsonb
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'san estrella'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'san estrella'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'));

-- Montequilla-Palvera: Land, Mountain
UPDATE diplomatic_relations SET border_types = '["land", "mountain"]'::jsonb
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'montequilla'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'montequilla'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'));

-- Montequilla-Sangreza: Land, River
UPDATE diplomatic_relations SET border_types = '["land", "river"]'::jsonb
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'montequilla'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'montequilla'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'));

-- Palvera-Sangreza: Land, River, Maritime
UPDATE diplomatic_relations SET border_types = '["land", "river", "maritime"]'::jsonb
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'palvera'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'palvera'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'));


-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_actions_available ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_actions_taken ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_mediation ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_escalation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_event_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_cooldowns ENABLE ROW LEVEL SECURITY;

-- incidents: all authenticated users can read (incidents are public knowledge)
CREATE POLICY incidents_select ON incidents
    FOR SELECT TO authenticated
    USING (true);

-- incidents: only service role can insert/update (tick processor)
CREATE POLICY incidents_insert ON incidents
    FOR INSERT TO service_role
    WITH CHECK (true);

CREATE POLICY incidents_update ON incidents
    FOR UPDATE TO service_role
    USING (true);

-- incident_events: all authenticated can read
CREATE POLICY incident_events_select ON incident_events
    FOR SELECT TO authenticated
    USING (true);

-- incident_events: service role can insert
CREATE POLICY incident_events_insert ON incident_events
    FOR INSERT TO service_role
    WITH CHECK (true);

-- incident_actions_available: all authenticated can read (reference data)
CREATE POLICY incident_actions_available_select ON incident_actions_available
    FOR SELECT TO authenticated
    USING (true);

-- incident_actions_available: service role can manage (seeding)
CREATE POLICY incident_actions_available_all ON incident_actions_available
    FOR ALL TO service_role
    USING (true);

-- incident_actions_taken: all authenticated can read
CREATE POLICY incident_actions_taken_select ON incident_actions_taken
    FOR SELECT TO authenticated
    USING (true);

-- incident_actions_taken: service role can insert (action execution goes through server)
CREATE POLICY incident_actions_taken_insert ON incident_actions_taken
    FOR INSERT TO service_role
    WITH CHECK (true);

-- incident_mediation: all authenticated can read
CREATE POLICY incident_mediation_select ON incident_mediation
    FOR SELECT TO authenticated
    USING (true);

-- incident_mediation: service role can manage
CREATE POLICY incident_mediation_all ON incident_mediation
    FOR ALL TO service_role
    USING (true);

-- incident_chat_messages: authenticated can read messages for their nation
-- Internal chat: only your nation. Public chat: everyone.
CREATE POLICY incident_chat_select ON incident_chat_messages
    FOR SELECT TO authenticated
    USING (
        chat_context = 'public'
        OR nation_id IN (
            SELECT f.nation_id FROM factions f
            WHERE f.user_id = auth.uid()
        )
    );

-- incident_chat_messages: authenticated can insert for their nation
CREATE POLICY incident_chat_insert ON incident_chat_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        nation_id IN (
            SELECT f.nation_id FROM factions f
            WHERE f.user_id = auth.uid()
        )
    );

-- incident_chat_messages: service role can insert system messages
CREATE POLICY incident_chat_system_insert ON incident_chat_messages
    FOR INSERT TO service_role
    WITH CHECK (true);

-- incident_escalation_log: all authenticated can read
CREATE POLICY incident_escalation_log_select ON incident_escalation_log
    FOR SELECT TO authenticated
    USING (true);

-- incident_escalation_log: service role can insert
CREATE POLICY incident_escalation_log_insert ON incident_escalation_log
    FOR INSERT TO service_role
    WITH CHECK (true);

-- incident_event_pool: all authenticated can read (reference data)
CREATE POLICY incident_event_pool_select ON incident_event_pool
    FOR SELECT TO authenticated
    USING (true);

-- incident_event_pool: service role can manage (seeding)
CREATE POLICY incident_event_pool_all ON incident_event_pool
    FOR ALL TO service_role
    USING (true);

-- incident_cooldowns: all authenticated can read
CREATE POLICY incident_cooldowns_select ON incident_cooldowns
    FOR SELECT TO authenticated
    USING (true);

-- incident_cooldowns: service role can manage
CREATE POLICY incident_cooldowns_all ON incident_cooldowns
    FOR ALL TO service_role
    USING (true);
