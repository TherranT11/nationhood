-- ════════════════════════════════════════════════════════════════════
-- 20270609 — Extract engine inventory + cost helpers (ONE SOURCE)
--
-- Following the 20270608 fix (own-engine double-billing), an audit
-- flagged that the engine-handling pattern lives in two functions:
--
--   • ent_queue_production_run   (DIY runs, 20270608)
--   • ent_accept_aircraft_order  (build-to-order, BTO branch, 20270586)
--
-- Both do the same five steps:
--   1. Look up the engine design row by engine_design_id.
--   2. Verify the row exists + is design_type = 'engine'.
--   3. Verify the consuming corp's ent_engine_inventory >= engine_count
--      × quantity.
--   4. Subtract engine_cost_per_unit × engine_count from v_per_unit so
--      the build doesn't double-bill the engine that's coming from
--      inventory.
--   5. Eagerly draw engine_count × quantity from ent_engine_inventory
--      via a race-guarded conditional UPDATE.
--
-- The math at step 4 and the CAS at step 5 are the kind of duplication
-- the philosophy warns about: if either ever changes (bulk discount,
-- audit-log on draw, etc.) it has to change in both places or the two
-- paths drift. 20270608 made the fix in only ent_queue_production_run;
-- ent_accept_aircraft_order was already correct but the formulas were
-- inlined.
--
-- This migration extracts:
--
--   • _aircraft_engine_requirement(corp_id, engine_design_id,
--                                  engine_count, qty) RETURNS jsonb
--     STABLE. Looks up the engine, validates type, checks inventory.
--     Returns {ok: true, engine_id, engine_name, cost_per_unit,
--     eng_need} on success; {ok: false, reason, …} on failure. Caller
--     decides which public reason code to surface (insufficient_engines
--     vs seller_insufficient_engines) so the existing client error
--     handlers don't have to move.
--
--   • _draw_engines_from_inventory(corp_id, engine_design_id, qty)
--     RETURNS boolean. Race-guarded conditional UPDATE; TRUE if the
--     draw succeeded, FALSE if a concurrent caller drained the row
--     between the check and the consume.
--
-- Then re-issues both ent_queue_production_run and
-- ent_accept_aircraft_order to call the helpers. Bodies are otherwise
-- byte-identical to their 20270608 / 20270586 versions — same
-- public surface, same response shapes, same per-tick stamps, same
-- locking discipline. Only the inline engine block compresses.
--
-- Apply after 20270608.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. _aircraft_engine_requirement — check (no mutation) ─────────
-- Encapsulates the lookup + type-check + inventory-check pattern.
-- STABLE — read-only. Returns enough to let the caller compute the
-- v_per_unit discount AND to surface a contextual failure reason.
CREATE OR REPLACE FUNCTION public._aircraft_engine_requirement(
    p_corp_id          uuid,
    p_engine_design_id uuid,
    p_engine_count     int,
    p_qty              int
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_engine   ent_aircraft_designs%ROWTYPE;
    v_eng_need int;
    v_eng_have int;
BEGIN
    -- Aircraft with no engine_design_id (legacy or partial designs)
    -- have no inventory requirement and no cost discount. Treat as a
    -- no-op success so callers don't have to gate the helper call.
    IF p_engine_design_id IS NULL THEN
        RETURN jsonb_build_object(
            'ok',            true,
            'engine_id',     NULL,
            'engine_name',   NULL,
            'cost_per_unit', 0::bigint,
            'eng_need',      0
        );
    END IF;

    SELECT * INTO v_engine FROM ent_aircraft_designs WHERE id = p_engine_design_id;
    IF v_engine.id IS NULL OR v_engine.design_type <> 'engine' THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'engine_missing');
    END IF;

    v_eng_need := COALESCE(p_engine_count, 0) * COALESCE(p_qty, 0);

    SELECT COALESCE(quantity, 0) INTO v_eng_have
      FROM ent_engine_inventory
     WHERE entrepreneur_corp_id = p_corp_id
       AND engine_design_id     = p_engine_design_id;

    IF COALESCE(v_eng_have, 0) < v_eng_need THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'inventory_short',
            'engine_name', v_engine.name,
            'need', v_eng_need,
            'have', COALESCE(v_eng_have, 0));
    END IF;

    RETURN jsonb_build_object(
        'ok',            true,
        'engine_id',     v_engine.id,
        'engine_name',   v_engine.name,
        'cost_per_unit', COALESCE(v_engine.cost_per_unit, 0)::bigint,
        'eng_need',      v_eng_need
    );
