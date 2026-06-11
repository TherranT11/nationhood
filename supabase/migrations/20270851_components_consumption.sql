-- ════════════════════════════════════════════════════════════════════
-- 20270851 — Electrical Components consumption + the Aluminum retune
--
-- The Automotive Electrical Components market (20270833) gets its
-- consumer. Per vehicle produced, assigned in full when the
-- Production Run starts (like Aluminum):
--
--   Components: Hybrid 1 · Basic Electric 2 · Performance Electric 3
--               +1 Technology Package · +1 Self-Driving Package
--   Aluminum:   Motorcycle 0.5 · Pickup 2 · every other type 1
--
-- Components live in their own depot pool with the same per-level
-- capacity as Aluminum (design ruling): buy_components mirrors
-- buy_aluminum — canonical market price, parts_depot_cap, foreign
-- sourcing at Depot III. start_production_run re-emitted from
-- 20270845 with the components gate and debit; the per-unit helpers
-- are the ONE place the consumption tables live (the Draft Blueprint
-- and Production Run modals mirror them for display).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS components_stock int NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.entrepreneur_corps.components_stock IS
    'Automotive Electrical Components in the Part Depot (20270851) — own pool at the depot''s Aluminum capacity, bought via buy_components, consumed up front by start_production_run.';

-- ── per-unit consumption helpers ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.vehicle_aluminum_per_unit(p_vehicle_type text)
RETURNS numeric LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_vehicle_type
        WHEN 'motorcycle' THEN 0.5
        WHEN 'pickup'     THEN 2
        ELSE 1
    END;
$$;
COMMENT ON FUNCTION public.vehicle_aluminum_per_unit(text) IS
    'Aluminum consumed per vehicle produced: 0.5 motorcycle, 2 pickup, 1 otherwise (20270851). Assigned in full at Production Run start.';

CREATE OR REPLACE FUNCTION public.vehicle_components_per_unit(p_engine text, p_packages text[])
RETURNS int LANGUAGE sql IMMUTABLE
AS $$
    SELECT (CASE p_engine
                WHEN 'hybrid'               THEN 1
                WHEN 'electric_basic'       THEN 2
                WHEN 'electric_performance' THEN 3
                ELSE 0
            END)
         + (CASE WHEN 'technology'   = ANY (COALESCE(p_packages, '{}')) THEN 1 ELSE 0 END)
         + (CASE WHEN 'self_driving' = ANY (COALESCE(p_packages, '{}')) THEN 1 ELSE 0 END);
$$;
COMMENT ON FUNCTION public.vehicle_components_per_unit(text, text[]) IS
    'Electrical Components consumed per vehicle produced: hybrid 1 / basic EV 2 / performance EV 3, +1 each for the Technology and Self-Driving packages (20270851). Assigned in full at Production Run start.';

-- ── buy_components — the depot's second shelf ─────────────────────
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

    RETURN jsonb_build_object('success', true,
        'bought', p_quantity, 'cost', v_cost,
        'new_stock', COALESCE(v_corp.components_stock, 0) + p_quantity,
        'cap', v_cap);
END $$;

REVOKE EXECUTE ON FUNCTION public.buy_components(uuid, uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.buy_components(uuid, uuid, int) TO authenticated;

-- ── start_production_run — both materials assigned at start ───────
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
        v_tick, v_tick + p_quantity, v_bonus
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

    RETURN jsonb_build_object('success', true, 'run_id', v_id,
        'quantity', p_quantity, 'unit_cost', v_unit, 'total_cost', v_total,
        'bonus_units', v_bonus,
        'completes_at_tick', v_tick + p_quantity);
END $$;

REVOKE EXECUTE ON FUNCTION public.start_production_run(uuid, uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.start_production_run(uuid, uuid, int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
