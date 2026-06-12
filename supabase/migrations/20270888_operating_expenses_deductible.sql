-- ════════════════════════════════════════════════════════════════════
-- 20270888 — Operating expenses are tax-deductible
--
-- Follow-up to 20270887 (which netted payroll out of the corporate
-- tax base): production and materials spend debited the treasury
-- without any YTD tracking, so it couldn't be deducted. This adds
-- the accumulator and wires the spenders:
--
--   • entrepreneur_corps.expenses_ytd / expenses_ytd_year — same
--     year-rollover pattern as the payroll accumulator (20270802),
--     keyed on the tick-year index.
--   • _corp_log_expense(corp, amount) — the one seam. Any future
--     treasury spend that should be deductible calls it.
--   • Wired spenders (latest bodies, byte-faithful outside the one
--     PERFORM each): _production_run_build (20270885 — the per-turn
--     vehicle build cost), buy_aluminum (20270843), buy_components
--     (20270851), buy_construction_goods (20270821 — materials AND
--     equipment), advance_build (20270852 — the $10k/site push).
--   • file_corporate_tax re-emitted from the 20270887 body: taxable
--     profit = revenue ledger − payroll_ytd − expenses_ytd, floored
--     at 0.
--
-- NOT wired (deliberate): asset-ladder upgrades, branch/plant
-- construction escrow, IPO/founding costs — capital expenditure,
-- not operating expense. Flag if the design wants them deductible.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. The accumulator ────────────────────────────────────────────
ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS expenses_ytd      bigint NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS expenses_ytd_year int;

COMMENT ON COLUMN public.entrepreneur_corps.expenses_ytd IS
    'Operating expenses year-to-date (tick-year index in expenses_ytd_year; resets on rollover). Fed by _corp_log_expense from production builds, material/component/equipment purchases and advance_build. Deducted from the corporate-tax base by file_corporate_tax. 20270888.';

REVOKE UPDATE (expenses_ytd, expenses_ytd_year) ON public.entrepreneur_corps
    FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public._corp_log_expense(
    p_corp_id uuid,
    p_amount  bigint
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_year int;
BEGIN
    IF p_corp_id IS NULL OR p_amount IS NULL OR p_amount <= 0 THEN
        RETURN;
    END IF;
    SELECT current_tick / 12 INTO v_year FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_year := COALESCE(v_year, 0);
    UPDATE entrepreneur_corps
       SET expenses_ytd = CASE WHEN COALESCE(expenses_ytd_year, -1) = v_year
                               THEN COALESCE(expenses_ytd, 0) + p_amount
                               ELSE p_amount END,
           expenses_ytd_year = v_year
     WHERE id = p_corp_id;
END $$;

REVOKE EXECUTE ON FUNCTION public._corp_log_expense(uuid, bigint) FROM PUBLIC;

-- ── 2. The spenders log what they spend ───────────────────────────
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

    -- Operating expense → the tax-deductible accumulator (20270888).
    PERFORM _corp_log_expense(p_corp_id, v_total_cost);

    PERFORM _log_corp_history(p_corp_id, v_tick,
        format('Production run — built %s vehicle(s): %s ($%s).', v_total_built, v_summary, v_total_cost));

    RETURN jsonb_build_object('success', true,
        'total_built', v_total_built, 'total_cost', v_total_cost,
        'lines', v_lines);
END $$;

CREATE OR REPLACE FUNCTION public.buy_aluminum(
    p_corp_id   uuid,
    p_nation_id uuid,
    p_quantity  int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_mkt    jsonb;
    v_cap    int;
    v_cost   bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL
       OR p_quantity IS NULL OR p_quantity < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the cap check and treasury debit must
    -- serialize against a concurrent buy.
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

    -- Foreign sourcing is the depot's Level III charter.
    IF p_nation_id <> v_corp.hq_nation_id
       AND COALESCE(v_corp.parts_depot_tier, 1) < 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'depot_too_small');
    END IF;

    v_mkt := aluminum_market(p_nation_id);
    IF NOT COALESCE((v_mkt->>'success')::boolean, false) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;
    IF p_quantity > (v_mkt->>'amount_available')::bigint THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_supply',
            'available', (v_mkt->>'amount_available')::bigint);
    END IF;

    v_cap := parts_depot_cap(COALESCE(v_corp.parts_depot_tier, 1));
    IF COALESCE(v_corp.aluminum_stock, 0) + p_quantity > v_cap THEN
        RETURN jsonb_build_object('success', false, 'reason', 'over_capacity',
            'cap', v_cap, 'have', COALESCE(v_corp.aluminum_stock, 0));
    END IF;

    v_cost := (v_mkt->>'cost_per_unit')::bigint * p_quantity;
    IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_cost, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash  = COALESCE(treasury_cash, 0) - v_cost,
           aluminum_stock = COALESCE(aluminum_stock, 0) + p_quantity
     WHERE id = p_corp_id;

    -- Operating expense → the tax-deductible accumulator (20270888).
    PERFORM _corp_log_expense(p_corp_id, v_cost);

    RETURN jsonb_build_object('success', true,
        'bought', p_quantity, 'cost', v_cost,
        'new_stock', COALESCE(v_corp.aluminum_stock, 0) + p_quantity,
        'cap', v_cap);
