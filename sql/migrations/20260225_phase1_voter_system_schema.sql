-- ===================================================================
-- Phase 1: Voter Preference & Approval System — Foundation Schema
-- Purely additive. No runtime behavior changes.
-- ===================================================================

-- 1. Government approval component columns on nations table
--    These store the three components of the spec's gov approval formula:
--    gov_approval = institutional(0.45) + outcomes(0.35) + events(0.20)
ALTER TABLE nations ADD COLUMN IF NOT EXISTS gov_approval REAL DEFAULT 50;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS gov_approval_institutional REAL DEFAULT 50;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS gov_approval_outcomes REAL DEFAULT 50;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS gov_approval_events REAL DEFAULT 0;

-- 2. Momentum audit log
--    Every adjustMomentum() call writes here with a source tag.
--    Enables player-visible "why did my approval change?" traceability.
CREATE TABLE IF NOT EXISTS momentum_log (
    id            BIGSERIAL PRIMARY KEY,
    nation_id     UUID NOT NULL,
    faction_id    UUID NOT NULL,
    bloc_id       UUID,                -- NULL = "all blocs for this faction"
    amount        REAL NOT NULL,
    source        TEXT NOT NULL,        -- e.g. 'crisis:government_shutdown', 'bill:enactment', 'promise:broken'
    tick          INTEGER NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_momentum_log_nation_faction
    ON momentum_log(nation_id, faction_id, tick);
CREATE INDEX IF NOT EXISTS idx_momentum_log_nation_tick
    ON momentum_log(nation_id, tick);

-- 3. Government approval event log
--    Every adjustGovernmentApprovalEvent() call writes here.
--    The events component (0.20 weight) decays 12% per tick; this tracks the raw inputs.
CREATE TABLE IF NOT EXISTS gov_approval_log (
    id            BIGSERIAL PRIMARY KEY,
    nation_id     UUID NOT NULL,
    amount        REAL NOT NULL,
    source        TEXT NOT NULL,
    tick          INTEGER NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gov_approval_log_nation_tick
    ON gov_approval_log(nation_id, tick);

-- 4. Stat history for weighted trend calculation
--    Stores per-tick snapshots of all nation stats. Used by statTrend() to compute
--    6-tick weighted trends for the performance pillar and outcomes component.
--    Composite primary key prevents duplicate snapshots per stat per tick.
CREATE TABLE IF NOT EXISTS stat_history (
    nation_id     UUID NOT NULL,
    stat_name     TEXT NOT NULL,
    value         REAL NOT NULL,
    tick          INTEGER NOT NULL,
    PRIMARY KEY (nation_id, stat_name, tick)
);
CREATE INDEX IF NOT EXISTS idx_stat_history_lookup
    ON stat_history(nation_id, stat_name, tick DESC);
