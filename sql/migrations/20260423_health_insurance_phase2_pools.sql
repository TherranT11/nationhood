-- ════════════════════════════════════════════════════════════════════════════════
-- Health Insurance — Phase 2: Per-nation policyholder pools + premium revenue
--
-- One row per (faction, nation) records the slow policyholder growth + last
-- tick's premium revenue. The corp tick processor (advance-corp-tick) reads
-- this table, updates policyholder counts via trickle/attrition, and credits
-- premium revenue to factions.corp_cash_reserves.
--
-- coverage_tier is intentionally deferred to Phase 3 when the UI selector
-- lands — no dead columns.
--
-- Idempotent. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS health_insurance_pools (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id              UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id               UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,

    -- Live state
    policyholders           INT NOT NULL DEFAULT 0,

    -- Last-tick snapshot (for UI display without recomputing)
    last_tick_revenue       BIGINT NOT NULL DEFAULT 0,
    last_tick_addressable   INT NOT NULL DEFAULT 0,
    last_tick_premium       INT NOT NULL DEFAULT 0,

    -- Lifetime totals
    total_revenue_collected BIGINT NOT NULL DEFAULT 0,

    created_at              TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (faction_id, nation_id)
);

COMMENT ON TABLE health_insurance_pools IS
    'One row per (corp faction, nation) running a private Health Insurance operation. Updated each corp tick by processHealthInsurancePools.';

CREATE INDEX IF NOT EXISTS idx_health_insurance_pools_nation
    ON health_insurance_pools (nation_id);
CREATE INDEX IF NOT EXISTS idx_health_insurance_pools_faction
    ON health_insurance_pools (faction_id);

-- ────────────────────────────────────────────────────────────────────────────────
-- RLS — intentionally stricter than corp_properties. The tick processor runs
-- with the service role (which bypasses RLS), so no client-side INSERT/UPDATE
-- policy is needed. A SELECT policy is granted so the Operations panel can
-- read a corp's own pools from the browser. If a later phase needs a "close
-- this operation" button, that write should go through a server-side RPC
-- rather than direct client access to avoid players forging their own
-- policyholder counts.
-- ────────────────────────────────────────────────────────────────────────────────
ALTER TABLE health_insurance_pools ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Anyone can read health_insurance_pools"
        ON health_insurance_pools
        FOR SELECT
        USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════════════
-- VERIFY
-- ════════════════════════════════════════════════════════════════════════════════
SELECT 'health_insurance_pools' AS table_name,
       COUNT(*) AS rows
  FROM health_insurance_pools;
