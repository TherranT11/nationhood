-- ════════════════════════════════════════════════════════════════════════════════
-- Autocracy V5 — Phase 1: Schema & Core State
-- Creates all tables for the new Five Pillars autocracy system.
-- ════════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. AUTOCRACY_TRACKER — one row per autocracy nation
--    Hidden regime stability gauge: 0 (stable) → 100 (collapse)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS autocracy_tracker (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    tracker_value   INTEGER NOT NULL DEFAULT 0 CHECK (tracker_value >= 0 AND tracker_value <= 100),
    last_updated_tick INTEGER NOT NULL DEFAULT 0,
    wildcard_pillar TEXT CHECK (wildcard_pillar IS NULL OR wildcard_pillar IN ('military', 'party', 'oligarchs', 'media', 'security')),
    wildcard_backing NUMERIC(5,2) NOT NULL DEFAULT 20.00 CHECK (wildcard_backing >= 0 AND wildcard_backing <= 20),
    wildcard_neglect_ticks INTEGER NOT NULL DEFAULT 0,

    -- Public-facing tracker (updated ~1/3 of ticks via 1d3 roll)
    public_tracker_value INTEGER NOT NULL DEFAULT 30 CHECK (public_tracker_value >= 0 AND public_tracker_value <= 100),

    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(nation_id)
);

CREATE INDEX IF NOT EXISTS idx_autocracy_tracker_nation ON autocracy_tracker(nation_id);

ALTER TABLE autocracy_tracker ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autocracy_tracker_select" ON autocracy_tracker FOR SELECT USING (true);
CREATE POLICY "autocracy_tracker_insert" ON autocracy_tracker FOR INSERT WITH CHECK (true);
CREATE POLICY "autocracy_tracker_update" ON autocracy_tracker FOR UPDATE USING (true);
CREATE POLICY "autocracy_tracker_delete" ON autocracy_tracker FOR DELETE USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. FACTION_PILLAR_STATE — one row per faction in an autocracy
--    Tracks pillar claim, backing, leader identity, escalation levels,
--    cooldowns, and coup-related state.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS faction_pillar_state (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id              UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id               UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,

    -- Pillar assignment
    pillar                  TEXT NOT NULL CHECK (pillar IN ('military', 'party', 'oligarchs', 'media', 'security')),
    is_strongman            BOOLEAN NOT NULL DEFAULT false,

    -- Backing (0–20, zero-sum across all 5 pillars to 100)
    backing                 NUMERIC(5,2) NOT NULL DEFAULT 20.00 CHECK (backing >= 0 AND backing <= 20),

    -- Leader identity
    leader_name             TEXT,
    leader_age              INTEGER,
    leader_birth_tick       INTEGER,
    death_age               INTEGER,         -- randomized 75–85 on creation

    -- Arrest state
    arrested_leader         BOOLEAN NOT NULL DEFAULT false,

    -- Government positions
    minister_count          INTEGER NOT NULL DEFAULT 0,
    is_prime_minister       BOOLEAN NOT NULL DEFAULT false,

    -- Longevity (ticks since this leader took power)
    longevity_ticks         INTEGER NOT NULL DEFAULT 0,

    -- Escalating AP costs (reset on leader death)
    deploy_ap_level         INTEGER NOT NULL DEFAULT 2,    -- Deploy: 2 → 4 → 6
    bribe_ap_level          INTEGER NOT NULL DEFAULT 2,    -- Bribe: 2 → 3 → 4 → 5
    blackmail_ap_level      INTEGER NOT NULL DEFAULT 1,    -- Blackmail: 1 → 2 → 3

    -- Cooldowns (tick numbers)
    party_congress_last_tick INTEGER NOT NULL DEFAULT 0,   -- 4-tick cooldown
    favor_last_tick          INTEGER NOT NULL DEFAULT 0,   -- 3-tick cooldown
    blackout_last_tick       INTEGER NOT NULL DEFAULT 0,   -- 5-tick cooldown

    -- Surveillance tracking
    surveillance_targets    JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array of faction_ids surveilled

    -- Blackmail immunity (tick number until which immune, 0 = not immune)
    blackmail_immune_until  INTEGER NOT NULL DEFAULT 0,

    -- Successor designation (Strongman only)
    designated_successor_id UUID REFERENCES factions(id) ON DELETE SET NULL,

    -- Arrest bonus from previous Release
    arrest_bonus            INTEGER NOT NULL DEFAULT 0,

    -- Neglect tracking: consecutive ticks with backing ≤ 3
    neglect_ticks           INTEGER NOT NULL DEFAULT 0,

    -- Whether the player explicitly chose this pillar (false = auto-assigned by migration)
    pillar_confirmed        BOOLEAN NOT NULL DEFAULT false,

    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now(),
    UNIQUE(faction_id),
    UNIQUE(nation_id, pillar)  -- one faction per pillar per nation
);

