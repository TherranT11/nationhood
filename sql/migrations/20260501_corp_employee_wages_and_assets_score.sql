-- ══════════════════════════════════════════════════════════════
-- Convert corp_assets to a 0-10 stat and add corp_employee_wages
-- as a 0-10 stat to match the canonical-stat list shown on the
-- redesigned corp dashboard.
--
-- Companion to 20260430_corp_simplify_v2.sql.
-- ══════════════════════════════════════════════════════════════

-- ── corp_assets: NUMERIC currency → NUMERIC(4,2) 0-10 ──
-- Existing values default to 0, so the type narrowing is safe.
-- Clamp anyway in case any stray values were written before this migration.
UPDATE factions
SET corp_assets = LEAST(GREATEST(COALESCE(corp_assets, 0), 0), 10)
WHERE faction_type = 'corporation';

ALTER TABLE factions
  ALTER COLUMN corp_assets TYPE NUMERIC(4,2) USING corp_assets::numeric;

ALTER TABLE factions
  ALTER COLUMN corp_assets SET DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_assets_range CHECK (corp_assets BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN factions.corp_assets IS
  '0-10 quality/scale of holdings (factories, equipment, real estate, IP). Event-driven.';

-- ── corp_employee_wages: new 0-10 stat ──
ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS corp_employee_wages NUMERIC(4,2) NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_employee_wages_range CHECK (corp_employee_wages BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN factions.corp_employee_wages IS
  '0-10 quality of employee compensation. Event-driven (collective bargaining, raises, freezes).';
