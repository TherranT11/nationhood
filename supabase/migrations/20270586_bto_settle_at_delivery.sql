-- ════════════════════════════════════════════════════════════════════
-- 20270586 — BTO aircraft orders: settle cash at delivery, not at accept
--
-- Defect (pre-existing): ent_accept_aircraft_order's bottom block
-- transfers the buyer's full v_total to the seller as soon as the
-- order is accepted, regardless of fulfilment_mode. For 'stock' that
-- mirrors instant delivery and is fine. For 'build_to_order' the
-- production run then runs for N ticks, debiting cost_per_tick from
-- the seller's treasury each tick (process_ent_production_runs).
-- Seller can drain treasury immediately after accept; the run then
-- silently pauses on the very next tick (cost_per_tick > 0 vs
-- treasury 0), buyer's money is gone, no plane ever delivered, no
-- UI surface. Integrity bug, also exploit-shaped.
--
-- Fix: settle cash on DELIVERY for BTO, matching the RFP system
-- pattern (process_ent_aircraft_rfps charges the airline only at
-- completion). Stock mode is unchanged — instant settle stays.
--
-- Mechanism:
--   1. New column ent_production_runs.delivery_price_per_unit bigint.
--      Stamped by ent_accept_aircraft_order at the BTO INSERT;
--      consumed by process_ent_production_runs on each delivery to
--      compute v_pay_total = price_per_unit × v_delta.
--   2. ent_accept_aircraft_order BTO branch: no longer transfers
--      cash at accept. The stock branch keeps its instant settle
--      (cash transfer block moved inside it).
--   3. process_ent_production_runs delivery branches (both the
--      completion path AND the progressive path for quantity > 1):
--      attempt to debit the buyer for the just-delivered units.
--      If FOUND: credit seller the same, deliver to buyer's
--      corp_aircraft. If NOT FOUND (buyer broke, or buyer corp
--      deleted via the existing ON DELETE SET NULL cascade): the
--      units fall back into the SELLER's design inventory_on_hand —
--      seller keeps what they built and can resell. Engines stay
--      consumed (they were committed at order accept).
--
-- Backwards-compat: rows with delivery_to_corp_id IS NOT NULL and
-- delivery_price_per_unit IS NULL are pre-fix runs — the buyer was
-- already charged in full at accept under the old behaviour. Those
-- deliver straight to the buyer's fleet without re-settling.
--
-- Cascade fix bonus: previously, ent_production_runs.delivery_to_corp_id
-- has ON DELETE SET NULL. If the buyer corp got deleted mid-build,
-- delivery_to_corp_id flipped to NULL and the plane went silently
-- into the seller's design inventory_on_hand (which is OK) — but the
-- buyer's money had already been collected by the seller (which was
-- not OK). After this migration, the buyer's money is collected at
-- delivery time, so the cascade-to-NULL case simply means "no buyer
-- to charge, no plane to deliver to them" and falls through to the
-- seller-keeps-it branch cleanly.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Settlement snapshot column ──────────────────────────────────
ALTER TABLE public.ent_production_runs
    ADD COLUMN IF NOT EXISTS delivery_price_per_unit bigint;

COMMENT ON COLUMN public.ent_production_runs.delivery_price_per_unit IS
    'BTO settlement snapshot: price-per-unit the buyer pays at delivery. Stamped by ent_accept_aircraft_order at the BTO INSERT; consumed by process_ent_production_runs to debit buyer + credit seller as each unit delivers. NULL on legacy runs queued before 20270586 (those runs had the buyer charged in full at accept under the old behaviour and deliver straight to fleet without re-settling).';

-- ── 2. ent_accept_aircraft_order — cash transfer moved into stock branch ──
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
    -- Cash gate: STOCK mode requires full upfront cash (instant settle below);
    -- BTO mode still requires full cash on hand at accept (commitment check)
    -- but the actual debit happens on delivery, not here. Same gate either way
    -- so a buyer can't accept a BTO they couldn't afford if it shipped today.
    IF COALESCE(v_buyer.treasury_cash, 0) < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_cash',
            'have', floor(COALESCE(v_buyer.treasury_cash, 0))::bigint, 'need', v_total);
    END IF;

    SELECT * INTO v_design FROM ent_aircraft_designs WHERE id = v_order.aircraft_design_id;
    IF v_design.id IS NULL OR v_design.design_type <> 'aircraft' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_missing');
    END IF;

    -- Lock the seller corp row. STOCK mode credits its treasury below;
    -- BTO mode mutates its engine inventory + queues a production run.
    -- Lock-early prevents interleaved accepts on the same seller from
    -- racing the treasury / inventory updates.
    PERFORM 1 FROM entrepreneur_corps WHERE id = v_order.seller_corp_id FOR UPDATE;

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

        -- Cash transfer for STOCK only: buyer pays now, seller credited now.
        -- BTO mode settles per delivery inside process_ent_production_runs
        -- (see 20270586 — moved from this RPC to fix the seller-drain bug
        -- where the seller could pocket v_total and silently pause the build).
        UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) - v_total, updated_at = now()
         WHERE id = v_order.buyer_corp_id;
        UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) + v_total, updated_at = now()
         WHERE id = v_order.seller_corp_id;

    ELSIF v_order.fulfilment_mode = 'build_to_order' THEN
        -- Build-to-order: queue a production run on a seller plant compatible
        -- with this airframe class, marked for delivery into the buyer. The
        -- per-tick processor will insert into corp_aircraft AND settle cash
        -- (debit buyer, credit seller) when each unit delivers. Mirrors
        -- ent_queue_production_run's plant + engine logic.
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
        -- Engines are consumed at accept (seller's commitment); they stay
        -- consumed even if a per-unit settlement later fails at delivery.
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
            status, last_processed_tick, delivery_to_corp_id, delivery_price_per_unit
        ) VALUES (
            v_order.seller_corp_id, v_order.aircraft_design_id, v_plant.id, v_order.quantity,
            v_cost_tick, v_tpu, v_total_ticks, v_per_unit,
            'active', v_tick, v_order.buyer_corp_id, v_order.price_per_unit
        );
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'mode_not_set');
    END IF;

    UPDATE ent_aircraft_orders SET status = 'completed' WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true,
        'mode', v_order.fulfilment_mode, 'total', v_total);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ent_accept_aircraft_order(uuid) TO authenticated;