CREATE INDEX IF NOT EXISTS idx_fps_nation ON faction_pillar_state(nation_id);
CREATE INDEX IF NOT EXISTS idx_fps_faction ON faction_pillar_state(faction_id);

ALTER TABLE faction_pillar_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fps_select" ON faction_pillar_state FOR SELECT USING (true);
CREATE POLICY "fps_insert" ON faction_pillar_state FOR INSERT WITH CHECK (true);
CREATE POLICY "fps_update" ON faction_pillar_state FOR UPDATE USING (true);
CREATE POLICY "fps_delete" ON faction_pillar_state FOR DELETE USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. COUP_ATTEMPT_LOG — records every coup attempt for history/display
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS coup_attempt_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id           UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    faction_id          UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    tick                INTEGER NOT NULL,
    tracker_at_attempt  INTEGER NOT NULL,
    roll_result         INTEGER NOT NULL,
    outcome             TEXT NOT NULL CHECK (outcome IN ('catastrophic', 'failure', 'pyrrhic', 'clean', 'dominant')),
    coup_type           TEXT NOT NULL DEFAULT 'standard' CHECK (coup_type IN ('standard', 'putsch', 'silent', 'auto')),
    details             JSONB DEFAULT '{}'::jsonb,  -- additional context (e.g. putsch response, silent coup votes)
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coup_log_nation ON coup_attempt_log(nation_id);
CREATE INDEX IF NOT EXISTS idx_coup_log_faction ON coup_attempt_log(faction_id);
CREATE INDEX IF NOT EXISTS idx_coup_log_tick ON coup_attempt_log(nation_id, tick DESC);

ALTER TABLE coup_attempt_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coup_log_select" ON coup_attempt_log FOR SELECT USING (true);
CREATE POLICY "coup_log_insert" ON coup_attempt_log FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SILENT_COUP_OFFERS — Security Services deal phase offers
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS silent_coup_offers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id           UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    from_faction_id     UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    to_faction_id       UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    offer_type          TEXT NOT NULL CHECK (offer_type IN ('minister', 'backing', 'immunity')),
    tick_offered        INTEGER NOT NULL,
    accepted            BOOLEAN,  -- null = pending, true = accepted, false = rejected
    voided              BOOLEAN NOT NULL DEFAULT false,  -- true if tracker dropped below 25
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sco_nation ON silent_coup_offers(nation_id);
CREATE INDEX IF NOT EXISTS idx_sco_to_faction ON silent_coup_offers(to_faction_id);

ALTER TABLE silent_coup_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sco_select" ON silent_coup_offers FOR SELECT USING (true);
CREATE POLICY "sco_insert" ON silent_coup_offers FOR INSERT WITH CHECK (true);
CREATE POLICY "sco_update" ON silent_coup_offers FOR UPDATE USING (true);
CREATE POLICY "sco_delete" ON silent_coup_offers FOR DELETE USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SILENT_COUP_VOTES — faction choices during Silent Coup vote phase
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS silent_coup_votes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id           UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    faction_id          UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    tick                INTEGER NOT NULL,
    choice              TEXT NOT NULL CHECK (choice IN ('strongman', 'coup')),
    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(nation_id, faction_id, tick)  -- one vote per faction per tick
);

CREATE INDEX IF NOT EXISTS idx_scv_nation_tick ON silent_coup_votes(nation_id, tick);

ALTER TABLE silent_coup_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scv_select" ON silent_coup_votes FOR SELECT USING (true);
CREATE POLICY "scv_insert" ON silent_coup_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "scv_delete" ON silent_coup_votes FOR DELETE USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. AUTOCRACY_ACTION_LOG — tracks all faction actions for surveillance reveal
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS autocracy_action_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id           UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    faction_id          UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    tick                INTEGER NOT NULL,
    action_type         TEXT NOT NULL,       -- e.g. 'deploy', 'rally', 'surveillance'
    action_mode         TEXT,                -- 'regime' or 'self' (null for strongman/stand_down)
    ap_spent            INTEGER NOT NULL DEFAULT 0,
    details             JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aal_nation_tick ON autocracy_action_log(nation_id, tick DESC);
CREATE INDEX IF NOT EXISTS idx_aal_faction ON autocracy_action_log(faction_id);

