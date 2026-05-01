-- ══════════════════════════════════════════════════════════════
-- Per-tick wages for Construction corps.
--
-- Formula:  wages = corp_work_crews × $300,000 × (0.5 + sol/100)
--
-- The (0.5 + sol/100) modifier mirrors the starting-cash and
-- starting-debt formulas in corp-nation-select.html so all three
-- Construction money knobs use one SoL curve:
--    SoL   0   →  0.5×   (poor labor costs $0.15M/crew)
--    SoL  50   →  1.0×   ($0.30M/crew, baseline)
--    SoL 100   →  1.5×   ($0.45M/crew, expensive labor market)
--
-- Construction-only by design — Finance and Shipping have their
-- own labor stat shapes and will get their own RPCs when those
-- sectors get their per-tick economic loop fleshed out.
--
-- Side effects per Construction corp in the nation:
--   1. corp_wages_current_tick   = computed wages (overwrites)
--   2. corp_cash_reserves       -= wages (floored at 0)
--
-- Returns one row per corp processed so the caller (the
-- advance-corp-tick edge function) can route the negative delta
-- through its _tickPnl accumulator for monthly_profit.
-- ══════════════════════════════════════════════════════════════

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
       SET corp_wages_current_tick = ROUND(COALESCE(f.corp_work_crews, 0)::NUMERIC * 300000 * v_mult),
           corp_cash_reserves      = GREATEST(
               0,
               COALESCE(f.corp_cash_reserves, 0)
             - ROUND(COALESCE(f.corp_work_crews, 0)::NUMERIC * 300000 * v_mult)
           )
     WHERE f.nation_id     = p_nation_id
       AND f.faction_type  = 'corporation'
       AND f.corp_sector   = 'Construction'
    RETURNING f.id, f.corp_wages_current_tick;
END;
$$;

GRANT EXECUTE ON FUNCTION apply_construction_wages_for_nation(UUID)
  TO authenticated, service_role;

COMMENT ON FUNCTION apply_construction_wages_for_nation(UUID) IS
  'Charges per-tick wages to every Construction corp in the given nation: corp_work_crews × $300k × (0.5 + sol/100). Updates corp_wages_current_tick and corp_cash_reserves atomically; returns (corp_id, wages) so the caller can accrue the P&L delta.';
