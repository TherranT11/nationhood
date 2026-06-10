-- ════════════════════════════════════════════════════════════════════
-- 20270806 — Blueprints are just designs: drop the PM assignment
--
-- Draft Blueprint loses ASSIGN PROJECT MANAGER — a blueprint is a
-- proprietary template, not a staffed project. PM assignment returns
-- when actual construction projects exist (award phase of the public
-- bid flow).
--
--   draft_blueprint: regrown without p_pm_applicant_id (signature
--   change — the 6-arg from 20270803 is DROPPED to avoid a PostgREST
--   overload). Body otherwise byte-faithful: same guards, same
--   allowance spend.
--
--   corp_blueprints.pm_applicant_id stays for the rows already
--   drafted with one (and as the future hook for project staffing);
--   new blueprints leave it NULL.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.draft_blueprint(uuid, text, text, text, uuid, text);

CREATE OR REPLACE FUNCTION public.draft_blueprint(
    p_corp_id       uuid,
    p_category      text,
    p_building_type text,
    p_quality_tier  text,
    p_name          text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tick int;
    v_id   uuid;
    v_name text := TRIM(COALESCE(p_name, ''));
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
    IF p_category IS DISTINCT FROM 'residential' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'category_not_chartered');
    END IF;
    IF p_building_type NOT IN ('single_story_home', 'double_story', 'multitenant_living')
       OR p_quality_tier NOT IN ('low_cost', 'standard', 'high_end', 'luxury', 'ultra_rich') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the per-tick allowance check below must
    -- serialize against a concurrent draft.
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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    INSERT INTO corp_blueprints (
        corp_id, category, city, building_type, quality_tier,
        created_at_tick, name
    ) VALUES (
        p_corp_id, p_category, COALESCE(v_corp.hq_city, '—'),
        p_building_type, p_quality_tier, v_tick, v_name
    ) RETURNING id INTO v_id;

    UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'blueprint_id', v_id, 'name', v_name);
END $$;

REVOKE EXECUTE ON FUNCTION public.draft_blueprint(uuid, text, text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.draft_blueprint(uuid, text, text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
