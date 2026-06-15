-- ════════════════════════════════════════════════════════════════════
-- 20270949 — Residential build profit + a finer Affordability scale
--
-- Self-started residential builds were inserted at price 0 — they made no
-- money. Now a finished house sells for a profit that's HIGH where housing
-- is scarce (low Affordability) and LOW where it's already cheap, by building
-- type:
--     single_story_home   $5K  → $60K
--     double_story        $10K → $100K
--     multitenant_living  $25K → $200K
-- (top of the range at Affordability 1, bottom at 10). The price is locked in
-- at start from the city's current Affordability — the preview the owner sees
-- is exactly what lands on completion (complete_construction_projects already
-- pays treasury += price).
--
-- On completion a self-built house adds housing supply: +0.5 Affordability to
-- the host city. cities.affordability becomes numeric(4,1) so the half-point
-- persists — the completion processor already wrote fractional quality-tier
-- moves (±0.1 / −0.3), which the old int column silently rounded away; those
-- now work too. Scale, CHECK (1–10), and "low is expensive" meaning are all
-- unchanged — it just carries one decimal now.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.cities
    ALTER COLUMN affordability TYPE numeric(4,1) USING affordability::numeric;

-- ── start_construction_project — re-emitted from 20270946 verbatim; only
-- the price changes from a hard 0 to the affordability-scaled profit. ──
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
    v_price bigint;
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

    -- Residential build profit (20270949): higher where housing is scarce
    -- (low Affordability), lower where it's already cheap. Locked in now at
    -- the city's current Affordability. The client preview mirrors this.
    v_price := ROUND(CASE v_bp.building_type
        WHEN 'single_story_home'  THEN  5000 + (60000  - 5000)  * (10 - COALESCE(v_city.affordability, 5)) / 9.0
        WHEN 'double_story'       THEN 10000 + (100000 - 10000) * (10 - COALESCE(v_city.affordability, 5)) / 9.0
        WHEN 'multitenant_living' THEN 25000 + (200000 - 25000) * (10 - COALESCE(v_city.affordability, 5)) / 9.0
        ELSE 0 END)::bigint;

    INSERT INTO corp_construction_projects (
        kind, corp_id, blueprint_id, pm_applicant_id, city_id, city,
        price, quality, started_tick, completes_at_tick
    ) VALUES (
        'self', p_corp_id, p_blueprint_id, p_pm_applicant_id,
        v_city.id, v_city.city_name,
        v_price, GREATEST(1, COALESCE(v_corp.pillar_quality, 1)),
        v_tick, v_tick + v_ticks
    ) RETURNING id INTO v_id;

    UPDATE entrepreneur_corps SET exec_action_tick = _corp_exec_spend(exec_action_tick, v_tick) WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'project_id', v_id,
        'price', v_price,
        'completes_at_tick', v_tick + v_ticks);
END $$;

-- ── complete_construction_projects — re-emitted from 20270881 verbatim;
-- only addition: a self-built (always residential) house adds housing
-- supply at completion → +0.5 Affordability, overriding the quality-tier
-- Affordability tint (Appeal tint is kept). ──
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
    v_req       construction_project_requests%ROWTYPE;
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
            -- 20270949: a self-built house is new housing supply → a flat
            -- +0.5 Affordability, regardless of quality tier.
            IF v_proj.kind = 'self' THEN
                v_aff := 0.5;
            END IF;
            IF v_aff <> 0 OR v_app <> 0 THEN
                UPDATE cities
                   SET affordability = GREATEST(1, LEAST(10, COALESCE(affordability, 5) + v_aff)),
                       appeal        = GREATEST(1, LEAST(10, COALESCE(appeal, 5)        + v_app))
                 WHERE id = v_proj.city_id;
            END IF;
        END IF;

        -- Plant expansion (20270864): a corp-requested build coming
        -- online adds one assembly line to the requester and moves
        -- the host city — +2 Growth, −3 Jobs (clamped 1..10).
        SELECT * INTO v_req FROM construction_project_requests
         WHERE id = v_proj.request_id;
        IF v_req.requester_corp_id IS NOT NULL THEN
            UPDATE entrepreneur_corps
               SET bonus_assembly_lines = COALESCE(bonus_assembly_lines, 0) + 1
             WHERE id = v_req.requester_corp_id;
            IF v_proj.city_id IS NOT NULL THEN
                UPDATE cities
                   SET growth = GREATEST(1, LEAST(10, COALESCE(growth, 5) + 2)),
                       -- 20270881: the factory hires townspeople.
                       unemployment = GREATEST(1, LEAST(10, COALESCE(unemployment, 5) - 3))
                 WHERE id = v_proj.city_id;
            END IF;
            PERFORM _log_corp_history(v_req.requester_corp_id, p_tick,
                format('Plant expansion in %s complete — a new assembly line comes online.', v_proj.city));
        END IF;

        v_completed := v_completed + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'completed', v_completed);
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
