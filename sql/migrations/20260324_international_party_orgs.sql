-- ============================================================
-- International Party Organisations (IPOs)
--
-- Voluntary cross-nation associations of like-minded parties.
-- Players create orgs, invite members, coordinate through
-- shared chat, vote on actions, and spend AP collectively.
--
-- Tables:
--   international_orgs       — org identity, charter (JSONB), presidency
--   ipo_members              — membership records (member / observer)
--   ipo_chat                 — org chat messages + system events
--   ipo_votes                — vote records (admission, expulsion, etc.)
--   ipo_ballots              — individual ballots (separate for secret ballot)
--   ipo_action_log           — action history (rallies, back-channel, etc.)
--   ipo_fund_transactions    — solidarity fund ledger
-- ============================================================


-- ==================== INTERNATIONAL ORGS ====================

CREATE TABLE IF NOT EXISTS international_orgs (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name                        TEXT NOT NULL,
    description                 TEXT,
    logo_symbol                 TEXT NOT NULL,             -- one of: ◈ ⬡ ▲ ◆ ⬢ ⊕
    logo_text                   TEXT NOT NULL,             -- max 4 characters, e.g. "PSI"

    -- Founding
    founded_at_tick             INT NOT NULL,
    founding_party_id           UUID NOT NULL REFERENCES factions(id),

    -- Leadership
    president_id                UUID NOT NULL REFERENCES factions(id),
    president_term_start_tick   INT NOT NULL,

    -- Headquarters (nullable — can be vacant)
    headquarters_nation_id      UUID REFERENCES nations(id),

    -- Solidarity Fund
    solidarity_fund_balance     INT NOT NULL DEFAULT 0,

    -- Charter — all 5 articles stored as structured JSONB
    -- Shape: {
    --   mission: string,
    --   leadership: { type, termYears, votingWeight, votePass },
    --   membership: { admission, ideologicalThreshold: { enabled, directions[] }, expulsionClause },
    --   governance: { voteTransparency, observerStatus, vetoRight, emergencyPowers },
    --   resources: { solidarityFund: { enabled, contributionPerQuarter },
    --               resourceSharingCap, jointStatementClause, headquarters }
    -- }
    charter                     JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Symposium state (org-level, not per-member)
    symposium_cooldown_remaining INT NOT NULL DEFAULT 0,
    pending_symposium           JSONB,                    -- { targetNation, axis, direction, ideologyShift, firesOnTick }

    -- Lifecycle
    is_active                   BOOLEAN NOT NULL DEFAULT true,
    dissolved_at_tick           INT,

    -- Metadata
    created_at                  TIMESTAMPTZ DEFAULT now(),
    updated_at                  TIMESTAMPTZ DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_org_name_length CHECK (char_length(name) <= 40),
    CONSTRAINT chk_org_description_length CHECK (char_length(description) <= 200),
    CONSTRAINT chk_org_logo_text_length CHECK (char_length(logo_text) <= 4),
    CONSTRAINT chk_org_logo_symbol CHECK (logo_symbol IN ('◈', '⬡', '▲', '◆', '⬢', '⊕')),
    CONSTRAINT chk_org_fund_nonneg CHECK (solidarity_fund_balance >= 0)
);

CREATE INDEX IF NOT EXISTS idx_international_orgs_active
    ON international_orgs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_international_orgs_president
    ON international_orgs(president_id);
CREATE INDEX IF NOT EXISTS idx_international_orgs_hq
    ON international_orgs(headquarters_nation_id);


-- ==================== MEMBERS ====================

