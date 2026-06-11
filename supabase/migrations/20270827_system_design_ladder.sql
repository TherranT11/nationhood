-- ════════════════════════════════════════════════════════════════════
-- 20270827 — System Design: the fifth and final asset ladder
--
--   0  CAD System & Laptop            +1 Experience per finished
--                                     project (the old flat +3 is
--                                     now Tier II's reward)
--   I  Drafting Workstations    $7M   +2 per project
--   II BIM Network & Renders    $10M  +3 per project
--   III Integrated Design Suite $16M  Experience cap 30 → 50
--   IV Parametric & Generative  $25M  (+3 per project; parametric /
--                                     generative / simulation /
--                                     digital-twin flavor)
--   V  AI-Augmented & Twins     $40M  Experience cap → 80
--
-- The experience economy reshapes: per-completion grant =
-- System Design contribution (1/2/3, flat 3 from Tier II up) + the
-- PM ladder bonus (20270823), CLAMPED at the design tier's cap
-- (30 / 50 at III / 80 at V). completion_experience regrows a
-- design-tier argument (old 1-arg dropped); experience_cap is the
-- cap's one home. Costs mirror the yard ladder (fifth consecutive
-- mirror ruling).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS design_tier int NOT NULL DEFAULT 0 CHECK (design_tier >= 0);

DROP FUNCTION IF EXISTS public.completion_experience(int);

CREATE OR REPLACE FUNCTION public.completion_experience(p_pm_tier int, p_design_tier int)
RETURNS numeric
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE
        WHEN COALESCE(p_design_tier, 0) >= 2 THEN 3
        WHEN COALESCE(p_design_tier, 0) >= 1 THEN 2
        ELSE 1
    END + CASE
        WHEN COALESCE(p_pm_tier, 0) >= 5 THEN 5
        WHEN COALESCE(p_pm_tier, 0) >= 4 THEN 3
        WHEN COALESCE(p_pm_tier, 0) >= 3 THEN 2
        WHEN COALESCE(p_pm_tier, 0) >= 2 THEN 1
        ELSE 0
    END;
$$;

COMMENT ON FUNCTION public.completion_experience(int, int) IS
    'Experience per completed project (20270827): System Design contribution (T0 +1 / TI +2 / TII+ +3) + PM ladder bonus (II +1, III +2, IV +3, V +5). The ONLY place these numbers live.';

CREATE OR REPLACE FUNCTION public.experience_cap(p_design_tier int)
RETURNS numeric
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE
        WHEN COALESCE(p_design_tier, 0) >= 5 THEN 80
        WHEN COALESCE(p_design_tier, 0) >= 3 THEN 50
        ELSE 30
    END;
$$;

COMMENT ON FUNCTION public.experience_cap(int) IS
    'Max corp Experience by design_tier (20270827): 30 baseline, 50 at Tier III, 80 at Tier V. The ONLY place the cap lives.';

-- ── logistical_overhaul — System Design joins (all five climb) ────
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

-- ── complete_construction_projects — scaled, capped grants ────────
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
           -- 20270821: and one committed equipment use.
           AND p.equipment_supplied >= 1
         FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE corp_construction_projects SET status = 'completed'
         WHERE id = v_proj.id;
        -- The escrowed price lands; stamped through the revenue
        -- accumulator so the Finances cards and corporate tax both
        -- see construction income.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_proj.price,
               -- 20270823: completion grants Experience — System
               -- Design's +3 baseline plus the PM ladder bonus.
               -- 20270827: grant scales with System Design + PM,
               -- clamped at the design tier's Experience cap.
               experience = LEAST(experience_cap(design_tier),
                   COALESCE(experience, 0)
                   + completion_experience(pm_tier, design_tier))
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
