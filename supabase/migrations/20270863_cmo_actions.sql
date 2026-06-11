-- ════════════════════════════════════════════════════════════════════
-- 20270863 — The CMO's desk: Run the Line + Second Shift
--
-- Manufacturing rung 6 gets its kit, mirroring the CCO's (20270850):
--
-- · cmo_start_production_run — RUN THE LINE: the chief starts a full
--   Production Run on their own authority, spending the employee
--   allowance (biz_action_tick) instead of the owner's executive
--   action. One source: start_production_run's body moves into the
--   internal _start_production_run core (re-emitted from 20270854 +
--   the Second Shift rider); the owner wrapper and the CMO wrapper
--   both call it, each spending its own allowance only on success —
--   the _resolve_sales_campaign pattern.
--
-- · cmo_action('second_shift') — SECOND SHIFT: a pending charge
--   (entrepreneur_corps.prod_buff_overtime, cap 1) that rides the
--   next Production Run: +25% output (bonus units at completion,
--   stacking with the engineer's +10%) for +25% cost, applied after
--   the engineer's discounts. Charged through _apply_kit_charge
--   (re-emitted from 20270858) like every other kit effect. Not a
--   directive: direct_employee's manufacturing action list is
--   unchanged, so NPCs can't be ordered onto overtime.
--
-- · _manufacturing_chief_check — the eligibility helper, the
--   _commercial_chief_check shape on the manufacturing track.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS prod_buff_overtime int NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.entrepreneur_corps.prod_buff_overtime IS
    'Pending Second Shift charge (20270863, cap 1) — the next Production Run builds +25% for +25% cost, then it falls off.';

-- ── _manufacturing_chief_check ────────────────────────────────────
CREATE OR REPLACE FUNCTION public._manufacturing_chief_check(p_uid uuid)
RETURNS factions
LANGUAGE plpgsql
AS $$
DECLARE
    v_fac factions%ROWTYPE;
BEGIN
    SELECT * INTO v_fac FROM factions
     WHERE (id = p_uid OR linked_user_id = p_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL OR v_fac.biz_employer_corp_id IS NULL
       OR lower(COALESCE(v_fac.status, '')) = 'arrested'
       OR NOT EXISTS (
            SELECT 1 FROM job_applicants a
              JOIN job_openings o ON o.id = a.opening_id
             WHERE a.applicant_faction_id = v_fac.id
               AND a.status = 'hired'
               AND o.corp_id = v_fac.biz_employer_corp_id
               AND o.track = 'manufacturing'
               AND o.rung = 6
       ) THEN
        RETURN NULL;
    END IF;
    RETURN v_fac;
END $$;

REVOKE EXECUTE ON FUNCTION public._manufacturing_chief_check(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._apply_kit_charge(p_corp_id uuid, p_action text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_corp entrepreneur_corps%ROWTYPE;
    v_cap  int;
    v_have int;
BEGIN
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    IF p_action IN ('optimize_line', 'lean_procurement', 'tune_tooling') THEN
        -- Max 1 pending charge of each type per assembly line.
        v_cap := assembly_lines(COALESCE(v_corp.assembly_tier, 1));
        v_have := COALESCE(CASE p_action
            WHEN 'optimize_line'    THEN v_corp.prod_buff_output
            WHEN 'lean_procurement' THEN v_corp.prod_buff_cost
            WHEN 'tune_tooling'     THEN v_corp.prod_buff_aluminum
        END, 0);
        IF v_have >= v_cap THEN
            RETURN jsonb_build_object('success', false, 'reason', 'line_already_tuned',
                'pending', v_have, 'cap', v_cap);
        END IF;
        UPDATE entrepreneur_corps SET
            prod_buff_output   = prod_buff_output   + CASE WHEN p_action = 'optimize_line'    THEN 1 ELSE 0 END,
            prod_buff_cost     = prod_buff_cost     + CASE WHEN p_action = 'lean_procurement' THEN 1 ELSE 0 END,
            prod_buff_aluminum = prod_buff_aluminum + CASE WHEN p_action = 'tune_tooling'     THEN 1 ELSE 0 END
         WHERE id = v_corp.id;
        RETURN jsonb_build_object('success', true,
            'action', p_action, 'pending', v_have + 1, 'cap', v_cap);

    ELSIF p_action IN ('drum_up_buyers', 'sharpen_pitch', 'sweeten_financing') THEN
        -- Max 1 pending charge of each type — campaigns run once a tick.
        v_have := COALESCE(CASE p_action
            WHEN 'drum_up_buyers'    THEN v_corp.sales_buff_units
            WHEN 'sharpen_pitch'     THEN v_corp.sales_buff_appeal
            WHEN 'sweeten_financing' THEN v_corp.sales_buff_price
        END, 0);
        IF v_have >= 1 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'campaign_already_primed');
        END IF;
        UPDATE entrepreneur_corps SET
            sales_buff_units  = sales_buff_units  + CASE WHEN p_action = 'drum_up_buyers'    THEN 1 ELSE 0 END,
            sales_buff_appeal = sales_buff_appeal + CASE WHEN p_action = 'sharpen_pitch'     THEN 1 ELSE 0 END,
            sales_buff_price  = sales_buff_price  + CASE WHEN p_action = 'sweeten_financing' THEN 1 ELSE 0 END
         WHERE id = v_corp.id;
        RETURN jsonb_build_object('success', true, 'action', p_action, 'pending', 1, 'cap', 1);

    ELSIF p_action = 'bench_test_components' THEN
        IF COALESCE(v_corp.design_buff_appeal, 0) >= 1 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'bench_already_charged');
        END IF;
        UPDATE entrepreneur_corps
           SET design_buff_appeal = COALESCE(design_buff_appeal, 0) + 1
         WHERE id = v_corp.id;
        RETURN jsonb_build_object('success', true, 'action', p_action, 'pending', 1, 'cap', 1);

    ELSIF p_action = 'second_shift' THEN
        -- The CMO's overtime rider (20270863) — one pending charge;
        -- the next Production Run builds +25% for +25% cost.
        IF COALESCE(v_corp.prod_buff_overtime, 0) >= 1 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'shift_already_scheduled');
        END IF;
        UPDATE entrepreneur_corps
           SET prod_buff_overtime = COALESCE(prod_buff_overtime, 0) + 1
         WHERE id = v_corp.id;
        RETURN jsonb_build_object('success', true, 'action', p_action, 'pending', 1, 'cap', 1);

    ELSIF p_action = 'log_test_mileage' THEN
        IF COALESCE(v_corp.experience, 0)
           >= design_studio_cap(COALESCE(v_corp.design_studio_tier, 1)) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'experience_at_cap',
                'cap', design_studio_cap(COALESCE(v_corp.design_studio_tier, 1)));
        END IF;
        UPDATE entrepreneur_corps
           SET experience = LEAST(design_studio_cap(COALESCE(design_studio_tier, 1)),
                                  COALESCE(experience, 0) + 1)
         WHERE id = v_corp.id;
        RETURN jsonb_build_object('success', true, 'action', p_action, 'pending', 1, 'cap', 1);
    END IF;

    RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
