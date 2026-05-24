-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR ENGINE TRADE — manufacturer-to-manufacturer engine orders
-- ════════════════════════════════════════════════════════════════════
-- An aviation-manufacturing corp browses another manufacturer's AVAILABLE
-- engine designs, requests a quantity, the seller names a price, and the
-- buyer accepts — a bilateral handshake (both parties agree) rather than the
-- lowest-wins auction used for aircraft RFPs.
--
--   ent_request_engine_order  buyer → 'pending'  (engine + qty, no price)
--   ent_price_engine_order    seller → 'priced'  (sets price_per_unit)
--   ent_accept_engine_order   buyer  → 'completed' + settle instantly
--   ent_cancel_engine_order   either → 'cancelled' (decline / withdraw)
--
-- Settlement (produce-to-order, instant on accept):
--   • buyer pays price_per_unit × qty
--   • seller is credited that, minus a production-cost sink
--     (engine.cost_per_unit × qty) — seller builds to order, no inventory
--   • qty engine units land in the buyer's ent_engine_inventory
--
-- Consumer (so engine stock isn't dead state): aircraft production now draws
-- foreign engines from inventory. ent_queue_production_run is replaced below:
-- when an aircraft design's engine belongs to ANOTHER corp, the run requires
-- and consumes engine_count × qty units from ent_engine_inventory and drops
-- the engine portion from the per-unit build cost (it was paid at purchase).
-- Own-engine aircraft are unchanged — produced inline at the bundled cost.
-- Engine consumption is EAGER (subtracted at queue time, no refund on pause),
-- mirroring the legacy production reservation.
--
-- Idempotent (CREATE OR REPLACE / IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Engine holdings (per buyer, per engine design) ──────────────────
CREATE TABLE IF NOT EXISTS public.ent_engine_inventory (
    entrepreneur_corp_id uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    engine_design_id     uuid NOT NULL REFERENCES ent_aircraft_designs(id) ON DELETE CASCADE,
    quantity             int  NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    PRIMARY KEY (entrepreneur_corp_id, engine_design_id)
);

ALTER TABLE public.ent_engine_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ent_engine_inventory_read_all" ON public.ent_engine_inventory;
CREATE POLICY "ent_engine_inventory_read_all"
    ON public.ent_engine_inventory FOR SELECT USING (true);

COMMENT ON TABLE public.ent_engine_inventory IS
    'Engine units a corp holds, keyed by the (foreign) engine design. Credited by ent_accept_engine_order; drawn down by aircraft production (ent_queue_production_run) for foreign-engine aircraft. RPC-write-only.';

-- ── Engine orders (bilateral negotiation) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.ent_engine_orders (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_corp_id    uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    seller_corp_id   uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    engine_design_id uuid NOT NULL REFERENCES ent_aircraft_designs(id) ON DELETE CASCADE,
    quantity         int  NOT NULL CHECK (quantity > 0 AND quantity <= 1000),
    price_per_unit   bigint CHECK (price_per_unit IS NULL OR price_per_unit >= 0),
    status           text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'priced', 'completed', 'cancelled')),
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ent_engine_orders_buyer
    ON public.ent_engine_orders (buyer_corp_id) WHERE status IN ('pending', 'priced');
CREATE INDEX IF NOT EXISTS idx_ent_engine_orders_seller
    ON public.ent_engine_orders (seller_corp_id) WHERE status IN ('pending', 'priced');

ALTER TABLE public.ent_engine_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ent_engine_orders_read_all" ON public.ent_engine_orders;
CREATE POLICY "ent_engine_orders_read_all"
    ON public.ent_engine_orders FOR SELECT USING (true);

COMMENT ON TABLE public.ent_engine_orders IS
    'Manufacturer-to-manufacturer engine purchase orders. Lifecycle pending→priced→completed/cancelled via the ent_*_engine_order RPCs. On accept, settles instantly (buyer pays, seller credited minus a cost sink, engines to buyer inventory). RPC-write-only.';

-- ── Helper: resolve the caller's entrepreneur faction ───────────────
-- (inline in each RPC; no shared function to keep the surface small)

-- ── ent_request_engine_order ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ent_request_engine_order(
    p_buyer_corp_id  uuid,
    p_engine_design_id uuid,
    p_quantity int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_buyer  entrepreneur_corps%ROWTYPE;
    v_engine ent_aircraft_designs%ROWTYPE;
    v_id     uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 1000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;

    SELECT * INTO v_buyer FROM entrepreneur_corps WHERE id = p_buyer_corp_id;
    IF v_buyer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_buyer.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_buyer.industry <> 'aviation_manufacturing' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_manufacturer');
    END IF;

    SELECT * INTO v_engine FROM ent_aircraft_designs WHERE id = p_engine_design_id;
    IF v_engine.id IS NULL OR v_engine.design_type <> 'engine' OR v_engine.status <> 'available' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'engine_not_available');
    END IF;
    IF v_engine.entrepreneur_corp_id = p_buyer_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'own_engine');
    END IF;

    INSERT INTO ent_engine_orders (buyer_corp_id, seller_corp_id, engine_design_id, quantity, status)
    VALUES (p_buyer_corp_id, v_engine.entrepreneur_corp_id, p_engine_design_id, p_quantity, 'pending')
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'order_id', v_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_request_engine_order(uuid, uuid, int) TO authenticated;

