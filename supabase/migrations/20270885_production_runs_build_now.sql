-- ════════════════════════════════════════════════════════════════════
-- 20270885 — Production runs BUILD the cars, that turn
--
-- User spec: 'Production Run needs to actually PRODUCE cars that
-- month on all the lines that are currently assigned or newly
-- assigned… the confirm button should say "Assign and Build" and
-- all lines with a vehicle assigned build automatically FOR THAT
-- TURN.' The old model assigned a quantity-target run that the
-- corp-tick sweep filled at 50/tick — cars arrived a tick later
-- and the action never visibly built anything.
--
-- New model:
--   • A 'running' vehicle_production_runs row is a LINE ASSIGNMENT —
--     persistent, no quantity target, no completion date. `produced`
--     accumulates lifetime output for the line.
--   • _production_run_build(corp, blueprint?) optionally assigns a
--     free line to the blueprint, then EVERY assigned line builds
--     vehicle_production_rate() (50) vehicles IMMEDIATELY: per-line
--     cash + Aluminum + Components are charged for this turn only,
--     units land in vehicle_blueprints.units_in_stock on the spot,
--     and the return carries a per-line breakdown for the modal.
--     Lines the treasury/depot can't fund are SKIPPED with a reason
--     (in assignment order — Line 1 first). All-skipped returns
--     nothing_built and the wrapper doesn't burn the allowance.
--   • Engineer/CMO buffs (cost −10% / Aluminum −10% / output +10% /
--     Second Shift +25% out +25% cost) now ride ONE BUILD TURN
--     fleet-wide — one charge each consumed per fire, bonus units
--     still free of cash and materials.
--   • In-flight prepaid runs convert at apply: their remaining cars
--     (+ banked bonus units) land in inventory immediately — they
--     were paid for up front — and the row stays as the line's
--     assignment going forward.
--   • advance_vehicle_production(p_tick) becomes a no-op (the corp
--     tick edge function still calls it; production is now
--     action-driven).
--   • unassign_production_line(corp, run) frees a line (owner-only,
--     no allowance burn).
--
-- Signature changes (old callers must fail loud):
--   DROP _start_production_run(uuid, uuid, int)
--      → _production_run_build(uuid, uuid)            [internal]
--   DROP start_production_run(uuid, uuid, int)
--      → start_production_run(uuid, uuid)             [CEO desk]
--   DROP cmo_start_production_run(uuid, int)
--      → cmo_start_production_run(uuid)               [CMO kit]
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Convert in-flight prepaid runs ─────────────────────────────
DO $do$
DECLARE
    r RECORD;
    v_owed int;
BEGIN
    FOR r IN SELECT * FROM vehicle_production_runs WHERE status = 'running' FOR UPDATE
    LOOP
        v_owed := GREATEST(0, r.quantity - r.produced) + COALESCE(r.bonus_units, 0);
        IF v_owed > 0 THEN
            UPDATE vehicle_blueprints
               SET units_in_stock = units_in_stock + v_owed
             WHERE id = r.blueprint_id;
        END IF;
        UPDATE vehicle_production_runs
           SET produced    = r.produced + v_owed,
               bonus_units = 0
         WHERE id = r.id;
        RAISE NOTICE '20270885: delivered % prepaid vehicle(s) on run %', v_owed, r.id;
    END LOOP;
END $do$;

-- ── 2. The build core ─────────────────────────────────────────────
DROP FUNCTION IF EXISTS public._start_production_run(uuid, uuid, int);

