-- ============================================================
-- BILATERAL ISSUES — Card System (Phase 1)
-- ============================================================
-- Adds card deck infrastructure to bilateral_issues.
-- Each issue has a 28-30 card deck. Cards are drawn on government
-- formation (Foreign Affairs stat determines hand size).
-- Players alternate turns playing one card per tick.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Card definitions — 28 cards per issue type
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS issue_card_definitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_type      TEXT NOT NULL,           -- 'territorial_ownership', 'maritime_fishing_rights', etc.
    card_number     INTEGER NOT NULL,        -- 1-28 (or 1-30)
    card_name       TEXT NOT NULL,           -- e.g. 'Citizen Settlement Wave'
    card_type       TEXT NOT NULL CHECK (card_type IN ('unilateral', 'diplomatic', 'aggressive', 'special')),
    required_role   TEXT NOT NULL,           -- 'head_of_government', 'foreign_minister', 'ambassador', 'minister_of_defense', 'minister_of_finance'
    ap_cost         INTEGER NOT NULL DEFAULT 1,
    narrative       TEXT NOT NULL,           -- The story text shown on the card

    -- Option A (role-specific: occupying/aggrieved/surplus nation)
    option_a_label  TEXT NOT NULL,           -- Role label, e.g. 'Occupying — Sangreza'
    option_a_title  TEXT NOT NULL,           -- Action title, e.g. 'Accelerate Settlement Program'
    option_a_text   TEXT NOT NULL,           -- Flavor text
    option_a_effects JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- { favor_delta: 2, tension_delta: 2, relation_delta: 0,
    --   stat_effects: [{ stat_key, delta, duration_ticks, target }],
    --   add_modifier: 'accelerated_settlement',
    --   incident_trigger_chance: 0, -- 0-1 probability of direct incident
    --   special: null }

    -- Option B (role-specific: claimant/enforcer/deficit nation)
    option_b_label  TEXT NOT NULL,
    option_b_title  TEXT NOT NULL,
    option_b_text   TEXT NOT NULL,
    option_b_effects JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Diplomatic card specifics (only for type='diplomatic')
    -- If diplomatic: proposing nation plays, other nation accepts/rejects within 3 ticks
    diplomatic_accept_effects JSONB,         -- effects if accepted
    diplomatic_reject_effects JSONB,         -- effects if rejected (proposer gets favor +0.5)

    -- Special card behavior
    -- 'both_play_synergy': if both nations play, special combined effects
    -- 'random_roll': outcome determined by RNG on play
    -- 'locks_diplomatic': locks diplomatic cards for N ticks
    special_behavior JSONB,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_issue_card UNIQUE (issue_type, card_number)
);

CREATE INDEX idx_issue_cards_type ON issue_card_definitions (issue_type);

-- ────────────────────────────────────────────────────────────
-- 2. Deck state columns on bilateral_issues
-- ────────────────────────────────────────────────────────────
-- Track the deck, hands, and turn state per issue.

ALTER TABLE bilateral_issues
    ADD COLUMN IF NOT EXISTS deck_remaining JSONB DEFAULT '[]'::jsonb,
    -- Array of card_number integers still in the draw pile

    ADD COLUMN IF NOT EXISTS hand_a JSONB DEFAULT '[]'::jsonb,
    -- Nation A's hand: array of card_number integers

    ADD COLUMN IF NOT EXISTS hand_b JSONB DEFAULT '[]'::jsonb,
    -- Nation B's hand: array of card_number integers

    ADD COLUMN IF NOT EXISTS played_cards JSONB DEFAULT '[]'::jsonb,
    -- Array of { card_number, played_by: 'a'|'b', played_tick, option_chosen: 'a'|'b' }

    ADD COLUMN IF NOT EXISTS active_card INTEGER,
    -- The card_number currently in play (waiting for response). NULL if no card active.

    ADD COLUMN IF NOT EXISTS active_card_played_by TEXT CHECK (active_card_played_by IN ('a', 'b')),
    -- Which nation played the active card

    ADD COLUMN IF NOT EXISTS active_card_played_tick INTEGER,
    -- Tick the active card was played

    ADD COLUMN IF NOT EXISTS whose_turn TEXT CHECK (whose_turn IN ('a', 'b')),
    -- Whose turn it is to play a card. Alternates each tick.
    -- NULL = deck not initialized yet.

    ADD COLUMN IF NOT EXISTS last_card_played_tick INTEGER DEFAULT 0,
    -- Tick when the last card was played (for tension decay: -0.25/tick if no card played)

    ADD COLUMN IF NOT EXISTS deck_initialized BOOLEAN DEFAULT FALSE,
    -- Whether the deck has been shuffled and hands dealt

    ADD COLUMN IF NOT EXISTS diplomatic_lock_until_tick INTEGER,
    -- If set, diplomatic cards cannot be played until this tick (from Election Bomb etc.)

    ADD COLUMN IF NOT EXISTS pending_diplomatic_card INTEGER,
    -- Card number of a diplomatic card awaiting accept/reject response

    ADD COLUMN IF NOT EXISTS pending_diplomatic_deadline_tick INTEGER,
    -- Tick by which the other nation must respond (3 ticks from play)

    ADD COLUMN IF NOT EXISTS pending_diplomatic_proposer TEXT CHECK (pending_diplomatic_proposer IN ('a', 'b'));
    -- Which side proposed the diplomatic card


-- ────────────────────────────────────────────────────────────
-- 3. Notification tracking for amber badge
-- ────────────────────────────────────────────────────────────
ALTER TABLE bilateral_issues
    ADD COLUMN IF NOT EXISTS last_action_by_a_tick INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_action_by_b_tick INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS a_seen_tick INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS b_seen_tick INTEGER DEFAULT 0;
    -- Amber badge shows when last_action_by_opponent_tick > my_seen_tick


-- ────────────────────────────────────────────────────────────
-- 4. Card play history (replaces bilateral_issue_actions_taken)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS issue_card_plays (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id        UUID NOT NULL REFERENCES bilateral_issues(id) ON DELETE CASCADE,
    card_number     INTEGER NOT NULL,
    played_by       TEXT NOT NULL CHECK (played_by IN ('a', 'b')),
    played_by_nation_id UUID NOT NULL REFERENCES nations(id),
    played_by_faction_id UUID REFERENCES factions(id),
    option_chosen   TEXT NOT NULL CHECK (option_chosen IN ('a', 'b')),
    played_tick     INTEGER NOT NULL,
    ap_spent        INTEGER NOT NULL DEFAULT 1,
    effects_applied JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Diplomatic card response tracking
    diplomatic_response TEXT CHECK (diplomatic_response IN ('accepted', 'rejected', 'expired')),
    diplomatic_response_tick INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_card_plays_issue ON issue_card_plays (issue_id, played_tick DESC);