-- ── ent_price_engine_order (seller) ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.ent_price_engine_order(
    p_order_id uuid,
    p_price_per_unit bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_order ent_engine_orders%ROWTYPE;
    v_corp  entrepreneur_corps%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_price_per_unit IS NULL OR p_price_per_unit < 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_price');
    END IF;

    SELECT * INTO v_order FROM ent_engine_orders WHERE id = p_order_id FOR UPDATE;
    IF v_order.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'order_not_found');
    END IF;
    IF v_order.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'order_not_pending');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_order.seller_corp_id;
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_seller');
    END IF;

    UPDATE ent_engine_orders SET price_per_unit = p_price_per_unit, status = 'priced'
     WHERE id = p_order_id;
    RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_price_engine_order(uuid, bigint) TO authenticated;

-- ── ent_accept_engine_order (buyer) — settle instantly ──────────────
CREATE OR REPLACE FUNCTION public.ent_accept_engine_order(
    p_order_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_order  ent_engine_orders%ROWTYPE;
    v_buyer  entrepreneur_corps%ROWTYPE;
    v_engine ent_aircraft_designs%ROWTYPE;
    v_total  bigint;
    v_cost   bigint;
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
    v_cost := COALESCE(v_engine.cost_per_unit, 0) * v_order.quantity;

    -- Buyer pays the agreed total or the deal fails (nothing moves).
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_total, updated_at = now()
     WHERE id = v_order.buyer_corp_id AND COALESCE(treasury_cash, 0) >= v_total;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_cash',
            'need', v_total, 'have', floor(COALESCE(v_buyer.treasury_cash, 0))::bigint);
    END IF;

    -- Seller credited the sale, minus the produce-to-order cost sink.
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) + v_total - v_cost, updated_at = now()
     WHERE id = v_order.seller_corp_id;

    -- Engines delivered into the buyer's holdings.
    INSERT INTO ent_engine_inventory (entrepreneur_corp_id, engine_design_id, quantity)
    VALUES (v_order.buyer_corp_id, v_order.engine_design_id, v_order.quantity)
    ON CONFLICT (entrepreneur_corp_id, engine_design_id)
    DO UPDATE SET quantity = ent_engine_inventory.quantity + EXCLUDED.quantity;

    UPDATE ent_engine_orders SET status = 'completed' WHERE id = p_order_id;
    RETURN jsonb_build_object('success', true, 'total', v_total, 'delivered', v_order.quantity);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_accept_engine_order(uuid) TO authenticated;