END $$;

CREATE OR REPLACE FUNCTION public.buy_components(
    p_corp_id   uuid,
    p_nation_id uuid,
    p_quantity  int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_mkt    jsonb;
    v_cap    int;
    v_cost   bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL
       OR p_quantity IS NULL OR p_quantity < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the cap check and treasury debit must
    -- serialize against a concurrent buy.
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

    -- Foreign sourcing is the depot's Level III charter.
    IF p_nation_id <> v_corp.hq_nation_id
       AND COALESCE(v_corp.parts_depot_tier, 1) < 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'depot_too_small');
    END IF;

    v_mkt := automotive_components_market(p_nation_id);
    IF NOT COALESCE((v_mkt->>'success')::boolean, false) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;
    IF p_quantity > (v_mkt->>'amount_available')::bigint THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_supply',
            'available', (v_mkt->>'amount_available')::bigint);
    END IF;

    -- Own pool, the depot's same per-level capacity (design ruling).
    v_cap := parts_depot_cap(COALESCE(v_corp.parts_depot_tier, 1));
    IF COALESCE(v_corp.components_stock, 0) + p_quantity > v_cap THEN
        RETURN jsonb_build_object('success', false, 'reason', 'over_capacity',
            'cap', v_cap, 'have', COALESCE(v_corp.components_stock, 0));
    END IF;

    v_cost := (v_mkt->>'cost_per_unit')::bigint * p_quantity;
    IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_cost, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash    = COALESCE(treasury_cash, 0) - v_cost,
           components_stock = COALESCE(components_stock, 0) + p_quantity
     WHERE id = p_corp_id;

    -- Operating expense → the tax-deductible accumulator (20270888).
    PERFORM _corp_log_expense(p_corp_id, v_cost);

    RETURN jsonb_build_object('success', true,
        'bought', p_quantity, 'cost', v_cost,
        'new_stock', COALESCE(v_corp.components_stock, 0) + p_quantity,
        'cap', v_cap);
END $$;

