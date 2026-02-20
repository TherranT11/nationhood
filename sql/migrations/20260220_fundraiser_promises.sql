-- ==================== FUNDRAISER PROMISES SYSTEM ====================
-- Tracks promises made by parties to voter blocs in exchange for large donations.
-- Integrates with Three Pillars system (preference_score, momentum).
--
-- fundraiser_promises: Active and historical promises
-- donor_trust: Per-party per-bloc trust tracking (lockouts, bonus multipliers)

-- 1. fundraiser_promises: tracks all promises (active, fulfilled, broken)
CREATE TABLE IF NOT EXISTS fundraiser_promises (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id        UUID NOT NULL,
    nation_id       UUID NOT NULL,
    bloc_id         UUID NOT NULL,
    bloc_name       TEXT NOT NULL,

    -- Demand details
    demand_index    INT NOT NULL,                -- index into DONOR_DEMANDS[bloc_name]
    demand_text     TEXT NOT NULL,               -- human-readable demand string
    demand_type     TEXT NOT NULL,               -- category: 'stat_target', 'ministry_control', 'block_bills', 'pass_bill', 'rally_count', 'no_confidence', 'coalition_restriction', 'vote_pattern', 'press_conference_count', 'constitutional_amendment', 'stat_floor', 'stat_sustained'

    -- Financial details
    donation_amount INT NOT NULL,                -- the large donation amount received
    small_amount    INT NOT NULL,                -- what the small offer was (for reference)

    -- Timing
    tick_created    INT NOT NULL,                -- tick when promise was made
    deadline_ticks  INT NOT NULL,                -- number of ticks allowed
    tick_deadline   INT NOT NULL,                -- absolute tick when promise expires (tick_created + deadline_ticks)

    -- Fulfillment tracking (JSONB for flexible per-demand conditions)
    conditions      JSONB NOT NULL DEFAULT '{}', -- structured conditions to check each tick
    progress        JSONB NOT NULL DEFAULT '{}', -- current progress toward fulfillment

    -- Status
    status          TEXT NOT NULL DEFAULT 'active',  -- 'active', 'fulfilled', 'broken'
    tick_resolved   INT,                         -- tick when fulfilled or broken

    -- Metadata
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_fundraiser_promises_party ON fundraiser_promises(party_id);
CREATE INDEX IF NOT EXISTS idx_fundraiser_promises_nation ON fundraiser_promises(nation_id);
CREATE INDEX IF NOT EXISTS idx_fundraiser_promises_status ON fundraiser_promises(party_id, status);
CREATE INDEX IF NOT EXISTS idx_fundraiser_promises_deadline ON fundraiser_promises(tick_deadline) WHERE status = 'active';

-- 2. donor_trust: per-party per-bloc trust state
CREATE TABLE IF NOT EXISTS donor_trust (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id        UUID NOT NULL,
    nation_id       UUID NOT NULL,
    bloc_id         UUID NOT NULL,
    bloc_name       TEXT NOT NULL,

    -- Trust multiplier: starts at 1.0, increases +0.25 per kept promise, resets on broken
    large_donation_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,

    -- Lockout: if > current_tick, this bloc won't offer large donations
    lockout_until_tick INT NOT NULL DEFAULT 0,

    -- Tracking
    promises_kept   INT NOT NULL DEFAULT 0,
    promises_broken INT NOT NULL DEFAULT 0,

    -- Global broken-promise counter for the "2 broken = no more big offers" rule
    -- (tracked per party, not per bloc, but stored here for convenience)
    recent_broken_count INT NOT NULL DEFAULT 0,  -- broken within last 20 ticks
    last_broken_tick    INT,                     -- tick of most recent broken promise

    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),

    UNIQUE(party_id, bloc_id)
);

CREATE INDEX IF NOT EXISTS idx_donor_trust_party ON donor_trust(party_id);
CREATE INDEX IF NOT EXISTS idx_donor_trust_lockout ON donor_trust(party_id, lockout_until_tick);

-- 3. RLS policies (permissive for now, matching campaign_actions pattern)
ALTER TABLE fundraiser_promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_trust ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fundraiser_promises' AND policyname = 'fundraiser_promises_select') THEN
        EXECUTE 'CREATE POLICY fundraiser_promises_select ON fundraiser_promises FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fundraiser_promises' AND policyname = 'fundraiser_promises_insert') THEN
        EXECUTE 'CREATE POLICY fundraiser_promises_insert ON fundraiser_promises FOR INSERT WITH CHECK (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fundraiser_promises' AND policyname = 'fundraiser_promises_update') THEN
        EXECUTE 'CREATE POLICY fundraiser_promises_update ON fundraiser_promises FOR UPDATE USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fundraiser_promises' AND policyname = 'fundraiser_promises_delete') THEN
        EXECUTE 'CREATE POLICY fundraiser_promises_delete ON fundraiser_promises FOR DELETE USING (true)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'donor_trust' AND policyname = 'donor_trust_select') THEN
        EXECUTE 'CREATE POLICY donor_trust_select ON donor_trust FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'donor_trust' AND policyname = 'donor_trust_insert') THEN
        EXECUTE 'CREATE POLICY donor_trust_insert ON donor_trust FOR INSERT WITH CHECK (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'donor_trust' AND policyname = 'donor_trust_update') THEN
        EXECUTE 'CREATE POLICY donor_trust_update ON donor_trust FOR UPDATE USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'donor_trust' AND policyname = 'donor_trust_delete') THEN
        EXECUTE 'CREATE POLICY donor_trust_delete ON donor_trust FOR DELETE USING (true)';
    END IF;
END $$;
