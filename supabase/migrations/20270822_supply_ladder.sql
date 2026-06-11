-- ════════════════════════════════════════════════════════════════════
-- 20270822 — Supply & Material Depot: The Logistics Hub
--
-- The third asset ladder, on its own column (materials_tier):
--
--   0  Retail Hardware Store           project-bound material buys
--   I  Storage Shed & Laydown    $7M   store 20
--   II Municipal Distribution    $10M  store 60
--   III Regional Supply Terminal $16M  store 85 · buy from ABROAD
--   IV Deep-Water Staging        $25M  store 120 · sell nationally
--                                      chartered (marketplace later)
--   V  Sovereign Conglomerate    $40M  store 170 · sell on the world
--                                      market chartered
--
-- Costs mirror the yard ladder (no figures were given; consistent
-- with both prior rulings — split the ladders apart any time).
-- "Project Manager or Owner/CEO": procurement opens to PLAYER hires
-- of the corp, not just the owner; the PM-side buying UI arrives
-- with the Current Role actions.
--
--   materials_storage_cap(tier): the one home of 0/20/60/85/120/170.
--   logistical_overhaul re-emitted (supply_material upgradeable on
--   materials_tier). buy_construction_goods re-emitted: PM-or-owner
--   buyer gate; materials project-bound at every level OR into the
--   depot at Level I+; foreign materials at Level III+. Selling at
--   IV/V is chartered; the player-priced marketplace is the same
--   later build as equipment's.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS materials_tier int NOT NULL DEFAULT 0 CHECK (materials_tier >= 0);

-- ── materials_storage_cap ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.materials_storage_cap(p_tier int)
RETURNS int
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE
        WHEN COALESCE(p_tier, 0) >= 5 THEN 170
        WHEN COALESCE(p_tier, 0) >= 4 THEN 120
        WHEN COALESCE(p_tier, 0) >= 3 THEN 85
        WHEN COALESCE(p_tier, 0) >= 2 THEN 60
        WHEN COALESCE(p_tier, 0) >= 1 THEN 20
        ELSE 0
    END;
$$;

COMMENT ON FUNCTION public.materials_storage_cap(int) IS
    'Supply & Material Depot storage caps by materials_tier (20270822): 0/20/60/85/120/170. The ONLY place these caps live.';

-- ── logistical_overhaul — Supply & Material joins ─────────────────
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

    -- Three assets have chartered ladders: the yard (HEAVY
    -- EQUIPMENT), PROJECT MANAGEMENT, and SUPPLY & MATERIAL. All
    -- climb the same price ladder (design calls: PM and Supply
    -- mirror the yard's $7-40M).
    IF p_asset NOT IN ('heavy_equipment', 'project_management', 'supply_material') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_higher_tiers');
    END IF;
    IF p_asset = 'heavy_equipment' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.supply_tier, 0) + 1);
    ELSIF p_asset = 'supply_material' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.materials_tier, 0) + 1);
    ELSE
        v_cost := yard_upgrade_cost(COALESCE(v_corp.pm_tier, 0) + 1);
        -- PM levels also demand owned commercial buildings — checks
        -- that cannot pass until commercial categories are chartered.
        IF v_cost IS NOT NULL
           AND NOT _pm_upgrade_requirement_met(p_corp_id, COALESCE(v_corp.pm_tier, 0) + 1) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'requires_building');
        END IF;
    END IF;
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
           supply_tier      = COALESCE(supply_tier, 0)
               + CASE WHEN p_asset = 'heavy_equipment' THEN 1 ELSE 0 END,
           pm_tier          = COALESCE(pm_tier, 0)
               + CASE WHEN p_asset = 'project_management' THEN 1 ELSE 0 END,
           materials_tier   = COALESCE(materials_tier, 0)
               + CASE WHEN p_asset = 'supply_material' THEN 1 ELSE 0 END,
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'asset', p_asset, 'cost', v_cost,
        'new_tier', CASE p_asset
                         WHEN 'heavy_equipment' THEN COALESCE(v_corp.supply_tier, 0) + 1
                         WHEN 'supply_material' THEN COALESCE(v_corp.materials_tier, 0) + 1
                         ELSE COALESCE(v_corp.pm_tier, 0) + 1 END);
END $$;

REVOKE EXECUTE ON FUNCTION public.logistical_overhaul(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.logistical_overhaul(uuid, text) TO authenticated;

-- ── buy_construction_goods — depot storage + PM buyers ────────────
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

    -- Buyer gate (20270822): the Owner/CEO — or a PLAYER hired by
    -- this corp (the Project Manager clause) — runs procurement.
    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        SELECT f.* INTO v_fac
          FROM factions f
          JOIN job_applicants a ON a.applicant_faction_id = f.id
          JOIN job_openings o ON o.id = a.opening_id
         WHERE (f.id = v_uid OR f.linked_user_id = v_uid)
           AND f.abandoned_at IS NULL
           AND a.status = 'hired'
           AND o.corp_id = p_corp_id
         LIMIT 1;
    END IF;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    v_caps := yard_storage_caps(COALESCE(v_corp.supply_tier, 0));

    IF p_good = 'materials' THEN
        -- Supply & Material Depot (20270822): foreign sourcing opens
        -- at Depot Level III.
        IF COALESCE(v_corp.materials_tier, 0) < 3
           AND p_nation_id <> v_corp.hq_nation_id THEN
            RETURN jsonb_build_object('success', false, 'reason', 'home_nation_only');
        END IF;
        IF p_project_id IS NOT NULL THEN
            -- Project-bound buy — allowed at every depot level.
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
            -- Into the depot — Level I+ only, capped by depot tier.
            IF materials_storage_cap(COALESCE(v_corp.materials_tier, 0)) = 0 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'project_required');
            END IF;
            IF COALESCE(v_corp.materials_stock, 0) + p_qty
               > materials_storage_cap(COALESCE(v_corp.materials_tier, 0)) THEN
                RETURN jsonb_build_object('success', false, 'reason', 'storage_full',
                    'cap', materials_storage_cap(COALESCE(v_corp.materials_tier, 0)),
                    'stock', COALESCE(v_corp.materials_stock, 0));
            END IF;
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

    IF p_good = 'materials' THEN
        IF p_project_id IS NOT NULL THEN
            UPDATE corp_construction_projects
               SET materials_supplied = materials_supplied + p_qty
             WHERE id = p_project_id;
        ELSE
            UPDATE entrepreneur_corps
               SET materials_stock = COALESCE(materials_stock, 0) + p_qty
             WHERE id = p_corp_id;
        END IF;
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

REVOKE EXECUTE ON FUNCTION public.buy_construction_goods(uuid, text, int, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.buy_construction_goods(uuid, text, int, uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
