-- ════════════════════════════════════════════════════════════════════
-- 20270818 — Executive Actions: Logistical Overhaul (the yard ladder
-- grows to six levels)
--
-- The fifth slot. Process completion history and capital to
-- permanently upgrade a corporate Asset, one level per action:
--
--   0 Commercial Rental Yard         —        no storage; L0 buys
--                                              fulfill a project
--   I Local Maintenance Yard         $7M      10 materials, home only
--   II District Equipment Depot      $10M     +5 equipment (home);
--                                              materials from any nation
--   III Regional Machinery Hub       $16M     10 equipment, any nation
--   IV National Fleet Logistics      $25M     corp-to-corp resale
--                                              chartered (market TBD)
--   V Automated Global Asset Fleet   $40M     20/20 storage, −10% on
--                                              all purchases
--
-- HEAVY EQUIPMENT (the yard) is the only asset with chartered higher
-- tiers; the other four appear in the modal and join as their
-- ladders are designed. Upgrading spends the tick's executive
-- action. The Level IV+ resale permission is chartered here; the
-- corp-to-corp marketplace itself is a separate build.
--
--   yard_upgrade_cost(next_tier): the one home of the price ladder.
--   yard_storage_caps re-emitted for the six-level caps.
--   buy_construction_goods re-emitted byte-faithful to 20270817
--   except equipment's foreign-sourcing gate (Level III+) and the
--   Level V −10% price line.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── yard_upgrade_cost ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.yard_upgrade_cost(p_next_tier int)
RETURNS bigint
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_next_tier
        WHEN 1 THEN  7000000::bigint
        WHEN 2 THEN 10000000::bigint
        WHEN 3 THEN 16000000::bigint
        WHEN 4 THEN 25000000::bigint
        WHEN 5 THEN 40000000::bigint
        ELSE NULL
    END;
$$;

COMMENT ON FUNCTION public.yard_upgrade_cost(int) IS
    'Logistical Overhaul price ladder (20270818): $7M/$10M/$16M/$25M/$40M for levels I-V. The ONLY place these prices live; the modal mirrors them for display.';

-- ── yard_storage_caps — six levels ────────────────────────────────
CREATE OR REPLACE FUNCTION public.yard_storage_caps(
    p_tier int,
    OUT materials_cap int,
    OUT equipment_cap int
) LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE WHEN COALESCE(p_tier, 0) >= 5 THEN 20
                WHEN COALESCE(p_tier, 0) >= 1 THEN 10
                ELSE 0 END,
           CASE WHEN COALESCE(p_tier, 0) >= 5 THEN 20
                WHEN COALESCE(p_tier, 0) >= 3 THEN 10
                WHEN COALESCE(p_tier, 0) >= 2 THEN 5
                ELSE 0 END;
$$;

COMMENT ON FUNCTION public.yard_storage_caps(int) IS
    'Yard storage caps by supply_tier (20270818): L0 none; L1-IV 10 materials; L2 +5 equipment, L3-IV 10; LV 20/20. The ONLY place these caps live.';

-- ── logistical_overhaul ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.logistical_overhaul(
    p_corp_id uuid,
    p_asset   text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tick int;
    v_cost bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_asset IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_asset NOT IN ('project_management', 'heavy_equipment', 'supply_material',
                       'system_design', 'regulatory_compliance') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_asset');
    END IF;

    -- Lock the corp row: allowance + treasury checks must serialize.
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

    -- Only the yard (HEAVY EQUIPMENT) has chartered higher tiers.
    IF p_asset <> 'heavy_equipment' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_higher_tiers');
    END IF;
    v_cost := yard_upgrade_cost(COALESCE(v_corp.supply_tier, 0) + 1);
    IF v_cost IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'max_tier');
    END IF;

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
           supply_tier      = COALESCE(supply_tier, 0) + 1,
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true,
        'asset', p_asset, 'new_tier', COALESCE(v_corp.supply_tier, 0) + 1, 'cost', v_cost);
END $$;

REVOKE EXECUTE ON FUNCTION public.logistical_overhaul(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.logistical_overhaul(uuid, text) TO authenticated;

-- ── buy_construction_goods — Level III+ foreign equipment, LV −10% ─
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

    -- Lock the corp row: allowance + stock checks must serialize.
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

    -- Tier sourcing rules. Materials: home only until Level II.
    -- Equipment: home only, and storable only at Level II.
    IF p_good = 'materials' THEN
        IF COALESCE(v_corp.supply_tier, 0) < 2
           AND p_nation_id <> v_corp.hq_nation_id THEN
            RETURN jsonb_build_object('success', false, 'reason', 'home_nation_only');
        END IF;
    ELSE
        -- Equipment sources from other nations at Level III+.
        IF COALESCE(v_corp.supply_tier, 0) < 3
           AND p_nation_id <> v_corp.hq_nation_id THEN
            RETURN jsonb_build_object('success', false, 'reason', 'home_nation_only');
        END IF;
        IF v_caps.equipment_cap = 0 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_storage');
        END IF;
        IF v_corp.equipment_stock + p_qty > v_caps.equipment_cap THEN
            RETURN jsonb_build_object('success', false, 'reason', 'storage_full',
                'cap', v_caps.equipment_cap, 'stock', v_corp.equipment_stock);
        END IF;
    END IF;

    -- Materials destination: Level 0 buys straight into an active
    -- project (no storage); Level I+ buys into the yard.
    IF p_good = 'materials' THEN
        IF v_caps.materials_cap = 0 THEN
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
        ELSIF v_corp.materials_stock + p_qty > v_caps.materials_cap THEN
            RETURN jsonb_build_object('success', false, 'reason', 'storage_full',
                'cap', v_caps.materials_cap, 'stock', v_corp.materials_stock);
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
    -- Level V — Automated Global Asset Fleet: −10% on all purchases.
    IF COALESCE(v_corp.supply_tier, 0) >= 5 THEN
        v_price := ROUND(v_price * 0.9);
    END IF;
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

    -- Commit the purchase.
    UPDATE entrepreneur_corps
       SET treasury_cash    = COALESCE(treasury_cash, 0) - v_total,
           exec_action_tick = v_tick,
           materials_stock  = materials_stock
               + CASE WHEN p_good = 'materials' AND v_caps.materials_cap > 0 THEN p_qty ELSE 0 END,
           equipment_stock  = equipment_stock
               + CASE WHEN p_good = 'equipment' THEN p_qty ELSE 0 END
     WHERE id = p_corp_id;

    IF p_good = 'materials' AND v_caps.materials_cap = 0 THEN
        UPDATE corp_construction_projects
           SET materials_supplied = materials_supplied + p_qty
         WHERE id = p_project_id;
    END IF;

    -- Equipment leaves the seller nation's ratcheting stock — the
    -- ratchet's only down-path. Conditional so a concurrent buyer
    -- can't drive it negative.
    IF p_good = 'equipment' THEN
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

REVOKE EXECUTE ON FUNCTION public.buy_construction_goods(uuid, text, int, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.buy_construction_goods(uuid, text, int, uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
