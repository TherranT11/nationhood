-- ════════════════════════════════════════════════════════════════════
-- 20270852 — Corporate History records every executive action
--
-- corp_history is the ledger: one line per action, written at the
-- success point of every RPC behind the Executive Actions desk —
-- construction (Submit Public Bid, Advance Build, Procurement,
-- Logistical Overhaul) and automotive (Draft Blueprint, Production
-- Run, Analyze Market, Sales Campaign via the shared resolver so the
-- CCO's campaigns log too, Expand Market). Construction's Draft
-- Blueprint and Start Project keep deriving their history from their
-- own rows as before — no double entries. The Corporate History
-- panel merges the ledger with the derived events. Every body below
-- is re-emitted byte-faithful to its latest emission plus the one
-- PERFORM line.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.corp_history (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id    uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    tick       int  NOT NULL,
    label      text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS corp_history_corp_idx ON public.corp_history (corp_id);

ALTER TABLE public.corp_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.corp_history;
CREATE POLICY "Allow select for all" ON public.corp_history
    FOR SELECT USING (true);

-- ── _log_corp_history — the one pen ───────────────────────────────
CREATE OR REPLACE FUNCTION public._log_corp_history(p_corp_id uuid, p_tick int, p_label text)
RETURNS void
LANGUAGE sql
AS $$
    INSERT INTO corp_history (corp_id, tick, label)
    VALUES (p_corp_id, COALESCE(p_tick, 0), p_label);
$$;

REVOKE EXECUTE ON FUNCTION public._log_corp_history(uuid, int, text) FROM PUBLIC;

-- ── submit_public_bid ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_public_bid(
    p_request_id   uuid,
    p_blueprint_id uuid,
    p_price        bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_bp      corp_blueprints%ROWTYPE;
    v_req     construction_project_requests%ROWTYPE;
    v_tick    int;
    v_id      uuid;
    v_ticks   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL OR p_blueprint_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_price IS NULL OR p_price < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_price');
    END IF;

    SELECT * INTO v_bp FROM corp_blueprints WHERE id = p_blueprint_id;
    IF v_bp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
    END IF;

    -- Lock the corp row: the per-tick allowance check below must
    -- serialize against a concurrent executive action.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_bp.corp_id FOR UPDATE;
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

    SELECT * INTO v_req FROM construction_project_requests WHERE id = p_request_id;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_req.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_open',
            'status', v_req.status);
    END IF;
    IF v_req.building_type <> v_bp.building_type THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_type_mismatch');
    END IF;
    -- Regulatory Compliance gates (20270826, superseding the PM
    -- Level III international privilege): the firm must hold the
    -- license tier for the building type, and foreign projects
    -- (request nation ≠ HQ) need the Tier V International Charter.
    IF reg_min_tier(v_req.building_type) > COALESCE(v_corp.reg_tier, 0) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_licensed');
    END IF;
    IF v_req.nation_id IS DISTINCT FROM v_corp.hq_nation_id
       AND COALESCE(v_corp.reg_tier, 0) < 5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'foreign_locked');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_ticks := construction_build_ticks(v_req.building_type, v_corp.pillar_speed);

    BEGIN
        INSERT INTO construction_project_bids (
            request_id, corp_id, blueprint_id, submitted_at_tick,
            price, quality, build_ticks
        ) VALUES (
            p_request_id, v_corp.id, p_blueprint_id, v_tick,
            p_price, GREATEST(1, COALESCE(v_corp.pillar_quality, 1)), v_ticks
        ) RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_bid');
    END;

    UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = v_corp.id;

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Bid $%s for the “%s” build in %s.', p_price, v_req.entity, v_req.city));
    RETURN jsonb_build_object('success', true, 'bid_id', v_id, 'build_ticks', v_ticks);
END $$;

REVOKE EXECUTE ON FUNCTION public.submit_public_bid(uuid, uuid, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.submit_public_bid(uuid, uuid, bigint) TO authenticated;

-- ── advance_build ──────────────────────────────────────────────
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

REVOKE EXECUTE ON FUNCTION public.advance_build(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.advance_build(uuid) TO authenticated;

-- ── buy_construction_goods ─────────────────────────────────────
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
    -- Procurement Efficiency (20270829): every pillar rank is −1%
    -- off the listed price, both goods, clamped at 99%.
    v_price := ROUND(v_price *
        (100 - LEAST(GREATEST(COALESCE(v_corp.pillar_efficiency, 1), 0), 99)) / 100.0)::bigint;
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

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Procured %s Construction %s ($%s).', p_qty, CASE WHEN p_good = 'materials' THEN 'Materials' ELSE 'Equipment' END, v_total));
    RETURN jsonb_build_object('success', true, 'qty', p_qty,
        'unit_price', v_price, 'total', v_total);
END $$;

REVOKE EXECUTE ON FUNCTION public.buy_construction_goods(uuid, text, int, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.buy_construction_goods(uuid, text, int, uuid, uuid) TO authenticated;

-- ── logistical_overhaul ────────────────────────────────────────
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
    -- All five assets now climb the same price ladder.
    IF p_asset NOT IN ('heavy_equipment', 'project_management', 'supply_material',
                       'regulatory_compliance', 'system_design') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_asset');
    END IF;
    IF p_asset = 'heavy_equipment' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.supply_tier, 0) + 1);
    ELSIF p_asset = 'supply_material' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.materials_tier, 0) + 1);
    ELSIF p_asset = 'regulatory_compliance' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.reg_tier, 0) + 1);
    ELSIF p_asset = 'system_design' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.design_tier, 0) + 1);
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
           reg_tier         = COALESCE(reg_tier, 0)
               + CASE WHEN p_asset = 'regulatory_compliance' THEN 1 ELSE 0 END,
           design_tier      = COALESCE(design_tier, 0)
               + CASE WHEN p_asset = 'system_design' THEN 1 ELSE 0 END,
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Logistical Overhaul — upgraded the %s asset ($%s).', replace(p_asset, '_', ' '), v_cost));
    RETURN jsonb_build_object('success', true, 'asset', p_asset, 'cost', v_cost,
        'new_tier', CASE p_asset
                         WHEN 'heavy_equipment'       THEN COALESCE(v_corp.supply_tier, 0) + 1
                         WHEN 'supply_material'       THEN COALESCE(v_corp.materials_tier, 0) + 1
                         WHEN 'regulatory_compliance' THEN COALESCE(v_corp.reg_tier, 0) + 1
                         WHEN 'system_design'         THEN COALESCE(v_corp.design_tier, 0) + 1
                         ELSE COALESCE(v_corp.pm_tier, 0) + 1 END);
