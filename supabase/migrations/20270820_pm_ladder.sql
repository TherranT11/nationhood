-- ════════════════════════════════════════════════════════════════════
-- 20270820 — The Project Management ladder: active-project caps and
-- international bidding
--
--   0  The Truck & Clipboard            —     1 active project
--   I  Rented Office Suite              $7M   2 · requires a
--                                              Commercial I building
--   II Municipal Contracting Office     $10M  3 · Commercial II
--   III Regional PMO Division           $16M  4 · Commercial III ·
--                                              unlocks INTERNATIONAL
--                                              bidding
--   IV National Compliance & Legal      $25M  5 · Commercial I in 2+
--                                              nations
--   V  Global Regulatory Affairs Dir.   $40M  unlimited · Commercial I
--                                              in 3+ nations
--
-- Prices mirror the yard ladder (design call) — yard_upgrade_cost is
-- the one home for both. "Owns a building" = a COMPLETED self-build
-- whose blueprint carries that commercial category; commercial
-- categories aren't chartered yet, so Level I+ is requirement-locked
-- until they are — the ladder, caps, and gates are live now.
--
-- Enforcement (user-confirmed): caps gate NEW projects (starts and
-- bid awards) immediately; in-flight builds above the cap are
-- grandfathered. International bids (request nation ≠ corp HQ)
-- require Level III.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS pm_tier int NOT NULL DEFAULT 0 CHECK (pm_tier >= 0);

-- ── pm_max_active_projects — the one home of the caps ─────────────
CREATE OR REPLACE FUNCTION public.pm_max_active_projects(p_tier int)
RETURNS int
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE
        WHEN COALESCE(p_tier, 0) >= 5 THEN NULL   -- unlimited
        ELSE COALESCE(p_tier, 0) + 1
    END;
$$;

COMMENT ON FUNCTION public.pm_max_active_projects(int) IS
    'Max Active Projects by pm_tier (20270820): tier+1 through Level IV, NULL (unlimited) at Level V. The ONLY place the caps live.';

-- ── _pm_cap_allows (internal) ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public._pm_cap_allows(p_corp_id uuid, p_tier int)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
    SELECT pm_max_active_projects(p_tier) IS NULL
        OR (SELECT COUNT(*) FROM corp_construction_projects
             WHERE corp_id = p_corp_id AND status = 'building')
           < pm_max_active_projects(p_tier);
$$;

REVOKE EXECUTE ON FUNCTION public._pm_cap_allows(uuid, int) FROM PUBLIC;

-- ── _pm_upgrade_requirement_met (internal) ────────────────────────
-- "Owns a Commercial {grade} building" = a completed self-build
-- whose blueprint category matches. Unchartered categories mean the
-- counts are zero everywhere today.
CREATE OR REPLACE FUNCTION public._pm_upgrade_requirement_met(p_corp_id uuid, p_next_tier int)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
    SELECT CASE p_next_tier
        WHEN 1 THEN EXISTS (
            SELECT 1 FROM corp_construction_projects p
              JOIN corp_blueprints b ON b.id = p.blueprint_id
             WHERE p.corp_id = p_corp_id AND p.kind = 'self'
               AND p.status = 'completed' AND b.category = 'tier_i_commercial')
        WHEN 2 THEN EXISTS (
            SELECT 1 FROM corp_construction_projects p
              JOIN corp_blueprints b ON b.id = p.blueprint_id
             WHERE p.corp_id = p_corp_id AND p.kind = 'self'
               AND p.status = 'completed' AND b.category = 'tier_ii_commercial')
        WHEN 3 THEN EXISTS (
            SELECT 1 FROM corp_construction_projects p
              JOIN corp_blueprints b ON b.id = p.blueprint_id
             WHERE p.corp_id = p_corp_id AND p.kind = 'self'
               AND p.status = 'completed' AND b.category = 'tier_iii_commercial')
        WHEN 4 THEN (
            SELECT COUNT(DISTINCT c.nation_id) FROM corp_construction_projects p
              JOIN corp_blueprints b ON b.id = p.blueprint_id
              JOIN cities c ON c.id = p.city_id
             WHERE p.corp_id = p_corp_id AND p.kind = 'self'
               AND p.status = 'completed' AND b.category = 'tier_i_commercial') >= 2
        WHEN 5 THEN (
            SELECT COUNT(DISTINCT c.nation_id) FROM corp_construction_projects p
              JOIN corp_blueprints b ON b.id = p.blueprint_id
              JOIN cities c ON c.id = p.city_id
             WHERE p.corp_id = p_corp_id AND p.kind = 'self'
               AND p.status = 'completed' AND b.category = 'tier_i_commercial') >= 3
        ELSE false
    END;
