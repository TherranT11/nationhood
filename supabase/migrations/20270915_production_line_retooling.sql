-- ════════════════════════════════════════════════════════════════════
-- 20270915 — Assigning/retooling a line tools up; it builds next turn
--
-- Design change (user spec): changing a line from one Model to another —
-- and assigning a fresh Model to a free line — should take ONE action
-- round and produce NO cars that turn. The line is retooling: it builds
-- nothing now and runs the new Model from next tick. Every OTHER line
-- already running still builds its 50 this turn (one retool doesn't idle
-- the plant), and retooling is free — the cost is the lost turn plus the
-- spent action.
--
-- The old model (20270885/20270888 "Assign and Build") built the newly
-- assigned line the same turn. New model: a line whose tooling started
-- THIS tick sits the build out.
--
-- No schema change: started_tick is already stamped to the assignment
-- tick on every new line (the INSERT below), so "retooling this turn"
-- is exactly started_tick = current tick. Switching a Model is still
-- unassign_production_line (free) then assign — the assign tools up.
--
-- Allowance: a pure tool-up turn (a line assigned but nothing else built)
-- is a valid action and burns the round; it charges nothing and leaves
-- the Engineer/CMO buffs standing for the real build next tick. Only an
-- all-skipped build with NO new assignment still returns nothing_built
-- without burning the action.
--
-- Re-emitted from 20270888; the signature is unchanged, so the CEO/CMO
-- wrappers (20270885) are untouched — they already burn the allowance on
-- success.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    v_assigned boolean := false;   -- a line was tooled up this call
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

    -- Optional new assignment — the line tools up this turn (its
    -- started_tick is stamped to now) and builds the Model next tick.
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
        v_assigned := true;
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

        -- A line whose tooling started THIS tick (newly assigned or
        -- switched) retools this turn — it builds nothing now and runs
        -- the Model from next tick (20270915).
        IF v_run.started_tick = v_tick THEN
            v_lines := v_lines || jsonb_build_object('line', v_line, 'model', v_run.bp_name,
                'built', 0, 'retooling', true);
            CONTINUE;
        END IF;

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
        -- A pure tool-up turn (a line was assigned/switched but nothing
        -- else built) is still a valid action: burn the round, charge
        -- nothing, leave the buffs standing for next tick's real build.
        IF v_assigned THEN
            PERFORM _log_corp_history(p_corp_id, v_tick,
                'Retooled a production line — first cars next turn.');
            RETURN jsonb_build_object('success', true,
                'total_built', 0, 'total_cost', 0, 'tooled_up', true, 'lines', v_lines);
        END IF;
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

    -- Operating expense → the tax-deductible accumulator (20270888).
    PERFORM _corp_log_expense(p_corp_id, v_total_cost);

    PERFORM _log_corp_history(p_corp_id, v_tick,
        format('Production run — built %s vehicle(s): %s ($%s).', v_total_built, v_summary, v_total_cost));

    RETURN jsonb_build_object('success', true,
        'total_built', v_total_built, 'total_cost', v_total_cost,
        'lines', v_lines);
END $$;

REVOKE EXECUTE ON FUNCTION public._production_run_build(uuid, uuid) FROM PUBLIC;

NOTIFY pgrst, 'reload schema';

COMMIT;