END $$;

REVOKE EXECUTE ON FUNCTION public.logistical_overhaul(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.logistical_overhaul(uuid, text) TO authenticated;

-- ── draft_vehicle_blueprint ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.draft_vehicle_blueprint(
    p_corp_id       uuid,
    p_name          text,
    p_vehicle_type  text,
    p_vehicle_class text,
    p_engine        text,
    p_packages      text[],
    p_quality       text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_tick     int;
    v_id       uuid;
    v_name     text := TRIM(COALESCE(p_name, ''));
    v_packages text[];
    v_cost     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF length(v_name) < 2 OR length(v_name) > 60 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_vehicle_type NOT IN ('coupe', 'sedan', 'pickup', 'motorcycle', 'sports_car')
       OR p_vehicle_class NOT IN ('economy', 'mid_range', 'premium', 'luxury', 'ultra_luxury')
       OR p_engine NOT IN ('basic_3cyl', 'basic_4cyl', 'tuned_4cyl', 'v6', 'v8', 'v12',
                           'electric_basic', 'electric_performance', 'hybrid')
       OR p_quality NOT IN ('low', 'moderate', 'standard', 'exceptional') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Packages: dedupe, then validate against the catalog and the
    -- two fitment gates (plus the V12's market restriction).
    SELECT COALESCE(array_agg(DISTINCT x), '{}') INTO v_packages
      FROM unnest(COALESCE(p_packages, '{}')) AS x;
    IF NOT (v_packages <@ ARRAY['leather_interior', 'premium_audio', 'technology',
                                'driver_assist', 'sport_performance', 'safety',
                                'appearance', 'cold_weather', 'off_road', 'self_driving']) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF 'off_road' = ANY(v_packages) AND p_vehicle_type <> 'pickup' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'off_road_pickup_only');
    END IF;
    IF 'self_driving' = ANY(v_packages)
       AND p_vehicle_class NOT IN ('premium', 'luxury', 'ultra_luxury') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'self_driving_premium_only');
    END IF;
    IF p_engine = 'v12' AND p_vehicle_type <> 'sports_car'
       AND p_vehicle_class NOT IN ('luxury', 'ultra_luxury') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'v12_restricted');
    END IF;

    -- Lock the corp row: the allowance check and the XP debit below
    -- must serialize against a concurrent draft.
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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_cost := vehicle_blueprint_xp_cost(p_vehicle_type, p_vehicle_class, p_engine,
                                        COALESCE(array_length(v_packages, 1), 0), p_quality);
    IF COALESCE(v_corp.experience, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_experience',
            'xp_cost', v_cost, 'experience', COALESCE(v_corp.experience, 0));
    END IF;

    -- Bench Test the Components (20270847): a pending charge bakes
    -- +0.5 appeal into this Model permanently, then falls off.
    INSERT INTO vehicle_blueprints (
        corp_id, name, vehicle_type, vehicle_class, engine,
        packages, quality, xp_cost, created_at_tick, appeal_bonus
    ) VALUES (
        p_corp_id, v_name, p_vehicle_type, p_vehicle_class, p_engine,
        v_packages, p_quality, v_cost, v_tick,
        CASE WHEN COALESCE(v_corp.design_buff_appeal, 0) > 0 THEN 0.5 ELSE 0 END
    ) RETURNING id INTO v_id;

    -- The Design & Engineering Studio (20270842): every new Model
    -- grants Experience by studio level (+1/+2/+3), accruing up to
    -- the level's ceiling (20/20/20/40/60 — the grant is forfeited
    -- at the cap, never clamping down).
    UPDATE entrepreneur_corps
       SET experience = GREATEST(COALESCE(experience, 0) - v_cost,
               LEAST(design_studio_cap(COALESCE(design_studio_tier, 1)),
                     COALESCE(experience, 0) - v_cost
                     + design_studio_grant(COALESCE(design_studio_tier, 1)))),
           design_buff_appeal = GREATEST(0, COALESCE(design_buff_appeal, 0) - 1),
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Drafted the Model “%s” (%s XP).', v_name, v_cost));
    RETURN jsonb_build_object('success', true, 'blueprint_id', v_id,
        'name', v_name, 'xp_cost', v_cost);
