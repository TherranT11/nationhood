-- ============================================================================
-- ELECTORATE SYSTEM MIGRATION — PHASE 1: NEW TABLES
-- ============================================================================
-- Creates all new tables for the electorate system rewrite.
-- Old tables (voter_blocs, faction_bloc_approval) are NOT dropped here —
-- that happens in Phase 9 after the new system is fully wired.
--
-- Run order: safe to run in one pass, each table depends only on nations/factions.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. electorate_profile
-- ────────────────────────────────────────────────────────────────────────────
-- One row per nation. Demographic distributions + ideological distribution
-- means/variances + axis salience weights. Generated from nation stats at
-- game creation, updated periodically by tick engine.

CREATE TABLE IF NOT EXISTS electorate_profile (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id         UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,

    -- Age distribution (sum to 100)
    age_18_29         DECIMAL(5,2) DEFAULT 22,
    age_30_44         DECIMAL(5,2) DEFAULT 28,
    age_45_64         DECIMAL(5,2) DEFAULT 30,
    age_65plus        DECIMAL(5,2) DEFAULT 20,

    -- Income distribution (sum to 100)
    income_low        DECIMAL(5,2) DEFAULT 28,
    income_middle     DECIMAL(5,2) DEFAULT 38,
    income_upper      DECIMAL(5,2) DEFAULT 22,
    income_high       DECIMAL(5,2) DEFAULT 12,

    -- Education distribution (sum to 100)
    edu_nodegree      DECIMAL(5,2) DEFAULT 48,
    edu_undergrad     DECIMAL(5,2) DEFAULT 38,
    edu_postgrad      DECIMAL(5,2) DEFAULT 14,

    -- Urbanization distribution (sum to 100)
    urban_rural       DECIMAL(5,2) DEFAULT 22,
    urban_smalltown   DECIMAL(5,2) DEFAULT 20,
    urban_suburban    DECIMAL(5,2) DEFAULT 32,
    urban_urban       DECIMAL(5,2) DEFAULT 26,

    -- Religion distribution (sum to 100)
    religion_secular  DECIMAL(5,2) DEFAULT 30,
    religion_moderate DECIMAL(5,2) DEFAULT 42,
    religion_devout   DECIMAL(5,2) DEFAULT 28,

    -- Nativity distribution (sum to 100)
    nativity_majority   DECIMAL(5,2) DEFAULT 72,
    nativity_minority   DECIMAL(5,2) DEFAULT 16,
    nativity_immigrant  DECIMAL(5,2) DEFAULT 12,

    -- Ideological distribution means (0–100 scale, 50 = center)
    ideo_mean_tradition_progress          DECIMAL(5,2) DEFAULT 50,
    ideo_mean_liberty_equality            DECIMAL(5,2) DEFAULT 50,
    ideo_mean_security_freedom            DECIMAL(5,2) DEFAULT 50,
    ideo_mean_globalism_nationalism       DECIMAL(5,2) DEFAULT 50,
    ideo_mean_individualism_collectivism  DECIMAL(5,2) DEFAULT 50,

    -- Ideological variance per axis (0–50, higher = more spread)
    ideo_var_tradition_progress           DECIMAL(5,2) DEFAULT 20,
    ideo_var_liberty_equality             DECIMAL(5,2) DEFAULT 20,
    ideo_var_security_freedom             DECIMAL(5,2) DEFAULT 20,
    ideo_var_globalism_nationalism        DECIMAL(5,2) DEFAULT 20,
    ideo_var_individualism_collectivism   DECIMAL(5,2) DEFAULT 20,

    -- Axis salience weights (sum to 1.0)
    salience_tradition_progress           DECIMAL(4,3) DEFAULT 0.200,
    salience_liberty_equality             DECIMAL(4,3) DEFAULT 0.200,
    salience_security_freedom             DECIMAL(4,3) DEFAULT 0.200,
    salience_globalism_nationalism        DECIMAL(4,3) DEFAULT 0.200,
    salience_individualism_collectivism   DECIMAL(4,3) DEFAULT 0.200,

    -- Mood
    enthusiasm        DECIMAL(5,2) DEFAULT 50,

    last_updated_tick INTEGER DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT uq_electorate_profile_nation UNIQUE (nation_id)
);

