-- ══════════════════════════════════════════════════════════════
-- Corporation Simplification v2
-- Collapses ~20 corp subsystems down to 11 canonical stats:
--   Ownership, Cash, Revenue, Costs, Debt, Employee Wages,
--   Innovation, Market Share, Reputation, Productivity, Assets
--
-- Corps live on the `factions` table (faction_type='corporation').
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. Drop dead tables (children before parents for FK safety)
-- ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS vessel_incidents CASCADE;
DROP TABLE IF EXISTS vessel_insurance CASCADE;
DROP TABLE IF EXISTS shipping_application_vessel CASCADE;
DROP TABLE IF EXISTS corp_vessels CASCADE;

DROP TABLE IF EXISTS corp_equipment_deliveries CASCADE;
DROP TABLE IF EXISTS corp_equipment CASCADE;
DROP TABLE IF EXISTS corp_warehouse CASCADE;

DROP TABLE IF EXISTS available_properties CASCADE;
DROP TABLE IF EXISTS property_catalog CASCADE;
DROP TABLE IF EXISTS corp_properties CASCADE;
DROP TABLE IF EXISTS corp_permits CASCADE;
DROP TABLE IF EXISTS construction_permits CASCADE;
-- construction_contracts is a parallel contract table that depends on dead
-- materials/equipment/workforce systems. corp_contracts is the surviving one.
DROP TABLE IF EXISTS construction_contracts CASCADE;
DROP TABLE IF EXISTS permit_policies CASCADE;
DROP TABLE IF EXISTS project_permit_requirements CASCADE;

DROP TABLE IF EXISTS bond_holdings CASCADE;
DROP TABLE IF EXISTS government_bonds CASCADE;
DROP TABLE IF EXISTS construction_insurance CASCADE;

DROP TABLE IF EXISTS finance_active_loans CASCADE;
DROP TABLE IF EXISTS finance_loan_requests CASCADE;
DROP TABLE IF EXISTS finance_loan_offers CASCADE;
DROP TABLE IF EXISTS finance_insurance_claims CASCADE;
DROP TABLE IF EXISTS finance_insurance_policies CASCADE;

-- Equity system: parallel ownership mechanism built on dead finance_loan_*
-- pipeline. Replaced by corp_ownership.
DROP TABLE IF EXISTS equity_secondary_offers CASCADE;
DROP TABLE IF EXISTS equity_dividends CASCADE;
DROP TABLE IF EXISTS equity_positions CASCADE;

DROP TABLE IF EXISTS corp_workforce_audit CASCADE;
DROP TABLE IF EXISTS corp_donation_cooldown CASCADE;
DROP TABLE IF EXISTS corp_cash_history CASCADE;

-- corp_executives + corp_executive_pool: KEPT (per spec).

-- Drop corp-side health insurance
DROP TABLE IF EXISTS health_insurance_lawsuits CASCADE;
DROP TABLE IF EXISTS health_insurance_claims CASCADE;
DROP TABLE IF EXISTS health_insurance_tiers CASCADE;
DROP TABLE IF EXISTS health_insurance_pools CASCADE;
DROP TABLE IF EXISTS health_insurance_policies CASCADE;

-- Drop dead RPCs by name (signature-agnostic, handles overloads).
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'declare_corp_bankruptcy',
        'deliver_vessel_order',
        'abandon_construction_contract',
        'release_stuck_corp_equipment',
        'buy_bond',
        'sell_bond',
        'dispute_bond',
        'call_loan',
        'claim_loan',
        'foreclose_loan',
        'pay_loan',
        'project_permit_requirements',
        'auto_loan_originate',
        'auto_loan_origination',
        'equity_buy_in',
        'equity_sell',
        'equity_pay_dividend',
        'resolve_construction_event'
      )
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. Drop dead columns on factions (corp side)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE factions
  DROP COLUMN IF EXISTS corp_subsector,
  DROP COLUMN IF EXISTS corp_general_workforce,
  DROP COLUMN IF EXISTS corp_skilled_workforce,
  DROP COLUMN IF EXISTS corp_innovative_workforce,
  DROP COLUMN IF EXISTS corp_operational_efficiency,
  -- monthly_profit was added by equity phase 1; superseded by the per-tick
  -- flow snapshots (corp_revenue/costs/wages_current_tick) introduced below.
  DROP COLUMN IF EXISTS monthly_profit;