END $$;

REVOKE EXECUTE ON FUNCTION public.draft_vehicle_blueprint(uuid, text, text, text, text, text[], text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.draft_vehicle_blueprint(uuid, text, text, text, text, text[], text) TO authenticated;

-- ── start_production_run ───────────────────────────────────────
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

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Started a production run — %s × %s ($%s).', p_quantity, v_bp.name, v_total));
    RETURN jsonb_build_object('success', true, 'run_id', v_id,
        'quantity', p_quantity, 'unit_cost', v_unit, 'total_cost', v_total,
        'bonus_units', v_bonus,
        'completes_at_tick', v_tick + p_quantity);
END $$;

REVOKE EXECUTE ON FUNCTION public.start_production_run(uuid, uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.start_production_run(uuid, uuid, int) TO authenticated;

-- ── analyze_vehicle_market ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.analyze_vehicle_market(
    p_corp_id      uuid,
    p_vehicle_type text,
    p_nation_id    uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_nation  nations%ROWTYPE;
    v_tick    int;
    v_share   numeric;
    v_demand  numeric;
    v_aff     numeric;
    v_w       numeric[];
    v_total   numeric;
    v_classes jsonb := '[]'::jsonb;
    v_names   text[] := ARRAY['economy', 'mid_range', 'premium', 'luxury', 'ultra_luxury'];
    v_sale    bigint;
    i         int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_vehicle_type NOT IN ('coupe', 'sedan', 'pickup', 'motorcycle', 'sports_car') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the allowance spend below must serialize.
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

    -- Home turf by default; a Quality & Data Center at Level III+
    -- (20270842) unlocks analyzing another nation.
    IF p_nation_id IS NOT NULL AND p_nation_id <> v_corp.hq_nation_id
       AND COALESCE(v_corp.data_center_tier, 1) < 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'data_center_too_small');
    END IF;
    SELECT * INTO v_nation FROM nations
     WHERE id = COALESCE(p_nation_id, v_corp.hq_nation_id)
       AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- Monthly demand: population ÷ 100k × the type's market share,
    -- class weights from affluence — both via the 20270839 helpers
    -- shared with run_sales_campaign.
    v_share := vehicle_type_share(p_vehicle_type);
    v_demand := vehicle_type_monthly_demand(v_nation.population, p_vehicle_type);

    v_aff := (GREATEST(1, COALESCE(v_nation.standard_of_living, 50))
              + GREATEST(1, COALESCE(v_nation.wages, 50))) / 2.0;
    v_w := ARRAY[
        vehicle_class_weight('economy',      v_aff),
        vehicle_class_weight('mid_range',    v_aff),
        vehicle_class_weight('premium',      v_aff),
        vehicle_class_weight('luxury',       v_aff),
        vehicle_class_weight('ultra_luxury', v_aff)
    ];
    v_total := v_w[1] + v_w[2] + v_w[3] + v_w[4] + v_w[5];

    FOR i IN 1..5 LOOP
        v_classes := v_classes || jsonb_build_array(jsonb_build_object(
            'class',         v_names[i],
            'desire_pct',    ROUND(v_w[i] / v_total * 100),
            'monthly_units', ROUND(v_demand * v_w[i] / v_total)));
    END LOOP;

    -- The showroom: every unit of this type sitting in the inventory
    -- of a corp headquartered in the nation.
    SELECT COALESCE(SUM(vb.units_in_stock), 0)
           + COALESCE((SELECT SUM(ms.units) FROM vehicle_market_stock ms
                         JOIN vehicle_blueprints mb ON mb.id = ms.blueprint_id
                        WHERE ms.nation_id = v_nation.id
                          AND mb.vehicle_type = p_vehicle_type), 0)
      INTO v_sale
      FROM vehicle_blueprints vb
      JOIN entrepreneur_corps ec ON ec.id = vb.corp_id
     WHERE ec.hq_nation_id = v_nation.id
       AND vb.vehicle_type = p_vehicle_type;

    -- The analysis is the day's executive action.
    UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = p_corp_id;

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Analyzed the %s market in %s.', replace(p_vehicle_type, '_', ' '), v_nation.name));
    RETURN jsonb_build_object(
        'success',        true,
        'nation',         v_nation.name,
        'vehicle_type',   p_vehicle_type,
        'monthly_demand', ROUND(v_demand),
        'affluence',      ROUND(v_aff),
        'classes',        v_classes,
        'for_sale_units', v_sale
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.analyze_vehicle_market(uuid, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.analyze_vehicle_market(uuid, text, uuid) TO authenticated;

-- ── _resolve_sales_campaign — both campaign channels log here ──
CREATE OR REPLACE FUNCTION public._resolve_sales_campaign(
    p_corp_id      uuid,
    p_nation_id    uuid,
    p_blueprint_id uuid,
    p_price        bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_corp   entrepreneur_corps%ROWTYPE;
    v_bp     vehicle_blueprints%ROWTYPE;
    v_nation nations%ROWTYPE;
    v_tick   int;
    v_aff    numeric;
    v_w      numeric;
    v_wsum   numeric;
    v_units  numeric;
    v_appeal numeric;
    v_comp   numeric;
    v_sold   int;
    v_rev    bigint;
    v_home   boolean;
    v_summit boolean;
    v_presence corp_market_presence%ROWTYPE;
    v_stockrow vehicle_market_stock%ROWTYPE;
    v_stock  int;
BEGIN
    IF p_corp_id IS NULL OR p_nation_id IS NULL OR p_blueprint_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_price IS NULL OR p_price < 1 OR p_price > 100000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_price');
    END IF;

    -- Lock the corp row: the allowance spend and the revenue credit
    -- below must serialize.
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

    SELECT * INTO v_nation FROM nations
     WHERE id = p_nation_id AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;

    -- Home campaigns sell HQ inventory; foreign ones need presence
    -- there (Expand Market, 20270840) and sell the stock you shipped.
    -- A Subsidiary's local badge earns +1 appeal.
    v_home := (p_nation_id = v_corp.hq_nation_id);
    IF NOT v_home THEN
        SELECT * INTO v_presence FROM corp_market_presence
         WHERE corp_id = p_corp_id AND nation_id = p_nation_id;
        IF v_presence.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'not_in_market');
        END IF;
        SELECT * INTO v_stockrow FROM vehicle_market_stock
         WHERE blueprint_id = p_blueprint_id AND nation_id = p_nation_id;
        v_stock := COALESCE(v_stockrow.units, 0);
    ELSE
        v_stock := COALESCE(v_bp.units_in_stock, 0);
    END IF;
    IF v_stock < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_stock');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- The month's demand for this type × class in the nation
    -- (identical math to analyze_vehicle_market via the helpers).
    v_aff := (GREATEST(1, COALESCE(v_nation.standard_of_living, 50))
              + GREATEST(1, COALESCE(v_nation.wages, 50))) / 2.0;
    v_w := vehicle_class_weight(v_bp.vehicle_class, v_aff);
    v_wsum := vehicle_class_weight('economy', v_aff) + vehicle_class_weight('mid_range', v_aff)
            + vehicle_class_weight('premium', v_aff) + vehicle_class_weight('luxury', v_aff)
            + vehicle_class_weight('ultra_luxury', v_aff);
    v_units := vehicle_type_monthly_demand(v_nation.population, v_bp.vehicle_type)
               * v_w / v_wsum;

    -- Gas prices and disposable income: high Energy on hand helps,
    -- a high Cost of Living hurts.
    v_units := v_units
        * GREATEST(0.5, LEAST(1.5, GREATEST(0, COALESCE(v_nation.energy, 0)) / 50.0))
        * GREATEST(0.5, LEAST(1.5, 50.0 / GREATEST(1, COALESCE(v_nation.cost_of_living, 50))));

    -- Pricing against the class anchor: undercutting sells more.
    -- Sweeten the Financing (20270846): the demand math reads the
    -- price 10% lower than the full sticker the buyers actually pay.
    v_units := v_units * GREATEST(0.4, LEAST(1.6,
        vehicle_class_anchor_price(v_bp.vehicle_class)::numeric
        / (p_price * CASE WHEN COALESCE(v_corp.sales_buff_price, 0) > 0 THEN 0.90 ELSE 1 END)));

    -- Appeal share against competitor Models of the same type with
    -- stock, HQ'd in the nation.
    -- Dealer Summit (20270850): the CCO's call applies to the next
    -- campaign IN THE SUMMIT'S NATION and falls off there — campaigns
    -- elsewhere leave the charge standing.
    v_summit := (v_corp.summit_nation_id = p_nation_id);
    v_appeal := vehicle_appeal(v_bp.engine, v_bp.quality,
                               COALESCE(array_length(v_bp.packages, 1), 0))
                -- Bench-tested designs (20270847) carry their bonus.
                + COALESCE(v_bp.appeal_bonus, 0)
                + CASE WHEN NOT v_home AND (v_presence).kind = 'subsidiary' THEN 1 ELSE 0 END
                -- Sharpen the Pitch (20270846): the rep's polish.
                + CASE WHEN COALESCE(v_corp.sales_buff_appeal, 0) > 0 THEN 0.5 ELSE 0 END
                + CASE WHEN v_summit THEN 1.5 ELSE 0 END;
    -- Rivals with stock IN this nation: locals' HQ inventory plus
    -- anything foreigners shipped in (their subsidiary badges don't
    -- defend — the bonus is the campaigner's edge).
    SELECT COALESCE(SUM(vehicle_appeal(vb.engine, vb.quality,
                                       COALESCE(array_length(vb.packages, 1), 0))
                        + COALESCE(vb.appeal_bonus, 0)), 0)
      INTO v_comp
      FROM vehicle_blueprints vb
      JOIN entrepreneur_corps ec ON ec.id = vb.corp_id
     WHERE vb.vehicle_type = v_bp.vehicle_type
       AND vb.corp_id <> p_corp_id
       AND ((ec.hq_nation_id = p_nation_id AND COALESCE(vb.units_in_stock, 0) > 0)
            OR EXISTS (SELECT 1 FROM vehicle_market_stock ms
                        WHERE ms.blueprint_id = vb.id
                          AND ms.nation_id = p_nation_id
                          AND ms.units > 0));
    v_units := v_units * v_appeal / (v_appeal + v_comp);

    -- Franchise & Commercial Suite (20270842): the network adds
    -- Demand at home by suite level (+1/+2/+3/+4, retained at V),
    -- and Subsidiary-brand campaigns gain +1/+2/+3 from Level III.
    IF v_home THEN
        v_units := v_units + franchise_home_demand(COALESCE(v_corp.franchise_tier, 1));
    ELSIF (v_presence).kind = 'subsidiary' THEN
        v_units := v_units + franchise_subsidiary_demand(COALESCE(v_corp.franchise_tier, 1));
    END IF;

    -- Drum Up Buyers (20270846): +10% units, rounded up, min +1 —
    -- applied before the stock cap.
    IF COALESCE(v_corp.sales_buff_units, 0) > 0 THEN
        v_units := v_units + GREATEST(1, CEIL(FLOOR(v_units) * 0.10));
    END IF;

    v_sold := LEAST(v_stock, FLOOR(v_units)::int);
    v_rev  := v_sold::bigint * p_price;

    IF v_home THEN
        UPDATE vehicle_blueprints
           SET units_in_stock = units_in_stock - v_sold
         WHERE id = v_bp.id;
    ELSE
        UPDATE vehicle_market_stock
           SET units = units - v_sold
         WHERE id = (v_stockrow).id;
    END IF;
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) + v_rev,
           sales_buff_units  = GREATEST(0, COALESCE(sales_buff_units, 0) - 1),
           sales_buff_appeal = GREATEST(0, COALESCE(sales_buff_appeal, 0) - 1),
           sales_buff_price  = GREATEST(0, COALESCE(sales_buff_price, 0) - 1),
           summit_nation_id  = CASE WHEN v_summit THEN NULL ELSE summit_nation_id END
     WHERE id = p_corp_id;
    IF v_rev > 0 THEN
        PERFORM stamp_entrepreneur_corp_revenue(p_corp_id, v_tick, v_rev);
    END IF;

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Sales campaign in %s — sold %s × %s for $%s.', v_nation.name, v_sold, v_bp.name, v_rev));
    RETURN jsonb_build_object(
        'success', true,
        'sold',    v_sold,
        'revenue', v_rev,
        'name',    v_bp.name,
        'price',   p_price,
        'nation',  v_nation.name
    );
END $$;

REVOKE EXECUTE ON FUNCTION public._resolve_sales_campaign(uuid, uuid, uuid, bigint) FROM PUBLIC;

-- ── expand_market ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.expand_market(
    p_corp_id         uuid,
    p_nation_id       uuid,
    p_kind            text,
    p_subsidiary_name text,
    p_shipments       jsonb
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
    v_cost     bigint := 0;
    v_name     text := TRIM(COALESCE(p_subsidiary_name, ''));
    v_shipped  int := 0;
    r          RECORD;
    v_bp       vehicle_blueprints%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_kind NOT IN ('expansion', 'subsidiary') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_kind');
    END IF;

    -- Lock the corp row: allowance, fee, and HQ stock deductions
    -- below must serialize.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'automotive' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;
    IF p_nation_id = v_corp.hq_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'home_nation');
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

    SELECT * INTO v_nation FROM nations
     WHERE id = p_nation_id AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- Validate every shipment BEFORE any money moves (20270844): a
    -- bad row must not leave the entry fee paid with nothing shipped
    -- (a plain RETURN does not roll back the debit). The row locks
    -- taken here also serialize the stock deductions below.
    FOR r IN SELECT * FROM jsonb_to_recordset(COALESCE(p_shipments, '[]'::jsonb))
                  AS x(blueprint_id uuid, units int, local_name text, list_price bigint)
    LOOP
        SELECT * INTO v_bp FROM vehicle_blueprints
         WHERE id = r.blueprint_id AND corp_id = p_corp_id
         FOR UPDATE;
        IF v_bp.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
        END IF;
        IF COALESCE(r.units, 0) < 0 OR COALESCE(r.units, 0) > COALESCE(v_bp.units_in_stock, 0) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'ship_exceeds_stock',
                'model', v_bp.name, 'have', COALESCE(v_bp.units_in_stock, 0));
        END IF;
    END LOOP;

    SELECT * INTO v_presence FROM corp_market_presence
     WHERE corp_id = p_corp_id AND nation_id = p_nation_id;

    IF v_presence.id IS NULL THEN
        -- First entry pays the fee: $10M flat to expand, or
        -- $7M × the TARGET nation's Standard of Living / 50 for a
        -- named subsidiary.
        IF p_kind = 'subsidiary' THEN
            IF length(v_name) < 2 OR length(v_name) > 60 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
            END IF;
            v_cost := ROUND(7000000
                * GREATEST(1, COALESCE(v_nation.standard_of_living, 50)) / 50.0)::bigint;
        ELSE
            v_cost := 10000000;
        END IF;
        IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_cost THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
                'need', v_cost, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
        END IF;
        INSERT INTO corp_market_presence (
            corp_id, nation_id, kind, subsidiary_name, cost_paid, established_tick
        ) VALUES (
            p_corp_id, p_nation_id, p_kind,
            CASE WHEN p_kind = 'subsidiary' THEN v_name END, v_cost, v_tick
        ) RETURNING * INTO v_presence;
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) - v_cost
         WHERE id = p_corp_id;
    END IF;
    -- Already present: the re-run ships and re-prices for free.

    -- Shipments (validated above): move units HQ → nation, set
    -- standing prices, and (subsidiaries only) the local Model names.
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
        VALUES (p_corp_id, p_nation_id, r.blueprint_id, COALESCE(r.units, 0),
                CASE WHEN v_presence.kind = 'subsidiary' THEN NULLIF(TRIM(COALESCE(r.local_name, '')), '') END,
                r.list_price)
        ON CONFLICT (blueprint_id, nation_id) DO UPDATE
           SET units      = vehicle_market_stock.units + COALESCE(EXCLUDED.units, 0),
               local_name = CASE WHEN v_presence.kind = 'subsidiary'
                                 THEN COALESCE(EXCLUDED.local_name, vehicle_market_stock.local_name)
                                 ELSE vehicle_market_stock.local_name END,
               list_price = COALESCE(EXCLUDED.list_price, vehicle_market_stock.list_price);
    END LOOP;

    UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = p_corp_id;

    PERFORM _log_corp_history(p_corp_id, v_tick, CASE
        WHEN v_cost > 0 AND v_presence.kind = 'subsidiary'
            THEN format('Opened the subsidiary “%s” in %s ($%s)%s', v_presence.subsidiary_name, v_nation.name, v_cost,
                        CASE WHEN v_shipped > 0 THEN format(' — shipped %s vehicle(s).', v_shipped) ELSE '.' END)
        WHEN v_cost > 0
            THEN format('Expanded into %s ($%s)%s', v_nation.name, v_cost,
                        CASE WHEN v_shipped > 0 THEN format(' — shipped %s vehicle(s).', v_shipped) ELSE '.' END)
        ELSE format('Shipped %s vehicle(s) to %s.', v_shipped, v_nation.name)
    END);
    RETURN jsonb_build_object(
        'success',   true,
        'kind',      v_presence.kind,
        'name',      v_presence.subsidiary_name,
        'cost_paid', v_cost,
        'shipped',   v_shipped,
        'nation',    v_nation.name
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.expand_market(uuid, uuid, text, text, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.expand_market(uuid, uuid, text, text, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
