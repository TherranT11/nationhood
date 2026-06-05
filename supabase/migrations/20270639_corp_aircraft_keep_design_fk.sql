-- ════════════════════════════════════════════════════════════════════
-- 20270639 — corp_aircraft.ent_design_id: stop dropping the design FK
--
-- Bug surfaced by an airline whose Regional plane rendered as
-- "Regional · range 0" with no design name. The corp_aircraft FK
-- to ent_aircraft_designs is what carries the per-plane stats
-- (name, range_nm, thrust, etc.), but the delivery RPCs were
-- inserting rows without populating ent_design_id at all — every
-- plane delivered via the design-targeted Buy / Build-to-Order
-- flow ended up orphaned.
--
-- Five INSERT sites, all of them in 20270586's two functions and
-- still wrong in their later re-emits (20270609 + 20270611):
--
--   ent_accept_aircraft_order, stock path     (20270611 line 350)
--   process_ent_production_runs, completion + buyer-broke fallback
--                                             (20270586 lines 314, 328)
--   process_ent_production_runs, progressive  (20270586 lines 357, 371)
--
-- In every case the variable is already in scope —
-- v_order.aircraft_design_id for the order path and r.design_id
-- for the production-run path — the column name just wasn't on
-- the INSERT.
--
-- The off-the-shelf class-only buy (entrepreneur_buy_aircraft,
-- 20270442) and the founding starter seed (20270440) legitimately
-- leave ent_design_id NULL — those flows don't take a design
-- parameter. They're untouched here.
--
-- Backfill: for every orphan corp_aircraft row, walk the union of
-- completed ent_aircraft_orders (status='completed') and completed
-- ent_production_runs (delivery_to_corp_id IS NOT NULL) for that
-- buyer + airframe_class. If exactly ONE design appears across all
-- evidence for the pair, pin the orphan to it. Rows with multiple
-- candidate designs stay NULL — we can't tell which was which
-- without timing data, and the forward fix means new aircraft are
-- correct from the next delivery onward.
--
-- Apply after 20270638.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. ent_accept_aircraft_order — same body as 20270611, with the
--       stock-path corp_aircraft INSERT now naming ent_design_id ────
CREATE OR REPLACE FUNCTION public.ent_accept_aircraft_order(
    p_order_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_order        ent_aircraft_orders%ROWTYPE;
    v_buyer        entrepreneur_corps%ROWTYPE;
    v_design       ent_aircraft_designs%ROWTYPE;
    v_plant        corp_buildings%ROWTYPE;
    v_compat       text[];
    v_tpu          int;
    v_per_unit     bigint;
    v_total        bigint;
    v_eng_count    int := 0;
    v_eng_need     int := 0;
    v_eng_check    jsonb;
    v_total_ticks  int;
    v_cost_tick    bigint;
    v_tick         int;
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

    PERFORM 1 FROM entrepreneur_corps WHERE id = v_order.seller_corp_id FOR UPDATE;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_order.fulfilment_mode = 'stock' THEN
        UPDATE ent_aircraft_designs
           SET inventory_on_hand = inventory_on_hand - v_order.quantity
         WHERE id = v_order.aircraft_design_id
           AND inventory_on_hand >= v_order.quantity;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_inventory',
                'need', v_order.quantity, 'have', COALESCE(v_design.inventory_on_hand, 0));
        END IF;

        -- 20270639: ent_design_id now populated. The design FK is
        -- what carries name/range/thrust/etc. for the per-plane row.
        INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick, ent_design_id)
        SELECT v_order.buyer_corp_id, v_design.airframe_class, 100, v_tick, v_order.aircraft_design_id
          FROM generate_series(1, v_order.quantity);

        UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) - v_total, updated_at = now()
         WHERE id = v_order.buyer_corp_id;
        UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) + v_total, updated_at = now()
         WHERE id = v_order.seller_corp_id;

    ELSIF v_order.fulfilment_mode = 'build_to_order' THEN
        v_compat := CASE v_design.airframe_class
            WHEN 'regional'   THEN ARRAY['light_assembly_plant', 'aircraft_assembly_facility']
            WHEN 'narrowbody' THEN ARRAY['aircraft_assembly_facility']
            WHEN 'widebody'   THEN ARRAY['heavy_manufacturing_plant']
            ELSE ARRAY[]::text[]
        END;
        v_tpu := CASE v_design.airframe_class
                     WHEN 'regional' THEN 2 WHEN 'narrowbody' THEN 3
                     WHEN 'widebody' THEN 4 ELSE 2 END;

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

        v_per_unit  := GREATEST(0, COALESCE(v_design.cost_per_unit, 0));
        v_eng_count := COALESCE(v_design.engine_count, 0);
        v_eng_check := public._aircraft_engine_requirement(
            v_order.seller_corp_id, v_design.engine_design_id, v_eng_count, v_order.quantity);
        IF NOT (v_eng_check ->> 'ok')::boolean THEN
            IF (v_eng_check ->> 'reason') = 'engine_missing' THEN
                RETURN jsonb_build_object('success', false, 'reason', 'engine_design_missing');
            ELSE
                RETURN jsonb_build_object('success', false, 'reason', 'seller_insufficient_engines',
                    'engine', v_eng_check ->> 'engine_name',
                    'need',   (v_eng_check ->> 'need')::int,
                    'have',   (v_eng_check ->> 'have')::int);
            END IF;
        END IF;
        v_eng_need := (v_eng_check ->> 'eng_need')::int;

        IF NOT public._draw_engines_from_inventory(
                v_order.seller_corp_id, v_design.engine_design_id, v_eng_need) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'seller_insufficient_engines',
                'engine', v_eng_check ->> 'engine_name');
        END IF;

        v_per_unit := GREATEST(0, v_per_unit
            - (v_eng_check ->> 'per_unit_discount')::bigint);

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

