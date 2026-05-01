-- ══════════════════════════════════════════════════════════════
-- Construction Operations Phase 4: Strategic Actions RPC
--
-- One RPC drives all 10 action cards. Costs and effects are encoded
-- server-side in a VALUES table so the client is just a thin display
-- layer (key + choice are the only inputs the player can spoof, and the
-- RPC ignores any client-supplied amounts).
--
-- Mechanics:
--   - Construction sector + ownership check.
--   - Global cooldown gate (corp_construction_action_locked_until_tick).
--   - Cash gate (corp_cash_reserves).
--   - Apply effect deltas to corp_work_crews / corp_regulatory_standing /
--     corp_supply_chain, clamped to 0-10.
--   - Deduct cash, set cooldown to current_tick + 12.
--   - Atomic — all in one UPDATE.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fire_construction_action(
    p_corp_id    UUID,
    p_action_key TEXT,
    p_choice     TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id    UUID := auth.uid();
    v_corp       factions%ROWTYPE;
    v_tick       INT;
    v_cost       BIGINT;
    v_e_crews    NUMERIC;
    v_e_reg      NUMERIC;
    v_e_supply   NUMERIC;
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
    IF v_corp.id <> v_user_id AND v_corp.linked_user_id <> v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    IF v_corp.faction_type <> 'corporation' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only corporations can take Strategic Actions');
    END IF;
    IF v_corp.corp_sector IS DISTINCT FROM 'Construction' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Construction Strategic Actions only available to construction corps');
    END IF;

    -- ── Current tick + cooldown gate ──
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active shard');
    END IF;
    IF COALESCE(v_corp.corp_construction_action_locked_until_tick, 0) > v_tick THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Strategic Actions locked for %s more tick(s)',
                v_corp.corp_construction_action_locked_until_tick - v_tick),
            'locked_until_tick', v_corp.corp_construction_action_locked_until_tick
        );
    END IF;

    IF p_choice NOT IN ('A', 'B') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid choice (must be A or B)');
    END IF;

    -- ── Action definitions ──
    -- Costs are in dollars (10x the design-mockup display values, e.g.
    -- $90M not $9M). Effects are in points on the 0-10 stat scale.
    SELECT cost, e_crews, e_reg, e_supply
      INTO v_cost, v_e_crews, v_e_reg, v_e_supply
    FROM (VALUES
        ('hiring',         'A',  40000000::BIGINT,  2.0,  0.0, -2.0),
        ('hiring',         'B',  70000000::BIGINT,  3.0,  1.0,  0.0),
        ('lobbying',       'A',  50000000::BIGINT, -2.0,  2.0,  0.0),
        ('lobbying',       'B',  80000000::BIGINT,  0.0,  3.0,  1.0),
        ('megaproject',    'A',  30000000::BIGINT,  0.0,  2.0, -2.0),
        ('megaproject',    'B',  90000000::BIGINT,  1.0,  3.0,  0.0),
        ('material',       'A',  40000000::BIGINT,  0.0, -2.0,  2.0),
        ('material',       'B',  70000000::BIGINT,  1.0,  0.0,  3.0),
        ('vertical',       'A',  60000000::BIGINT, -2.0,  0.0,  2.0),
        ('vertical',       'B', 100000000::BIGINT,  0.0,  1.0,  3.0),
        ('safety',         'A',  40000000::BIGINT, -2.0,  2.0,  0.0),
        ('safety',         'B',  80000000::BIGINT,  1.0,  3.0,  0.0),
        ('equipment',      'A',  50000000::BIGINT,  2.0,  0.0, -2.0),
        ('equipment',      'B',  90000000::BIGINT,  3.0,  0.0,  1.0),
        ('patriotic',      'A',  30000000::BIGINT, -2.0,  2.0,  0.0),
        ('patriotic',      'B',  60000000::BIGINT,  0.0,  3.0,  1.0),
        ('apprenticeship', 'A',  40000000::BIGINT,  2.0, -2.0,  0.0),
        ('apprenticeship', 'B',  80000000::BIGINT,  3.0,  1.0,  0.0),
        ('stockpile',      'A',  50000000::BIGINT, -2.0,  0.0,  2.0),
        ('stockpile',      'B',  90000000::BIGINT,  0.0,  1.0,  3.0)
    ) AS defs(key, choice, cost, e_crews, e_reg, e_supply)
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
    UPDATE factions
    SET corp_cash_reserves = corp_cash_reserves - v_cost,
        corp_work_crews = LEAST(GREATEST(COALESCE(corp_work_crews, 0) + v_e_crews, 0::numeric), 10::numeric),
        corp_regulatory_standing = LEAST(GREATEST(COALESCE(corp_regulatory_standing, 0) + v_e_reg, 0::numeric), 10::numeric),
        corp_supply_chain = LEAST(GREATEST(COALESCE(corp_supply_chain, 0) + v_e_supply, 0::numeric), 10::numeric),
        corp_construction_action_locked_until_tick = v_tick + v_lock_ticks
    WHERE id = p_corp_id;

    RETURN jsonb_build_object(
        'success', true,
        'cost', v_cost,
        'effects', jsonb_build_object(
            'crews',      v_e_crews,
            'regulatory', v_e_reg,
            'supply',     v_e_supply
        ),
        'locked_until_tick', v_tick + v_lock_ticks
    );
END;
$$;

GRANT EXECUTE ON FUNCTION fire_construction_action(UUID, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION fire_construction_action(UUID, TEXT, TEXT) IS
  'Fires a single Strategic Action card (A or B branch) for a construction corp. Validates ownership, sector, cooldown, and cash; deducts cost; applies effect deltas clamped to 0-10; sets corp_construction_action_locked_until_tick to current_tick + 12. Action definitions are encoded server-side and must stay in sync with ACTION_DEFS in corp-operations.html.';