-- ─────────────────────────────────────────────────────────────
-- 3. Add new persisted stats to factions
-- ─────────────────────────────────────────────────────────────

-- Single-number Assets (replaces properties + equipment + warehouse + vessels)
ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS corp_assets NUMERIC NOT NULL DEFAULT 0;

-- 0-10 derived stats (event-driven, no passive drift)
ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS corp_innovation     NUMERIC(4,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corp_market_share   NUMERIC(4,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corp_productivity   NUMERIC(4,2) NOT NULL DEFAULT 0;

-- Per-tick flow snapshots (recomputed each tick; history in corp_pnl_history)
ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS corp_revenue_current_tick NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corp_costs_current_tick   NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corp_wages_current_tick   NUMERIC NOT NULL DEFAULT 0;

-- Range constraints on 0-10 stats
DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_innovation_range   CHECK (corp_innovation   BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_market_share_range CHECK (corp_market_share BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_productivity_range CHECK (corp_productivity BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- 4. Rescale Reputation 0-100 → 0-10
-- ─────────────────────────────────────────────────────────────
UPDATE factions
SET corp_reputation = ROUND((COALESCE(corp_reputation, 0)::numeric / 10), 2)
WHERE faction_type = 'corporation'
  AND corp_reputation > 10;  -- idempotent guard

ALTER TABLE factions
  ALTER COLUMN corp_reputation TYPE NUMERIC(4,2) USING corp_reputation::numeric;

ALTER TABLE factions
  ALTER COLUMN corp_reputation SET DEFAULT 5.0;

UPDATE factions SET corp_reputation = 5.0 WHERE corp_reputation IS NULL;

ALTER TABLE factions
  ALTER COLUMN corp_reputation SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_reputation_range CHECK (corp_reputation BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- 5. Strip dead columns from corp_contracts
-- ─────────────────────────────────────────────────────────────
ALTER TABLE corp_contracts
  DROP COLUMN IF EXISTS assigned_workforce,
  DROP COLUMN IF EXISTS assigned_assets,
  DROP COLUMN IF EXISTS permits_required,
  DROP COLUMN IF EXISTS equipment_required,
  DROP COLUMN IF EXISTS materials_estimated,
  DROP COLUMN IF EXISTS current_phase,
  DROP COLUMN IF EXISTS stalled_ticks,
  DROP COLUMN IF EXISTS required_subsector;

ALTER TABLE corp_contracts
  ADD COLUMN IF NOT EXISTS progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (progress_pct BETWEEN 0 AND 100);

-- ─────────────────────────────────────────────────────────────
-- 6. Ownership table (multiple stakeholders, sums to 100% per corp)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS corp_ownership (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corp_id      UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  holder_type  TEXT NOT NULL CHECK (holder_type IN ('player','state','shareholders','rival_corp','other')),
  holder_id    UUID,           -- nullable: e.g. anonymous shareholders
  pct          NUMERIC(5,2) NOT NULL CHECK (pct >= 0 AND pct <= 100),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corp_ownership_corp ON corp_ownership(corp_id);
CREATE INDEX IF NOT EXISTS idx_corp_ownership_holder ON corp_ownership(holder_type, holder_id);

-- Sum-to-100 enforcement via deferred trigger (allows transactional reshuffles).
-- Skips the check if the corp itself no longer exists (FK CASCADE delete) or
-- the corp has 0 ownership rows left (corp being dissolved). This avoids
-- blocking corp deletion when CASCADE empties the table for that corp_id.
CREATE OR REPLACE FUNCTION corp_ownership_sum_check() RETURNS TRIGGER AS $$
DECLARE
  v_total NUMERIC;
  v_corp  UUID;
  v_count INT;
BEGIN
  v_corp := COALESCE(NEW.corp_id, OLD.corp_id);

  IF NOT EXISTS (SELECT 1 FROM factions WHERE id = v_corp) THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*), COALESCE(SUM(pct), 0)
    INTO v_count, v_total
    FROM corp_ownership WHERE corp_id = v_corp;

  IF v_count = 0 THEN
    RETURN NULL;  -- corp dissolved; ownership cleared deliberately
  END IF;

  IF v_total <> 100 THEN
    RAISE EXCEPTION 'corp_ownership for corp % must sum to 100, got %', v_corp, v_total;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS corp_ownership_sum_trigger ON corp_ownership;
CREATE CONSTRAINT TRIGGER corp_ownership_sum_trigger
  AFTER INSERT OR UPDATE OR DELETE ON corp_ownership
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION corp_ownership_sum_check();

-- RLS: read-all (ownership stakes are public knowledge); writes are gated to
-- service_role / SECURITY DEFINER RPCs (no INSERT/UPDATE/DELETE policy = deny).
ALTER TABLE corp_ownership ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "corp_ownership_read_all" ON corp_ownership;
CREATE POLICY "corp_ownership_read_all" ON corp_ownership FOR SELECT USING (true);

-- Backfill: every corporation gets 100% ownership seeded.
-- Player-owned corps (linked_user_id present) → 'player' holder.
-- NPC/state-owned corps → 'state' holder (anonymous).
INSERT INTO corp_ownership (corp_id, holder_type, holder_id, pct)
SELECT id,
       CASE WHEN linked_user_id IS NOT NULL THEN 'player' ELSE 'state' END,
       linked_user_id,
       100
FROM factions
WHERE faction_type = 'corporation'
  AND NOT EXISTS (SELECT 1 FROM corp_ownership o WHERE o.corp_id = factions.id);

-- ─────────────────────────────────────────────────────────────
-- 7. Per-tick P&L history
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS corp_pnl_history (
  corp_id    UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  tick       INTEGER NOT NULL,
  revenue    NUMERIC NOT NULL DEFAULT 0,
  costs      NUMERIC NOT NULL DEFAULT 0,
  wages      NUMERIC NOT NULL DEFAULT 0,
  profit     NUMERIC GENERATED ALWAYS AS (revenue - costs - wages) STORED,
  cash_start NUMERIC NOT NULL DEFAULT 0,
  cash_end   NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (corp_id, tick)
);

CREATE INDEX IF NOT EXISTS idx_corp_pnl_history_tick ON corp_pnl_history(tick);

-- RLS: read-all (P&L is published to all viewers); writes via tick processor
-- (SECURITY DEFINER) only — no INSERT/UPDATE/DELETE policy = deny by default.
ALTER TABLE corp_pnl_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "corp_pnl_history_read_all" ON corp_pnl_history;
CREATE POLICY "corp_pnl_history_read_all" ON corp_pnl_history FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────
-- 8. Comments
-- ─────────────────────────────────────────────────────────────
COMMENT ON COLUMN factions.corp_assets             IS 'Total asset value (single number). Modified by events. Replaces properties/equipment/vessels/warehouse.';
COMMENT ON COLUMN factions.corp_innovation         IS '0-10 R&D and creative output. Event-driven, no passive drift.';
COMMENT ON COLUMN factions.corp_market_share       IS '0-10 industry share. Event-driven.';
COMMENT ON COLUMN factions.corp_productivity       IS '0-10 input-to-output efficiency. Event-driven.';
COMMENT ON COLUMN factions.corp_reputation         IS '0-10 public/investor perception. Event-driven (scandals, performance, treatment of workers).';
COMMENT ON COLUMN factions.corp_revenue_current_tick IS 'Revenue earned during the current tick. Snapshot — historized in corp_pnl_history.';
COMMENT ON COLUMN factions.corp_costs_current_tick   IS 'Non-wage operating costs for the current tick.';
COMMENT ON COLUMN factions.corp_wages_current_tick   IS 'Wage outflows for the current tick.';
COMMENT ON TABLE  corp_ownership   IS 'Stakeholder ownership of corporations. Sums to 100% per corp.';
COMMENT ON TABLE  corp_pnl_history IS 'Per-tick P&L snapshot for each corporation.';