END;
$$;

COMMENT ON FUNCTION public._aircraft_engine_requirement(uuid, uuid, int, int) IS
    'Single source of truth for the aircraft-production engine check. Returns {ok, engine_id, engine_name, cost_per_unit, eng_need} on success; {ok: false, reason: ''engine_missing'' | ''inventory_short'', …} on failure. STABLE — read-only. Callers (ent_queue_production_run for DIY runs, ent_accept_aircraft_order for BTO) translate the internal reason to the public-API code their client UI expects (insufficient_engines vs seller_insufficient_engines).';

REVOKE EXECUTE ON FUNCTION public._aircraft_engine_requirement(uuid, uuid, int, int) FROM PUBLIC;

-- ── 2. _draw_engines_from_inventory — race-guarded CAS draw ───────
CREATE OR REPLACE FUNCTION public._draw_engines_from_inventory(
    p_corp_id          uuid,
    p_engine_design_id uuid,
    p_qty              int
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Null-engine or zero-qty: nothing to draw, success.
    IF p_engine_design_id IS NULL OR COALESCE(p_qty, 0) <= 0 THEN
        RETURN TRUE;
    END IF;
    UPDATE ent_engine_inventory
       SET quantity = quantity - p_qty
     WHERE entrepreneur_corp_id = p_corp_id
       AND engine_design_id     = p_engine_design_id
       AND quantity             >= p_qty;
    RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public._draw_engines_from_inventory(uuid, uuid, int) IS
    'Race-guarded conditional UPDATE that draws p_qty engines from a corp''s ent_engine_inventory row. Returns TRUE on success, FALSE if a concurrent caller drained the row between the caller''s _aircraft_engine_requirement check and this draw. Single source of truth for the engine CAS — paired with _aircraft_engine_requirement.';

REVOKE EXECUTE ON FUNCTION public._draw_engines_from_inventory(uuid, uuid, int) FROM PUBLIC;

-- ── 3. ent_queue_production_run — call the helpers ────────────────
-- Body is the 20270608 version with the inline engine block replaced
-- by helper calls. Same response shape, same reason codes
-- (insufficient_engines preserved), same per_unit_cost INSERT.
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
    v_plant        corp_buildings%ROWTYPE;
    v_compat       text[];
    v_tpu          int;
    v_per_unit     bigint;
    v_total_cost   bigint;
    v_total_ticks  int;
    v_cost_tick    bigint;
    v_eng_check    jsonb;
    v_eng_need     int := 0;
    v_eng_count    int := 0;
    v_tick         int;
    v_run_id       uuid;
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

    SELECT * INTO v_design FROM ent_aircraft_designs WHERE id = p_design_id;
    IF v_design.id IS NULL OR v_design.entrepreneur_corp_id <> p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_not_found');
    END IF;
    IF v_design.status <> 'available' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'design_not_available');
    END IF;

    IF v_design.design_type = 'engine' THEN
        v_compat := ARRAY['engine_assembly_plant'];
        v_tpu    := 1;
    ELSIF v_design.design_type = 'aircraft' THEN
        v_compat := CASE v_design.airframe_class
            WHEN 'business'   THEN ARRAY['light_assembly_plant']
            WHEN 'regional'   THEN ARRAY['light_assembly_plant', 'aircraft_assembly_facility']
            WHEN 'narrowbody' THEN ARRAY['aircraft_assembly_facility']
            WHEN 'widebody'   THEN ARRAY['heavy_manufacturing_plant']
            ELSE ARRAY[]::text[]
        END;
        v_tpu := CASE v_design.airframe_class
                     WHEN 'business' THEN 1 WHEN 'regional' THEN 2
                     WHEN 'narrowbody' THEN 3 WHEN 'widebody' THEN 4 ELSE 2 END;
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'design_type_invalid');
    END IF;

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
    IF EXISTS (SELECT 1 FROM ent_production_runs
                WHERE plant_building_id = p_plant_building_id AND status = 'active') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plant_busy');
    END IF;

    v_per_unit := GREATEST(0, COALESCE(v_design.cost_per_unit, 0));

    -- Aircraft branch: helper checks inventory + returns engine cost;
    -- v_per_unit drops the engine portion of cost_per_unit because
    -- engines come from inventory, not from this run's budget.
    IF v_design.design_type = 'aircraft' THEN
        v_eng_count := COALESCE(v_design.engine_count, 0);
        v_eng_check := public._aircraft_engine_requirement(
            p_corp_id, v_design.engine_design_id, v_eng_count, p_quantity);
        IF NOT (v_eng_check ->> 'ok')::boolean THEN
            IF (v_eng_check ->> 'reason') = 'engine_missing' THEN
                RETURN jsonb_build_object('success', false, 'reason', 'engine_design_missing');
            ELSE
                RETURN jsonb_build_object('success', false, 'reason', 'insufficient_engines',
                    'engine', v_eng_check ->> 'engine_name',
                    'need',   (v_eng_check ->> 'need')::int,
                    'have',   (v_eng_check ->> 'have')::int);
            END IF;
        END IF;
        v_eng_need := (v_eng_check ->> 'eng_need')::int;
        v_per_unit := GREATEST(0, v_per_unit
            - (v_eng_check ->> 'cost_per_unit')::bigint * v_eng_count);
    END IF;

    v_total_ticks := v_tpu * p_quantity;
    v_total_cost  := v_per_unit * p_quantity;
    v_cost_tick   := GREATEST(1, (v_total_cost / v_total_ticks))::bigint;

    IF COALESCE(v_corp.treasury_cash, 0) < v_cost_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_cash',
            'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint, 'need', v_cost_tick);
    END IF;

    -- Race-guarded draw. The pre-check above passed but a concurrent
    -- queue/accept may have drained the row between then and now.
    IF NOT public._draw_engines_from_inventory(
            p_corp_id, v_design.engine_design_id, v_eng_need) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_engines',
            'engine', v_eng_check ->> 'engine_name');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO ent_production_runs (
        entrepreneur_corp_id, design_id, plant_building_id, quantity,
        cost_per_tick, ticks_per_unit, total_ticks, per_unit_cost,
        status, last_processed_tick
    ) VALUES (
        p_corp_id, p_design_id, p_plant_building_id, p_quantity,
        v_cost_tick, v_tpu, v_total_ticks, v_per_unit,
        'active', v_tick
    ) RETURNING id INTO v_run_id;

    RETURN jsonb_build_object('success', true, 'run_id', v_run_id,
        'quantity', p_quantity, 'per_unit_cost', v_per_unit,
        'total_cost', v_total_cost, 'cost_per_tick', v_cost_tick,
        'total_ticks', v_total_ticks, 'engines_consumed', v_eng_need);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ent_queue_production_run(uuid, uuid, uuid, int) TO authenticated;

-- ── 4. ent_accept_aircraft_order — call the helpers in BTO branch ─
-- Body is the 20270586 version with the inline engine block in the
-- build_to_order branch replaced by helper calls. Same response
-- shape, same reason codes (seller_insufficient_engines preserved
-- for the client error handler at entrepreneur-corp.html:2216).
-- STOCK branch and surrounding cash gate unchanged.
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

        INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
        SELECT v_order.buyer_corp_id, v_design.airframe_class, 100, v_tick
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

        -- Engine requirement via the shared helper. Seller's inventory
        -- funds the build; v_per_unit drops the engine portion of
        -- cost_per_unit. Engines are consumed at accept (commitment);
        -- they stay consumed even if per-unit settlement later fails.
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
            - (v_eng_check ->> 'cost_per_unit')::bigint * v_eng_count);

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

NOTIFY pgrst, 'reload schema';

COMMIT;