CREATE TABLE IF NOT EXISTS ipo_members (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES international_orgs(id) ON DELETE CASCADE,
    faction_id          UUID NOT NULL REFERENCES factions(id),

    -- Role: 'member' can vote/act, 'observer' can only read
    role                TEXT NOT NULL DEFAULT 'member',

    -- Timeline
    joined_at_tick      INT NOT NULL,
    left_at_tick        INT,
    is_active           BOOLEAN NOT NULL DEFAULT true,

    -- Chat colour assigned from fixed palette on join
    chat_color          TEXT,

    -- Metadata
    created_at          TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_member_role CHECK (role IN ('member', 'observer'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ipo_members_active_unique
    ON ipo_members(org_id, faction_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ipo_members_org
    ON ipo_members(org_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ipo_members_faction
    ON ipo_members(faction_id) WHERE is_active = true;


-- ==================== CHAT ====================

CREATE TABLE IF NOT EXISTS ipo_chat (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES international_orgs(id) ON DELETE CASCADE,

    -- Sender (NULL for system messages)
    faction_id          UUID REFERENCES factions(id),
    is_system           BOOLEAN NOT NULL DEFAULT false,

    -- Content
    message_text        TEXT NOT NULL,

    -- Tick
    tick_posted         INT NOT NULL,

    -- Metadata
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ipo_chat_org
    ON ipo_chat(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ipo_chat_org_tick
    ON ipo_chat(org_id, tick_posted DESC);


-- ==================== VOTES ====================

CREATE TABLE IF NOT EXISTS ipo_votes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES international_orgs(id) ON DELETE CASCADE,

    -- Vote metadata
    title               TEXT NOT NULL,
    vote_type           TEXT NOT NULL,
    meta                JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Status
    status              TEXT NOT NULL DEFAULT 'open',

    -- Timeline
    opened_at_tick      INT NOT NULL,
    closes_at_tick      INT NOT NULL,
    resolved_at_tick    INT,

    -- Proposer
    proposed_by         UUID NOT NULL REFERENCES factions(id),

    -- Result (populated on resolution)
    result              JSONB,                  -- { yes, no, abstain, passed }

    -- Metadata
    created_at          TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_vote_type CHECK (vote_type IN (
        'membership', 'expulsion', 'joint_statement', 'fund_draw',
        'charter_amendment', 'change_headquarters', 'symposium'
    )),
    CONSTRAINT chk_vote_status CHECK (status IN ('open', 'passed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_ipo_votes_org
    ON ipo_votes(org_id, opened_at_tick DESC);
CREATE INDEX IF NOT EXISTS idx_ipo_votes_open
    ON ipo_votes(org_id, status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_ipo_votes_closes
    ON ipo_votes(closes_at_tick) WHERE status = 'open';


-- ==================== BALLOTS ====================
-- Separate from votes to support secret ballot (ballots can be
-- stored without faction_id linkage when transparency = 'secret').

CREATE TABLE IF NOT EXISTS ipo_ballots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vote_id             UUID NOT NULL REFERENCES ipo_votes(id) ON DELETE CASCADE,

    -- Voter (NULL for secret ballots — only tallies stored)
    faction_id          UUID REFERENCES factions(id),

    -- Vote cast
    ballot              TEXT,                    -- 'yes', 'no', 'abstain'

    -- Timeline
    cast_at_tick        INT,

    -- Metadata
    created_at          TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_ballot_value CHECK (ballot IN ('yes', 'no', 'abstain'))
);

-- Public ballots: one per voter per vote
CREATE UNIQUE INDEX IF NOT EXISTS idx_ipo_ballots_unique_public
    ON ipo_ballots(vote_id, faction_id) WHERE faction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ipo_ballots_vote
    ON ipo_ballots(vote_id);


-- ==================== ACTION LOG ====================

CREATE TABLE IF NOT EXISTS ipo_action_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES international_orgs(id) ON DELETE CASCADE,

    -- Who performed it
    faction_id          UUID NOT NULL REFERENCES factions(id),

    -- Action details
    action_type         TEXT NOT NULL,
    target_faction_id   UUID REFERENCES factions(id),   -- for targeted actions (rally, back-channel)
    action_data         JSONB NOT NULL DEFAULT '{}'::jsonb,  -- dice rolls, exposure flag, amounts, etc.
    ap_cost             INT NOT NULL DEFAULT 0,

    -- Tick
    performed_at_tick   INT NOT NULL,

    -- Metadata
    created_at          TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_action_type CHECK (action_type IN (
        'hold_rally', 'rally_all', 'back_channel',
        'joint_statement', 'fund_draw'
    ))
);

CREATE INDEX IF NOT EXISTS idx_ipo_action_log_org
    ON ipo_action_log(org_id, performed_at_tick DESC);
CREATE INDEX IF NOT EXISTS idx_ipo_action_log_type_target
    ON ipo_action_log(org_id, action_type, target_faction_id);


-- ==================== FUND TRANSACTIONS ====================
-- Ledger for the solidarity fund — every AP in and out is tracked.

CREATE TABLE IF NOT EXISTS ipo_fund_transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES international_orgs(id) ON DELETE CASCADE,

    -- Who (NULL for system-level entries like HQ cost)
    faction_id          UUID REFERENCES factions(id),

    -- Transaction
    transaction_type    TEXT NOT NULL,
    amount              INT NOT NULL,               -- positive = deposit, negative = withdrawal
    description         TEXT,

    -- Tick
    tick                INT NOT NULL,

    -- Metadata
    created_at          TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_fund_txn_type CHECK (transaction_type IN (
        'contribution', 'draw', 'hq_cost', 'symposium_payment'
    ))
);

CREATE INDEX IF NOT EXISTS idx_ipo_fund_txn_org
    ON ipo_fund_transactions(org_id, tick DESC);


-- ==================== INVITATIONS ====================
-- Tracks pending invitations to join an org.

CREATE TABLE IF NOT EXISTS ipo_invitations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES international_orgs(id) ON DELETE CASCADE,

    -- Who invited whom
    invited_by          UUID NOT NULL REFERENCES factions(id),
    target_faction_id   UUID NOT NULL REFERENCES factions(id),

    -- Role offered
    invited_role        TEXT NOT NULL DEFAULT 'member',

    -- Status
    status              TEXT NOT NULL DEFAULT 'pending',

    -- Timeline
    invited_at_tick     INT NOT NULL,
    responded_at_tick   INT,

    -- Metadata
    created_at          TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_invite_role CHECK (invited_role IN ('member', 'observer')),
    CONSTRAINT chk_invite_status CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'vote_pending'))
);

-- Only one active invite per org per target
CREATE UNIQUE INDEX IF NOT EXISTS idx_ipo_invitations_active
    ON ipo_invitations(org_id, target_faction_id)
    WHERE status IN ('pending', 'vote_pending');
CREATE INDEX IF NOT EXISTS idx_ipo_invitations_target
    ON ipo_invitations(target_faction_id, status)
    WHERE status IN ('pending', 'vote_pending');


-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE international_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipo_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipo_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipo_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipo_ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipo_action_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipo_fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipo_invitations ENABLE ROW LEVEL SECURITY;

-- Orgs: anyone can read active orgs; only the service role creates/updates
CREATE POLICY "international_orgs_select" ON international_orgs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "international_orgs_insert" ON international_orgs
    FOR INSERT TO authenticated
    WITH CHECK (founding_party_id = auth.uid());

CREATE POLICY "international_orgs_update" ON international_orgs
    FOR UPDATE TO authenticated
    USING (
        president_id = auth.uid()
        OR id IN (SELECT org_id FROM ipo_members WHERE faction_id = auth.uid() AND is_active = true)
    );

-- Members: anyone can read; members insert/update their own records
CREATE POLICY "ipo_members_select" ON ipo_members
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "ipo_members_insert" ON ipo_members
    FOR INSERT TO authenticated
    WITH CHECK (faction_id = auth.uid());

CREATE POLICY "ipo_members_update" ON ipo_members
    FOR UPDATE TO authenticated
    USING (
        faction_id = auth.uid()
        OR org_id IN (SELECT org_id FROM ipo_members WHERE faction_id = auth.uid() AND is_active = true)
    );

-- Chat: members/observers of the org can read; only full members can write
CREATE POLICY "ipo_chat_select" ON ipo_chat
    FOR SELECT TO authenticated
    USING (
        org_id IN (SELECT org_id FROM ipo_members WHERE faction_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "ipo_chat_insert" ON ipo_chat
    FOR INSERT TO authenticated
    WITH CHECK (
        faction_id = auth.uid()
        AND org_id IN (
            SELECT org_id FROM ipo_members
            WHERE faction_id = auth.uid() AND is_active = true AND role = 'member'
        )
    );

-- Votes: org members can read; any member can propose
CREATE POLICY "ipo_votes_select" ON ipo_votes
    FOR SELECT TO authenticated
    USING (
        org_id IN (SELECT org_id FROM ipo_members WHERE faction_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "ipo_votes_insert" ON ipo_votes
    FOR INSERT TO authenticated
    WITH CHECK (
        proposed_by = auth.uid()
        AND org_id IN (
            SELECT org_id FROM ipo_members
            WHERE faction_id = auth.uid() AND is_active = true AND role = 'member'
        )
    );

-- Ballots: org members can read (public) or see own (secret handled in app);
-- members can insert their own ballot
CREATE POLICY "ipo_ballots_select" ON ipo_ballots
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "ipo_ballots_insert" ON ipo_ballots
    FOR INSERT TO authenticated
    WITH CHECK (
        (faction_id = auth.uid() OR faction_id IS NULL)
    );

CREATE POLICY "ipo_ballots_update" ON ipo_ballots
    FOR UPDATE TO authenticated
    USING (faction_id = auth.uid());

-- Action log: org members can read; executor writes
CREATE POLICY "ipo_action_log_select" ON ipo_action_log
    FOR SELECT TO authenticated
    USING (
        org_id IN (SELECT org_id FROM ipo_members WHERE faction_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "ipo_action_log_insert" ON ipo_action_log
    FOR INSERT TO authenticated
    WITH CHECK (faction_id = auth.uid());

-- Fund transactions: org members can read
CREATE POLICY "ipo_fund_txn_select" ON ipo_fund_transactions
    FOR SELECT TO authenticated
    USING (
        org_id IN (SELECT org_id FROM ipo_members WHERE faction_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "ipo_fund_txn_insert" ON ipo_fund_transactions
    FOR INSERT TO authenticated WITH CHECK (true);

-- Invitations: target can read their own; org members can read org invites
CREATE POLICY "ipo_invitations_select" ON ipo_invitations
    FOR SELECT TO authenticated
    USING (
        target_faction_id = auth.uid()
        OR org_id IN (SELECT org_id FROM ipo_members WHERE faction_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "ipo_invitations_insert" ON ipo_invitations
    FOR INSERT TO authenticated
    WITH CHECK (
        invited_by = auth.uid()
        AND org_id IN (
            SELECT org_id FROM ipo_members
            WHERE faction_id = auth.uid() AND is_active = true AND role = 'member'
        )
    );

CREATE POLICY "ipo_invitations_update" ON ipo_invitations
    FOR UPDATE TO authenticated
    USING (
        target_faction_id = auth.uid()
        OR invited_by = auth.uid()
    );
