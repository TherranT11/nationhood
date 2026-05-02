-- ══════════════════════════════════════════════════════════════
-- Add factions.corp_opex_current_tick as a GENERATED column.
--
-- Mirrors the corp_profit_current_tick pattern from migration
-- 20260628. The Costs & Wages card reads opex directly instead
-- of summing two columns client-side; database enforces the
-- formula in one place.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS corp_opex_current_tick NUMERIC
    GENERATED ALWAYS AS (
      corp_costs_current_tick + corp_wages_current_tick
    ) STORED;

NOTIFY pgrst, 'reload schema';
