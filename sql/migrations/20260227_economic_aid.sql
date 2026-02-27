-- ==================== ECONOMIC AID SUPPORT ====================
-- Extends the trade agreement system to support Economic Aid agreements.
-- Aid agreements use the existing trade_negotiations and trade_agreements tables
-- with agreement_type = 'economic_aid'.
--
-- This migration adds:
--   1. aid_agreement_state — mutable per-agreement state (condition tracking, amounts)
--   2. aid_condition_reviews — audit log of annual condition reviews
--   3. Indexes for efficient aid lookups

-- ==================== AID AGREEMENT STATE ====================
-- 1:1 extension of trade_agreements for economic_aid type.
-- Stores mutable state that changes between annual reviews.

CREATE TABLE IF NOT EXISTS aid_agreement_state (
    agreement_id            UUID PRIMARY KEY REFERENCES trade_agreements(id) ON DELETE CASCADE,

    -- Denormalized for fast lookups (derived from aid_terms article)
    donor_nation_id         UUID NOT NULL REFERENCES nations(id),
    recipient_nation_id     UUID NOT NULL REFERENCES nations(id),

    -- Current annual amount (may differ from original if reduced by condition failures)
    current_annual_amount   NUMERIC NOT NULL DEFAULT 0,
    original_annual_amount  NUMERIC NOT NULL DEFAULT 0,

    -- Condition review tracking
    last_review_tick        INT,                            -- tick of most recent condition review
    next_review_tick        INT,                            -- tick when next review should occur
    condition_failures      JSONB DEFAULT '{}'::jsonb,      -- { "0": 2, "1": 0 } — article index → consecutive failure count

    -- Suspension state (aid paused but agreement still exists)
    is_suspended            BOOLEAN DEFAULT false,
    suspended_at_tick       INT,
    suspension_reason       TEXT,

    -- Metadata
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aid_state_donor
    ON aid_agreement_state(donor_nation_id);
CREATE INDEX IF NOT EXISTS idx_aid_state_recipient
    ON aid_agreement_state(recipient_nation_id);
CREATE INDEX IF NOT EXISTS idx_aid_state_next_review
    ON aid_agreement_state(next_review_tick);

-- ==================== AID CONDITION REVIEWS ====================
-- Audit log: one row per annual review per agreement.
-- Useful for event feeds and debugging.

CREATE TABLE IF NOT EXISTS aid_condition_reviews (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id            UUID NOT NULL REFERENCES trade_agreements(id) ON DELETE CASCADE,

    review_tick             INT NOT NULL,
    donor_nation_id         UUID NOT NULL,
    recipient_nation_id     UUID NOT NULL,

    -- Snapshot of each condition at review time
    -- Array of { stat_key, operator, threshold, current_value, met: bool, on_failure, grace_periods, consecutive_failures }
    conditions_checked      JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Actions taken as a result of this review
    -- Array of { condition_index, action: 'none'|'warn'|'suspend'|'terminate'|'reduce', reason }
    actions_taken           JSONB DEFAULT '[]'::jsonb,

    -- Resulting state
    aid_continued           BOOLEAN NOT NULL DEFAULT true,   -- false if terminated
    new_annual_amount       NUMERIC,                         -- amount after any reductions

    created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aid_reviews_agreement
    ON aid_condition_reviews(agreement_id);
CREATE INDEX IF NOT EXISTS idx_aid_reviews_tick
    ON aid_condition_reviews(review_tick);

-- ==================== RLS POLICIES ====================

ALTER TABLE aid_agreement_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_condition_reviews ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
DROP POLICY IF EXISTS "aid_agreement_state_read" ON aid_agreement_state;
CREATE POLICY "aid_agreement_state_read" ON aid_agreement_state
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "aid_agreement_state_write" ON aid_agreement_state;
CREATE POLICY "aid_agreement_state_write" ON aid_agreement_state
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "aid_condition_reviews_read" ON aid_condition_reviews;
CREATE POLICY "aid_condition_reviews_read" ON aid_condition_reviews
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "aid_condition_reviews_write" ON aid_condition_reviews;
CREATE POLICY "aid_condition_reviews_write" ON aid_condition_reviews
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
