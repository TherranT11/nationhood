-- ════════════════════════════════════════════════════════════════════
-- 20270817 — The yard ladder: storage, purchasing, and supplied builds
--
-- supply_tier (20270816) is THE yard — displayed as the HEAVY
-- EQUIPMENT department's tier:
--
--   Level 0  Commercial Rental Yard    no storage. May buy
--            Construction Materials only to fulfill an active
--            project, home nation only — the purchase applies
--            straight to the project.
--   Level I  Local Maintenance Yard    store up to 10 materials,
--            home-nation purchases only.
--   Level II District Equipment Depot  10 materials (now purchasable
--            from other nations) + 5 Construction Equipment
--            (home nation only).
--
-- Consumption (design call): a build cannot COMPLETE until its
-- blueprint's materials_needed have been supplied. Ticks and Advance
-- Build still move it; a due-but-unsupplied project parks until the
-- yard delivers. Equipment has no project sink yet — it stores at
-- Level II and waits for its mechanic.
--
--   entrepreneur_corps.materials_stock / equipment_stock: the yard.
--   corp_construction_projects.materials_supplied: per-build ledger.
--   Existing building projects are GRANDFATHERED (supplied = need) —
--   they started before materials existed.
--
--   yard_storage_caps(tier): the one place the 10/5 caps live.
--
--   buy_construction_goods: owner-only; prices read THROUGH the
--   canonical market functions (the listed price IS the charged
--   price); equipment purchases decrement the seller nation's
--   ratcheting stock — the ratchet's only down-path. Each purchase
--   spends the tick's executive action (it IS Procurement Run).
--
--   apply_materials_to_project: free logistics — the owner or the
--   project's player PM moves yard stock onto an active build.
--
--   complete_construction_projects: byte-faithful to 20270810 except
--   the supplied-materials gate on the sweep's WHERE.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS materials_stock int NOT NULL DEFAULT 0 CHECK (materials_stock >= 0),
    ADD COLUMN IF NOT EXISTS equipment_stock int NOT NULL DEFAULT 0 CHECK (equipment_stock >= 0);

ALTER TABLE public.corp_construction_projects
    ADD COLUMN IF NOT EXISTS materials_supplied int NOT NULL DEFAULT 0 CHECK (materials_supplied >= 0);

-- Grandfather: builds started before materials existed owe nothing.
UPDATE public.corp_construction_projects p
   SET materials_supplied = COALESCE((
       SELECT b.materials_needed FROM corp_blueprints b WHERE b.id = p.blueprint_id), 0)
 WHERE p.status = 'building';

-- ── yard_storage_caps — the one home of the tier caps ─────────────
CREATE OR REPLACE FUNCTION public.yard_storage_caps(
    p_tier int,
    OUT materials_cap int,
    OUT equipment_cap int
) LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE WHEN COALESCE(p_tier, 0) >= 1 THEN 10 ELSE 0 END,
           CASE WHEN COALESCE(p_tier, 0) >= 2 THEN 5  ELSE 0 END;
$$;

COMMENT ON FUNCTION public.yard_storage_caps(int) IS
    'Yard storage caps by supply_tier (20270817): L0 none, L1 10 materials, L2 10 materials + 5 equipment. The ONLY place these caps live.';

-- ── buy_construction_goods ────────────────────────────────────────
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
        IF p_nation_id <> v_corp.hq_nation_id THEN
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