CREATE INDEX IF NOT EXISTS idx_electorate_profile_nation
    ON electorate_profile(nation_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 2. issue_state
-- ────────────────────────────────────────────────────────────────────────────
-- One row per (nation, issue). Tracks salience, ownership, pioneer status.
-- 8 issues seeded per nation at genesis:
--   cost_of_living, immigration, healthcare, unemployment,
--   corruption, education, infrastructure, climate

CREATE TABLE IF NOT EXISTS issue_state (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id           UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    issue_id            VARCHAR(50) NOT NULL,

    salience            DECIMAL(5,2) DEFAULT 30,
    salience_target     DECIMAL(5,2) DEFAULT 30,
    salience_floor      DECIMAL(5,2) DEFAULT 5,

    owned_by            UUID REFERENCES factions(id) ON DELETE SET NULL,
    pioneer_faction_id  UUID REFERENCES factions(id) ON DELETE SET NULL,
    pioneer_ticks_held  INTEGER DEFAULT 0,

    last_updated_tick   INTEGER DEFAULT 0,

    CONSTRAINT uq_issue_state_nation_issue UNIQUE (nation_id, issue_id)
);

CREATE INDEX IF NOT EXISTS idx_issue_state_nation
    ON issue_state(nation_id);
CREATE INDEX IF NOT EXISTS idx_issue_state_salience
    ON issue_state(nation_id, salience DESC);


-- ────────────────────────────────────────────────────────────────────────────
-- 3. faction_issue_stance
-- ────────────────────────────────────────────────────────────────────────────
-- One row per (faction, nation, issue). Max 5 active stances per faction.
-- Stances decay each tick (strength -= decay_rate) and are removed at 0.

CREATE TABLE IF NOT EXISTS faction_issue_stance (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id                  UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id                   UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    issue_id                    VARCHAR(50) NOT NULL,

    axis                        VARCHAR(50) NOT NULL,
    side                        VARCHAR(10) NOT NULL CHECK (side IN ('left', 'right')),
    intensity                   VARCHAR(10) NOT NULL CHECK (intensity IN ('centrist', 'moderate', 'radical')),

    strength                    DECIMAL(5,2) DEFAULT 100,
    decay_rate                  DECIMAL(4,2) NOT NULL,
    -- centrist = 2, moderate = 4, radical = 8

    ticks_held                  INTEGER DEFAULT 0,
    ticks_at_current_intensity  INTEGER DEFAULT 0,
    last_intensity_change_tick  INTEGER,

    ideologically_consistent    BOOLEAN DEFAULT TRUE,
    is_pioneer                  BOOLEAN DEFAULT FALSE,

    created_tick                INTEGER,

    CONSTRAINT uq_faction_issue_stance UNIQUE (faction_id, nation_id, issue_id)
);

CREATE INDEX IF NOT EXISTS idx_faction_issue_stance_faction
    ON faction_issue_stance(faction_id, nation_id);
CREATE INDEX IF NOT EXISTS idx_faction_issue_stance_issue
    ON faction_issue_stance(nation_id, issue_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 4. faction_electoral_standing
-- ────────────────────────────────────────────────────────────────────────────
-- One row per (faction, nation). The main output table — three pillars,
-- visibility, credibility, vote shares, pillar contributions, and polled
-- snapshot values.

CREATE TABLE IF NOT EXISTS faction_electoral_standing (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id                  UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id                   UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,

    -- Three pillars
    ideological_alignment       DECIMAL(5,2) DEFAULT 50,
    platform_appeal             DECIMAL(5,2) DEFAULT 0,
    party_approval              DECIMAL(5,2) DEFAULT 25,

    -- Platform appeal breakdown
    ideology_baseline           DECIMAL(5,2),
    stance_contribution_total   DECIMAL(5,2),
    platform_ceiling            DECIMAL(5,2),

    -- Visibility (turnout multiplier, not a pillar)
    visibility                  DECIMAL(5,2) DEFAULT 0,

    -- Credibility components
    credibility_modifier                DECIMAL(4,3) DEFAULT 0.500,
    credibility_radius_component        DECIMAL(4,3) DEFAULT 0,
    credibility_promise_component       DECIMAL(4,3) DEFAULT 0,
    credibility_recovery_suspended_until INTEGER DEFAULT 0,

    -- Vote output
    raw_appeal                  DECIMAL(5,2),
    vote_weight                 DECIMAL(5,2),
    contested_vote_share        DECIMAL(5,4),
    base_vote_share             DECIMAL(5,4),
    realized_vote_share         DECIMAL(5,4),
    turnout_rate                DECIMAL(4,3),

    -- Per-pillar contribution to final vote share (for display)
    alignment_contribution      DECIMAL(5,4),
    appeal_contribution         DECIMAL(5,4),
    approval_contribution       DECIMAL(5,4),
    vote_left_on_table          DECIMAL(5,4),

    -- Polling snapshot (updated only when player runs Poll Now)
    last_polled_tick                INTEGER DEFAULT 0,
    polled_alignment                DECIMAL(5,2),
    polled_platform_appeal          DECIMAL(5,2),
    polled_party_approval           DECIMAL(5,2),
    polled_visibility               DECIMAL(5,2),
    polled_credibility              DECIMAL(4,3),
    polled_vote_share               DECIMAL(5,4),
    polled_alignment_contribution   DECIMAL(5,4),
    polled_appeal_contribution      DECIMAL(5,4),
    polled_approval_contribution    DECIMAL(5,4),
    polled_vote_left_on_table       DECIMAL(5,4),

    last_updated_tick           INTEGER DEFAULT 0,

    CONSTRAINT uq_faction_electoral_standing UNIQUE (faction_id, nation_id)
);

CREATE INDEX IF NOT EXISTS idx_faction_electoral_standing_faction
    ON faction_electoral_standing(faction_id);
CREATE INDEX IF NOT EXISTS idx_faction_electoral_standing_nation
    ON faction_electoral_standing(nation_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 5. party_bases
-- ────────────────────────────────────────────────────────────────────────────
-- One row per (faction, nation, axis). Tracks crystallized base voters who
-- are locked in and only defect if ideology shifts away.

CREATE TABLE IF NOT EXISTS party_bases (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id              UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id               UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    axis                    VARCHAR(50) NOT NULL,
    side                    VARCHAR(15) NOT NULL,

    base_size               DECIMAL(5,4),
    base_loyalty            DECIMAL(4,3) DEFAULT 0.850,
    ticks_held              INTEGER DEFAULT 0,

    crystallized            BOOLEAN DEFAULT FALSE,
    crystallized_tick       INTEGER,
    last_defection_tick     INTEGER,

    is_recovering           BOOLEAN DEFAULT FALSE,
    recovery_deadline_tick  INTEGER,

    CONSTRAINT uq_party_bases UNIQUE (faction_id, nation_id, axis)
);

CREATE INDEX IF NOT EXISTS idx_party_bases_faction
    ON party_bases(faction_id, nation_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 6. faction_promises
-- ────────────────────────────────────────────────────────────────────────────
-- Tracks governing stat promises, crisis promises, conditional promises, and
-- predictions. Separate from fundraiser_promises (donor-driven system).

CREATE TABLE IF NOT EXISTS faction_promises (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id          UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id           UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,

    promise_type        VARCHAR(20) NOT NULL,
    -- 'governing_stat' | 'governing_crisis' | 'conditional' | 'prediction'

    stat_key            VARCHAR(50),
    direction           VARCHAR(10),
    -- 'improve' | 'worsen' (predictions only)

    status              VARCHAR(20) DEFAULT 'active',
    -- 'active' | 'pending_government' | 'kept' | 'broken' | 'superseded' | 'resolved' | 'wrong'

    created_tick        INTEGER,
    activated_tick      INTEGER,
    deadline_tick       INTEGER,
    resolved_tick       INTEGER,

    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faction_promises_faction
    ON faction_promises(faction_id, nation_id);
CREATE INDEX IF NOT EXISTS idx_faction_promises_status
    ON faction_promises(faction_id, status)
    WHERE status = 'active';


-- ────────────────────────────────────────────────────────────────────────────
-- 7. election_results
-- ────────────────────────────────────────────────────────────────────────────
-- Historical record of election outcomes. Results stored as JSONB keyed by
-- faction_id with vote_share, seat_count, pillar contributions, etc.

CREATE TABLE IF NOT EXISTS election_results (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id               UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    election_type           VARCHAR(30),
    election_tick           INTEGER,

    results                 JSONB,
    -- { faction_id: { vote_share, seat_count, was_governing,
    --   alignment_contribution, appeal_contribution, approval_contribution } }

    governing_coalition     JSONB,

    created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_election_results_nation
    ON election_results(nation_id, election_tick DESC);


-- ────────────────────────────────────────────────────────────────────────────
-- 8. ideology_shift_actions
-- ────────────────────────────────────────────────────────────────────────────
-- Tracks ongoing ideology-shifting actions: Think Tank, Media Campaign,
-- Grassroots Movement. Each has different fields used.

CREATE TABLE IF NOT EXISTS ideology_shift_actions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id          UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id           UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,

    action_type         VARCHAR(30) NOT NULL,
    -- 'think_tank' | 'media_campaign' | 'grassroots_movement'

    target_axis         VARCHAR(50),
    target_direction    VARCHAR(10),
    -- 'left' | 'right' relative to axis

    -- Think tank / Media campaign fields
    drift_rate          DECIMAL(4,3),
    -- think_tank: 0.3/tick | media_campaign: variance shift amount

    -- Grassroots movement fields
    target_demographic  VARCHAR(50),
    target_band         VARCHAR(30),
    band_drift_rate     DECIMAL(4,3) DEFAULT 0.5,
    band_shift_total    DECIMAL(5,2) DEFAULT 0,
    band_shift_max      DECIMAL(5,2) DEFAULT 15,

    status              VARCHAR(20) DEFAULT 'active',
    -- 'active' | 'suspended' | 'completed' | 'disbanded'

    created_tick        INTEGER,
    last_active_tick    INTEGER,
    ap_cost_per_10_ticks INTEGER DEFAULT 1,

    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ideology_shift_actions_faction
    ON ideology_shift_actions(faction_id, nation_id);
CREATE INDEX IF NOT EXISTS idx_ideology_shift_actions_active
    ON ideology_shift_actions(faction_id, status)
    WHERE status = 'active';


-- ────────────────────────────────────────────────────────────────────────────
-- 9. activity_log
-- ────────────────────────────────────────────────────────────────────────────
-- All campaign actions log here. Powers the persistent Activity Feed sidebar.

CREATE TABLE IF NOT EXISTS activity_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id      UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id       UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,

    action_type     VARCHAR(50) NOT NULL,
    action_label    VARCHAR(100),
    description     TEXT,
    outcome         VARCHAR(20),
    -- 'success' | 'failure' | 'backfire' | 'neutral' | 'pending'

    ap_spent        INTEGER DEFAULT 0,
    tick            INTEGER NOT NULL,

    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_faction
    ON activity_log(faction_id, nation_id, tick DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_nation_tick
    ON activity_log(nation_id, tick DESC);


-- ────────────────────────────────────────────────────────────────────────────
-- 10. RLS Policies
-- ────────────────────────────────────────────────────────────────────────────
-- Permissive for now, matching existing patterns (e.g. fundraiser_promises).

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'electorate_profile',
            'issue_state',
            'faction_issue_stance',
            'faction_electoral_standing',
            'party_bases',
            'faction_promises',
            'election_results',
            'ideology_shift_actions',
            'activity_log'
        ])
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

        -- SELECT
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = tbl || '_select'
        ) THEN
            EXECUTE format(
                'CREATE POLICY %I ON %I FOR SELECT USING (true)',
                tbl || '_select', tbl
            );
        END IF;

        -- INSERT
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = tbl || '_insert'
        ) THEN
            EXECUTE format(
                'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (true)',
                tbl || '_insert', tbl
            );
        END IF;

        -- UPDATE
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = tbl || '_update'
        ) THEN
            EXECUTE format(
                'CREATE POLICY %I ON %I FOR UPDATE USING (true)',
                tbl || '_update', tbl
            );
        END IF;

        -- DELETE
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = tbl || '_delete'
        ) THEN
            EXECUTE format(
                'CREATE POLICY %I ON %I FOR DELETE USING (true)',
                tbl || '_delete', tbl
            );
        END IF;
    END LOOP;
END $$;


-- ============================================================================
-- DONE — Phase 1 complete. 9 tables created, indexes added, RLS enabled.
-- Old tables (voter_blocs, faction_bloc_approval) remain untouched.
-- ============================================================================

-- ============================================================================
-- KNOWN ISSUE: RLS POLICIES ARE PERMISSIVE (USING (true))
-- ============================================================================
-- All 9 electorate tables currently use wide-open RLS policies. This means:
--   - Any authenticated client can SELECT/INSERT/UPDATE/DELETE any row.
--   - faction_issue_stance can be written by any client for any faction.
--   - faction_electoral_standing approval/visibility can be manipulated.
--
-- This is acceptable for alpha because:
--   1. All writes go through server-side Deno Edge Functions (trusted context).
--   2. Frontend only reads; campaign actions route through the edge function.
--   3. Alpha has a small, trusted player base.
--
-- Before beta/public launch, replace with ownership-based policies:
--   - SELECT: USING (true) is fine (public data).
--   - INSERT/UPDATE/DELETE on faction_issue_stance, faction_electoral_standing:
--       USING (faction_id IN (SELECT id FROM factions WHERE user_id = auth.uid()))
--   - INSERT on activity_log, campaign_actions:
--       WITH CHECK (faction_id IN (SELECT id FROM factions WHERE user_id = auth.uid()))
-- ============================================================================
