-- ══════════════════════════════════════════════════════════════
-- Add factions.corp_profit_current_tick as a GENERATED column.
--
-- Mirrors corp_pnl_history.profit (also GENERATED). Single source
-- of truth for current-tick P&L: the database enforces
--   profit = revenue - costs - wages
-- so every UI that reads it sees the same number.
--
-- The three component columns stay — they are the input the
-- tick processor accrues into via accruePnl, and the Costs &
-- Wages card still reads costs + wages broken out.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS corp_profit_current_tick NUMERIC
    GENERATED ALWAYS AS (
      corp_revenue_current_tick - corp_costs_current_tick - corp_wages_current_tick
    ) STORED;

NOTIFY pgrst, 'reload schema';
