-- ─────────────────────────────────────────────────────────────────────────────
-- Bilateral aircraft purchase orders. Mirrors ent_engine_orders (20270235):
-- airline (buyer) → ent_request_aircraft_order → 'pending';
-- aviation manufacturer (seller) → ent_price_aircraft_order with a fulfilment
-- mode → 'priced'; buyer → ent_accept_aircraft_order → 'completed' and either
-- (mode='stock') decrement seller inventory + insert N corp_aircraft rows for
-- the buyer, or (mode='build_to_order') queue an ent_production_runs row on a
-- seller plant marked with delivery_to_corp_id = buyer so the per-tick
-- production processor delivers the finished units into the buyer's fleet.
--
-- New column on ent_production_runs:
--   delivery_to_corp_id — nullable. Stock runs leave it NULL and deliver into
--   the producer's own inventory; build-to-order runs set it to the buyer's
--   corp id, and process_ent_production_runs inserts the finished aircraft
--   into corp_aircraft for that corp instead of bumping inventory_on_hand.
--
-- Class scope: regional / narrowbody / widebody only (matches corp_aircraft's
-- existing CHECK; business jets need a separate widening pass like the RFP
-- migration 20261107 documents). The request RPC rejects 'business' designs
-- with reason='class_not_supported' so the failure surfaces in the modal.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── ent_aircraft_orders ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ent_aircraft_orders (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_corp_id       uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    seller_corp_id      uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    aircraft_design_id  uuid NOT NULL REFERENCES ent_aircraft_designs(id) ON DELETE CASCADE,
    quantity            int  NOT NULL CHECK (quantity > 0 AND quantity <= 50),
    price_per_unit      bigint CHECK (price_per_unit IS NULL OR price_per_unit >= 0),
    fulfilment_mode     text CHECK (fulfilment_mode IS NULL OR fulfilment_mode IN ('stock', 'build_to_order')),
    status              text NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'priced', 'completed', 'cancelled')),
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ent_aircraft_orders_buyer
    ON public.ent_aircraft_orders (buyer_corp_id) WHERE status IN ('pending', 'priced');
CREATE INDEX IF NOT EXISTS idx_ent_aircraft_orders_seller
    ON public.ent_aircraft_orders (seller_corp_id) WHERE status IN ('pending', 'priced');

ALTER TABLE public.ent_aircraft_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ent_aircraft_orders_read_all" ON public.ent_aircraft_orders;
CREATE POLICY "ent_aircraft_orders_read_all"
    ON public.ent_aircraft_orders FOR SELECT USING (true);

COMMENT ON TABLE public.ent_aircraft_orders IS
    'Bilateral aircraft purchase orders, airline buyer ↔ aviation manufacturer seller. pending → priced (seller names price + fulfilment_mode) → completed (buyer accepts: stock = instant delivery, build_to_order = production run on seller plant delivering into buyer corp_aircraft) | cancelled (either party while open). RPC-write-only.';

