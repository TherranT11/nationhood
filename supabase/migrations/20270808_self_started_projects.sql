-- ════════════════════════════════════════════════════════════════════
-- 20270808 — Self-started construction projects
--
-- The bottom of the Submit Public Bid modal grows a second door:
-- instead of bidding on a city's request, the owner picks a city
-- (Residential Housing only — Commercial is greyed until chartered),
-- one of their blueprints, a Project Manager from their hires, and
-- [Start Project]. A speculative build — no buyer, no payout at
-- completion yet (the sales/asset model is the next phase); the
-- corp is building on its own book.
--
--   corp_construction_projects: request_id / bid_id relax to
--   nullable (self-started projects have neither), kind
--   ('public_bid' / 'self') tells the two doors apart, and
--   pm_applicant_id returns — the assigned PM is a hired
--   job_applicants row, and the project surfaces on that PM's (and
--   the owner's) Pressing Issues with the 7-stage tracker.
--
--   start_construction_project: owner-only (businessman, not
--   arrested, construction corp), residential blueprints only, the
--   PM must be hired by this corp, and starting a project IS the
--   tick's executive action — same exec_action_tick allowance and
--   corp-row lock as drafting and bidding. Build time is the same
--   derivation bids snapshot: type baseline (4/6/9) − Structural
--   Speed, floor 1.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.corp_construction_projects
    ALTER COLUMN request_id DROP NOT NULL,
    ALTER COLUMN bid_id     DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'public_bid'
        CHECK (kind IN ('public_bid', 'self')),
    ADD COLUMN IF NOT EXISTS pm_applicant_id uuid
        REFERENCES public.job_applicants(id) ON DELETE SET NULL;

-- ── start_construction_project ────────────────────────────────────
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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- Build time: type baseline − Structural Speed, floor 1 tick —
    -- the same derivation public bids snapshot.
    v_ticks := GREATEST(1,
        CASE v_bp.building_type
            WHEN 'single_story_home'  THEN 4
            WHEN 'double_story'       THEN 6
            WHEN 'multitenant_living' THEN 9
            ELSE 6
        END - GREATEST(1, COALESCE(v_corp.pillar_speed, 1)));

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
