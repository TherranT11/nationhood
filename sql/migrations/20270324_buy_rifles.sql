-- ============================================================================
-- buy_rifles — purchase rifles from the world market into an army's inventory.
-- ============================================================================
-- Immediate, atomic, single-transaction purchase (no order queue, no delivery
-- delay): on success it charges the army faction's treasury (factions.party_funds
-- — the single army pot, per 20270125), depletes the shared world_stock, and
-- credits army_rifle_inventory, all at once. The pricing/stock live in
-- rifle_models (one source of truth); this RPC is the sole writer of both
-- rifle_models.world_stock and army_rifle_inventory.
--
-- Ownership/auth mirrors create_unit (20270132): caller must command the army
-- faction. Both the faction and the model rows are locked FOR UPDATE so a
-- double-fire can't double-spend funds or oversell stock.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.buy_rifles(
    p_faction_id     UUID,
    p_rifle_model_id UUID,
    p_quantity       INT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_user    UUID := auth.uid();
    v_fac     factions%ROWTYPE;
    v_model   rifle_models%ROWTYPE;
    v_qty     INT;
    v_total   BIGINT;
    v_balance NUMERIC;
    v_on_hand INT;
BEGIN
    -- Faction + ownership (same gate as create_unit).
    SELECT * INTO v_fac FROM factions WHERE id = p_faction_id FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Army faction not found');
    END IF;
    IF v_fac.faction_type <> 'military' OR v_fac.branch <> 'army' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Not an army faction');
    END IF;
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
    END IF;
    IF v_fac.id <> v_user AND v_fac.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('ok', false, 'error', 'You do not command this army');
    END IF;

    v_qty := p_quantity;
    IF v_qty IS NULL OR v_qty < 1 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Quantity must be at least 1');
    END IF;

    SELECT * INTO v_model FROM rifle_models WHERE id = p_rifle_model_id FOR UPDATE;
    IF v_model.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Rifle model not found');
    END IF;
    IF v_model.world_stock < v_qty THEN
        RETURN jsonb_build_object('ok', false, 'error',
            format('Only %s in world stock', v_model.world_stock));
    END IF;

    v_total   := v_model.cost_raw::bigint * v_qty;
    v_balance := COALESCE(v_fac.party_funds, 0);
    IF v_balance < v_total THEN
        RETURN jsonb_build_object('ok', false, 'error',
            format('Insufficient Army Funds: $%s available, $%s required',
                   round(v_balance / 1000000.0, 2), round(v_total / 1000000.0, 2)));
    END IF;

    -- Atomic: pay, deplete shared stock, deliver to inventory.
    UPDATE factions    SET party_funds = COALESCE(party_funds, 0) - v_total WHERE id = p_faction_id;
    UPDATE rifle_models SET world_stock = world_stock - v_qty               WHERE id = p_rifle_model_id;

    INSERT INTO army_rifle_inventory (faction_id, rifle_model_id, quantity)
    VALUES (p_faction_id, p_rifle_model_id, v_qty)
    ON CONFLICT (faction_id, rifle_model_id)
        DO UPDATE SET quantity   = army_rifle_inventory.quantity + EXCLUDED.quantity,
                      updated_at = now()
    RETURNING quantity INTO v_on_hand;

    RETURN jsonb_build_object('ok', true,
        'quantity',    v_qty,
        'on_hand',     v_on_hand,
        'spent',       v_total,
        'party_funds', v_balance - v_total,
        'world_stock', v_model.world_stock - v_qty);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Error: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_rifles(UUID, UUID, INT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
