-- ==================== ADMINISTRATIONS TABLE ====================
-- Tracks the history of every coalition government that has ruled the nation.
-- A new row is created when a coalition forms, and updated when it ends.

CREATE TABLE IF NOT EXISTS administrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       UUID NOT NULL REFERENCES nations(id),

    -- Identity
    admin_name      TEXT,           -- e.g., "Chávez Administration"

    -- Who was in charge
    head_of_state       TEXT,       -- name snapshot
    prime_minister      TEXT,       -- name snapshot
    pm_party_name       TEXT,       -- party that held PM
    pm_party_id         UUID,       -- faction ID of PM's party
    coalition_parties   JSONB,      -- array of { party_id, party_name, seats } at time of formation
    total_seats         INT,        -- coalition's combined seats when formed
    government_type     TEXT,       -- 'Democracy' or 'Autocracy'

    -- Timeline
    started_at_tick     INT NOT NULL,
    ended_at_tick       INT,        -- NULL if this is the current administration
    started_at_date     TEXT,       -- game date string when formed (e.g., "March, 2001")
    ended_at_date       TEXT,       -- game date string when ended

    -- How it ended
    end_reason          TEXT,       -- 'election_loss', 'coalition_collapse', 'new_coalition', 'coup', 'dissolved', NULL if current

    -- Stat snapshots (JSONB objects mapping stat_key → value)
    stats_at_start      JSONB,      -- full nation stats when administration began
    stats_at_end        JSONB,      -- full nation stats when administration ended (NULL if current)

    -- Approval snapshot
    approval_at_start   INT,        -- government approval when formed
    approval_at_end     INT,        -- government approval when ended

    -- Legislation and crises (computed on end)
    bills_passed        JSONB,      -- array of { bill_id, bill_name, passed_date }
    laws_repealed       JSONB,      -- array of { bill_id, bill_name, repealed_date }
    crises_started      JSONB,      -- array of { event_id, title, started_date }
    crises_solved       JSONB,      -- array of { event_id, title, solved_date }
    elections_survived  INT DEFAULT 0,

    -- Metadata
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_administrations_nation ON administrations(nation_id);
CREATE INDEX IF NOT EXISTS idx_administrations_current ON administrations(nation_id) WHERE ended_at_tick IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_administration_per_nation ON administrations(nation_id) WHERE ended_at_tick IS NULL;
