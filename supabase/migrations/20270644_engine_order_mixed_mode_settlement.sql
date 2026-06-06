-- ════════════════════════════════════════════════════════════════════
-- 20270644 — ent_accept_engine_order: mixed-mode settlement
--
-- User flagged that engine sales were leaving most of the sale value
-- on the table. Across four completed sales totalling $88M gross,
-- only $8M actually credited to the seller — the other $80M
-- evaporated into a "produce-to-order cost sink" the 20270235
-- implementation subtracted on every accept. Inventory the seller
-- had built up from their own production runs never got drawn down
-- either, because the original settlement model assumed the seller
-- produced FRESH for every buyer.
--
-- That model fights the rest of the system: process_ent_production_
-- runs (20270586) deposits engines into ent_engine_inventory when
-- the seller produces for themselves, but no path drained that
-- inventory through a sale. So a seller could stockpile forever
-- and still pay the production cost again on every transaction.
--
-- Mixed-mode settlement on accept:
--   1. Try to draw the order quantity from the seller's
--      ent_engine_inventory row.
--   2. Anything drawn from stock counts as a no-cost sale — the
--      engines were already paid for when produced, so the seller
--      pockets the full price for that slice.
--   3. The shortfall (if inventory < qty) builds to order — the
--      seller eats v_engine.cost_per_unit for each shortfall unit
--      and pockets the margin only on that slice.
--
-- Buyer side is unchanged: they pay full price × qty, the engines
-- land in their ent_engine_inventory as before.
--
-- Apply after 20270643.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.ent_accept_engine_order(
    p_order_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_order        ent_engine_orders%ROWTYPE;
    v_buyer        entrepreneur_corps%ROWTYPE;
    v_engine       ent_aircraft_designs%ROWTYPE;
    v_total        bigint;
    v_from_stock   int := 0;
    v_shortfall    int := 0;
    v_cost_sink    bigint := 0;
    v_seller_credit bigint;
    v_stock_have   int := 0;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_order FROM ent_engine_orders WHERE id = p_order_id FOR UPDATE;
    IF v_order.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'order_not_found');
    END IF;
    IF v_order.status <> 'priced' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'order_not_priced');
    END IF;

    SELECT * INTO v_buyer FROM entrepreneur_corps WHERE id = v_order.buyer_corp_id FOR UPDATE;
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_buyer.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_buyer');
    END IF;

    v_total := COALESCE(v_order.price_per_unit, 0) * v_order.quantity;
    SELECT * INTO v_engine FROM ent_aircraft_designs WHERE id = v_order.engine_design_id;

    -- 20270644: lock the seller's inventory row to figure out how
    -- much of the order can ship from stock. The row may not exist
    -- (seller has never produced this design for themselves), in
    -- which case v_stock_have stays 0 and everything builds to
    -- order — same as the pre-fix behaviour.
    SELECT COALESCE(quantity, 0) INTO v_stock_have
      FROM ent_engine_inventory
     WHERE entrepreneur_corp_id = v_order.seller_corp_id
       AND engine_design_id     = v_order.engine_design_id
     FOR UPDATE;

    v_from_stock := LEAST(COALESCE(v_stock_have, 0), v_order.quantity);
    v_shortfall  := v_order.quantity - v_from_stock;
    v_cost_sink  := COALESCE(v_engine.cost_per_unit, 0) * v_shortfall;
    -- Seller pockets: full sale price for stock units (no production
    -- cost — paid at produce time), margin only on the build-to-
    -- order shortfall.
    v_seller_credit := v_total - v_cost_sink;

    -- Buyer pays the agreed total or the deal fails (nothing moves).
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_total, updated_at = now()
     WHERE id = v_order.buyer_corp_id AND COALESCE(treasury_cash, 0) >= v_total;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_cash',
            'need', v_total, 'have', floor(COALESCE(v_buyer.treasury_cash, 0))::bigint);
    END IF;

    -- Seller credited the net.
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) + v_seller_credit, updated_at = now()
     WHERE id = v_order.seller_corp_id;

    -- Draw whatever came from stock down (atomic, race-guarded so
    -- a concurrent build-against-inventory can't double-spend the
    -- same units we already promised to the buyer).
    IF v_from_stock > 0 THEN
        UPDATE ent_engine_inventory
           SET quantity = quantity - v_from_stock
         WHERE entrepreneur_corp_id = v_order.seller_corp_id
           AND engine_design_id     = v_order.engine_design_id
           AND quantity            >= v_from_stock;
        IF NOT FOUND THEN
            -- A concurrent caller drained the row between our check
            -- and our decrement. Re-raise to roll back the whole
            -- transaction so the buyer's debit + seller credit
            -- unwind too.
            RAISE EXCEPTION 'engine_inventory_race'
                USING HINT = 'Inventory row drained between FOR UPDATE and decrement.';
        END IF;
    END IF;

    -- Engines delivered into the buyer's holdings — same destination
    -- regardless of stock vs build-to-order split.
    INSERT INTO ent_engine_inventory (entrepreneur_corp_id, engine_design_id, quantity)
    VALUES (v_order.buyer_corp_id, v_order.engine_design_id, v_order.quantity)
    ON CONFLICT (entrepreneur_corp_id, engine_design_id)
    DO UPDATE SET quantity = ent_engine_inventory.quantity + EXCLUDED.quantity;

    UPDATE ent_engine_orders SET status = 'completed' WHERE id = p_order_id;
    RETURN jsonb_build_object(
        'success',       true,
        'total',         v_total,
        'delivered',     v_order.quantity,
        'from_stock',    v_from_stock,
        'built_to_order', v_shortfall,
        'cost_sink',     v_cost_sink,
        'seller_credit', v_seller_credit
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_accept_engine_order(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
