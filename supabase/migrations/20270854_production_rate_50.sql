-- ════════════════════════════════════════════════════════════════════
-- 20270854 — Production rebalance: 50 vehicles per tick, bigger depot
--
-- One car a tick was crawling. The assembly line's baseline rate
-- becomes 50 vehicles per tick (vehicle_production_rate — the ONE
-- home of the number; Superior/Automated line efficiencies will
-- multiply it someday), with the depot's materials as the real
-- limiter. The Part Depot caps rise to match: 50 each of Aluminum
-- and Electrical Components at Level I, 80 at II, 150 at III
-- (design ruling; IV/V extrapolated to 250/400 — flag to retune).
-- Order bound rises 60 → 200.
--
-- start_production_run re-emitted from 20270852 (duration =
-- ceil(quantity ÷ rate)); advance_vehicle_production re-emitted from
-- 20270845 (output = elapsed × rate, bonus cars at completion
-- unchanged); parts_depot_cap re-emitted with the new ladder.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.vehicle_production_rate()
RETURNS int LANGUAGE sql IMMUTABLE
AS $$ SELECT 50; $$;
COMMENT ON FUNCTION public.vehicle_production_rate() IS
    'Vehicles produced per assembly line per tick (20270854 baseline 50). The ONLY home of the rate — start_production_run and advance_vehicle_production read it; the client mirrors it for display.';

CREATE OR REPLACE FUNCTION public.parts_depot_cap(p_tier int)
RETURNS int LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE
        WHEN p_tier >= 5 THEN 400
        WHEN p_tier = 4 THEN 250
        WHEN p_tier = 3 THEN 150
        WHEN p_tier = 2 THEN 80
        ELSE 50
    END;
$$;
COMMENT ON FUNCTION public.parts_depot_cap(int) IS
    'Supply Chain & Part Depot: storage by level for EACH material pool — Aluminum and Electrical Components alike (20270854: 50/80/150/250/400; IV/V extrapolated). The ONE place the caps live.';