-- ── ent_cancel_engine_order (buyer or seller) ───────────────────────
CREATE OR REPLACE FUNCTION public.ent_cancel_engine_order(
    p_order_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_order  ent_engine_orders%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_order FROM ent_engine_orders WHERE id = p_order_id FOR UPDATE;
    IF v_order.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'order_not_found');
    END IF;
    IF v_order.status NOT IN ('pending', 'priced') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'order_closed');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL
       OR v_fac.id NOT IN (
            SELECT owner_faction_id FROM entrepreneur_corps
             WHERE id IN (v_order.buyer_corp_id, v_order.seller_corp_id)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_party');
    END IF;

    UPDATE ent_engine_orders SET status = 'cancelled' WHERE id = p_order_id;
    RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_cancel_engine_order(uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- ent_queue_production_run — now consumes foreign engine stock
-- (body of 20270234 with the engine-requirement block added; everything
--  else verbatim).
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.ent_queue_production_run(
    p_corp_id  uuid,
    p_design_id uuid,
    p_plant_building_id uuid,
    p_quantity int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_corp         entrepreneur_corps%ROWTYPE;
    v_design       ent_aircraft_designs%ROWTYPE;
    v_engine       ent_aircraft_designs%ROWTYPE;
    v_plant        corp_buildings%ROWTYPE;
    v_compat       text[];
    v_tpu          int;
    v_per_unit     bigint;
    v_total_cost   bigint;
    v_total_ticks  int;
    v_cost_tick    bigint;
    v_tick         int;
    v_run_id       uuid;
    v_foreign      boolean := false;
    v_eng_needed   int := 0;
    v_have         int := 0;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 100 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_corp.industry <> 'aviation_manufacturing' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_manufacturer');
    END IF;

    -- Design: this corp's own, available, aircraft.
    SELECT * INTO v_design FROM ent_aircraft_designs WHERE id = p_design_id;
    IF v_design.id IS NULL OR v_design.entrepreneur_corp_id <> p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_not_found');
    END IF;
    IF v_design.design_type <> 'aircraft' OR v_design.status <> 'available' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_not_available');
    END IF;

    -- Plant compatibility for the airframe class.
    v_compat := CASE v_design.airframe_class
        WHEN 'business'   THEN ARRAY['light_assembly_plant']
        WHEN 'regional'   THEN ARRAY['light_assembly_plant', 'aircraft_assembly_facility']
        WHEN 'narrowbody' THEN ARRAY['aircraft_assembly_facility']
        WHEN 'widebody'   THEN ARRAY['heavy_manufacturing_plant']
        ELSE ARRAY[]::text[]
    END;

    SELECT * INTO v_plant FROM corp_buildings WHERE id = p_plant_building_id;
    IF v_plant.id IS NULL OR v_plant.owner_corp_id <> p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plant_not_found');
    END IF;
    IF v_plant.status <> 'completed' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plant_not_ready');
    END IF;
    IF NOT (v_plant.building_type = ANY (v_compat)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plant_incompatible',
            'allowed', v_compat);
    END IF;
    -- One active run per plant.
    IF EXISTS (SELECT 1 FROM ent_production_runs
                WHERE plant_building_id = p_plant_building_id AND status = 'active') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plant_busy');
    END IF;

    -- Base cost (cost_per_unit bundles airframe + engines + modules).
    v_per_unit := GREATEST(0, COALESCE(v_design.cost_per_unit, 0));

    -- Foreign-engine aircraft draw engines from purchased stock and drop the
    -- engine portion from the build cost. Own-engine aircraft are unchanged.
    IF v_design.engine_design_id IS NOT NULL THEN
        SELECT * INTO v_engine FROM ent_aircraft_designs WHERE id = v_design.engine_design_id;
        IF v_engine.id IS NOT NULL AND v_engine.entrepreneur_corp_id <> p_corp_id THEN
            v_foreign := true;
            v_eng_needed := COALESCE(v_design.engine_count, 0) * p_quantity;
            SELECT COALESCE(quantity, 0) INTO v_have FROM ent_engine_inventory
             WHERE entrepreneur_corp_id = p_corp_id AND engine_design_id = v_engine.id;
            IF COALESCE(v_have, 0) < v_eng_needed THEN
                RETURN jsonb_build_object('success', false, 'reason', 'insufficient_engines',
                    'engine', v_engine.name, 'need', v_eng_needed, 'have', COALESCE(v_have, 0));
            END IF;
            v_per_unit := GREATEST(0, v_per_unit
                - COALESCE(v_engine.cost_per_unit, 0) * COALESCE(v_design.engine_count, 0));
        END IF;
    END IF;

    v_tpu        := CASE v_design.airframe_class
                        WHEN 'business' THEN 1 WHEN 'regional' THEN 2
                        WHEN 'narrowbody' THEN 3 WHEN 'widebody' THEN 4 ELSE 2 END;
    v_total_ticks := v_tpu * p_quantity;
    v_total_cost  := v_per_unit * p_quantity;
    v_cost_tick   := GREATEST(1, (v_total_cost / v_total_ticks))::bigint;

    -- Need at least one tick of funding to start.
    IF COALESCE(v_corp.treasury_cash, 0) < v_cost_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_cash',
            'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint, 'need', v_cost_tick);
    END IF;

    -- Consume engines now (eager, guarded against a concurrent draw-down).
    IF v_foreign AND v_eng_needed > 0 THEN
        UPDATE ent_engine_inventory SET quantity = quantity - v_eng_needed
         WHERE entrepreneur_corp_id = p_corp_id AND engine_design_id = v_engine.id
           AND quantity >= v_eng_needed;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_engines',
                'engine', v_engine.name, 'need', v_eng_needed, 'have', COALESCE(v_have, 0));
        END IF;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO ent_production_runs (
        entrepreneur_corp_id, design_id, plant_building_id, quantity,
        cost_per_tick, ticks_per_unit, total_ticks,
        status, last_processed_tick
    ) VALUES (
        p_corp_id, p_design_id, p_plant_building_id, p_quantity,
        v_cost_tick, v_tpu, v_total_ticks,
        'active', v_tick
    ) RETURNING id INTO v_run_id;

    RETURN jsonb_build_object('success', true, 'run_id', v_run_id,
        'quantity', p_quantity, 'per_unit_cost', v_per_unit,
        'total_cost', v_total_cost, 'cost_per_tick', v_cost_tick,
        'total_ticks', v_total_ticks, 'engines_consumed', CASE WHEN v_foreign THEN v_eng_needed ELSE 0 END);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_queue_production_run(uuid, uuid, uuid, int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- Re-apply 20270234 to restore the engine-agnostic ent_queue_production_run.
-- DROP FUNCTION IF EXISTS public.ent_cancel_engine_order(uuid);
-- DROP FUNCTION IF EXISTS public.ent_accept_engine_order(uuid);
-- DROP FUNCTION IF EXISTS public.ent_price_engine_order(uuid, bigint);
-- DROP FUNCTION IF EXISTS public.ent_request_engine_order(uuid, uuid, int);
-- DROP TABLE IF EXISTS public.ent_engine_orders;
-- DROP TABLE IF EXISTS public.ent_engine_inventory;
-- COMMIT;
