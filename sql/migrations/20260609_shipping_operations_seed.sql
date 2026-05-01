-- ══════════════════════════════════════════════════════════════
-- Shipping Operations Phase A: sector-specific 0-10 stats + action cooldown
--
-- Mirrors Construction (20260502) and Finance (20260514). Three new
-- 0-10 stats on factions plus a per-corp action cooldown column.
-- Every existing Shipping corp seeds to founding values:
--   corp_freighters    = 3   (modest fleet, room to expand to 10)
--   corp_fleet_health  = 5   (mid-tier maintenance baseline)
--   corp_route_risk    = 0   (clean — no exposure yet; INVERTED stat
--                              where high = bad, mirroring overleverage)
--
-- Stat semantics (player-visible):
--   corp_freighters    — fleet capacity. Drives max active routes
--                        and bid eligibility on multi-vessel contracts.
--   corp_fleet_health  — vessel condition baseline. Drives breakdown
--                        risk and required-condition gates on contracts.
--   corp_route_risk    — INVERTED. Tracks chokepoint / pirate /
--                        sanctions exposure. High = bad. 8+ likely
--                        triggers insurance-premium spikes; 10 is
--                        Crisis-tier (uninsurable lanes).
--
-- The action cooldown is a single global lock — the future Strategic
-- Actions grid (one of (FSA / SSA / similar) will share one 12-tick
-- cooldown like its sibling sectors. fire_shipping_action (when built)
-- sets corp_shipping_action_locked_until_tick = current_tick + 12.
-- ══════════════════════════════════════════════════════════════

-- ── Shipping-sector 0-10 stats ──
ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS corp_freighters   NUMERIC(4,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corp_fleet_health NUMERIC(4,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corp_route_risk   NUMERIC(4,2) NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_freighters_range CHECK (corp_freighters BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_fleet_health_range CHECK (corp_fleet_health BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_route_risk_range CHECK (corp_route_risk BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Backfill existing Shipping corps to founding seed ──
-- The DEFAULT 0 above only applies to new rows. Existing corps need
-- an explicit UPDATE so they match the founding-position baseline.
-- Idempotent — re-running just resets the seed to 3/5/0.
UPDATE factions
   SET corp_freighters   = 3,
       corp_fleet_health = 5,
       corp_route_risk   = 0
 WHERE faction_type = 'corporation'
   AND corp_sector  = 'Shipping';

-- ── Shipping Strategic Action global cooldown ──
ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS corp_shipping_action_locked_until_tick INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN factions.corp_freighters IS
  'Shipping sector 0-10 stat. Capacity to staff routes (drives max active routes and multi-vessel contract eligibility).';
COMMENT ON COLUMN factions.corp_fleet_health IS
  'Shipping sector 0-10 stat. Vessel condition baseline — higher means lower breakdown risk and access to higher-tier contracts.';
COMMENT ON COLUMN factions.corp_route_risk IS
  'Shipping sector 0-10 stat. INVERTED — high values mean dangerous concentration / chokepoint / sanctions exposure. Insurance premiums climb above 6; uninsurable territory near 10.';
COMMENT ON COLUMN factions.corp_shipping_action_locked_until_tick IS
  'Tick at which the Shipping Strategic Actions grid unlocks. Set to current_tick + 12 on every fire_shipping_action call (when that RPC exists).';

NOTIFY pgrst, 'reload schema';