-- ── ent_production_runs.delivery_to_corp_id ────────────────────────
ALTER TABLE public.ent_production_runs
    ADD COLUMN IF NOT EXISTS delivery_to_corp_id uuid REFERENCES entrepreneur_corps(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.ent_production_runs.delivery_to_corp_id IS
    'Build-to-order aircraft target. NULL for stock runs (delivery into entrepreneur_corp_id own inventory_on_hand). When set, process_ent_production_runs inserts N corp_aircraft rows for this corp instead of bumping inventory.';

-- ── process_ent_production_runs — delivery_to_corp_id branch ───────
-- Body reproduced from 20270356_unify_engine_inventory.sql with a single
-- aircraft-delivery branch: build-to-order runs (delivery_to_corp_id NOT NULL)
-- insert into corp_aircraft for the buyer; stock runs (NULL) bump the
-- producer's own inventory_on_hand. Engines are unchanged.
CREATE OR REPLACE FUNCTION public.process_ent_production_runs(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick      int;
    r           RECORD;
    v_dtype     text;
    v_dclass    text;
    v_new       int;
    v_target    int;
    v_delta     int;
    v_advanced  int := 0;
    v_delivered int := 0;
    v_completed int := 0;
    v_paused    int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, p_tick, 0);

    FOR r IN
        SELECT * FROM ent_production_runs
         WHERE status = 'active'
           AND (last_processed_tick IS NULL OR last_processed_tick <> v_tick)
         FOR UPDATE
    LOOP
        -- Charge this tick; pause (no progress) if the treasury can't cover.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) - r.cost_per_tick, updated_at = now()
         WHERE id = r.entrepreneur_corp_id
           AND COALESCE(treasury_cash, 0) >= r.cost_per_tick;
        IF NOT FOUND THEN
            UPDATE ent_production_runs SET last_processed_tick = v_tick WHERE id = r.id;
            v_paused := v_paused + 1;
            CONTINUE;
        END IF;

        SELECT design_type, airframe_class INTO v_dtype, v_dclass
          FROM ent_aircraft_designs WHERE id = r.design_id;

        v_new    := r.ticks_elapsed + 1;
        v_target := LEAST(r.quantity, v_new / r.ticks_per_unit);
        v_delta  := v_target - r.units_delivered;

        IF v_new >= r.total_ticks THEN
            v_delta := r.quantity - r.units_delivered;
            IF v_delta > 0 THEN
                IF v_dtype = 'engine' THEN
                    INSERT INTO ent_engine_inventory (entrepreneur_corp_id, engine_design_id, quantity)
                    VALUES (r.entrepreneur_corp_id, r.design_id, v_delta)
                    ON CONFLICT (entrepreneur_corp_id, engine_design_id)
                    DO UPDATE SET quantity = ent_engine_inventory.quantity + EXCLUDED.quantity;
                ELSIF r.delivery_to_corp_id IS NOT NULL THEN
                    -- Build-to-order: deliver finished aircraft into buyer's fleet.
                    INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
                    SELECT r.delivery_to_corp_id, v_dclass, 100, v_tick
                      FROM generate_series(1, v_delta);
                ELSE
                    UPDATE ent_aircraft_designs
                       SET inventory_on_hand = inventory_on_hand + v_delta WHERE id = r.design_id;
                END IF;
                v_delivered := v_delivered + v_delta;
            END IF;
            UPDATE ent_production_runs
               SET ticks_elapsed = v_new, units_delivered = r.quantity,
                   status = 'completed', last_processed_tick = v_tick
             WHERE id = r.id;
            v_completed := v_completed + 1;
        ELSE
            IF v_delta > 0 THEN
                IF v_dtype = 'engine' THEN
                    INSERT INTO ent_engine_inventory (entrepreneur_corp_id, engine_design_id, quantity)
                    VALUES (r.entrepreneur_corp_id, r.design_id, v_delta)
                    ON CONFLICT (entrepreneur_corp_id, engine_design_id)
                    DO UPDATE SET quantity = ent_engine_inventory.quantity + EXCLUDED.quantity;
                ELSIF r.delivery_to_corp_id IS NOT NULL THEN
                    INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
                    SELECT r.delivery_to_corp_id, v_dclass, 100, v_tick
                      FROM generate_series(1, v_delta);
                ELSE
                    UPDATE ent_aircraft_designs
                       SET inventory_on_hand = inventory_on_hand + v_delta WHERE id = r.design_id;
                END IF;
                v_delivered := v_delivered + v_delta;
            END IF;
            UPDATE ent_production_runs
               SET ticks_elapsed = v_new, units_delivered = v_target, last_processed_tick = v_tick
             WHERE id = r.id;
            v_advanced := v_advanced + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick,
        'advanced', v_advanced, 'delivered', v_delivered,
        'completed', v_completed, 'paused', v_paused);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.process_ent_production_runs(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_ent_production_runs(int) TO service_role;

-- ── ent_request_aircraft_order ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ent_request_aircraft_order(
    p_buyer_corp_id    uuid,
    p_aircraft_design_id uuid,
    p_quantity int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_buyer   entrepreneur_corps%ROWTYPE;
    v_design  ent_aircraft_designs%ROWTYPE;
    v_id      uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 50 THEN
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
    IF v_buyer.industry <> 'airline' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_airline');
    END IF;

    SELECT * INTO v_design FROM ent_aircraft_designs WHERE id = p_aircraft_design_id;
    IF v_design.id IS NULL OR v_design.design_type <> 'aircraft' OR v_design.status <> 'available' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_not_available');
    END IF;
    IF v_design.entrepreneur_corp_id = p_buyer_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'own_design');
    END IF;
    -- corp_aircraft.aircraft_class CHECK is regional/narrowbody/widebody only
    -- (per 20261107 comment block). Business jets need the broader widening
    -- pass before they can be delivered through this flow.
    IF v_design.airframe_class NOT IN ('regional', 'narrowbody', 'widebody') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'class_not_supported');
    END IF;

    INSERT INTO ent_aircraft_orders (buyer_corp_id, seller_corp_id, aircraft_design_id, quantity, status)
    VALUES (p_buyer_corp_id, v_design.entrepreneur_corp_id, p_aircraft_design_id, p_quantity, 'pending')
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'order_id', v_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_request_aircraft_order(uuid, uuid, int) TO authenticated;

