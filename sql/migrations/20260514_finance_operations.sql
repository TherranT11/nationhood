-- ══════════════════════════════════════════════════════════════
-- Finance Operations Phase A: sector-specific 0-10 stats + action cooldown
--
-- Mirrors the Construction stats block (20260502): three sector-only
-- 0-10 derived stats on factions plus a per-corp action cooldown
-- column. Seeded values for new Finance corps live in
-- corp-nation-select.html (the page-level seed block); existing
-- corps fall through to the column DEFAULT of 0 — they'll be 0/0/0
-- until they take an action or get a manual seed.
--
-- Stat semantics (player-visible):
--   corp_lending_capital  — capacity to issue loans. Drives max
--                           loan size and loan offers seen.
--   corp_interest_rates   — pricing power. Higher = better margins
--                           but fewer borrowers will accept.
--   corp_overleverage     — INVERTED stat. High = bad. Tracks how
--                           exposed the bank's portfolio is. Drifts
--                           up when issuing loans, down when loans
--                           close. Strategic Actions push both ways.
--
-- The action cooldown is a single global lock — all 10 Strategic
-- Action cards on the Operations page share one 12-tick cooldown
-- (set on action fire to current_tick + 12), exactly like
-- corp_construction_action_locked_until_tick.
-- ══════════════════════════════════════════════════════════════

-- ── Finance-sector 0-10 stats ──
ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS corp_lending_capital NUMERIC(4,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corp_interest_rates  NUMERIC(4,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corp_overleverage    NUMERIC(4,2) NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_lending_capital_range CHECK (corp_lending_capital BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_interest_rates_range CHECK (corp_interest_rates BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE factions
    ADD CONSTRAINT corp_overleverage_range CHECK (corp_overleverage BETWEEN 0 AND 10);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Backfill existing Finance corps to 3/3/3 ──
-- The column DEFAULT of 0 only applies to new rows; corps that already
-- exist need an explicit UPDATE so they match the founding-position
-- baseline. Idempotent — re-running just resets to 3/3/3.
UPDATE factions
   SET corp_lending_capital = 3,
       corp_interest_rates  = 3,
       corp_overleverage    = 0
 WHERE faction_type = 'corporation'
   AND corp_sector  = 'Finance';

-- ── Finance Strategic Action global cooldown ──
ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS corp_finance_action_locked_until_tick INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN factions.corp_lending_capital IS
  'Finance sector 0-10 stat. Capacity to issue loans (drives max loan size and offer flow).';
COMMENT ON COLUMN factions.corp_interest_rates IS
  'Finance sector 0-10 stat. Pricing power on loans — higher means richer margins but pickier borrowers.';
COMMENT ON COLUMN factions.corp_overleverage IS
  'Finance sector 0-10 stat. INVERTED — high values mean dangerous portfolio exposure. Drifts up when loans are issued, down when they close. Strategic Actions can push it either way.';
COMMENT ON COLUMN factions.corp_finance_action_locked_until_tick IS
  'Tick at which the Finance Strategic Actions grid unlocks. Set to current_tick + 12 on every fire_finance_action call.';
