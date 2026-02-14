-- ==================== PRESIDENTIAL DEMOCRACY SCHEMA ====================
-- Adds database support for the Presidential Democracy government type.
-- Run this migration once against the Supabase database.

-- ==================== PRESIDENTS TABLE ====================
-- Tracks elected presidents, their terms, and traits.
-- A new row is created each presidential election; is_active marks the sitting president.

CREATE TABLE IF NOT EXISTS presidents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id           UUID NOT NULL REFERENCES nations(id),
    faction_id          UUID NOT NULL REFERENCES factions(id),

    -- Identity
    first_name          TEXT NOT NULL,
    last_name           TEXT NOT NULL,
    age                 INT,
    ideology            TEXT,           -- ideology tag (e.g., 'PROGRESS')
    trait               TEXT,           -- leader trait name
    trait_upside        TEXT,
    trait_downside      TEXT,

    -- Term
    elected_tick        INT NOT NULL,
    term_ends_tick      INT NOT NULL,   -- elected_tick + PRESIDENTIAL_TERM_TICKS (24)
    is_active           BOOLEAN DEFAULT true,

    -- Approval
    approval_modifier   INT DEFAULT 0,  -- president-specific approval delta

    -- Metadata
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presidents_nation ON presidents(nation_id);
CREATE INDEX IF NOT EXISTS idx_presidents_active ON presidents(nation_id) WHERE is_active = true;

-- ==================== BILLS TABLE — PRESIDENTIAL COLUMNS ====================
-- Tracks presidential action on passed bills (sign / veto).

ALTER TABLE bills ADD COLUMN IF NOT EXISTS president_action TEXT;         -- NULL, 'signed', 'vetoed', 'overridden'
ALTER TABLE bills ADD COLUMN IF NOT EXISTS president_action_tick INT;     -- tick when president acted
ALTER TABLE bills ADD COLUMN IF NOT EXISTS president_desk_deadline INT;   -- tick when auto-sign triggers
ALTER TABLE bills ADD COLUMN IF NOT EXISTS original_bill_id UUID;        -- for veto_override bills, links to the vetoed bill
ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_veto_override BOOLEAN DEFAULT false;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS ministry_key TEXT;             -- for minister_confirmation bills, links to ministry slot

-- ==================== ELECTIONS TABLE — ELECTION TYPE ====================
-- Distinguishes parliamentary vs presidential elections for staggered scheduling.

ALTER TABLE elections ADD COLUMN IF NOT EXISTS election_type TEXT DEFAULT 'parliamentary';
-- Values: 'parliamentary', 'presidential'

-- ==================== ADMINISTRATIONS TABLE — PRESIDENTIAL COLUMNS ====================
-- Stores president info alongside existing PM fields for presidential governments.

ALTER TABLE administrations ADD COLUMN IF NOT EXISTS president_name TEXT;
ALTER TABLE administrations ADD COLUMN IF NOT EXISTS president_party_id UUID;
ALTER TABLE administrations ADD COLUMN IF NOT EXISTS president_party_name TEXT;

-- ==================== MINISTRIES TABLE — CONFIRMATION COLUMNS ====================
-- Tracks pending minister nominations awaiting parliamentary confirmation.

ALTER TABLE ministries ADD COLUMN IF NOT EXISTS pending_party_id UUID;
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS pending_first_name TEXT;
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS pending_last_name TEXT;
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS pending_age INT;
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS confirmation_status TEXT;          -- 'pending', 'confirmed', 'rejected'
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS rejected_party_ids JSONB DEFAULT '[]'::JSONB;
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS pending_minister JSONB;                       -- JSONB blob for pending nominee
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS rejected_parties JSONB DEFAULT '[]'::JSONB;   -- tracks rejected party IDs per slot

-- ==================== PM_CANDIDATES TABLE — CANDIDATE TYPE ====================
-- Distinguishes PM candidates from presidential nominees.
-- Presidential candidates are generated 6 ticks before the election.

ALTER TABLE pm_candidates ADD COLUMN IF NOT EXISTS candidate_type TEXT DEFAULT 'pm';
-- Values: 'pm', 'presidential'
