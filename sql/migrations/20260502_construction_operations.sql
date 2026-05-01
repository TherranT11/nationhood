-- ══════════════════════════════════════════════════════════════
-- Construction Operations: sector-specific stats + contract extensions
--
-- Backs the redesigned construction-corp Operations page:
--   - Three sector-only 0-10 stats (Work Crews / Regulatory Standing /
--     Material Supply Chain) on factions.
--   - A global cooldown column for the 10 Strategic Action cards.
--   - corp_contracts gets FOREIGN as a third contract_type plus a
--     requirements JSONB (e.g. {"work_crews": 4, "supply_chain": 5}).
-- ══════════════════════════════════════════════════════════════

-- ── Construction-sector 0-10 stats ──
ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS corp_work_crews          NUMERIC(4,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corp_regulatory_standing NUMERIC(4,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corp_supply_chain        NUMERIC(4,2) NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_work_crews_range CHECK (corp_work_crews BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_regulatory_standing_range CHECK (corp_regulatory_standing BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_supply_chain_range CHECK (corp_supply_chain BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Strategic Action global cooldown ──
-- All 10 action cards lock together. Set on action fire to current_tick + 12.
ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS corp_construction_action_locked_until_tick INT NOT NULL DEFAULT 0;

-- ── corp_contracts: add FOREIGN type + requirements JSONB ──
-- Drop whatever CHECK currently constrains contract_type (the original
-- migration declared it inline, so the auto-generated name might vary).
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.corp_contracts'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%contract_type%'
  LOOP
    EXECUTE format('ALTER TABLE corp_contracts DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE corp_contracts
  ADD CONSTRAINT corp_contracts_contract_type_check
    CHECK (contract_type IN ('GOVERNMENT', 'PRIVATE', 'FOREIGN'));

ALTER TABLE corp_contracts
  ADD COLUMN IF NOT EXISTS requirements JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ── Comments ──
COMMENT ON COLUMN factions.corp_work_crews IS
  '0-10 construction-sector capacity. Drives bid speed, max active projects.';
COMMENT ON COLUMN factions.corp_regulatory_standing IS
  '0-10 construction-sector government relations. Affects permit speed, audit risk.';
COMMENT ON COLUMN factions.corp_supply_chain IS
  '0-10 construction-sector material sourcing. Affects reserves, sanctions exposure.';
COMMENT ON COLUMN factions.corp_construction_action_locked_until_tick IS
  'When current tick < this value, all 10 Strategic Action cards are locked. Updated on action fire.';
COMMENT ON COLUMN corp_contracts.requirements IS
  'JSONB of stat thresholds the bidding corp must meet, e.g. {"work_crews": 4, "regulatory_standing": 6, "supply_chain": 5}. Empty {} = no gates.';