-- ── apply_materials_to_project ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.apply_materials_to_project(
    p_project_id uuid,
    p_qty        int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_proj    corp_construction_projects%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_need    int;
    v_allowed boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_project_id IS NULL OR p_qty IS NULL OR p_qty < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_proj FROM corp_construction_projects
     WHERE id = p_project_id FOR UPDATE;
    IF v_proj.id IS NULL OR v_proj.status <> 'building' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'project_not_found');
    END IF;
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_proj.corp_id FOR UPDATE;

    -- The owner — or the project's assigned PM when that hire is a
    -- real player — can move yard stock onto the build.
    SELECT EXISTS (
        SELECT 1 FROM factions f
         WHERE (f.id = v_uid OR f.linked_user_id = v_uid)
           AND f.abandoned_at IS NULL
           AND (f.id = v_corp.owner_faction_id
                OR f.id = (SELECT a.applicant_faction_id FROM job_applicants a
                            WHERE a.id = v_proj.pm_applicant_id))
    ) INTO v_allowed;
    IF NOT v_allowed THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;

    IF COALESCE(v_corp.materials_stock, 0) < p_qty THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_stock',
            'stock', COALESCE(v_corp.materials_stock, 0));
    END IF;
    v_need := COALESCE((SELECT materials_needed FROM corp_blueprints
                         WHERE id = v_proj.blueprint_id), 0);
    IF v_proj.materials_supplied + p_qty > v_need THEN
        RETURN jsonb_build_object('success', false, 'reason', 'exceeds_project_need',
            'needed', v_need, 'supplied', v_proj.materials_supplied);
    END IF;

    UPDATE entrepreneur_corps
       SET materials_stock = materials_stock - p_qty
     WHERE id = v_corp.id;
    UPDATE corp_construction_projects
       SET materials_supplied = materials_supplied + p_qty
     WHERE id = p_project_id;

    RETURN jsonb_build_object('success', true,
        'supplied', v_proj.materials_supplied + p_qty, 'needed', v_need);
END $$;

REVOKE EXECUTE ON FUNCTION public.apply_materials_to_project(uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.apply_materials_to_project(uuid, int) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_construction_projects(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_proj      RECORD;
    v_completed int := 0;
    v_tier      text;
    v_aff       numeric;
    v_app       numeric;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    FOR v_proj IN
        SELECT p.* FROM corp_construction_projects p
         WHERE p.status = 'building' AND p.completes_at_tick <= p_tick
           -- 20270817: a due build PARKS until its blueprint's
           -- materials have been supplied; it completes on the first
           -- sweep after the yard delivers. Blueprint-less projects
           -- owe nothing.
           AND p.materials_supplied >= COALESCE((
               SELECT b.materials_needed FROM corp_blueprints b
                WHERE b.id = p.blueprint_id), 0)
         FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE corp_construction_projects SET status = 'completed'
         WHERE id = v_proj.id;
        -- The escrowed price lands; stamped through the revenue
        -- accumulator so the Finances cards and corporate tax both
        -- see construction income.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_proj.price
         WHERE id = v_proj.corp_id;
        PERFORM stamp_entrepreneur_corp_revenue(v_proj.corp_id, p_tick, v_proj.price);

        -- Quality-tier city effects (20270810): the finished building
        -- moves the host city's stats. Tier comes from the blueprint
        -- (one source); a deleted blueprint or a city-less project
        -- simply applies nothing. Clamped 1..10 like the ordinance
        -- resolver's stat moves.
        --   low_cost +0.1 Affordability · standard — ·
        --   high_end −0.1 Affordability · luxury and ultra_rich
        --   −0.3 Affordability and +0.1 Appeal
        IF v_proj.city_id IS NOT NULL AND v_proj.blueprint_id IS NOT NULL THEN
            SELECT quality_tier INTO v_tier
              FROM corp_blueprints WHERE id = v_proj.blueprint_id;
            v_aff := CASE v_tier
                WHEN 'low_cost'   THEN  0.1
                WHEN 'high_end'   THEN -0.1
                WHEN 'luxury'     THEN -0.3
                WHEN 'ultra_rich' THEN -0.3
                ELSE 0 END;
            v_app := CASE v_tier WHEN 'luxury' THEN 0.1 WHEN 'ultra_rich' THEN 0.1 ELSE 0 END;
            IF v_aff <> 0 OR v_app <> 0 THEN
                UPDATE cities
                   SET affordability = GREATEST(1, LEAST(10, COALESCE(affordability, 5) + v_aff)),
                       appeal        = GREATEST(1, LEAST(10, COALESCE(appeal, 5)        + v_app))
                 WHERE id = v_proj.city_id;
            END IF;
        END IF;

        v_completed := v_completed + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'completed', v_completed);
END $$;

REVOKE EXECUTE ON FUNCTION public.complete_construction_projects(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.complete_construction_projects(int) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