END $$;

REVOKE EXECUTE ON FUNCTION public._apply_kit_charge(uuid, text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._start_production_run(
    p_corp_id      uuid,
    p_blueprint_id uuid,
    p_quantity     int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
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

    -- Second Shift (20270863, the CMO's rider): the plant runs
    -- overtime — +25% output for +25% cost, applied after the
    -- engineer's discounts; the bonus vehicles stack with the
    -- line-tuning +10% and land at completion the same way.
    IF COALESCE(v_corp.prod_buff_overtime, 0) > 0 THEN
        v_total := ROUND(v_total * 1.25);
        v_bonus := v_bonus + GREATEST(1, CEIL(p_quantity * 0.25))::int;
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
           prod_buff_overtime = GREATEST(0, COALESCE(prod_buff_overtime, 0) - 1)
     WHERE id = p_corp_id;

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Started a production run — %s × %s ($%s).', p_quantity, v_bp.name, v_total));
    RETURN jsonb_build_object('success', true, 'run_id', v_id,
        'quantity', p_quantity, 'unit_cost', v_unit, 'total_cost', v_total,
        'bonus_units', v_bonus,
        'completes_at_tick', v_tick + CEIL(p_quantity::numeric / vehicle_production_rate())::int);
END $$;

REVOKE EXECUTE ON FUNCTION public._start_production_run(uuid, uuid, int) FROM PUBLIC;

-- ── start_production_run — the owner wrapper ─────────────────────
CREATE OR REPLACE FUNCTION public.start_production_run(
    p_corp_id      uuid,
    p_blueprint_id uuid,
    p_quantity     int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tick int;
    v_res  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_res := _start_production_run(p_corp_id, p_blueprint_id, p_quantity);
    IF COALESCE((v_res->>'success')::boolean, false) THEN
        UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = p_corp_id;
    END IF;
    RETURN v_res;
END $$;

REVOKE EXECUTE ON FUNCTION public.start_production_run(uuid, uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.start_production_run(uuid, uuid, int) TO authenticated;

-- ── cmo_start_production_run — RUN THE LINE ───────────────────────
CREATE OR REPLACE FUNCTION public.cmo_start_production_run(
    p_blueprint_id uuid,
    p_quantity     int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_tick int;
    v_res  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    v_fac := _manufacturing_chief_check(v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_cmo');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_res := _start_production_run(v_fac.biz_employer_corp_id, p_blueprint_id, p_quantity);
    IF COALESCE((v_res->>'success')::boolean, false) THEN
        UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;
    END IF;
    RETURN v_res;
END $$;

REVOKE EXECUTE ON FUNCTION public.cmo_start_production_run(uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cmo_start_production_run(uuid, int) TO authenticated;

-- ── cmo_action — SECOND SHIFT (the kit-RPC shape) ─────────────────
CREATE OR REPLACE FUNCTION public.cmo_action(p_action text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_tick int;
    v_res  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_action NOT IN ('second_shift') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    v_fac := _manufacturing_chief_check(v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_cmo');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_res := _apply_kit_charge(v_fac.biz_employer_corp_id, p_action);
    IF NOT COALESCE((v_res->>'success')::boolean, false) THEN
        RETURN v_res;
    END IF;
    UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;
    RETURN v_res;
END $$;

REVOKE EXECUTE ON FUNCTION public.cmo_action(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cmo_action(text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