-- ── ent_price_aircraft_order (seller; sets price + fulfilment_mode) ─
CREATE OR REPLACE FUNCTION public.ent_price_aircraft_order(
    p_order_id        uuid,
    p_price_per_unit  bigint,
    p_fulfilment_mode text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_order  ent_aircraft_orders%ROWTYPE;
    v_seller entrepreneur_corps%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_price_per_unit IS NULL OR p_price_per_unit < 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_price');
    END IF;
    IF p_fulfilment_mode NOT IN ('stock', 'build_to_order') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_mode');
    END IF;

    SELECT * INTO v_order FROM ent_aircraft_orders WHERE id = p_order_id FOR UPDATE;
    IF v_order.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'order_not_found');
    END IF;
    IF v_order.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'order_not_pending');
    END IF;

    SELECT * INTO v_seller FROM entrepreneur_corps WHERE id = v_order.seller_corp_id;
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_seller.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_seller');
    END IF;

    UPDATE ent_aircraft_orders
       SET price_per_unit = p_price_per_unit,
           fulfilment_mode = p_fulfilment_mode,
           status = 'priced'
     WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_price_aircraft_order(uuid, bigint, text) TO authenticated;

-- ── ent_accept_aircraft_order (buyer; settles cash + delivery) ─────
CREATE OR REPLACE FUNCTION public.ent_accept_aircraft_order(
    p_order_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_fac       factions%ROWTYPE;
    v_order     ent_aircraft_orders%ROWTYPE;
    v_buyer     entrepreneur_corps%ROWTYPE;
    v_seller    entrepreneur_corps%ROWTYPE;
    v_design    ent_aircraft_designs%ROWTYPE;
    v_engine    ent_aircraft_designs%ROWTYPE;
    v_plant     corp_buildings%ROWTYPE;
    v_compat    text[];
    v_tpu       int;
    v_per_unit  bigint;
    v_total     bigint;
    v_eng_count int;
    v_eng_need  int;
    v_eng_have  int;
    v_total_ticks int;
    v_cost_tick bigint;
    v_tick      int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_order FROM ent_aircraft_orders WHERE id = p_order_id FOR UPDATE;
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
    IF COALESCE(v_buyer.treasury_cash, 0) < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_cash',
            'have', floor(COALESCE(v_buyer.treasury_cash, 0))::bigint, 'need', v_total);
    END IF;

    SELECT * INTO v_design FROM ent_aircraft_designs WHERE id = v_order.aircraft_design_id;
    IF v_design.id IS NULL OR v_design.design_type <> 'aircraft' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_missing');
    END IF;

    SELECT * INTO v_seller FROM entrepreneur_corps WHERE id = v_order.seller_corp_id FOR UPDATE;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_order.fulfilment_mode = 'stock' THEN
        -- Stock fulfilment: decrement seller inventory, insert N rows into
        -- buyer's corp_aircraft, settle cash. Instant.
        UPDATE ent_aircraft_designs
           SET inventory_on_hand = inventory_on_hand - v_order.quantity
         WHERE id = v_order.aircraft_design_id
           AND inventory_on_hand >= v_order.quantity;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_inventory',
                'need', v_order.quantity, 'have', COALESCE(v_design.inventory_on_hand, 0));
        END IF;

        INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
        SELECT v_order.buyer_corp_id, v_design.airframe_class, 100, v_tick
          FROM generate_series(1, v_order.quantity);

    ELSIF v_order.fulfilment_mode = 'build_to_order' THEN
        -- Build-to-order: queue a production run on a seller plant compatible
        -- with this airframe class, marked for delivery into the buyer. The
        -- per-tick processor will insert into corp_aircraft when the run
        -- completes. Mirrors ent_queue_production_run's plant + engine logic.
        v_compat := CASE v_design.airframe_class
            WHEN 'regional'   THEN ARRAY['light_assembly_plant', 'aircraft_assembly_facility']
            WHEN 'narrowbody' THEN ARRAY['aircraft_assembly_facility']
            WHEN 'widebody'   THEN ARRAY['heavy_manufacturing_plant']
            ELSE ARRAY[]::text[]
        END;
        v_tpu := CASE v_design.airframe_class
                     WHEN 'regional' THEN 2 WHEN 'narrowbody' THEN 3
                     WHEN 'widebody' THEN 4 ELSE 2 END;

        -- First completed compatible plant on the seller that's not running
        -- another active run right now.
        SELECT * INTO v_plant FROM corp_buildings
         WHERE owner_corp_id = v_order.seller_corp_id
           AND status = 'completed'
           AND building_type = ANY (v_compat)
           AND NOT EXISTS (SELECT 1 FROM ent_production_runs
                            WHERE plant_building_id = corp_buildings.id AND status = 'active')
         ORDER BY created_at_tick ASC LIMIT 1;
        IF v_plant.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_seller_plant',
                'allowed', v_compat);
        END IF;

        -- Engine requirement mirrors ent_queue_production_run: the seller's
        -- engine inventory funds the build. v_per_unit drops the engine
        -- portion of cost_per_unit because engines come from inventory.
        v_per_unit := GREATEST(0, COALESCE(v_design.cost_per_unit, 0));
        IF v_design.engine_design_id IS NOT NULL THEN
            SELECT * INTO v_engine FROM ent_aircraft_designs WHERE id = v_design.engine_design_id;
            IF v_engine.id IS NULL OR v_engine.design_type <> 'engine' THEN
                RETURN jsonb_build_object('success', false, 'reason', 'engine_design_missing');
            END IF;
            v_eng_count := COALESCE(v_design.engine_count, 0);
            v_eng_need  := v_eng_count * v_order.quantity;

            SELECT COALESCE(quantity, 0) INTO v_eng_have FROM ent_engine_inventory
             WHERE entrepreneur_corp_id = v_order.seller_corp_id
               AND engine_design_id = v_engine.id;
            IF COALESCE(v_eng_have, 0) < v_eng_need THEN
                RETURN jsonb_build_object('success', false, 'reason', 'seller_insufficient_engines',
                    'engine', v_engine.name, 'need', v_eng_need, 'have', COALESCE(v_eng_have, 0));
            END IF;

            -- Consume engines from seller now (eager, guarded against a
            -- concurrent draw-down — same pattern as ent_queue_production_run).
            UPDATE ent_engine_inventory SET quantity = quantity - v_eng_need
             WHERE entrepreneur_corp_id = v_order.seller_corp_id
               AND engine_design_id = v_engine.id
               AND quantity >= v_eng_need;
            IF NOT FOUND THEN
                RETURN jsonb_build_object('success', false, 'reason', 'seller_insufficient_engines');
            END IF;

            v_per_unit := GREATEST(0, v_per_unit - COALESCE(v_engine.cost_per_unit, 0) * v_eng_count);
        END IF;

        v_total_ticks := v_tpu * v_order.quantity;
        v_cost_tick   := GREATEST(1, ((v_per_unit * v_order.quantity) / v_total_ticks))::bigint;

        INSERT INTO ent_production_runs (
            entrepreneur_corp_id, design_id, plant_building_id, quantity,
            cost_per_tick, ticks_per_unit, total_ticks, per_unit_cost,
            status, last_processed_tick, delivery_to_corp_id
        ) VALUES (
            v_order.seller_corp_id, v_order.aircraft_design_id, v_plant.id, v_order.quantity,
            v_cost_tick, v_tpu, v_total_ticks, v_per_unit,
            'active', v_tick, v_order.buyer_corp_id
        );
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'mode_not_set');
    END IF;

    -- Cash transfer happens for both modes: buyer pays, seller credited.
    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) - v_total, updated_at = now()
     WHERE id = v_order.buyer_corp_id;
    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) + v_total, updated_at = now()
     WHERE id = v_order.seller_corp_id;

    UPDATE ent_aircraft_orders SET status = 'completed' WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true,
        'mode', v_order.fulfilment_mode, 'total', v_total);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_accept_aircraft_order(uuid) TO authenticated;

-- ── ent_cancel_aircraft_order (either party while open) ────────────
CREATE OR REPLACE FUNCTION public.ent_cancel_aircraft_order(
    p_order_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_order ent_aircraft_orders%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_order FROM ent_aircraft_orders WHERE id = p_order_id FOR UPDATE;
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

    UPDATE ent_aircraft_orders SET status = 'cancelled' WHERE id = p_order_id;
    RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_cancel_aircraft_order(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
