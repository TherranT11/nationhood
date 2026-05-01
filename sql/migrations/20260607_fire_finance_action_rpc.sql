-- ══════════════════════════════════════════════════════════════
-- Finance Strategic Actions FSA2: fire_finance_action RPC
--
-- Mirror of fire_construction_action (20260504) with Finance-shaped
-- stats. One RPC drives all 10 action cards × 2 choices = 20 rows
-- in a VALUES table. Effects encoded server-side so the client is
-- a thin display layer.
--
-- Action effects map to three stats. The first two are split-layer
-- — actions write to the action-controlled column, recompute folds
-- it into the displayed value:
--
--   Lending Capital → corp_lending_capital_max  (recompute reads)
--   Overleverage    → corp_overleverage_offset  (recompute reads)
--   Interest Rates  → corp_interest_rates       (no recompute layer;
--                                                 written directly)
--
-- After the UPDATE, recompute_finance_stats fires so the displayed
-- corp_lending_capital and corp_overleverage flow from the newly
-- changed _max / _offset. corp_interest_rates is the displayed value
-- itself.
--
-- Mechanics:
--   - Finance sector + ownership check.
--   - Global cooldown gate (corp_finance_action_locked_until_tick).
--   - Cash gate.
--   - Apply effect deltas clamped to each column's CHECK range.
--   - Deduct cash, set cooldown to current_tick + 12.
--   - Recompute derived stats so the dial updates in-band.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fire_finance_action(
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
    v_e_lending  NUMERIC;
    v_e_rates    NUMERIC;
    v_e_over     NUMERIC;
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
    IF v_corp.corp_sector IS DISTINCT FROM 'Finance' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Finance Strategic Actions only available to Finance corps');
    END IF;

    -- ── Current tick + cooldown gate ──
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active shard');
    END IF;
    IF COALESCE(v_corp.corp_finance_action_locked_until_tick, 0) > v_tick THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Strategic Actions locked for %s more tick(s)',
                v_corp.corp_finance_action_locked_until_tick - v_tick),
            'locked_until_tick', v_corp.corp_finance_action_locked_until_tick
        );
    END IF;

    IF p_choice NOT IN ('A', 'B') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid choice (must be A or B)');
    END IF;

    -- ── Action definitions ──
    -- Effects are net-displayed deltas: "+1 Lending Capital" raises the
    -- player-visible value by 1, "+1 Lending Capital deployed" lowers
    -- it by 1 (the user's "deployed" suffix flips sign — captured here
    -- as a negative). Costs in dollars; deltas applied to:
    --   lending → corp_lending_capital_max
    --   rates   → corp_interest_rates (direct)
    --   over    → corp_overleverage_offset
    SELECT cost, e_lending, e_rates, e_over
      INTO v_cost, v_e_lending, v_e_rates, v_e_over
    FROM (VALUES
        ('capital_raise',       'A',  60000000::BIGINT,  2.0,  0.0,  2.0),
        ('capital_raise',       'B', 150000000::BIGINT,  3.0,  0.0, -1.0),
        ('aggressive_lending',  'A',  40000000::BIGINT, -1.0,  0.0,  2.0),
        ('aggressive_lending',  'B',  70000000::BIGINT, -2.0, -1.0,  0.0),
        ('rate_hike',           'A',  30000000::BIGINT, -2.0,  2.0,  0.0),
        ('rate_hike',           'B',  70000000::BIGINT,  1.0,  3.0,  0.0),
        ('rate_cut',            'A',  40000000::BIGINT, -2.0, -2.0,  1.0),
        ('rate_cut',            'B',  80000000::BIGINT, -3.0, -3.0,  0.0),
        ('reserve_building',    'A',  50000000::BIGINT, -2.0,  0.0, -2.0),
        ('reserve_building',    'B',  90000000::BIGINT,  0.0,  1.0, -3.0),
        ('high_yield',          'A',  50000000::BIGINT,  2.0,  0.0,  3.0),
        ('high_yield',          'B', 100000000::BIGINT,  3.0,  0.0,  1.0),
        ('deposit_drive',       'A',  40000000::BIGINT,  2.0, -2.0,  0.0),
        ('deposit_drive',       'B',  80000000::BIGINT,  3.0,  1.0,  0.0),
        ('loan_restructuring',  'A',  60000000::BIGINT, -1.0,  0.0, -1.0),
        ('loan_restructuring',  'B',  90000000::BIGINT,  0.0,  1.0, -3.0),
        ('foreign_capital',     'A',  30000000::BIGINT,  2.0,  1.0,  2.0),
        ('foreign_capital',     'B',  80000000::BIGINT,  3.0,  0.0, -1.0),
        ('central_bank',        'A',  65000000::BIGINT, -2.0,  0.0, -2.0),
        ('central_bank',        'B',  80000000::BIGINT,  1.0,  0.0, -3.0)
    ) AS defs(key, choice, cost, e_lending, e_rates, e_over)
    WHERE key = p_action_key AND choice = p_choice;

    IF v_cost IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unknown action / choice');
    END IF;

    -- ── Cash gate ──
    IF COALESCE(v_corp.corp_cash_reserves, 0) < v_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Insufficient cash — need $%sM, have $%sM',
                (v_cost / 1000000)::TEXT,
                (COALESCE(v_corp.corp_cash_reserves, 0) / 1000000)::TEXT)
        );
    END IF;

    -- ── Apply ──
    -- Deltas applied to action-controlled columns and clamped to each
    -- column's CHECK range:
    --   corp_lending_capital_max     ∈ [0, 10]
    --   corp_interest_rates          ∈ [0, 10]
    --   corp_overleverage_offset     ∈ [-10, 10]
    -- Clamping at the SET prevents constraint-violation errors when
    -- an action's delta would push a column past its bound.
    UPDATE factions
    SET corp_cash_reserves                      = corp_cash_reserves - v_cost,
        corp_lending_capital_max                = LEAST(GREATEST(
                                                      COALESCE(corp_lending_capital_max, 5) + v_e_lending,
                                                      0::numeric), 10::numeric),
        corp_interest_rates                     = LEAST(GREATEST(
                                                      COALESCE(corp_interest_rates, 0) + v_e_rates,
                                                      0::numeric), 10::numeric),
        corp_overleverage_offset                = LEAST(GREATEST(
                                                      COALESCE(corp_overleverage_offset, 0) + v_e_over,
                                                      -10::numeric), 10::numeric),
        corp_finance_action_locked_until_tick   = v_tick + v_lock_ticks
    WHERE id = p_corp_id;

    -- ── Recompute derived stats ──
    -- corp_lending_capital and corp_overleverage are derived from
    -- the action-controlled columns we just modified plus the
    -- portfolio. Recompute folds the new _max / _offset into the
    -- displayed values so the player sees the dial move in-band.
    PERFORM recompute_finance_stats(p_corp_id);

    RETURN jsonb_build_object(
        'success', true,
        'cost', v_cost,
        'effects', jsonb_build_object(
            'lending', v_e_lending,
            'rates',   v_e_rates,
            'over',    v_e_over
        ),
        'locked_until_tick', v_tick + v_lock_ticks
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION fire_finance_action(UUID, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION fire_finance_action(UUID, TEXT, TEXT) IS
  'Fires a single Finance Strategic Action (A or B branch) for a Finance corp. Validates ownership, sector, cooldown, and cash; deducts cost; applies effect deltas (clamped) to corp_lending_capital_max / corp_interest_rates / corp_overleverage_offset; sets corp_finance_action_locked_until_tick to current_tick + 12; calls recompute_finance_stats so displayed lending_capital and overleverage update in-band. Action definitions encoded server-side and must stay in sync with the FSA3 client constants.';

NOTIFY pgrst, 'reload schema';