CREATE OR REPLACE FUNCTION public._production_run_build(
    p_corp_id      uuid,
    p_blueprint_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_corp   entrepreneur_corps%ROWTYPE;
    v_bp     vehicle_blueprints%ROWTYPE;
    v_tick   int;
    v_rate   int := vehicle_production_rate();
    v_run    RECORD;
    v_line   int := 0;
    v_lines  jsonb := '[]'::jsonb;
    -- buff multipliers, read once for the whole turn
    v_cost_mult numeric := 1;
    v_alum_mult numeric := 1;
    v_bonus_pct numeric := 0;
    -- per-line working values
    v_unit   bigint;
    v_cost   bigint;
    v_alum   numeric;
    v_comp   int;
    v_built  int;
    -- running balances
    v_cash   bigint;
    v_alum_left numeric;
    v_comp_left int;
    v_total_built int := 0;
    v_total_cost  bigint := 0;
    v_summary text := '';
BEGIN
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: assignment, funding and the debit below
    -- must serialize against concurrent builds.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'automotive' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Optional new assignment first — "currently assigned or NEWLY
    -- assigned" lines all build this turn.
    IF p_blueprint_id IS NOT NULL THEN
        SELECT * INTO v_bp FROM vehicle_blueprints
         WHERE id = p_blueprint_id AND corp_id = p_corp_id;
        IF v_bp.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
        END IF;
        IF (SELECT COUNT(*) FROM vehicle_production_runs
             WHERE corp_id = p_corp_id AND status = 'running')
           >= corp_assembly_lines(v_corp.assembly_tier, v_corp.bonus_assembly_lines) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_line_available');
        END IF;
        INSERT INTO vehicle_production_runs (
            corp_id, blueprint_id, quantity, unit_cost, total_cost,
            started_tick, completes_at_tick, bonus_units
        ) VALUES (
            -- quantity stores the per-turn rate; completes_at_tick is
            -- vestigial under the build-now model (kept NOT NULL for
            -- the legacy column shape).
            p_corp_id, p_blueprint_id, v_rate,
            GREATEST(1, COALESCE(v_bp.xp_cost, 1)) * 5000, 0,
            v_tick, v_tick, 0
        );
    END IF;

    -- Buff charges ride one build turn, fleet-wide, then fall off.
    IF COALESCE(v_corp.prod_buff_cost, 0)     > 0 THEN v_cost_mult := v_cost_mult * 0.90; END IF;
    IF COALESCE(v_corp.prod_buff_aluminum, 0) > 0 THEN v_alum_mult := 0.90; END IF;
    IF COALESCE(v_corp.prod_buff_output, 0)   > 0 THEN v_bonus_pct := v_bonus_pct + 0.10; END IF;
    IF COALESCE(v_corp.prod_buff_overtime, 0) > 0 THEN
        v_cost_mult := v_cost_mult * 1.25;
        v_bonus_pct := v_bonus_pct + 0.25;
    END IF;

    v_cash      := floor(COALESCE(v_corp.treasury_cash, 0))::bigint;
    v_alum_left := COALESCE(v_corp.aluminum_stock, 0);
    v_comp_left := COALESCE(v_corp.components_stock, 0);

    FOR v_run IN
        SELECT pr.*, bp.name AS bp_name, bp.vehicle_type, bp.engine, bp.packages, bp.xp_cost
          FROM vehicle_production_runs pr
          JOIN vehicle_blueprints bp ON bp.id = pr.blueprint_id
         WHERE pr.corp_id = p_corp_id AND pr.status = 'running'
         ORDER BY pr.created_at
         FOR UPDATE OF pr
    LOOP
        v_line := v_line + 1;
        v_unit := GREATEST(1, COALESCE(v_run.xp_cost, 1)) * 5000;
        v_cost := ROUND(v_unit * v_rate * v_cost_mult);
        v_alum := ROUND(vehicle_aluminum_per_unit(v_run.vehicle_type) * v_rate * v_alum_mult * 2) / 2.0;
        v_comp := vehicle_components_per_unit(v_run.engine, v_run.packages) * v_rate;

        IF v_cost > v_cash THEN
            v_lines := v_lines || jsonb_build_object('line', v_line, 'model', v_run.bp_name,
                'built', 0, 'skipped', 'insufficient_treasury', 'need', v_cost);
            CONTINUE;
        END IF;
        IF v_alum > v_alum_left THEN
            v_lines := v_lines || jsonb_build_object('line', v_line, 'model', v_run.bp_name,
                'built', 0, 'skipped', 'not_enough_aluminum', 'need', v_alum);
            CONTINUE;
        END IF;
        IF v_comp > v_comp_left THEN
            v_lines := v_lines || jsonb_build_object('line', v_line, 'model', v_run.bp_name,
                'built', 0, 'skipped', 'not_enough_components', 'need', v_comp);
            CONTINUE;
        END IF;

        -- Bonus vehicles are free of cash and materials, as before.
        v_built := v_rate + CEIL(v_rate * v_bonus_pct)::int;

        v_cash      := v_cash - v_cost;
        v_alum_left := v_alum_left - v_alum;
        v_comp_left := v_comp_left - v_comp;
        v_total_cost  := v_total_cost + v_cost;
        v_total_built := v_total_built + v_built;

        UPDATE vehicle_blueprints
           SET units_in_stock = units_in_stock + v_built
         WHERE id = v_run.blueprint_id;
        UPDATE vehicle_production_runs
           SET produced = produced + v_built
         WHERE id = v_run.id;

        v_lines := v_lines || jsonb_build_object('line', v_line, 'model', v_run.bp_name,
            'built', v_built, 'cost', v_cost);
        v_summary := v_summary || CASE WHEN v_summary = '' THEN '' ELSE ', ' END
                     || format('%s × %s (Line %s)', v_built, v_run.bp_name, v_line);
    END LOOP;

    IF v_line = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_lines_assigned');
    END IF;
    IF v_total_built = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nothing_built',
            'lines', v_lines);
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash      = COALESCE(treasury_cash, 0) - v_total_cost,
           aluminum_stock     = v_alum_left,
           components_stock   = v_comp_left,
           prod_buff_cost     = GREATEST(0, COALESCE(prod_buff_cost, 0) - 1),
           prod_buff_aluminum = GREATEST(0, COALESCE(prod_buff_aluminum, 0) - 1),
           prod_buff_output   = GREATEST(0, COALESCE(prod_buff_output, 0) - 1),
           prod_buff_overtime = GREATEST(0, COALESCE(prod_buff_overtime, 0) - 1)
     WHERE id = p_corp_id;

    PERFORM _log_corp_history(p_corp_id, v_tick,
        format('Production run — built %s vehicle(s): %s ($%s).', v_total_built, v_summary, v_total_cost));

    RETURN jsonb_build_object('success', true,
        'total_built', v_total_built, 'total_cost', v_total_cost,
        'lines', v_lines);