ALTER TABLE autocracy_action_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aal_select" ON autocracy_action_log FOR SELECT USING (true);
CREATE POLICY "aal_insert" ON autocracy_action_log FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. PUTSCH_STATE — tracks active Putsch events (Military special coup)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS putsch_state (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id           UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    military_faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    declared_tick       INTEGER NOT NULL,
    strongman_response  TEXT,  -- 'emergency_decree', 'appeal_security', 'do_nothing', null = pending
    security_response   TEXT,  -- 'regime', 'yourself', null = pending or N/A
    resolved            BOOLEAN NOT NULL DEFAULT false,
    outcome             TEXT,  -- references coup outcome if resolved
    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(nation_id, declared_tick)
);

ALTER TABLE putsch_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "putsch_select" ON putsch_state FOR SELECT USING (true);
CREATE POLICY "putsch_insert" ON putsch_state FOR INSERT WITH CHECK (true);
CREATE POLICY "putsch_update" ON putsch_state FOR UPDATE USING (true);
CREATE POLICY "putsch_delete" ON putsch_state FOR DELETE USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. VULNERABILITY_WINDOW — tracks when Strongman foundation backing = 0
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vulnerability_window (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id           UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    start_tick          INTEGER NOT NULL,
    end_tick            INTEGER NOT NULL,    -- start_tick + 3
    resolved            BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(nation_id, start_tick)
);

ALTER TABLE vulnerability_window ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vw_select" ON vulnerability_window FOR SELECT USING (true);
CREATE POLICY "vw_insert" ON vulnerability_window FOR INSERT WITH CHECK (true);
CREATE POLICY "vw_update" ON vulnerability_window FOR UPDATE USING (true);
CREATE POLICY "vw_delete" ON vulnerability_window FOR DELETE USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. PYRRHIC_WINDOW — tracks 3-tick window after pyrrhic coup success
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pyrrhic_window (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id           UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    start_tick          INTEGER NOT NULL,
    end_tick            INTEGER NOT NULL,    -- start_tick + 3
    new_strongman_id    UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    resolved            BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(nation_id, start_tick)
);

ALTER TABLE pyrrhic_window ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pw_select" ON pyrrhic_window FOR SELECT USING (true);
CREATE POLICY "pw_insert" ON pyrrhic_window FOR INSERT WITH CHECK (true);
CREATE POLICY "pw_update" ON pyrrhic_window FOR UPDATE USING (true);
CREATE POLICY "pw_delete" ON pyrrhic_window FOR DELETE USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. NATIONS TABLE — add successor columns for Strongman succession
-- ─────────────────────────────────────────────────────────────────────────────

-- designated_successor_faction_id: which faction is the designated successor
ALTER TABLE nations ADD COLUMN IF NOT EXISTS designated_successor_faction_id UUID REFERENCES factions(id) ON DELETE SET NULL;

-- pillar_confirmed: whether the player explicitly chose their pillar (false = auto-assigned)
ALTER TABLE faction_pillar_state ADD COLUMN IF NOT EXISTS pillar_confirmed BOOLEAN NOT NULL DEFAULT false;

-- Public-facing tracker: delayed visibility via 1d3 roll per tick. Starts at 30.
ALTER TABLE autocracy_tracker ADD COLUMN IF NOT EXISTS public_tracker_value INTEGER NOT NULL DEFAULT 30;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. SEED: Initialize autocracy_tracker for existing autocracy nations
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO autocracy_tracker (nation_id, tracker_value, last_updated_tick)
SELECT n.id, 0, COALESCE(s.current_tick, 0)
FROM nations n
JOIN shard s ON s.id = n.shard_id
WHERE (n.government_type ILIKE '%autocra%'
    OR n.government_type ILIKE '%authoritarian%'
    OR n.government_type ILIKE '%dictat%'
    OR n.government_type ILIKE '%junta%')