CREATE OR REPLACE FUNCTION public.buy_construction_goods(
    p_corp_id    uuid,
    p_good       text,
    p_qty        int,
    p_nation_id  uuid,
    p_project_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_proj   corp_construction_projects%ROWTYPE;
    v_need   int;
    v_caps   record;
    v_units  int;
    v_mkt    jsonb;
    v_price  bigint;
    v_total  bigint;
    v_tick   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL
       OR p_good NOT IN ('materials', 'equipment')
       OR p_qty IS NULL OR p_qty < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: allowance + cap checks must serialize.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
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

    v_caps := yard_storage_caps(COALESCE(v_corp.supply_tier, 0));

    IF p_good = 'materials' THEN
        -- Materials: always project-bound, always home nation —
        -- storage returns with the Supply & Material ladder.
        IF p_nation_id <> v_corp.hq_nation_id THEN
            RETURN jsonb_build_object('success', false, 'reason', 'home_nation_only');
        END IF;
        IF p_project_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'project_required');
        END IF;
        SELECT * INTO v_proj FROM corp_construction_projects
         WHERE id = p_project_id AND corp_id = p_corp_id AND status = 'building'
         FOR UPDATE;
        IF v_proj.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'project_not_found');
        END IF;
        v_need := COALESCE((SELECT materials_needed FROM corp_blueprints
                             WHERE id = v_proj.blueprint_id), 0);
        IF v_proj.materials_supplied + p_qty > v_need THEN
            RETURN jsonb_build_object('success', false, 'reason', 'exceeds_project_need',
                'needed', v_need, 'supplied', v_proj.materials_supplied);
        END IF;
    ELSE
        -- Equipment: abroad opens at Level IV.
        IF COALESCE(v_corp.supply_tier, 0) < 4
           AND p_nation_id <> v_corp.hq_nation_id THEN
            RETURN jsonb_build_object('success', false, 'reason', 'home_nation_only');
        END IF;
        IF v_caps.equipment_cap = 0 THEN
            -- Level 0: one unit, bought straight onto an active
            -- project — its single use is committed on the spot.
            IF p_qty <> 1 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
            END IF;
            IF p_project_id IS NULL THEN
                RETURN jsonb_build_object('success', false, 'reason', 'project_required');
            END IF;
            SELECT * INTO v_proj FROM corp_construction_projects
             WHERE id = p_project_id AND corp_id = p_corp_id AND status = 'building'
             FOR UPDATE;
            IF v_proj.id IS NULL THEN
                RETURN jsonb_build_object('success', false, 'reason', 'project_not_found');
            END IF;
            IF v_proj.equipment_supplied >= 1 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'exceeds_project_need');
            END IF;
        ELSE
            SELECT COUNT(*) INTO v_units FROM corp_equipment WHERE corp_id = p_corp_id;
            IF v_units + p_qty > v_caps.equipment_cap THEN
                RETURN jsonb_build_object('success', false, 'reason', 'storage_full',
                    'cap', v_caps.equipment_cap, 'stock', v_units);
            END IF;
        END IF;
    END IF;

    -- Price + availability THROUGH the canonical market functions —
    -- the listed price IS the charged price.
    v_mkt := CASE p_good
        WHEN 'materials' THEN construction_materials_market(p_nation_id)
        ELSE construction_equipment_market(p_nation_id)
    END;
    IF NOT COALESCE((v_mkt->>'success')::boolean, false) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'market_unavailable');
    END IF;
    IF p_qty > (v_mkt->>'amount_available')::bigint THEN
        RETURN jsonb_build_object('success', false, 'reason', 'market_sold_out',
            'available', (v_mkt->>'amount_available')::bigint);
    END IF;
    v_price := (v_mkt->>'cost_per_unit')::bigint;
    v_total := v_price * p_qty;
    IF FLOOR(COALESCE(v_corp.treasury_cash, 0)) < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_total, 'have', FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash    = COALESCE(treasury_cash, 0) - v_total,
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    -- Operating expense → the tax-deductible accumulator (20270888).
    PERFORM _corp_log_expense(p_corp_id, v_total);

    IF p_good = 'materials' THEN
        UPDATE corp_construction_projects
           SET materials_supplied = materials_supplied + p_qty
         WHERE id = p_project_id;
    ELSE
        IF v_caps.equipment_cap = 0 THEN
            UPDATE corp_construction_projects
               SET equipment_supplied = 1
             WHERE id = p_project_id;
        ELSE
            INSERT INTO corp_equipment (corp_id, uses_left, acquired_at_tick)
            SELECT p_corp_id, 3, v_tick FROM generate_series(1, p_qty);
        END IF;
        -- Equipment leaves the seller nation's ratcheting stock —
        -- the ratchet's only down-path. Conditional so a concurrent
        -- buyer can't drive it negative.
        UPDATE nations
           SET construction_equipment_stock = construction_equipment_stock - p_qty
         WHERE id = p_nation_id
           AND construction_equipment_stock >= p_qty;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'reason', 'market_sold_out');
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'qty', p_qty,
        'unit_price', v_price, 'total', v_total);
END $$;