END $$;

REVOKE EXECUTE ON FUNCTION public._production_run_build(uuid, uuid) FROM PUBLIC;

-- ── 3. CEO desk wrapper ───────────────────────────────────────────
DROP FUNCTION IF EXISTS public.start_production_run(uuid, uuid, int);

CREATE OR REPLACE FUNCTION public.start_production_run(
    p_corp_id      uuid,
    p_blueprint_id uuid DEFAULT NULL
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

    v_res := _production_run_build(p_corp_id, p_blueprint_id);
    IF COALESCE((v_res->>'success')::boolean, false) THEN
        UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = p_corp_id;
    END IF;
    RETURN v_res;
END $$;

REVOKE EXECUTE ON FUNCTION public.start_production_run(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.start_production_run(uuid, uuid) TO authenticated;

-- ── 4. CMO kit wrapper (RUN THE LINE) ─────────────────────────────
DROP FUNCTION IF EXISTS public.cmo_start_production_run(uuid, int);

CREATE OR REPLACE FUNCTION public.cmo_start_production_run(
    p_blueprint_id uuid DEFAULT NULL
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

    v_res := _production_run_build(v_fac.biz_employer_corp_id, p_blueprint_id);
    IF COALESCE((v_res->>'success')::boolean, false) THEN
        UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;
    END IF;
    RETURN v_res;
END $$;

REVOKE EXECUTE ON FUNCTION public.cmo_start_production_run(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cmo_start_production_run(uuid) TO authenticated;

-- ── 5. The tick sweep retires ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.advance_vehicle_production(p_tick int)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
    -- 20270885: production is action-driven (Assign and Build).
    -- advance-corp-tick still calls this each tick; nothing to do.
    SELECT jsonb_build_object('success', true, 'vehicles_produced', 0,
                              'note', 'action_driven_since_20270885');
$$;

REVOKE EXECUTE ON FUNCTION public.advance_vehicle_production(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.advance_vehicle_production(int) TO service_role;

-- ── 6. Free a line ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.unassign_production_line(
    p_corp_id uuid,
    p_run_id  uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_corp entrepreneur_corps%ROWTYPE;
    v_fac  factions%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_run_id IS NULL THEN
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

    UPDATE vehicle_production_runs
       SET status = 'complete'
     WHERE id = p_run_id AND corp_id = p_corp_id AND status = 'running';
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'line_not_running');
    END IF;
    RETURN jsonb_build_object('success', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.unassign_production_line(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.unassign_production_line(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
