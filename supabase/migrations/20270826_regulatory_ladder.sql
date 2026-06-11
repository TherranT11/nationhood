-- ════════════════════════════════════════════════════════════════════
-- 20270826 — Regulatory Compliance: the license ladder
--
-- The fourth asset ladder (reg_tier), authorizing what the firm may
-- legally build:
--
--   0  City Permits                       Residential · Commercial I ·
--                                         Infrastructure I
--   I  Provincial Contractor License $7M  + Commercial II · Infra II
--   II National General Contractor  $10M  + Commercial III · Infra III
--   III Industrial Construction Lic $16M  + Infrastructure IV (user
--                                         call: Infra IV only)
--   IV Federal Defense Clearance    $25M  + Military Tier I
--   V  International Charter        $40M  + FOREIGN construction
--
-- Costs mirror the yard ladder (no figures given; fourth consecutive
-- mirror ruling). DESIGN CALL: Reg Tier V REPLACES the PM Level III
-- international-bidding privilege — foreign bids AND foreign
-- self-builds (previously ungated!) now gate on reg_tier ≥ 5 alone.
--
--   reg_min_tier(building_type): the one authorization map. Today's
--   chartered types are all Tier 0; infrastructure II-IV are mapped
--   ahead of their chartering, commercial/military types join when
--   their type names exist.
--
--   logistical_overhaul re-emitted (regulatory joins);
--   submit_public_bid re-emitted byte-faithful to 20270825 except
--   the PM-international block → the two reg gates;
--   start_construction_project re-emitted byte-faithful to 20270820
--   plus the reg gates.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS reg_tier int NOT NULL DEFAULT 0 CHECK (reg_tier >= 0);

-- ── reg_min_tier — the authorization map ──────────────────────────
CREATE OR REPLACE FUNCTION public.reg_min_tier(p_building_type text)
RETURNS int
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_building_type
        WHEN 'single_story_home'        THEN 0
        WHEN 'double_story'             THEN 0
        WHEN 'multitenant_living'       THEN 0
        WHEN 'infrastructure_tier_i'    THEN 0
        WHEN 'infrastructure_tier_ii'   THEN 1
        WHEN 'infrastructure_tier_iii'  THEN 2
        WHEN 'infrastructure_tier_iv'   THEN 3
        ELSE 0  -- commercial/military types map here when chartered
    END;
$$;

COMMENT ON FUNCTION public.reg_min_tier(text) IS
    'Minimum Regulatory Compliance tier to build a type (20270826). The ONLY authorization map; foreign construction is the separate reg_tier ≥ 5 gate.';

-- ── logistical_overhaul — Regulatory Compliance joins ─────────────
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
    IF p_asset NOT IN ('heavy_equipment', 'project_management', 'supply_material',
                       'regulatory_compliance') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_higher_tiers');
    END IF;
    IF p_asset = 'heavy_equipment' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.supply_tier, 0) + 1);
    ELSIF p_asset = 'supply_material' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.materials_tier, 0) + 1);
    ELSIF p_asset = 'regulatory_compliance' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.reg_tier, 0) + 1);
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
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'asset', p_asset, 'cost', v_cost,
        'new_tier', CASE p_asset
                         WHEN 'heavy_equipment'       THEN COALESCE(v_corp.supply_tier, 0) + 1
                         WHEN 'supply_material'       THEN COALESCE(v_corp.materials_tier, 0) + 1
                         WHEN 'regulatory_compliance' THEN COALESCE(v_corp.reg_tier, 0) + 1
                         ELSE COALESCE(v_corp.pm_tier, 0) + 1 END);
END $$;

REVOKE EXECUTE ON FUNCTION public.logistical_overhaul(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.logistical_overhaul(uuid, text) TO authenticated;

-- ── submit_public_bid — reg gates replace the PM international gate ─
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

    RETURN jsonb_build_object('success', true, 'bid_id', v_id, 'build_ticks', v_ticks);
END $$;

REVOKE EXECUTE ON FUNCTION public.submit_public_bid(uuid, uuid, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.submit_public_bid(uuid, uuid, bigint) TO authenticated;

-- ── start_construction_project — reg gates ────────────────────────
CREATE OR REPLACE FUNCTION public.start_construction_project(
    p_corp_id         uuid,
    p_city_id         uuid,
    p_blueprint_id    uuid,
    p_pm_applicant_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_corp  entrepreneur_corps%ROWTYPE;
    v_bp    corp_blueprints%ROWTYPE;
    v_city  cities%ROWTYPE;
    v_pm    job_applicants%ROWTYPE;
    v_tick  int;
    v_ticks int;
    v_id    uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_city_id IS NULL
       OR p_blueprint_id IS NULL OR p_pm_applicant_id IS NULL THEN
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

    SELECT * INTO v_bp FROM corp_blueprints
     WHERE id = p_blueprint_id AND corp_id = p_corp_id;
    IF v_bp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
    END IF;
    IF v_bp.category <> 'residential' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'category_not_chartered');
    END IF;

    SELECT * INTO v_city FROM cities WHERE id = p_city_id;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;

    -- The assigned PM must be someone this corp actually hired.
    SELECT a.* INTO v_pm
      FROM job_applicants a
      JOIN job_openings o ON o.id = a.opening_id
     WHERE a.id = p_pm_applicant_id
       AND o.corp_id = p_corp_id
       AND a.status = 'hired';
    IF v_pm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'pm_not_found');
    END IF;

    -- Project Management cap (20270820): NEW projects refuse beyond
    -- the tier's Max Active Projects; in-flight builds above the cap
    -- are grandfathered.
    IF NOT _pm_cap_allows(p_corp_id, v_corp.pm_tier) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'project_cap_reached',
            'cap', pm_max_active_projects(v_corp.pm_tier));
    END IF;

    -- Regulatory Compliance gates (20270826): license tier for the
    -- building type, and Tier V for building outside the HQ nation.
    IF reg_min_tier(v_bp.building_type) > COALESCE(v_corp.reg_tier, 0) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_licensed');
    END IF;
    IF v_city.nation_id IS DISTINCT FROM v_corp.hq_nation_id
       AND COALESCE(v_corp.reg_tier, 0) < 5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'foreign_locked');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_ticks := construction_build_ticks(v_bp.building_type, v_corp.pillar_speed);

    INSERT INTO corp_construction_projects (
        kind, corp_id, blueprint_id, pm_applicant_id, city_id, city,
        price, quality, started_tick, completes_at_tick
    ) VALUES (
        'self', p_corp_id, p_blueprint_id, p_pm_applicant_id,
        v_city.id, v_city.city_name,
        0, GREATEST(1, COALESCE(v_corp.pillar_quality, 1)),
        v_tick, v_tick + v_ticks
    ) RETURNING id INTO v_id;

    UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'project_id', v_id,
        'completes_at_tick', v_tick + v_ticks);
END $$;

REVOKE EXECUTE ON FUNCTION public.start_construction_project(uuid, uuid, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.start_construction_project(uuid, uuid, uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
