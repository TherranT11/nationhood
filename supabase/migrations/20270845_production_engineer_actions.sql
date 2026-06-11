-- ════════════════════════════════════════════════════════════════════
-- 20270845 — The Production Engineer's kit (Manufacturing rung 1)
--
-- The first employee-side actions: a hired Production Engineer
-- (manufacturing track, rung 1 — verified on the live hire row)
-- picks one each tick, priming the employer's NEXT Production Run:
--
--   · optimize_line   — +10% output (round up, min +1; the bonus
--                       cars land at completion, free of ticks,
--                       dollars, and Aluminum)
--   · lean_procurement — −10% off the run's dollar cost
--   · tune_tooling     — −10% Aluminum, rounded to the half-unit
--
-- Max 1 pending charge of each type PER ASSEMBLY LINE (the plant's
-- assembly_lines cap); one charge of each falls off when the next
-- Production Run starts. factions.biz_action_tick is the employee's
-- one-action-per-tick allowance — the worker's exec_action_tick.
--
-- start_production_run re-emitted from 20270843 (buffs applied
-- before the treasury/Aluminum gates, then consumed);
-- advance_vehicle_production re-emitted from 20270834 (bonus cars on
-- the completion transition — no edge-function redeploy needed,
-- same name and signature).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS prod_buff_output   int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS prod_buff_cost     int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS prod_buff_aluminum int NOT NULL DEFAULT 0;

ALTER TABLE public.vehicle_production_runs
    ADD COLUMN IF NOT EXISTS bonus_units int NOT NULL DEFAULT 0;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS biz_action_tick int;

COMMENT ON COLUMN public.factions.biz_action_tick IS
    'The employed businessman''s one-action-per-tick allowance (20270845) — the worker''s mirror of entrepreneur_corps.exec_action_tick.';

-- ── production_engineer_action ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.production_engineer_action(p_action text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_corp  entrepreneur_corps%ROWTYPE;
    v_tick  int;
    v_cap   int;
    v_have  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_action NOT IN ('optimize_line', 'lean_procurement', 'tune_tooling') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_businessman');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;
    IF v_fac.biz_employer_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_employed');
    END IF;

    -- The kit belongs to the rung-1 Production Engineer — verified
    -- on the live hire row, the same record everything else reads.
    IF NOT EXISTS (
        SELECT 1 FROM job_applicants a
          JOIN job_openings o ON o.id = a.opening_id
         WHERE a.applicant_faction_id = v_fac.id
           AND a.status = 'hired'
           AND o.corp_id = v_fac.biz_employer_corp_id
           AND o.track = 'manufacturing'
           AND o.rung = 1
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_production_engineer');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = v_fac.biz_employer_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

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
    UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;

    RETURN jsonb_build_object('success', true,
        'action', p_action, 'pending', v_have + 1, 'cap', v_cap);
END $$;

REVOKE EXECUTE ON FUNCTION public.production_engineer_action(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.production_engineer_action(text) TO authenticated;

-- ── start_production_run — buffs ride the next run ────────────────
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
    v_bonus int := 0;
    v_id    uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_blueprint_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    -- 1 vehicle per tick: the amount IS the ticks the line is
    -- assigned. 60 (five game-years) bounds runaway assignments.
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 60 THEN
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

    -- Aluminum (20270843) is assigned when the run starts: 0.5 per
    -- motorcycle, 1 per car — the whole order's worth must be in the
    -- depot up front.
    v_aluminum := vehicle_aluminum_per_unit(v_bp.vehicle_type) * p_quantity;

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

    INSERT INTO vehicle_production_runs (
        corp_id, blueprint_id, quantity, unit_cost, total_cost,
        started_tick, completes_at_tick, bonus_units
    ) VALUES (
        p_corp_id, p_blueprint_id, p_quantity, v_unit, v_total,
        v_tick, v_tick + p_quantity, v_bonus
    ) RETURNING id INTO v_id;

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_total,
           aluminum_stock = COALESCE(aluminum_stock, 0) - v_aluminum,
           prod_buff_cost     = GREATEST(0, COALESCE(prod_buff_cost, 0) - 1),
           prod_buff_aluminum = GREATEST(0, COALESCE(prod_buff_aluminum, 0) - 1),
           prod_buff_output   = GREATEST(0, COALESCE(prod_buff_output, 0) - 1),
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'run_id', v_id,
        'quantity', p_quantity, 'unit_cost', v_unit, 'total_cost', v_total,
        'bonus_units', v_bonus,
        'completes_at_tick', v_tick + p_quantity);
END $$;

REVOKE EXECUTE ON FUNCTION public.start_production_run(uuid, uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.start_production_run(uuid, uuid, int) TO authenticated;

-- ── advance_vehicle_production — bonus cars at completion ─────────
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

    -- 1 vehicle per line per tick; idempotent — produced derives from
    -- elapsed ticks, so a re-run of the same tick adds nothing.
    FOR r IN SELECT * FROM vehicle_production_runs
              WHERE status = 'running'
              ORDER BY created_at
              FOR UPDATE
    LOOP
        v_done  := LEAST(r.quantity, GREATEST(0, p_tick - r.started_tick));
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
