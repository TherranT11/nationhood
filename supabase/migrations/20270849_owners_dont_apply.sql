-- ════════════════════════════════════════════════════════════════════
-- 20270849 — Owners don't job-hunt
--
-- A businessman who owns a corporation can no longer apply for jobs
-- anywhere — running a company IS the job. apply_to_job_opening
-- re-emitted byte-faithful to 20270798 except:
--   · the new is_owner gate (any owned corp refuses; this subsumes
--     the old own_corp check)
--   · the applicant snapshot's now-unreachable "Owner of …" branch
--     becomes the real thing: an employed applicant shows their
--     current employer, title, and years on the job
--     (ticks ÷ 12 since hiring).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── apply_to_job_opening — the owner gate ─────────────────────────
CREATE OR REPLACE FUNCTION public.apply_to_job_opening(
    p_opening_id uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_fac       factions%ROWTYPE;
    v_opening   job_openings%ROWTYPE;
    v_corp      entrepreneur_corps%ROWTYPE;
    v_tick      int;
    v_city      text;
    v_corp_name text;
    v_id        uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_opening_id IS NULL OR p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_faction');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT * INTO v_opening FROM job_openings WHERE id = p_opening_id;
    IF v_opening.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_found');
    END IF;
    IF v_opening.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_open');
    END IF;

    -- Owners don't job-hunt (20270849): holding ANY corporation
    -- blocks applying — which also covers the old own_corp case.
    IF EXISTS (SELECT 1 FROM entrepreneur_corps WHERE owner_faction_id = v_fac.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'is_owner');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_opening.corp_id;
    IF v_opening.reach = 'local' AND v_fac.nation_id IS DISTINCT FROM v_corp.hq_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'local_only');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- The row is a server-derived snapshot of who's applying: home
    -- city plus their current job when they hold one (owners can't
    -- reach this point since 20270849, so the old "Owner of …"
    -- snapshot is gone).
    v_city := COALESCE(v_fac.biz_home_city,
        (SELECT capital FROM nations WHERE id = v_fac.nation_id), '—');
    SELECT name INTO v_corp_name FROM entrepreneur_corps
     WHERE id = v_fac.biz_employer_corp_id;

    BEGIN
        INSERT INTO job_applicants (
            opening_id, applicant_faction_id, name, city,
            current_employment, current_title, years_experience, applied_at_tick
        ) VALUES (
            p_opening_id, v_fac.id,
            COALESCE(NULLIF(TRIM(COALESCE(v_fac.leader_first_name, '') || ' ' || COALESCE(v_fac.leader_last_name, '')), ''), v_fac.faction_name, '—'),
            v_city,
            CASE WHEN v_corp_name IS NULL THEN 'Unemployed' ELSE v_corp_name END,
            CASE WHEN v_corp_name IS NULL THEN '—'          ELSE COALESCE(v_fac.biz_job_title, '—') END,
            GREATEST(0, (v_tick - COALESCE(v_fac.biz_hired_at_tick, v_tick)) / 12),
            v_tick
        ) RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_applied');
    END;

    RETURN jsonb_build_object('success', true, 'applicant_id', v_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.apply_to_job_opening(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.apply_to_job_opening(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
