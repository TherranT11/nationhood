-- ══════════════════════════════════════════════════════════════
-- Option 4 Phase 5: drop legacy corp P&L state.
--
-- Phase 4 retired the dual-write — these aren't read or written
-- by application code anymore. This migration lets the schema
-- forget they existed.
--
--   factions:
--     - corp_profit_current_tick  (GENERATED, dropped before its inputs)
--     - corp_opex_current_tick    (GENERATED)
--     - monthly_profit            (column)
--     - corp_revenue_current_tick (column)
--     - corp_costs_current_tick   (column)
--     - corp_wages_current_tick   (column — but RPC writes it; updated below)
--
--   tables:
--     - corp_pnl_history          (never had a writer; pure dead-write target)
--
-- The construction-wages RPC apply_construction_wages_for_nation
-- still wrote corp_wages_current_tick. CREATE OR REPLACE below
-- drops that side-effect; it now only updates corp_cash_reserves
-- and returns the wages value computed inline.
-- ══════════════════════════════════════════════════════════════

-- 1. Update the RPC FIRST so the DROP COLUMN doesn't break it.
CREATE OR REPLACE FUNCTION apply_construction_wages_for_nation(
    p_nation_id UUID
) RETURNS TABLE (corp_id UUID, wages NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sol  NUMERIC;
    v_mult NUMERIC;
BEGIN
    SELECT COALESCE(standard_of_living, 50)::NUMERIC
      INTO v_sol
      FROM nations
     WHERE id = p_nation_id;

    IF NOT FOUND THEN RETURN; END IF;

    v_mult := 0.5 + (v_sol / 100.0);

    RETURN QUERY
    UPDATE factions f
       SET corp_cash_reserves = GREATEST(
               0,
               COALESCE(f.corp_cash_reserves, 0)
             - ROUND(COALESCE(f.corp_work_crews, 0)::NUMERIC * 300000 * v_mult)
           )
     WHERE f.nation_id     = p_nation_id
       AND f.faction_type  = 'corporation'
       AND f.corp_sector   = 'Construction'
    RETURNING f.id,
              ROUND(COALESCE(f.corp_work_crews, 0)::NUMERIC * 300000 * v_mult) AS wages;
END;
$$;

GRANT EXECUTE ON FUNCTION apply_construction_wages_for_nation(UUID)
  TO authenticated, service_role;

COMMENT ON FUNCTION apply_construction_wages_for_nation(UUID) IS
  'Charges per-tick wages to every Construction corp in the given nation: corp_work_crews × $300k × (0.5 + sol/100). Updates corp_cash_reserves; returns (corp_id, wages) so the caller (advance-corp-tick) can log a wages event into corp_cash_events.';

-- 2. Drop GENERATED columns first — they depend on the source columns.
ALTER TABLE factions DROP COLUMN IF EXISTS corp_profit_current_tick;
ALTER TABLE factions DROP COLUMN IF EXISTS corp_opex_current_tick;

-- 3. Drop the source columns.
ALTER TABLE factions DROP COLUMN IF EXISTS monthly_profit;
ALTER TABLE factions DROP COLUMN IF EXISTS corp_revenue_current_tick;
ALTER TABLE factions DROP COLUMN IF EXISTS corp_costs_current_tick;
ALTER TABLE factions DROP COLUMN IF EXISTS corp_wages_current_tick;

-- 4. Drop the dead history table. corp_cash_history stays — it still
-- backs the dashboard's cash sparkline (cash_end snapshot per tick).
DROP TABLE IF EXISTS corp_pnl_history CASCADE;

NOTIFY pgrst, 'reload schema';
