-- ════════════════════════════════════════════════════════════════════
-- 20270843 — New Raw Material: Aluminum
--
-- Every Minerals resource a nation has puts 12 Aluminum on hand
-- (live derivation like Construction Materials), base $10k priced on
-- the shared scarcity curve. Corps buy it into the Supply Chain &
-- Part Depot — the caps finally bite (10/50/75/120/250 by depot
-- level) and Level III unlocks buying from other nations. Buying is
-- free logistics (no executive action — design ruling; it lives in
-- the Production Run modal).
--
-- Consumption: 0.5 Aluminum per motorcycle, 1 per car, assigned in
-- full when the Production Run starts — the depot must hold the
-- whole order's worth. start_production_run re-emitted from
-- 20270842 with the gate + debit; construction_market_listings
-- re-emitted from 20270833 with the aluminum shelf.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS aluminum_stock numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.entrepreneur_corps.aluminum_stock IS
    'Aluminum in the Supply Chain & Part Depot (20270843) — bought via buy_aluminum (cap by parts_depot_cap), consumed up front by start_production_run (0.5/motorcycle, 1/car).';

-- ── per-level + per-type helpers ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.parts_depot_cap(p_tier int)
RETURNS int LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE
        WHEN p_tier >= 5 THEN 250
        WHEN p_tier = 4 THEN 120
        WHEN p_tier = 3 THEN 75
        WHEN p_tier = 2 THEN 50
        ELSE 10
    END;
$$;
COMMENT ON FUNCTION public.parts_depot_cap(int) IS
    'Supply Chain & Part Depot: Aluminum storage by level (10/50/75/120/250). The ONE place the caps live.';

CREATE OR REPLACE FUNCTION public.vehicle_aluminum_per_unit(p_vehicle_type text)
RETURNS numeric LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE WHEN p_vehicle_type = 'motorcycle' THEN 0.5 ELSE 1.0 END;
$$;
COMMENT ON FUNCTION public.vehicle_aluminum_per_unit(text) IS
    'Aluminum consumed per vehicle produced: 0.5 for motorcycles, 1 for cars. Assigned in full at Production Run start.';

-- ── aluminum_market ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.aluminum_market(p_nation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_local  numeric;
    v_global numeric;
    v_count  int;
    v_mult   numeric;
BEGIN
    IF p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    -- Every Minerals resource on hand yields 12 Aluminum.
    SELECT COALESCE(minerals, 0) * 12 INTO v_local
      FROM nations WHERE id = p_nation_id;
    IF v_local IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    SELECT SUM(COALESCE(minerals, 0) * 12), COUNT(*)
      INTO v_global, v_count
      FROM nations
     WHERE name = ANY (market_nation_names());

    -- Same scarcity curve as the other goods; while the whole world
    -- holds zero, everyone pays flat base.
    IF COALESCE(v_global, 0) = 0 THEN
        v_mult := 1;
    ELSE
        v_mult := GREATEST(0.5, LEAST(3,
            (v_global / GREATEST(v_count, 1)) / GREATEST(v_local, 1)));
    END IF;

    RETURN jsonb_build_object(
        'success',          true,
        'amount_available', FLOOR(v_local)::bigint,
        'cost_per_unit',    ROUND(10000 * v_mult)::bigint,
        'base_cost',        10000,
        'scarcity_mult',    ROUND(v_mult, 2),
        'local_supply',     FLOOR(v_local)::bigint,
        'global_supply',    FLOOR(COALESCE(v_global, 0))::bigint
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.aluminum_market(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.aluminum_market(uuid) TO authenticated;

-- ── buy_aluminum — free logistics into the depot ──────────────────
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

    RETURN jsonb_build_object('success', true,
        'bought', p_quantity, 'cost', v_cost,
        'new_stock', COALESCE(v_corp.aluminum_stock, 0) + p_quantity,
        'cap', v_cap);
END $$;

REVOKE EXECUTE ON FUNCTION public.buy_aluminum(uuid, uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.buy_aluminum(uuid, uuid, int) TO authenticated;

-- ── start_production_run — Aluminum assigned at start ─────────────
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
    IF COALESCE(v_corp.aluminum_stock, 0) < v_aluminum THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_aluminum',
            'need', v_aluminum, 'have', COALESCE(v_corp.aluminum_stock, 0));
    END IF;

    INSERT INTO vehicle_production_runs (
        corp_id, blueprint_id, quantity, unit_cost, total_cost,
        started_tick, completes_at_tick
    ) VALUES (
        p_corp_id, p_blueprint_id, p_quantity, v_unit, v_total,
        v_tick, v_tick + p_quantity
    ) RETURNING id INTO v_id;

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_total,
           aluminum_stock = COALESCE(aluminum_stock, 0) - v_aluminum,
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'run_id', v_id,
        'quantity', p_quantity, 'unit_cost', v_unit, 'total_cost', v_total,
        'completes_at_tick', v_tick + p_quantity);
END $$;

REVOKE EXECUTE ON FUNCTION public.start_production_run(uuid, uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.start_production_run(uuid, uuid, int) TO authenticated;

-- ── construction_market_listings — the Aluminum shelf ─────────────
CREATE OR REPLACE FUNCTION public.construction_market_listings()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_n         RECORD;
    v_mats      jsonb := '[]'::jsonb;
    v_equip     jsonb := '[]'::jsonb;
    v_comps     jsonb := '[]'::jsonb;
    v_alu       jsonb := '[]'::jsonb;
    v_m         jsonb;
    v_e         jsonb;
    v_c         jsonb;
    v_a         jsonb;
BEGIN
    FOR v_n IN
        SELECT id, name, flag_url FROM nations
         WHERE name = ANY (market_nation_names())
         ORDER BY name
    LOOP
        v_m := construction_materials_market(v_n.id);
        v_e := construction_equipment_market(v_n.id);
        v_c := automotive_components_market(v_n.id);
        v_a := aluminum_market(v_n.id);
        IF COALESCE((v_m->>'success')::boolean, false) THEN
            v_mats := v_mats || jsonb_build_array(
                v_m || jsonb_build_object('nation_id', v_n.id,
                    'nation', v_n.name, 'flag_url', v_n.flag_url));
        END IF;
        IF COALESCE((v_e->>'success')::boolean, false) THEN
            v_equip := v_equip || jsonb_build_array(
                v_e || jsonb_build_object('nation_id', v_n.id,
                    'nation', v_n.name, 'flag_url', v_n.flag_url));
        END IF;
        IF COALESCE((v_c->>'success')::boolean, false) THEN
            v_comps := v_comps || jsonb_build_array(
                v_c || jsonb_build_object('nation_id', v_n.id,
                    'nation', v_n.name, 'flag_url', v_n.flag_url));
        END IF;
        IF COALESCE((v_a->>'success')::boolean, false) THEN
            v_alu := v_alu || jsonb_build_array(
                v_a || jsonb_build_object('nation_id', v_n.id,
                    'nation', v_n.name, 'flag_url', v_n.flag_url));
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true,
        'materials', v_mats, 'equipment', v_equip, 'components', v_comps,
        'aluminum', v_alu);
END $$;

REVOKE EXECUTE ON FUNCTION public.construction_market_listings() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.construction_market_listings() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
