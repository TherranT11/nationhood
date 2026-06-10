-- ════════════════════════════════════════════════════════════════════
-- 20270797 — Expected salary anchor cut by 70%
--
-- Sierramar is a small island nation; the original anchor of
-- wages × standard_of_living × 100 produced salaries far too large
-- for its economy. The expected salary is now
--
--     wages × standard_of_living × 30
--
-- (a 70% cut), and the post_job_opening 25%-200% validation band
-- moves with it. The job modal in business-corp.html computes the
-- same × 30 client-side — the two must stay in lockstep.
--
-- Body byte-faithful to 20270796's post_job_opening except the
-- v_expected multiplier (100 → 30) and the comments around it.
-- Openings already posted under the old band keep their salaries —
-- the band only gates new posts.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.post_job_opening(
    p_corp_id       uuid,
    p_track         text,
    p_rung          int,
    p_salary_yearly bigint,
    p_reach         text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_nation   nations%ROWTYPE;
    v_tick     int;
    v_title    text;
    v_expected numeric;
    v_id       uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_track IS DISTINCT FROM 'operations' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_track');
    END IF;
    -- Only the chartered rungs are postable; 4-6 unlock when their
    -- charters are written.
    v_title := CASE p_rung
        WHEN 1 THEN 'Project Manager (PM)'
        WHEN 2 THEN 'Senior Project Manager'
        WHEN 3 THEN 'Regional Director of Operations'
        ELSE NULL
    END;
    IF v_title IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rung');
    END IF;
    IF p_reach NOT IN ('local', 'global') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_reach');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
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

    -- Salary band: 25%-200% of the HQ nation's expected salary, the
    -- same wages × standard_of_living × 30 the modal shows.
    SELECT * INTO v_nation FROM nations WHERE id = v_corp.hq_nation_id;
    v_expected := GREATEST(1, COALESCE(v_nation.wages, 50))
                  * GREATEST(1, COALESCE(v_nation.standard_of_living, 50))
                  * 30;
    IF p_salary_yearly < v_expected * 0.25 OR p_salary_yearly > v_expected * 2.0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'salary_out_of_band',
            'expected_yearly', round(v_expected));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    BEGIN
        INSERT INTO job_openings (
            corp_id, track, rung, title, salary_yearly, reach,
            posted_by_faction_id, posted_at_tick
        ) VALUES (
            p_corp_id, p_track, p_rung, v_title, p_salary_yearly, p_reach,
            v_fac.id, v_tick
        ) RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_open');
    END;

    RETURN jsonb_build_object(
        'success',    true,
        'opening_id', v_id,
        'title',      v_title
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
