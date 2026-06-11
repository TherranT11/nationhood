-- ════════════════════════════════════════════════════════════════════
-- 20270855 — Automotive's fifth action becomes Logistical Overhaul;
-- shipping moves to the CCO
--
-- Design change. The owner's EXPAND MARKET leaves the desk — market
-- ENTRY is now the CCO's pitch (20270853) — and LOGISTICAL OVERHAUL
-- takes the fifth card, construction parity: upgrade_automotive_asset
-- re-emitted from 20270842 to spend the day's executive action and
-- log to Corporate History (the free on-card upgrade buttons retire
-- with it; one upgrade path).
--
-- Shipping stock abroad — and subsidiary Model renames / standing
-- list prices — moves to the CCO's desk (design ruling):
-- cco_ship_vehicles validates every row before any stock moves (the
-- 20270844 lesson), requires presence, and spends the chief's daily
-- action. The orphaned owner expand_market is DROPPED.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.expand_market(uuid, uuid, text, text, jsonb);

-- ── cco_ship_vehicles ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cco_ship_vehicles(
    p_nation_id uuid,
    p_shipments jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_nation   nations%ROWTYPE;
    v_presence corp_market_presence%ROWTYPE;
    v_tick     int;
    v_shipped  int := 0;
    r          RECORD;
    v_bp       vehicle_blueprints%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    v_fac := _commercial_chief_check(v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_cco');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = v_fac.biz_employer_corp_id FOR UPDATE;
    IF p_nation_id = v_corp.hq_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'home_nation');
    END IF;
    SELECT * INTO v_nation FROM nations
     WHERE id = p_nation_id AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;
    SELECT * INTO v_presence FROM corp_market_presence
     WHERE corp_id = v_corp.id AND nation_id = p_nation_id;
    IF v_presence.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_market');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- Validate every row BEFORE any stock moves (the 20270844
    -- lesson); the locks taken here serialize the deductions below.
    FOR r IN SELECT * FROM jsonb_to_recordset(COALESCE(p_shipments, '[]'::jsonb))
                  AS x(blueprint_id uuid, units int, local_name text, list_price bigint)
    LOOP
        SELECT * INTO v_bp FROM vehicle_blueprints
         WHERE id = r.blueprint_id AND corp_id = v_corp.id
         FOR UPDATE;
        IF v_bp.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
        END IF;
        IF COALESCE(r.units, 0) < 0 OR COALESCE(r.units, 0) > COALESCE(v_bp.units_in_stock, 0) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'ship_exceeds_stock',
                'model', v_bp.name, 'have', COALESCE(v_bp.units_in_stock, 0));
        END IF;
    END LOOP;

    FOR r IN SELECT * FROM jsonb_to_recordset(COALESCE(p_shipments, '[]'::jsonb))
                  AS x(blueprint_id uuid, units int, local_name text, list_price bigint)
    LOOP
        IF COALESCE(r.units, 0) > 0 THEN
            UPDATE vehicle_blueprints
               SET units_in_stock = units_in_stock - r.units
             WHERE id = r.blueprint_id;
            v_shipped := v_shipped + COALESCE(r.units, 0);
        END IF;
        INSERT INTO vehicle_market_stock (corp_id, nation_id, blueprint_id, units, local_name, list_price)
        VALUES (v_corp.id, p_nation_id, r.blueprint_id, COALESCE(r.units, 0),
                CASE WHEN v_presence.kind = 'subsidiary' THEN NULLIF(TRIM(COALESCE(r.local_name, '')), '') END,
                r.list_price)
        ON CONFLICT (blueprint_id, nation_id) DO UPDATE
           SET units      = vehicle_market_stock.units + COALESCE(EXCLUDED.units, 0),
               local_name = CASE WHEN v_presence.kind = 'subsidiary'
                                 THEN COALESCE(EXCLUDED.local_name, vehicle_market_stock.local_name)
                                 ELSE vehicle_market_stock.local_name END,
               list_price = COALESCE(EXCLUDED.list_price, vehicle_market_stock.list_price);
    END LOOP;

    UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;
    IF v_shipped > 0 THEN
        PERFORM _log_corp_history(v_corp.id, v_tick,
            format('Shipped %s vehicle(s) to %s — the CCO.', v_shipped, v_nation.name));
    END IF;

    RETURN jsonb_build_object('success', true,
        'shipped', v_shipped, 'nation', v_nation.name);
END $$;

REVOKE EXECUTE ON FUNCTION public.cco_ship_vehicles(uuid, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cco_ship_vehicles(uuid, jsonb) TO authenticated;

-- ── upgrade_automotive_asset — now the Logistical Overhaul ────────
CREATE OR REPLACE FUNCTION public.upgrade_automotive_asset(
    p_corp_id uuid,
    p_asset   text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tier int;
    v_cost bigint;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_asset NOT IN
       ('design_studio', 'assembly', 'data_center', 'parts_depot', 'franchise') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the treasury debit and tier bump must
    -- serialize against a concurrent upgrade.
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

    v_tier := COALESCE(CASE p_asset
        WHEN 'design_studio' THEN v_corp.design_studio_tier
        WHEN 'assembly'      THEN v_corp.assembly_tier
        WHEN 'data_center'   THEN v_corp.data_center_tier
        WHEN 'parts_depot'   THEN v_corp.parts_depot_tier
        WHEN 'franchise'     THEN v_corp.franchise_tier
    END, 1);
    IF v_tier >= 5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'max_tier');
    END IF;

    -- The construction price ladder, aligned by Roman numeral:
    -- II $10M · III $16M · IV $25M · V $40M (Level I is free at
    -- founding). yard_upgrade_cost is the one price source.
    v_cost := yard_upgrade_cost(v_tier + 1);
    IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_cost, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    -- The overhaul is the day's executive action (20270855 — the
    -- on-card free upgrades retired with the Logistical Overhaul
    -- card, construction parity).
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    UPDATE entrepreneur_corps SET
        treasury_cash      = COALESCE(treasury_cash, 0) - v_cost,
        exec_action_tick   = v_tick,
        design_studio_tier = CASE WHEN p_asset = 'design_studio' THEN v_tier + 1 ELSE design_studio_tier END,
        assembly_tier      = CASE WHEN p_asset = 'assembly'      THEN v_tier + 1 ELSE assembly_tier END,
        data_center_tier   = CASE WHEN p_asset = 'data_center'   THEN v_tier + 1 ELSE data_center_tier END,
        parts_depot_tier   = CASE WHEN p_asset = 'parts_depot'   THEN v_tier + 1 ELSE parts_depot_tier END,
        franchise_tier     = CASE WHEN p_asset = 'franchise'     THEN v_tier + 1 ELSE franchise_tier END
     WHERE id = p_corp_id;

    PERFORM _log_corp_history(p_corp_id, v_tick,
        format('Logistical Overhaul — upgraded the %s asset to Level %s ($%s).',
               replace(p_asset, '_', ' '), v_tier + 1, v_cost));

    RETURN jsonb_build_object('success', true,
        'asset', p_asset, 'tier', v_tier + 1, 'cost', v_cost);
END $$;

REVOKE EXECUTE ON FUNCTION public.upgrade_automotive_asset(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.upgrade_automotive_asset(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