$$;

REVOKE EXECUTE ON FUNCTION public._pm_upgrade_requirement_met(uuid, int) FROM PUBLIC;

-- ── logistical_overhaul — PM joins the ladder ─────────────────────
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

    -- Two assets have chartered ladders: the yard (HEAVY EQUIPMENT)
    -- and PROJECT MANAGEMENT. Both climb the same price ladder
    -- (design call: PM mirrors the yard's $7-40M).
    IF p_asset NOT IN ('heavy_equipment', 'project_management') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_higher_tiers');
    END IF;
    IF p_asset = 'heavy_equipment' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.supply_tier, 0) + 1);
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
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'asset', p_asset, 'cost', v_cost,
        'new_tier', CASE WHEN p_asset = 'heavy_equipment'
                         THEN COALESCE(v_corp.supply_tier, 0) + 1
                         ELSE COALESCE(v_corp.pm_tier, 0) + 1 END);
END $$;

REVOKE EXECUTE ON FUNCTION public.logistical_overhaul(uuid, text) FROM PUBLIC;

-- ── start_construction_project — cap on new starts ────────────────
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

-- ── submit_public_bid — international gate at Level III ───────────
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
    -- International bidding is a Level III Project Management
    -- privilege (20270820).
    IF v_req.nation_id IS DISTINCT FROM v_corp.hq_nation_id
       AND COALESCE(v_corp.pm_tier, 0) < 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'international_locked');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- Build time: type baseline − Structural Speed, floor 1 tick.
    v_ticks := GREATEST(1,
        CASE v_req.building_type
            WHEN 'single_story_home'  THEN 4
            WHEN 'double_story'       THEN 6
            WHEN 'multitenant_living' THEN 9
            ELSE 6
        END - GREATEST(1, COALESCE(v_corp.pillar_speed, 1)));

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

-- ── _award_construction_bid — cap at award ────────────────────────
CREATE OR REPLACE FUNCTION public._award_construction_bid(p_bid_id uuid, p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_bid  construction_project_bids%ROWTYPE;
    v_req  construction_project_requests%ROWTYPE;
    v_city cities%ROWTYPE;
    v_id   uuid;
BEGIN
    SELECT * INTO v_bid FROM construction_project_bids WHERE id = p_bid_id FOR UPDATE;
    IF v_bid.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_found');
    END IF;
    IF v_bid.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_pending');
    END IF;

    SELECT * INTO v_req FROM construction_project_requests
     WHERE id = v_bid.request_id FOR UPDATE;
    IF v_req.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_open');
    END IF;
    IF v_req.requester_city_id IS NULL THEN
        -- Corp-to-corp requests have no payer wired yet.
        RETURN jsonb_build_object('success', false, 'reason', 'no_payer');
    END IF;

    SELECT * INTO v_city FROM cities WHERE id = v_req.requester_city_id FOR UPDATE;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;
    IF COALESCE(v_city.budget, 0) < v_bid.price THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_city_budget',
            'budget', COALESCE(v_city.budget, 0), 'price', v_bid.price);
    END IF;

    -- Project Management cap (20270820): an award that would push
    -- the winner past Max Active Projects fails — auto-award moves
    -- on to the next-lowest bidder.
    IF NOT _pm_cap_allows(v_bid.corp_id,
        (SELECT pm_tier FROM entrepreneur_corps WHERE id = v_bid.corp_id)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'project_cap_reached');
    END IF;

    -- Escrow: the city pays now, the corp collects at completion.
    UPDATE cities SET budget = COALESCE(budget, 0) - v_bid.price
     WHERE id = v_city.id;

    UPDATE construction_project_bids SET status = 'won' WHERE id = p_bid_id;
    UPDATE construction_project_bids SET status = 'lost'
     WHERE request_id = v_req.id AND status = 'pending';
    UPDATE construction_project_requests SET status = 'awarded'
     WHERE id = v_req.id;

    INSERT INTO corp_construction_projects (
        request_id, bid_id, corp_id, blueprint_id, city_id, city,
        price, quality, started_tick, completes_at_tick
    ) VALUES (
        v_req.id, p_bid_id, v_bid.corp_id, v_bid.blueprint_id,
        v_city.id, v_req.city, v_bid.price, v_bid.quality,
        p_tick, p_tick + GREATEST(1, v_bid.build_ticks)
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'project_id', v_id,
        'completes_at_tick', p_tick + GREATEST(1, v_bid.build_ticks));
END $$;

REVOKE EXECUTE ON FUNCTION public._award_construction_bid(uuid, int) FROM PUBLIC;

NOTIFY pgrst, 'reload schema';

COMMIT;
