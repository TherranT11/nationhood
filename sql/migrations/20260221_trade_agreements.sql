-- ==================== TRADE AGREEMENTS SCHEMA ====================
-- Adds trade agreement support as Diplomatic Initiatives.
-- 4 types: FTA, PTA, Resource Supply Contract, Export Subsidy.
-- 6 tradeable sectors: Fuel, Minerals, Food, Manufactured Goods, Technology, Arms.
--
-- Uses existing diplomatic_proposals table with new proposal_type values
-- and structured proposal_data JSONB for article details.

-- ==================== TRADE NEGOTIATIONS TABLE ====================
-- Tracks active trade negotiations between nations.
-- Created when both ambassadors agree to open negotiations.
-- Status flow: open → active → concluded / expired / cancelled

CREATE TABLE IF NOT EXISTS trade_negotiations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Participating nations
    nation_a_id             UUID NOT NULL REFERENCES nations(id),
    nation_b_id             UUID NOT NULL REFERENCES nations(id),

    -- The diplomatic_proposals row that initiated this negotiation
    initiating_proposal_id  UUID REFERENCES diplomatic_proposals(id),

    -- Agreement type being negotiated
    agreement_type          TEXT NOT NULL,       -- fta, pta, resource_supply, export_subsidy

    -- Status
    status                  TEXT NOT NULL DEFAULT 'open',
                                                 -- open: awaiting partner acceptance
                                                 -- active: both sides negotiating
                                                 -- concluded: agreement finalized, bill generated
                                                 -- expired: deadline passed
                                                 -- cancelled: manually cancelled

    -- Participants who have joined the negotiation
    -- Each entry: { faction_id, role: 'ambassador'|'foreign_minister'|'prime_minister', joined_at_tick, nation_id }
    participants            JSONB DEFAULT '[]'::jsonb,

    -- The draft articles being negotiated (structured per agreement type)
    draft_articles          JSONB DEFAULT '[]'::jsonb,

    -- Agreement name
    agreement_name          TEXT,

    -- Expiration
    expires_at_tick         INT NOT NULL,        -- negotiation deadline
    extension_requested_a   BOOLEAN DEFAULT false,  -- nation_a requested extension
    extension_requested_b   BOOLEAN DEFAULT false,  -- nation_b requested extension
    extensions_used         INT DEFAULT 0,          -- how many times extended

    -- Approval tracking
    -- The highest representative on each side must approve
    approved_by_a           UUID,                -- faction_id of approver (PM or FM)
    approved_by_a_role      TEXT,                -- 'prime_minister' or 'foreign_minister'
    approved_at_a_tick      INT,
    approved_by_b           UUID,
    approved_by_b_role      TEXT,
    approved_at_b_tick      INT,

    -- Generated bills (once both sides approve)
    bill_a_id               UUID,                -- bill in nation_a's parliament
    bill_b_id               UUID,                -- bill in nation_b's parliament

    -- Timeline
    opened_at_tick          INT NOT NULL,
    concluded_at_tick       INT,

    -- Metadata
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_trade_neg_nation_order CHECK (nation_a_id < nation_b_id)
);

CREATE INDEX IF NOT EXISTS idx_trade_negotiations_nations
    ON trade_negotiations(nation_a_id, nation_b_id);
CREATE INDEX IF NOT EXISTS idx_trade_negotiations_status
    ON trade_negotiations(status);
CREATE INDEX IF NOT EXISTS idx_trade_negotiations_expires
    ON trade_negotiations(expires_at_tick);

-- ==================== ACTIVE TRADE AGREEMENTS TABLE ====================
-- Stores enacted trade agreements (after both parliaments pass the bill).
-- These have mechanical effects on the trade engine.

CREATE TABLE IF NOT EXISTS trade_agreements (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Participating nations (canonical order)
    nation_a_id             UUID NOT NULL REFERENCES nations(id),
    nation_b_id             UUID NOT NULL REFERENCES nations(id),

    -- Link back to the negotiation and bills
    negotiation_id          UUID REFERENCES trade_negotiations(id),
    bill_a_id               UUID,
    bill_b_id               UUID,

    -- Agreement details
    agreement_type          TEXT NOT NULL,       -- fta, pta, resource_supply, export_subsidy
    agreement_name          TEXT NOT NULL,
    articles                JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Duration
    duration_type           TEXT NOT NULL DEFAULT 'fixed',  -- permanent, fixed
    duration_ticks          INT,                            -- for fixed-term
    auto_renew              BOOLEAN DEFAULT false,
    withdrawal_notice_ticks INT DEFAULT 3,                  -- ticks notice required to withdraw

    -- Status
    status                  TEXT NOT NULL DEFAULT 'active',
                                                 -- active, expired, withdrawn, breached, suspended

    -- Timeline
    enacted_at_tick         INT NOT NULL,
    expires_at_tick         INT,                 -- null if permanent
    withdrawn_at_tick       INT,
    withdrawal_notice_at    INT,                 -- tick when withdrawal notice was given

    -- Who withdrew (if applicable)
    withdrawn_by_nation     UUID,

    -- Metadata
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_trade_agr_nation_order CHECK (
        agreement_type = 'export_subsidy' OR nation_a_id < nation_b_id
    )
);

CREATE INDEX IF NOT EXISTS idx_trade_agreements_nations
    ON trade_agreements(nation_a_id, nation_b_id);
CREATE INDEX IF NOT EXISTS idx_trade_agreements_status
    ON trade_agreements(status);
CREATE INDEX IF NOT EXISTS idx_trade_agreements_type
    ON trade_agreements(agreement_type);
CREATE INDEX IF NOT EXISTS idx_trade_agreements_expires
    ON trade_agreements(expires_at_tick);

-- ==================== LINK BILLS TO TRADE AGREEMENTS ====================
-- Add columns to bills table for trade agreement ratification bills.

ALTER TABLE bills ADD COLUMN IF NOT EXISTS trade_negotiation_id UUID REFERENCES trade_negotiations(id);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS trade_agreement_data JSONB;

-- ==================== RLS POLICIES ====================
-- Trade negotiations and agreements should be readable by all authenticated users
-- but only writable through RPCs/edge functions.

ALTER TABLE trade_negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_agreements ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
DROP POLICY IF EXISTS "trade_negotiations_read" ON trade_negotiations;
CREATE POLICY "trade_negotiations_read" ON trade_negotiations
    FOR SELECT TO authenticated USING (true);

-- Write access for all authenticated users (authorization checked in application code)
DROP POLICY IF EXISTS "trade_negotiations_write" ON trade_negotiations;
CREATE POLICY "trade_negotiations_write" ON trade_negotiations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "trade_agreements_read" ON trade_agreements;
CREATE POLICY "trade_agreements_read" ON trade_agreements
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "trade_agreements_write" ON trade_agreements;
CREATE POLICY "trade_agreements_write" ON trade_agreements
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
