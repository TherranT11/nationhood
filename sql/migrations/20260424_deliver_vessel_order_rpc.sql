-- ════════════════════════════════════════════════════════════════════════════════
-- Atomic vessel order delivery
--
-- Prior behaviour: processVesselOrderDeliveries() in advance-corp-tick did
-- four separate writes (deduct corp cash, credit shipyard budget, insert
-- corp_vessels row, mark order delivered) with `continue` on failure. If a
-- later step failed, the earlier writes persisted and the order stayed
-- `building`, so the next tick re-ran the deductions → cash drain until the
-- order self-cancelled for insufficient funds.
--
-- This RPC wraps all four writes in one PL/pgSQL block so they succeed or
-- fail together. Safe to call multiple times — the status guard makes it
-- a no-op for any order already delivered or cancelled.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION deliver_vessel_order(
    p_order_id uuid,
    p_current_tick integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order             vessel_orders%ROWTYPE;
    v_corp_cash         bigint;
    v_corp_nation_id    uuid;
BEGIN
    SELECT * INTO v_order FROM vessel_orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND OR v_order.status <> 'building' THEN
        RETURN; -- already handled; no-op
    END IF;

    SELECT COALESCE(corp_cash_reserves, 0), nation_id
    INTO v_corp_cash, v_corp_nation_id
    FROM factions
    WHERE id = v_order.faction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'deliver_vessel_order: corp % not found for order %',
            v_order.faction_id, p_order_id;
    END IF;

    IF v_corp_cash < v_order.balance_due THEN
        UPDATE vessel_orders
        SET status = 'cancelled', cancelled_at_tick = p_current_tick
        WHERE id = p_order_id;
        RETURN;
    END IF;

    UPDATE factions
    SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) - v_order.balance_due
    WHERE id = v_order.faction_id;

    UPDATE nations
    SET budget_reserves = COALESCE(budget_reserves, 0) + v_order.balance_due
    WHERE id = v_order.shipyard_nation_id;

    INSERT INTO corp_vessels (
        faction_id, nation_id, vessel_name, vessel_class,
        condition, fuel, status,
        capacity_dwt, capacity_unit, base_maintenance, fuel_capacity,
        purchase_price, built_at_tick, current_port_nation_id
    ) VALUES (
        v_order.faction_id, v_corp_nation_id, v_order.vessel_name, v_order.vessel_class,
        100, 100, 'in_port',
        v_order.capacity_dwt, v_order.capacity_unit, v_order.base_maintenance, v_order.fuel_capacity,
        LEAST(v_order.total_cost, 2147483647)::int, p_current_tick, v_corp_nation_id
    );

    UPDATE vessel_orders
    SET status = 'delivered', delivered_at_tick = p_current_tick
    WHERE id = p_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION deliver_vessel_order(uuid, integer) TO authenticated, service_role;