-- ── start_production_run — rate-based duration ────────────────────
CREATE OR REPLACE FUNCTION public.start_production_run(
    p_corp_id      uuid,
    p_blueprint_id uuid,
    p_quantity     int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_corp  entrepreneur_corps%ROWTYPE;
    v_bp    vehicle_blueprints%ROWTYPE;
    v_tick  int;
    v_unit  bigint;
    v_total bigint;
    v_aluminum numeric;
    v_components int;
    v_bonus int := 0;
    v_id    uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_blueprint_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    -- 50 vehicles per tick per line (vehicle_production_rate,
    -- 20270854): the line is assigned ceil(quantity ÷ rate) ticks.
    -- 200 bounds runaway assignments; the depot's materials are the
    -- real limiter.
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 200 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;

    -- Lock the corp row: the allowance, the line check, and the
    -- treasury debit below must serialize against concurrent runs.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'automotive' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT * INTO v_bp FROM vehicle_blueprints
     WHERE id = p_blueprint_id AND corp_id = p_corp_id;
    IF v_bp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
    END IF;

    -- Assembly lines by plant level (20270842): 1/2/2/3/4 concurrent
    -- runs. (The Level III+ Superior / Automated line efficiencies
    -- await their production model.)
    IF (SELECT COUNT(*) FROM vehicle_production_runs
         WHERE corp_id = p_corp_id AND status = 'running')
       >= assembly_lines(COALESCE(v_corp.assembly_tier, 1)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_line_available');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_unit  := GREATEST(1, COALESCE(v_bp.xp_cost, 1)) * 5000;
    v_total := v_unit * p_quantity;
    IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_total, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    -- Materials are assigned when the run starts — the whole order's
    -- worth must be in the depot up front. Aluminum: 0.5/motorcycle,
    -- 2/pickup, 1 otherwise (20270851). Electrical Components ride
    -- the design: hybrid 1 / basic EV 2 / performance EV 3, +1 each
    -- for the Technology and Self-Driving packages.
    v_aluminum := vehicle_aluminum_per_unit(v_bp.vehicle_type) * p_quantity;
    v_components := vehicle_components_per_unit(v_bp.engine, v_bp.packages) * p_quantity;

    -- Production Engineer buffs (20270845): one pending charge of
    -- each type rides this run, then falls off. Cost −10%, Aluminum
    -- −10% (rounded to the half-unit), output +10% (round up, min
    -- +1 — the bonus cars land at completion, costing no extra
    -- ticks, dollars, or Aluminum).
    IF COALESCE(v_corp.prod_buff_cost, 0) > 0 THEN
        v_total := ROUND(v_total * 0.90);
    END IF;
    IF COALESCE(v_corp.prod_buff_aluminum, 0) > 0 THEN
        v_aluminum := ROUND(v_aluminum * 0.90 * 2) / 2.0;
    END IF;
    IF COALESCE(v_corp.prod_buff_output, 0) > 0 THEN
        v_bonus := GREATEST(1, CEIL(p_quantity * 0.10))::int;
    END IF;

    IF COALESCE(v_corp.aluminum_stock, 0) < v_aluminum THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_aluminum',
            'need', v_aluminum, 'have', COALESCE(v_corp.aluminum_stock, 0));
    END IF;
    IF COALESCE(v_corp.components_stock, 0) < v_components THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_components',
            'need', v_components, 'have', COALESCE(v_corp.components_stock, 0));
    END IF;

    INSERT INTO vehicle_production_runs (
        corp_id, blueprint_id, quantity, unit_cost, total_cost,
        started_tick, completes_at_tick, bonus_units
    ) VALUES (
        p_corp_id, p_blueprint_id, p_quantity, v_unit, v_total,
        v_tick, v_tick + CEIL(p_quantity::numeric / vehicle_production_rate())::int, v_bonus
    ) RETURNING id INTO v_id;

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_total,
           aluminum_stock = COALESCE(aluminum_stock, 0) - v_aluminum,
           components_stock = COALESCE(components_stock, 0) - v_components,
           prod_buff_cost     = GREATEST(0, COALESCE(prod_buff_cost, 0) - 1),
           prod_buff_aluminum = GREATEST(0, COALESCE(prod_buff_aluminum, 0) - 1),
           prod_buff_output   = GREATEST(0, COALESCE(prod_buff_output, 0) - 1),
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Started a production run — %s × %s ($%s).', p_quantity, v_bp.name, v_total));
    RETURN jsonb_build_object('success', true, 'run_id', v_id,
        'quantity', p_quantity, 'unit_cost', v_unit, 'total_cost', v_total,
        'bonus_units', v_bonus,
        'completes_at_tick', v_tick + CEIL(p_quantity::numeric / vehicle_production_rate())::int);
END $$;

REVOKE EXECUTE ON FUNCTION public.start_production_run(uuid, uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.start_production_run(uuid, uuid, int) TO authenticated;

-- ── advance_vehicle_production — rate-based output ────────────────
CREATE OR REPLACE FUNCTION public.advance_vehicle_production(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    r          RECORD;
    v_done     int;
    v_delta    int;
    v_produced int := 0;
    v_finished int := 0;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- vehicle_production_rate (50) vehicles per line per tick;
    -- idempotent — produced derives from elapsed ticks, so a re-run
    -- of the same tick adds nothing.
    FOR r IN SELECT * FROM vehicle_production_runs
              WHERE status = 'running'
              ORDER BY created_at
              FOR UPDATE
    LOOP
        v_done  := LEAST(r.quantity,
                         GREATEST(0, p_tick - r.started_tick) * vehicle_production_rate());
        v_delta := v_done - r.produced;
        -- The Production Engineer's bonus cars (20270845) land on
        -- the completion transition — the loop only sees 'running'
        -- rows, so it fires exactly once per run.
        IF v_done >= r.quantity THEN
            v_delta := v_delta + COALESCE(r.bonus_units, 0);
        END IF;
        IF v_delta > 0 THEN
            UPDATE vehicle_blueprints
               SET units_in_stock = units_in_stock + v_delta
             WHERE id = r.blueprint_id;
            v_produced := v_produced + v_delta;
        END IF;
        UPDATE vehicle_production_runs
           SET produced = v_done,
               status   = CASE WHEN v_done >= r.quantity THEN 'complete' ELSE 'running' END
         WHERE id = r.id;
        IF v_done >= r.quantity THEN
            v_finished := v_finished + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true,
        'vehicles_produced', v_produced, 'runs_completed', v_finished);
END $$;

REVOKE EXECUTE ON FUNCTION public.advance_vehicle_production(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.advance_vehicle_production(int) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