-- ── 3. process_ent_production_runs — settle BTO cash at delivery ──
-- Re-emits the 20270585 body (which fixed the stale-tick read) with
-- both delivery branches (completion + progressive) updated to:
--   • try to debit the buyer delivery_price_per_unit × v_delta;
--   • on success, credit the seller and deliver units to the buyer;
--   • on failure (buyer broke, or buyer corp deleted → SET NULL),
--     fall back into the seller's design inventory_on_hand.
-- Engines were already consumed at accept and are not refunded — the
-- seller built real units that landed somewhere.
CREATE OR REPLACE FUNCTION public.process_ent_production_runs(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick       int;
    r            RECORD;
    v_dtype      text;
    v_dclass     text;
    v_new        int;
    v_target     int;
    v_delta      int;
    v_pay_total  bigint;
    v_buyer_paid boolean;
    v_advanced   int := 0;
    v_delivered  int := 0;
    v_completed  int := 0;
    v_paused     int := 0;
BEGIN
    v_tick := COALESCE(p_tick, (SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), 0);

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
                    -- BTO delivery. Legacy runs (delivery_price_per_unit NULL)
                    -- were paid up-front under the old behaviour — deliver
                    -- straight to fleet without re-settling.
                    IF r.delivery_price_per_unit IS NULL THEN
                        INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
                        SELECT r.delivery_to_corp_id, v_dclass, 100, v_tick
                          FROM generate_series(1, v_delta);
                    ELSE
                        v_pay_total := r.delivery_price_per_unit * v_delta;
                        UPDATE entrepreneur_corps
                           SET treasury_cash = COALESCE(treasury_cash, 0) - v_pay_total, updated_at = now()
                         WHERE id = r.delivery_to_corp_id
                           AND COALESCE(treasury_cash, 0) >= v_pay_total;
                        v_buyer_paid := FOUND;
                        IF v_buyer_paid THEN
                            UPDATE entrepreneur_corps
                               SET treasury_cash = COALESCE(treasury_cash, 0) + v_pay_total, updated_at = now()
                             WHERE id = r.entrepreneur_corp_id;
                            INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
                            SELECT r.delivery_to_corp_id, v_dclass, 100, v_tick
                              FROM generate_series(1, v_delta);
                        ELSE
                            -- Buyer broke — seller keeps the units in design stock.
                            UPDATE ent_aircraft_designs
                               SET inventory_on_hand = inventory_on_hand + v_delta WHERE id = r.design_id;
                        END IF;
                    END IF;
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
                    IF r.delivery_price_per_unit IS NULL THEN
                        INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
                        SELECT r.delivery_to_corp_id, v_dclass, 100, v_tick
                          FROM generate_series(1, v_delta);
                    ELSE
                        v_pay_total := r.delivery_price_per_unit * v_delta;
                        UPDATE entrepreneur_corps
                           SET treasury_cash = COALESCE(treasury_cash, 0) - v_pay_total, updated_at = now()
                         WHERE id = r.delivery_to_corp_id
                           AND COALESCE(treasury_cash, 0) >= v_pay_total;
                        v_buyer_paid := FOUND;
                        IF v_buyer_paid THEN
                            UPDATE entrepreneur_corps
                               SET treasury_cash = COALESCE(treasury_cash, 0) + v_pay_total, updated_at = now()
                             WHERE id = r.entrepreneur_corp_id;
                            INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
                            SELECT r.delivery_to_corp_id, v_dclass, 100, v_tick
                              FROM generate_series(1, v_delta);
                        ELSE
                            UPDATE ent_aircraft_designs
                               SET inventory_on_hand = inventory_on_hand + v_delta WHERE id = r.design_id;
                        END IF;
                    END IF;
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

NOTIFY pgrst, 'reload schema';

COMMIT;