ON CONFLICT (nation_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. SEED: Initialize faction_pillar_state for existing autocracy factions
--     Assigns pillars round-robin. Strongman = ruling faction.
--     5th pillar = wildcard (no faction).
--     Backing starts at 20 for all 5 pillars (sums to 100).
-- ─────────────────────────────────────────────────────────────────────────────

-- We use a DO block because we need procedural logic for pillar assignment.
DO $$
DECLARE
    v_nation RECORD;
    v_faction RECORD;
    v_pillar_list TEXT[] := ARRAY['military', 'party', 'oligarchs', 'media', 'security'];
    v_pillar_idx INTEGER;
    v_strongman_pillar TEXT;
    v_faction_count INTEGER;
    v_death_age INTEGER;
BEGIN
    -- Loop each autocracy nation
    FOR v_nation IN
        SELECT n.id, n.ruling_faction_id, COALESCE(s.current_tick, 0) AS tick
        FROM nations n
        JOIN shard s ON s.id = n.shard_id
        WHERE n.government_type ILIKE '%autocra%'
           OR n.government_type ILIKE '%authoritarian%'
           OR n.government_type ILIKE '%dictat%'
           OR n.government_type ILIKE '%junta%'
    LOOP
        -- Skip if already seeded
        IF EXISTS (SELECT 1 FROM faction_pillar_state WHERE nation_id = v_nation.id) THEN
            CONTINUE;
        END IF;

        v_pillar_idx := 0;

        -- Assign pillars to factions ordered by seats desc
        -- First faction (or ruling faction) = strongman
        FOR v_faction IN
            SELECT f.id, f.faction_name
            FROM factions f
            WHERE f.nation_id = v_nation.id
            ORDER BY
                CASE WHEN f.id = v_nation.ruling_faction_id THEN 0 ELSE 1 END,
                f.seats DESC NULLS LAST
            LIMIT 4
        LOOP
            v_pillar_idx := v_pillar_idx + 1;

            -- Skip if we've run out of pillars (shouldn't happen with LIMIT 4)
            IF v_pillar_idx > 5 THEN EXIT; END IF;

            -- Randomize death age 75-85
            v_death_age := 75 + floor(random() * 11)::int;

            INSERT INTO faction_pillar_state (
                faction_id, nation_id, pillar,
                is_strongman,
                backing,
                leader_name, leader_age, leader_birth_tick, death_age,
                longevity_ticks
            ) VALUES (
                v_faction.id,
                v_nation.id,
                v_pillar_list[v_pillar_idx],
                (v_pillar_idx = 1),  -- first faction is strongman
                20.00,
                v_faction.faction_name || ' Leader',
                55 + floor(random() * 15)::int,  -- starting age 55-69
                v_nation.tick - ((55 + floor(random() * 15)::int) * 12),
                v_death_age,
                CASE WHEN v_pillar_idx = 1 THEN 12 ELSE 0 END  -- strongman starts with some longevity
            )
            ON CONFLICT (faction_id) DO NOTHING;
        END LOOP;

        -- Set wildcard_pillar on autocracy_tracker = the 5th unassigned pillar
        UPDATE autocracy_tracker
        SET wildcard_pillar = (
            SELECT p.pillar
            FROM unnest(v_pillar_list) AS p(pillar)
            WHERE p.pillar NOT IN (
                SELECT fps.pillar FROM faction_pillar_state fps
                WHERE fps.nation_id = v_nation.id
            )
            LIMIT 1
        )
        WHERE nation_id = v_nation.id;

    END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. RPC STUBS — placeholder functions for future phases
-- ─────────────────────────────────────────────────────────────────────────────

-- Get the regime tracker word for the Strongman
CREATE OR REPLACE FUNCTION get_tracker_word(p_nation_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_tracker INTEGER;
BEGIN
    SELECT tracker_value INTO v_tracker
    FROM autocracy_tracker
    WHERE nation_id = p_nation_id;

    IF v_tracker IS NULL THEN RETURN NULL; END IF;

    RETURN CASE
        WHEN v_tracker <= 20  THEN 'IRON'
        WHEN v_tracker <= 40  THEN 'FIRM'
        WHEN v_tracker <= 60  THEN 'RESTLESS'
        WHEN v_tracker <= 80  THEN 'VOLATILE'
        ELSE 'CRITICAL'
    END;
END;
$$;

-- Get faction pillar state with computed power (server-side only)
CREATE OR REPLACE FUNCTION get_faction_power(p_faction_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_state RECORD;
    v_base INTEGER;
    v_power INTEGER;
BEGIN
    SELECT backing, is_prime_minister, minister_count, longevity_ticks
    INTO v_state
    FROM faction_pillar_state
    WHERE faction_id = p_faction_id;

    IF NOT FOUND THEN RETURN NULL; END IF;

    v_base := CEIL(v_state.backing / 4.0);
    IF v_state.is_prime_minister THEN v_base := v_base + 1; END IF;
    v_base := v_base + FLOOR(v_state.minister_count / 2.0);
    IF v_state.longevity_ticks >= 36 THEN v_base := v_base + 1; END IF;

    v_power := GREATEST(1, LEAST(v_base, 5));
    RETURN v_power;
END;
$$;

-- Map power level to tracker delta magnitude
CREATE OR REPLACE FUNCTION get_power_delta(p_power INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN CASE p_power
        WHEN 1 THEN 2
        WHEN 2 THEN 3
        WHEN 3 THEN 4
        WHEN 4 THEN 5
        WHEN 5 THEN 7
        ELSE 0
    END;
END;
$$;
