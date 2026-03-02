-- ==================== DIPLOMACY TABLES ====================
-- International Diplomacy system for Nationhood.
-- Enables nations to interact through Ambassadors, Foreign Ministers,
-- and Heads of Government via a 3-tier approval system.

-- ==================== AMBASSADORS ====================
-- Tracks ambassadors posted to foreign nations.
-- Each nation can have one active ambassador per foreign nation.
-- Ambassadors must be from a coalition party and confirmed by Parliament.

CREATE TABLE IF NOT EXISTS ambassadors (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id               UUID NOT NULL REFERENCES nations(id),        -- The ambassador's home nation
    target_nation_id        UUID NOT NULL REFERENCES nations(id),        -- The nation they are posted to
    faction_id              UUID NOT NULL REFERENCES factions(id),       -- The party holding this role

    -- Ambassador identity
    ambassador_first_name   TEXT,
    ambassador_last_name    TEXT,
    ambassador_age          INT,
    ambassador_approval     INT DEFAULT 50,

    -- Status
    is_active               BOOLEAN DEFAULT true,
    status                  TEXT NOT NULL DEFAULT 'pending_confirmation', -- pending_confirmation, active, recalled, rejected
    confirmation_bill_id    UUID,                                        -- FK to bills (the auto-created confirmation bill)

    -- Timeline
    appointed_at_tick       INT,
    recalled_at_tick        INT,

    -- Term limits
    term_length             INT NOT NULL DEFAULT 60,            -- term duration in ticks (default 60 = 5 years)
    retirement_warning_shown BOOLEAN NOT NULL DEFAULT false,    -- prevents repeated 3-tick warnings

    -- Metadata
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ambassadors_active_unique
    ON ambassadors(nation_id, target_nation_id)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_ambassadors_nation ON ambassadors(nation_id);
CREATE INDEX IF NOT EXISTS idx_ambassadors_faction ON ambassadors(faction_id);

-- ==================== DIPLOMATIC MESSAGES ====================
-- Chat messages between nations' diplomatic representatives.
-- Visible to ambassadors, FMs, and HoGs on both sides.

CREATE TABLE IF NOT EXISTS diplomatic_messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_nation_id      UUID NOT NULL REFERENCES nations(id),
    to_nation_id        UUID NOT NULL REFERENCES nations(id),
    from_faction_id     UUID NOT NULL REFERENCES factions(id),
    sender_role         TEXT NOT NULL,       -- 'ambassador', 'foreign_minister', 'head_of_government'
    sender_name         TEXT,                -- Display name (e.g., "Ambassador Reyes")
    message_text        TEXT NOT NULL,
    sent_at_tick        INT NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diplomatic_messages_nations
    ON diplomatic_messages(from_nation_id, to_nation_id);
CREATE INDEX IF NOT EXISTS idx_diplomatic_messages_tick
    ON diplomatic_messages(sent_at_tick DESC);

-- ==================== DIPLOMATIC PROPOSALS ====================
-- Tracks all diplomatic proposals between nations.
-- Status flow: negotiating → proposed → fm_review → ratification → active/rejected
-- Minor (Tier 1) proposals skip fm_review and ratification.

CREATE TABLE IF NOT EXISTS diplomatic_proposals (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposing_nation_id     UUID NOT NULL REFERENCES nations(id),
    target_nation_id        UUID NOT NULL REFERENCES nations(id),
    proposed_by_faction_id  UUID NOT NULL REFERENCES factions(id),

    -- Type & classification
    proposal_type           TEXT NOT NULL,   -- cultural_exchange, visa_agreement, joint_statement, student_exchange,
                                             -- trade_agreement, non_aggression_pact, military_alliance, embargo,
                                             -- ceasefire, open_borders, close_embassy
    proposal_tier           INT NOT NULL,    -- 1 = minor (ambassador-level), 2 = FM approval, 3 = Parliament ratification

    -- Status
    status                  TEXT NOT NULL DEFAULT 'negotiating',
                                             -- negotiating, proposed, fm_review, ratification, active,
                                             -- rejected, expired, rescinded

    -- Custom terms
    proposal_data           JSONB DEFAULT '{}'::jsonb,  -- Type-specific fields (duration, amounts, terms, etc.)

    -- FM review tracking
    fm_approved_at_tick     INT,
    fm_review_expires_tick  INT,             -- Auto-expires if FM doesn't act by this tick

    -- Ratification bill linkage (for Tier 3 proposals)
    proposing_bill_id       UUID,            -- Bill in proposing nation's parliament
    target_bill_id          UUID,            -- Bill in target nation's parliament

    -- Timeline
    proposed_at_tick        INT NOT NULL,
    activated_at_tick       INT,
    terminated_at_tick      INT,

    -- Metadata
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diplomatic_proposals_nations
    ON diplomatic_proposals(proposing_nation_id, target_nation_id);
CREATE INDEX IF NOT EXISTS idx_diplomatic_proposals_status
    ON diplomatic_proposals(status);
CREATE INDEX IF NOT EXISTS idx_diplomatic_proposals_type
    ON diplomatic_proposals(proposal_type);

-- ==================== DIPLOMATIC RELATIONS ====================
-- Tracks the overall relationship state between each pair of nations.
-- Uses canonical ordering (lower UUID = nation_a) to prevent duplicate pairs.

CREATE TABLE IF NOT EXISTS diplomatic_relations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_a_id         UUID NOT NULL REFERENCES nations(id),   -- Always the lower UUID
    nation_b_id         UUID NOT NULL REFERENCES nations(id),   -- Always the higher UUID

    -- Relationship state
    relation_type       TEXT NOT NULL DEFAULT 'neutral',        -- neutral, friendly, hostile, war, allied
    relation_score      INT NOT NULL DEFAULT 30,                -- hidden score, drives display tier

    -- Active treaties (array of diplomatic_proposals IDs)
    active_treaties     JSONB DEFAULT '[]'::jsonb,

    -- Embassy status
    embassy_status_a    TEXT DEFAULT 'open',     -- a's embassy in b: open, closed, recalled
    embassy_status_b    TEXT DEFAULT 'open',     -- b's embassy in a: open, closed, recalled

    -- War tracking
    war_declared_at_tick    INT,
    war_justification       TEXT,

    -- Metadata
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT uq_diplomatic_relations_pair UNIQUE(nation_a_id, nation_b_id),
    CONSTRAINT chk_nation_order CHECK (nation_a_id < nation_b_id)
);

CREATE INDEX IF NOT EXISTS idx_diplomatic_relations_nations
    ON diplomatic_relations(nation_a_id, nation_b_id);

-- ==================== DIPLOMATIC ACTION LOG ====================
-- Tracks all diplomatic actions taken (formal protests, covert ops, recalls, etc.).
-- Follows the same pattern as ministry_action_log for AP costs, cooldowns, and stat effects.

CREATE TABLE IF NOT EXISTS diplomatic_action_log (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id                   UUID NOT NULL REFERENCES nations(id),
    target_nation_id            UUID REFERENCES nations(id),
    faction_id                  UUID NOT NULL REFERENCES factions(id),

    -- Action details
    action_type                 TEXT NOT NULL,           -- formal_protest, covert_gather_intel, covert_propaganda,
                                                         -- covert_bribe, recall_ambassador, impose_embargo,
                                                         -- offer_foreign_aid, issue_ultimatum, declare_war,
                                                         -- sue_for_peace, state_visit
    action_data                 JSONB DEFAULT '{}'::jsonb, -- Details, outcomes, dice rolls, etc.
    ap_cost                     INT NOT NULL DEFAULT 0,

    -- Tick processing
    applied_at_tick             INT NOT NULL,
    cooldown_until_tick         INT,
    stat_effects                JSONB,                   -- Array of { stat_key, direction, rate, delay_ticks, duration_ticks }
    effects_applied_through_tick INT,
    processed                   BOOLEAN DEFAULT false,

    -- Metadata
    created_at                  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diplomatic_action_log_nation ON diplomatic_action_log(nation_id);
CREATE INDEX IF NOT EXISTS idx_diplomatic_action_log_cooldown ON diplomatic_action_log(cooldown_until_tick);

-- ==================== BILLS TABLE EXTENSION ====================
-- Add column to link ratification/confirmation bills back to diplomatic proposals.

ALTER TABLE bills ADD COLUMN IF NOT EXISTS diplomatic_proposal_id UUID REFERENCES diplomatic_proposals(id);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS ambassador_id UUID REFERENCES ambassadors(id);

-- ==================== AMBASSADOR NOMINATION RPC ====================
-- Creates the pending ambassador + confirmation bill in one atomic write.
-- If any statement fails, PostgreSQL rolls back the full function call.

CREATE OR REPLACE FUNCTION create_ambassador_nomination_with_bill(
    p_nation_id UUID,
    p_target_nation_id UUID,
    p_faction_id UUID,
    p_proposed_by UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_age INT,
    p_current_tick INT,
    p_bill_name TEXT,
    p_preamble TEXT,
    p_voting_ends_tick INT
)
RETURNS TABLE(ambassador_id UUID, bill_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
    v_ambassador_id UUID;
    v_bill_id UUID;
BEGIN
    INSERT INTO ambassadors (
        nation_id,
        target_nation_id,
        faction_id,
        ambassador_first_name,
        ambassador_last_name,
        ambassador_age,
        status,
        is_active,
        appointed_at_tick
    )
    VALUES (
        p_nation_id,
        p_target_nation_id,
        p_faction_id,
        p_first_name,
        p_last_name,
        p_age,
        'pending_confirmation',
        true,
        p_current_tick
    )
    RETURNING id INTO v_ambassador_id;

    INSERT INTO bills (
        nation_id,
        proposed_by,
        proposed_tick,
        bill_name,
        bill_type,
        status,
        voting_ends_tick,
        ambassador_id,
        preamble
    )
    VALUES (
        p_nation_id,
        p_proposed_by,
        p_current_tick,
        p_bill_name,
        'confirmation',
        'floor',
        p_voting_ends_tick,
        v_ambassador_id,
        p_preamble
    )
    RETURNING id INTO v_bill_id;

    UPDATE ambassadors
    SET confirmation_bill_id = v_bill_id
    WHERE id = v_ambassador_id;

    RETURN QUERY SELECT v_ambassador_id, v_bill_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Extra defensive cleanup; function-level atomicity also rolls back all writes.
        DELETE FROM ambassadors
        WHERE id = v_ambassador_id
          AND is_active = true
          AND status = 'pending_confirmation';
        RAISE;
END;
$$;

-- ==================== SEED DATA ====================
-- Create diplomatic_relations rows for all nation pairs (4 choose 2 = 6 pairs).
-- Uses canonical ordering (lower UUID = nation_a).

INSERT INTO diplomatic_relations (nation_a_id, nation_b_id)
SELECT
    LEAST(a.id, b.id) AS nation_a_id,
    GREATEST(a.id, b.id) AS nation_b_id
FROM nations a
CROSS JOIN nations b
WHERE a.id < b.id
ON CONFLICT (nation_a_id, nation_b_id) DO NOTHING;
