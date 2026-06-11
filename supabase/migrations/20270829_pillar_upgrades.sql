-- ════════════════════════════════════════════════════════════════════
-- 20270829 — Pillar upgrades: the Experience spend
--
-- The loop closes: Experience earned from completed projects is
-- spent raising the three Core Metrics, exactly as Draft Blueprint's
-- mechanic promised ("allocating Experience Points into Speed,
-- Procurement, or Quality").
--
--   upgrade_pillar(corp, pillar): +1 to the chosen pillar for
--   current_level × 10 EP ("Level 1 = 10, 2 = 20, 3 = 30") — the
--   Experience caps (30/50/80 by System Design tier) are the natural
--   ceiling on how far a firm can climb. Owner-only; does NOT spend
--   the tick's executive action (EP is the constraint — flag to
--   change).
--
--   PROCUREMENT EFFICIENCY REDEFINED (user spec): every rank is −1%
--   off the purchase price of Construction Materials AND Equipment —
--   buy_construction_goods re-emitted byte-faithful to 20270822 plus
--   the one discount line (the RPC's returned unit_price is the
--   charged, discounted figure).
--
--   STRUCTURAL SPEED REDEFINED (user spec): one point = −1% build
--   time, not −1 tick. construction_build_ticks re-emitted:
--   ticks = ROUND(baseline × (100 − speed) / 100), floor 1, speed
--   clamped at 99%. Both bid snapshots and self-builds read the one
--   helper, so the new curve applies everywhere at once.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── construction_build_ticks — percent model ──────────────────────
CREATE OR REPLACE FUNCTION public.construction_build_ticks(
    p_building_type text,
    p_speed         int
) RETURNS int
LANGUAGE sql IMMUTABLE
AS $$
    SELECT GREATEST(1, ROUND(
        CASE p_building_type
            WHEN 'single_story_home'     THEN 4
            WHEN 'double_story'          THEN 6
            WHEN 'multitenant_living'    THEN 9
            WHEN 'infrastructure_tier_i' THEN 12
            ELSE 6
        END * (100 - LEAST(GREATEST(COALESCE(p_speed, 1), 0), 99)) / 100.0)::int);
$$;

COMMENT ON FUNCTION public.construction_build_ticks(text, int) IS
    'Canonical build time (20270829 percent model): type baseline (4/6/9/12 ticks) × (100 − Structural Speed)% — one pillar point is −1% build time — rounded, floor 1. The ONLY place these numbers live.';

-- ── upgrade_pillar ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upgrade_pillar(
    p_corp_id uuid,
    p_pillar  text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_corp  entrepreneur_corps%ROWTYPE;
    v_level int;
    v_cost  numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_pillar NOT IN ('speed', 'efficiency', 'quality') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the EP balance check must serialize.
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

    v_level := CASE p_pillar
        WHEN 'speed'      THEN COALESCE(v_corp.pillar_speed, 1)
        WHEN 'efficiency' THEN COALESCE(v_corp.pillar_efficiency, 1)
        ELSE                   COALESCE(v_corp.pillar_quality, 1)
    END;
    v_cost := v_level * 10;

    IF COALESCE(v_corp.experience, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_experience',
            'need', v_cost, 'have', COALESCE(v_corp.experience, 0));
    END IF;

    UPDATE entrepreneur_corps
       SET experience        = COALESCE(experience, 0) - v_cost,
           pillar_speed      = pillar_speed      + CASE WHEN p_pillar = 'speed'      THEN 1 ELSE 0 END,
           pillar_efficiency = pillar_efficiency + CASE WHEN p_pillar = 'efficiency' THEN 1 ELSE 0 END,
           pillar_quality    = pillar_quality    + CASE WHEN p_pillar = 'quality'    THEN 1 ELSE 0 END
     WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true,
        'pillar', p_pillar, 'new_level', v_level + 1, 'cost', v_cost);
END $$;

REVOKE EXECUTE ON FUNCTION public.upgrade_pillar(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.upgrade_pillar(uuid, text) TO authenticated;

-- ── buy_construction_goods — the efficiency discount ─────────────
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

    RETURN jsonb_build_object('success', true, 'qty', p_qty,
        'unit_price', v_price, 'total', v_total);
END $$;

REVOKE EXECUTE ON FUNCTION public.buy_construction_goods(uuid, text, int, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.buy_construction_goods(uuid, text, int, uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
