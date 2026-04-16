-- ════════════════════════════════════════════════════════════════════════════════
-- Corporate Executives — Phase 1: Schema + Executive Pool
--
-- Each corporation has a C-suite (CEO, CFO, COO, CTO, CMO, CLO, Lobbyist).
-- CEO is auto-generated at corp creation from existing leader data.
-- Other roles start vacant; the player hires from a persistent executive pool.
--
-- The executive pool is generated per-nation (15-20 candidates) with names
-- drawn from all nation name lists. Pool is seeded once and persists.
-- ════════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════
-- 1. CORP EXECUTIVES TABLE (hired executives)
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS corp_executives (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id          UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,

    -- Role
    role                TEXT NOT NULL CHECK (role IN ('CEO', 'CFO', 'COO', 'CTO', 'CMO', 'CLO', 'Lobbyist')),

    -- Identity
    first_name          TEXT NOT NULL,
    last_name           TEXT NOT NULL,
    age                 INT NOT NULL CHECK (age >= 25 AND age <= 80),
    origin_nation       TEXT,            -- display label: 'Calveth', 'Flandis', etc.

    -- Stats (tiered model, 1..5)
    -- Compatibility note: legacy 0..100 rows should be bucketed during upgrade.
    skill               INT NOT NULL CHECK (skill >= 1 AND skill <= 5),

    -- Compensation
    salary_per_year     BIGINT NOT NULL DEFAULT 0,      -- annual salary
    contract_years      INT NOT NULL DEFAULT 1 CHECK (contract_years >= 1 AND contract_years <= 7),
    contract_start_tick INT,                              -- tick when hired
    contract_end_tick   INT,                              -- computed: start + (contract_years * ticks_per_year)

    -- Status
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fired', 'expired', 'resigned')),

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One active executive per role per corporation
    CONSTRAINT uq_corp_exec_role UNIQUE (faction_id, role, status)
);

CREATE INDEX IF NOT EXISTS idx_corp_executives_faction ON corp_executives(faction_id);

-- RLS
ALTER TABLE corp_executives ENABLE ROW LEVEL SECURITY;
CREATE POLICY corp_executives_read ON corp_executives
    FOR SELECT TO authenticated USING (true);
CREATE POLICY corp_executives_insert ON corp_executives
    FOR INSERT TO authenticated WITH CHECK (faction_id = auth.uid());
CREATE POLICY corp_executives_update ON corp_executives
    FOR UPDATE TO authenticated USING (faction_id = auth.uid());


-- ═══════════════════════════════════════════════════
-- 2. EXECUTIVE POOL TABLE (available candidates)
-- ═══════════════════════════════════════════════════
-- Generated once per nation. Players browse this to hire.

CREATE TABLE IF NOT EXISTS executive_pool (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id           UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,

    -- Identity
    first_name          TEXT NOT NULL,
    last_name           TEXT NOT NULL,
    age                 INT NOT NULL CHECK (age >= 28 AND age <= 65),
    origin_nation       TEXT NOT NULL,   -- where they're from: 'Calveth', 'Flandis', etc.

    -- Qualifications (tiered model, 1..5)
    -- Compatibility note: legacy 25..90 rows should be bucketed during upgrade.
    skill               INT NOT NULL CHECK (skill >= 1 AND skill <= 5),
    specializations     TEXT[] NOT NULL DEFAULT '{}',  -- roles they can fill: '{CFO,COO}'

    -- Compensation demands
    required_salary     BIGINT NOT NULL,                -- total contract value / years = annual
    required_years      INT NOT NULL CHECK (required_years >= 2 AND required_years <= 7),

    -- Status
    status              TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'hired', 'retired')),
    hired_by_faction_id UUID REFERENCES factions(id) ON DELETE SET NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_executive_pool_nation ON executive_pool(nation_id);
CREATE INDEX IF NOT EXISTS idx_executive_pool_status ON executive_pool(status) WHERE status = 'available';

-- RLS
ALTER TABLE executive_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY executive_pool_read ON executive_pool
    FOR SELECT TO authenticated USING (true);
-- Hiring is done through RPCs, not direct writes
-- Service role handles status updates

-- ───────────────────────────────────────────────────────────────────────────────
-- Compatibility migration (safe on existing DBs that already have these tables)
-- Converts historical 0..100 style values to tiered 1..5 buckets and tightens
-- constraints to the new range.
-- ───────────────────────────────────────────────────────────────────────────────

UPDATE corp_executives
SET skill = LEAST(5, GREATEST(1, CEIL(skill::numeric / 20.0)::INT))
WHERE skill IS NOT NULL AND (skill < 1 OR skill > 5);

UPDATE executive_pool
SET skill = LEAST(5, GREATEST(1, CEIL(skill::numeric / 20.0)::INT))
WHERE skill IS NOT NULL AND (skill < 1 OR skill > 5);

ALTER TABLE corp_executives DROP CONSTRAINT IF EXISTS corp_executives_skill_check;
ALTER TABLE corp_executives
    ADD CONSTRAINT corp_executives_skill_check CHECK (skill >= 1 AND skill <= 5);

ALTER TABLE executive_pool DROP CONSTRAINT IF EXISTS executive_pool_skill_check;
ALTER TABLE executive_pool
    ADD CONSTRAINT executive_pool_skill_check CHECK (skill >= 1 AND skill <= 5);

COMMIT;
