-- ══════════════════════════════════════════════════════════════
-- Shipping Strategic Actions SSA1: fire_shipping_action RPC
--
-- Mirror of fire_construction_action (20260504) and
-- fire_finance_action (20260607) with Shipping-shaped stats. One
-- RPC drives all 10 action cards × 2 choices = 20 rows in a
-- server-side VALUES table; client is a thin display layer.
--
-- Effect routing — direct writes to displayed columns. Unlike
-- Finance, none of the three Shipping stats are portfolio-derived
-- (no recompute_shipping_stats yet), so action deltas land
-- directly on corp_freighters / corp_fleet_health / corp_route_risk
-- without a split-layer max/offset companion.
--
-- Effect signs use net-displayed semantics:
--   "+X Freighters (utilization)" — Finance-style suffix that
--     flips the sign. Utilization rising = spare freighters falling
--     = stat dropping. Encoded here as a negative delta.
--   "+X Route Risk Reduction" — Risk is INVERTED (high = bad), so
--     "Reduction" lowers the stat. Encoded as a negative Route Risk
--     delta. "−X Route Risk Reduction" = the reverse → positive
--     Route Risk delta (concentrates exposure).
--
-- Mechanics:
--   - Auth + ownership + Shipping-sector gate.
--   - Global cooldown via corp_shipping_action_locked_until_tick
--     (added 20260609). 12-tick lock on success.
--   - Cash gate.
--   - Atomic apply UPDATE with WHERE guard re-checking cooldown +
--     cash so a double-fire race can't double-deduct cash. Same
--     pattern as fire_finance_action's audit fix.
--   - Stat clamping at SET to [0, 10] per the existing CHECK
--     constraints from 20260609.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fire_shipping_action(
    p_corp_id    UUID,
    p_action_key TEXT,
    p_choice     TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user_id    UUID := auth.uid();
    v_corp       factions%ROWTYPE;
    v_tick       INT;
    v_cost       BIGINT;
    v_e_freight  NUMERIC;
    v_e_health   NUMERIC;
    v_e_risk     NUMERIC;
    v_lock_ticks INT := 12;
BEGIN
    -- ── Auth: caller owns the corp ──
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Corporation not found');
    END IF;
    IF v_corp.id <> v_user_id AND v_corp.linked_user_id IS DISTINCT FROM v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    IF v_corp.faction_type <> 'corporation' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only corporations can take Strategic Actions');
    END IF;
    IF v_corp.corp_sector IS DISTINCT FROM 'Shipping' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shipping Strategic Actions only available to Shipping corps');
    END IF;

    -- ── Current tick + cooldown gate ──
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active shard');
    END IF;
    IF COALESCE(v_corp.corp_shipping_action_locked_until_tick, 0) > v_tick THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Strategic Actions locked for %s more tick(s)',
                v_corp.corp_shipping_action_locked_until_tick - v_tick),
            'locked_until_tick', v_corp.corp_shipping_action_locked_until_tick
        );
    END IF;

    IF p_choice NOT IN ('A', 'B') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid choice (must be A or B)');
    END IF;

    -- ── Action definitions ──
    -- Effect deltas use net-displayed semantics:
    --   freighters delta → corp_freighters
    --   health     delta → corp_fleet_health
    --   risk       delta → corp_route_risk (INVERTED stat)
    -- "(utilization)" suffix from the design spec captured as
    -- negative freighters delta; "Route Risk Reduction" captured
    -- as negative risk delta.
    SELECT cost, e_freight, e_health, e_risk
      INTO v_cost, v_e_freight, v_e_health, v_e_risk
    FROM (VALUES
        ('fleet_expansion',         'A',  50000000::BIGINT,  2.0, -2.0,  0.0),
        ('fleet_expansion',         'B',  90000000::BIGINT,  3.0,  0.0,  0.0),
        ('maintenance_program',     'A',  40000000::BIGINT, -2.0,  2.0,  0.0),
        ('maintenance_program',     'B',  80000000::BIGINT,  0.0,  3.0, -1.0),
        ('route_diversification',   'A',  50000000::BIGINT, -2.0,  0.0, -2.0),
        ('route_diversification',   'B',  90000000::BIGINT,  0.0,  1.0, -3.0),
        ('insurance_hedging',       'A',  30000000::BIGINT,  0.0, -2.0, -2.0),
        ('insurance_hedging',       'B',  70000000::BIGINT,  1.0,  0.0, -3.0),
        ('high_risk_route',         'A',  20000000::BIGINT, -2.0,  0.0,  2.0),
        ('high_risk_route',         'B',  80000000::BIGINT, -3.0,  0.0, -1.0),
        ('crew_training',           'A',  40000000::BIGINT, -2.0,  2.0,  0.0),
        ('crew_training',           'B',  80000000::BIGINT,  0.0,  3.0, -1.0),
        ('vessel_decommissioning',  'A',  30000000::BIGINT, -2.0,  2.0,  0.0),
        ('vessel_decommissioning',  'B',  70000000::BIGINT,  1.0,  3.0,  0.0),
        ('cargo_specialization',    'A',  50000000::BIGINT,  2.0,  0.0,  2.0),
        ('cargo_specialization',    'B',  90000000::BIGINT,  3.0,  0.0, -1.0),
        ('geopolitical_lobbying',   'A',  40000000::BIGINT,  0.0, -2.0, -2.0),
        ('geopolitical_lobbying',   'B',  80000000::BIGINT,  1.0,  0.0, -3.0),
        ('fleet_modernization',     'A',  50000000::BIGINT, -2.0,  2.0,  0.0),
        ('fleet_modernization',     'B', 100000000::BIGINT,  1.0,  3.0,  0.0)
    ) AS defs(key, choice, cost, e_freight, e_health, e_risk)
    WHERE key = p_action_key AND choice = p_choice;

    IF v_cost IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unknown action / choice');
    END IF;

    -- ── Cash gate (snapshot for nice diagnostic) ──
    IF COALESCE(v_corp.corp_cash_reserves, 0) < v_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Insufficient cash — need $%sM, have $%sM',
                (v_cost / 1000000)::TEXT,
                (COALESCE(v_corp.corp_cash_reserves, 0) / 1000000)::TEXT)
        );
    END IF;

    -- ── Apply (atomic against double-fire) ──
    -- Re-evaluate cooldown + cash atomically in the WHERE clause so
    -- two concurrent fires can't double-deduct. ROW_COUNT = 0
    -- (IF NOT FOUND) means a race caught it. Same pattern as
    -- fire_finance_action's audit fix.
    --
    -- Stat clamping at SET to [0, 10] per CHECK constraints from
    -- 20260609. None of the three stats are portfolio-derived, so
    -- writes land directly without a max/offset companion.
    UPDATE factions
    SET corp_cash_reserves                      = corp_cash_reserves - v_cost,
        corp_freighters                         = LEAST(GREATEST(
                                                      COALESCE(corp_freighters, 0) + v_e_freight,
                                                      0::numeric), 10::numeric),
        corp_fleet_health                       = LEAST(GREATEST(
                                                      COALESCE(corp_fleet_health, 0) + v_e_health,
                                                      0::numeric), 10::numeric),
        corp_route_risk                         = LEAST(GREATEST(
                                                      COALESCE(corp_route_risk, 0) + v_e_risk,
                                                      0::numeric), 10::numeric),
        corp_shipping_action_locked_until_tick  = v_tick + v_lock_ticks
    WHERE id = p_corp_id
      AND COALESCE(corp_shipping_action_locked_until_tick, 0) <= v_tick
      AND COALESCE(corp_cash_reserves, 0) >= v_cost;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Action raced — cooldown engaged or cash dropped after the pre-check; try again'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'cost', v_cost,
        'effects', jsonb_build_object(
            'freighters',  v_e_freight,
            'fleet_health', v_e_health,
            'route_risk',  v_e_risk
        ),
        'locked_until_tick', v_tick + v_lock_ticks
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION fire_shipping_action(UUID, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION fire_shipping_action(UUID, TEXT, TEXT) IS
  'Fires a single Shipping Strategic Action (A or B branch) for a Shipping corp. Validates ownership, sector, cooldown, and cash; deducts cost; applies effect deltas (clamped 0-10) directly to corp_freighters / corp_fleet_health / corp_route_risk; sets corp_shipping_action_locked_until_tick to current_tick + 12. Atomic WHERE guard against double-fire races. Action definitions encoded server-side and must stay in sync with the SSA2 client constants.';

NOTIFY pgrst, 'reload schema';