-- ── 2. process_ent_production_runs — same body as 20270586, with
--       all four BTO corp_aircraft INSERTs now naming ent_design_id ──
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
                    IF r.delivery_price_per_unit IS NULL THEN
                        -- 20270639: r.design_id is the canonical FK here.
                        INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick, ent_design_id)
                        SELECT r.delivery_to_corp_id, v_dclass, 100, v_tick, r.design_id
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
                            -- 20270639: same fix on the paid-delivery branch.
                            INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick, ent_design_id)
                            SELECT r.delivery_to_corp_id, v_dclass, 100, v_tick, r.design_id
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
                        -- 20270639: progressive-delivery legacy branch.
                        INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick, ent_design_id)
                        SELECT r.delivery_to_corp_id, v_dclass, 100, v_tick, r.design_id
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
                            -- 20270639: progressive-delivery paid branch.
                            INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick, ent_design_id)
                            SELECT r.delivery_to_corp_id, v_dclass, 100, v_tick, r.design_id
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

-- ── 3. Backfill orphan corp_aircraft rows ────────────────────────
-- For every (buyer corp, airframe_class) pair, gather candidate
-- designs from BOTH completed orders and BTO production runs that
-- delivered to that buyer. If the pair yields exactly one distinct
-- design, every orphan in that pair gets pinned to it. Pairs with
-- multiple candidates stay NULL — the unambiguous case covers the
-- common scenario (corp standardised on one design per class)
-- without guessing in the multi-design case.
WITH evidence AS (
    SELECT o.buyer_corp_id      AS corp_id,
           d.airframe_class     AS klass,
           o.aircraft_design_id AS design_id
      FROM ent_aircraft_orders o
      JOIN ent_aircraft_designs d ON d.id = o.aircraft_design_id
     WHERE o.status = 'completed'
       AND o.buyer_corp_id  IS NOT NULL
       AND d.airframe_class IS NOT NULL
    UNION
    SELECT r.delivery_to_corp_id AS corp_id,
           d.airframe_class      AS klass,
           r.design_id           AS design_id
      FROM ent_production_runs r
      JOIN ent_aircraft_designs d ON d.id = r.design_id
     WHERE r.delivery_to_corp_id IS NOT NULL
       AND d.airframe_class      IS NOT NULL
),
unique_design AS (
    -- PG has no MIN(uuid); the HAVING guarantees exactly one
    -- distinct design per group, so array_agg + [1] picks that
    -- single value cleanly.
    SELECT corp_id, klass, (array_agg(DISTINCT design_id))[1] AS design_id
      FROM evidence
     GROUP BY corp_id, klass
    HAVING COUNT(DISTINCT design_id) = 1
)
UPDATE corp_aircraft ca
   SET ent_design_id = u.design_id
  FROM unique_design u
 WHERE ca.ent_design_id IS NULL
   AND ca.entrepreneur_corp_id = u.corp_id
   AND ca.aircraft_class       = u.klass;

NOTIFY pgrst, 'reload schema';

COMMIT;