CREATE OR REPLACE FUNCTION public.advance_build(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_corp  entrepreneur_corps%ROWTYPE;
    v_tick  int;
    v_count int;
    v_cost  bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the per-tick allowance check below must
    -- serialize against a concurrent executive action.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
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

    SELECT COUNT(*) INTO v_count FROM corp_construction_projects
     WHERE corp_id = p_corp_id AND status = 'building';
    IF v_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_active_projects');
    END IF;

    v_cost := v_count * 10000;
    IF FLOOR(COALESCE(v_corp.treasury_cash, 0)) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_cost, 'have', FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash    = COALESCE(treasury_cash, 0) - v_cost,
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    -- Operating expense → the tax-deductible accumulator (20270888).
    PERFORM _corp_log_expense(p_corp_id, v_cost);

    UPDATE corp_construction_projects
       SET completes_at_tick = completes_at_tick - 1
     WHERE corp_id = p_corp_id AND status = 'building';

    -- Anything pushed to due completes NOW through the canonical
    -- sweep — same payout, revenue stamp, and tier city effects the
    -- tick engine applies.
    PERFORM complete_construction_projects(v_tick);

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Advance Build — pushed %s job site(s) forward ($%s).', v_count, v_cost));
    RETURN jsonb_build_object(
        'success',  true,
        'advanced', v_count,
        'cost',     v_cost
    );
END $$;

-- ── 3. The filing deducts it ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.file_corporate_tax(
    p_corp_id        uuid,
    p_disclosure_pct int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_corp        entrepreneur_corps%ROWTYPE;
    v_owner       factions%ROWTYPE;
    v_nation      nations%ROWTYPE;
    v_tick        int;
    v_year_start  int;
    v_year        int;
    v_profit_raw  numeric;
    v_profit      bigint;
    v_rate        int;
    v_holiday_pct int;
    v_tax_owed    bigint;
    v_declared    bigint;
    v_evaded      bigint;
    v_treasury    numeric;
    v_has_agent   boolean;
    v_corruption  int;
    v_roll        int;
    v_caught      boolean := false;
    v_fine        bigint := 0;
    v_clawback    bigint := 0;
    v_status      text;
    v_paid        bigint;
    v_filing_id   uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_disclosure_pct NOT IN (100, 75, 50, 25) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_disclosure');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    -- Owner gate: the corp's owner faction must belong to the caller.
    SELECT * INTO v_owner FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_owner.id IS NULL AND NOT is_admin() THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_corp.hq_nation_id FOR UPDATE;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick       := COALESCE(v_tick, 0);
    v_year_start := (v_tick / 12) * 12;
    v_year       := 2000 + (v_tick / 12);   -- matches utils.tickToYear

    IF EXISTS (SELECT 1 FROM corp_tax_filings WHERE corp_id = p_corp_id AND year = v_year) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_filed_this_year', 'year', v_year);
    END IF;

    -- Taxable profit YTD (20270887): the ledger revenue the page's
    -- Revenue cards show (corp_revenue_by_year sums the same rows)
    -- MINUS the payroll accumulator (process_corp_payroll, 20270802,
    -- year-guarded on the tick-year index). Payroll never writes
    -- corp_cash_events, so there is no double-count. Production and
    -- materials spend has no YTD accumulator yet — flagged follow-up;
    -- until it lands those costs are not deductible. Negative net →
    -- 0 owed.
    SELECT COALESCE(SUM(delta), 0) INTO v_profit_raw
      FROM corp_cash_events
     WHERE corp_id = p_corp_id
       AND tick >= v_year_start
       AND tick <= v_tick;
    IF COALESCE(v_corp.payroll_ytd_year, -1) = (v_tick / 12) THEN
        v_profit_raw := v_profit_raw - COALESCE(v_corp.payroll_ytd, 0);
    END IF;
    -- 20270888: operating expenses (production runs, material and
    -- equipment purchases, build acceleration) accumulate into
    -- expenses_ytd via _corp_log_expense and deduct the same way.
    IF COALESCE(v_corp.expenses_ytd_year, -1) = (v_tick / 12) THEN
        v_profit_raw := v_profit_raw - COALESCE(v_corp.expenses_ytd, 0);
    END IF;
    v_profit := GREATEST(0, FLOOR(v_profit_raw))::bigint;

    -- nations.corporate_tax rides the 0-10 policy scale (the Active
    -- Laws Corporate Taxation options pin it via the target drift:
    -- Tax Haven 1 / Pro-Business 3 / Standard 5 / Progressive 7 /
    -- Heavy 9). Corps pay ×5 of that as a real percent of net profit
    -- (design ruling 20270872): 5% / 15% / 25% / 35% / 45%.
    v_rate     := GREATEST(0, LEAST(100, COALESCE(v_nation.corporate_tax, 0) * 5));
    -- An active Tax Holiday Act (20270873) discounts the filing rate
    -- for covered years and sectors — sectors NULL means all.
    SELECT pct INTO v_holiday_pct FROM corporate_tax_holidays
     WHERE nation_id = v_corp.hq_nation_id
       AND v_year >= start_year AND v_year < start_year + years
       AND (sectors IS NULL OR v_corp.industry = ANY (sectors))
     ORDER BY created_at DESC LIMIT 1;
    IF v_holiday_pct IS NOT NULL THEN
        v_rate := FLOOR(v_rate * (100 - v_holiday_pct) / 100.0)::int;
    END IF;
    v_tax_owed := FLOOR(v_profit * v_rate / 100.0)::bigint;
    v_declared := FLOOR(v_tax_owed * p_disclosure_pct / 100.0)::bigint;
    v_evaded   := v_tax_owed - v_declared;
    v_treasury := COALESCE(v_corp.treasury_cash, 0);

    -- Must be able to cover the declared portion. A short corp can pick
    -- a lower disclosure tier to owe less.
    IF v_declared > v_treasury THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'declared', v_declared, 'treasury', FLOOR(v_treasury)::bigint);
    END IF;

    -- Resolve outcome.
    IF p_disclosure_pct = 100 OR v_tax_owed = 0 THEN
        v_status := 'compliant';
        v_evaded := 0;
    ELSE
        v_has_agent := EXISTS (
            SELECT 1 FROM factions
             WHERE faction_type = 'politician'
               AND nation_id = v_corp.hq_nation_id
               AND politician_fis_joined_at_tick IS NOT NULL
               AND abandoned_at IS NULL
        );
        IF v_has_agent THEN
            -- Deferred: an FIS agent exists, so no auto-catch. The
            -- hidden income is logged for a later audit to uncover.
            v_status := 'evaded';
        ELSE
            -- No auditor → the game adjudicates with a Balanced roll.
            v_corruption := GREATEST(0, LEAST(100, COALESCE(v_nation.corruption, 0)::int));
            v_roll       := 1 + FLOOR(random() * 100)::int;
            v_caught     := (v_roll + v_corruption) <= (100 - p_disclosure_pct);
            v_status     := CASE WHEN v_caught THEN 'caught' ELSE 'evaded' END;
        END IF;
    END IF;

    -- Pay the declared portion now.
    v_paid     := v_declared;
    v_treasury := v_treasury - v_declared;

    -- If caught, claw back the evaded amount + 10% fine (clamped to
    -- whatever treasury is left). Nothing is "successfully evaded".
    IF v_status = 'caught' THEN
        v_fine     := FLOOR(v_evaded * 0.10)::bigint;
        v_clawback := LEAST(FLOOR(v_treasury)::bigint, v_evaded + v_fine);
        v_paid     := v_paid + v_clawback;
        v_treasury := v_treasury - v_clawback;
        v_evaded   := 0;
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash = v_treasury, updated_at = now()
     WHERE id = p_corp_id;

    -- Credit the nation's budget for everything actually collected
    -- (/1e9 RAW_PER_ABSTRACT convention).
    IF v_paid > 0 THEN
        UPDATE nations
           SET budget = COALESCE(budget, 0) + (v_paid::numeric / 1000000000)
         WHERE id = v_corp.hq_nation_id;
    END IF;

    INSERT INTO corp_tax_filings (
        corp_id, nation_id, year, taxable_profit, rate_pct, tax_owed,
        disclosure_pct, amount_paid, amount_evaded, status,
        has_fis_agent, filed_by_faction_id, filed_at_tick
    ) VALUES (
        p_corp_id, v_corp.hq_nation_id, v_year, v_profit, v_rate, v_tax_owed,
        p_disclosure_pct, v_paid, v_evaded, v_status,
        COALESCE(v_has_agent, false), v_owner.id, v_tick
    ) RETURNING id INTO v_filing_id;

    RETURN jsonb_build_object(
        'success',         true,
        'filing_id',       v_filing_id,
        'year',            v_year,
        'taxable_profit',  v_profit,
        'rate_pct',        v_rate,
        'tax_owed',        v_tax_owed,
        'disclosure_pct',  p_disclosure_pct,
        'amount_paid',     v_paid,
        'amount_evaded',   v_evaded,
        'status',          v_status,
        'has_fis_agent',   COALESCE(v_has_agent, false),
        'caught',          v_caught
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.file_corporate_tax(uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.file_corporate_tax(uuid, int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
