-- ════════════════════════════════════════════════════════════════════
-- 20270830 — The LEADERSHIP track: six rungs, postable from day one
--
--   1 Estimator / Business Development Associate
--   2 Business Development Manager
--   3 Regional General Manager
--   4 Vice President of Strategy
--   5 President / Chief Operating Officer
--   6 Chief Executive Officer (CEO)
--
-- Unlike Operations (rungs 4-6 still being chartered), the whole
-- leadership ladder posts immediately. Hired players carry the title
-- through the same employment record everything reads — home-page
-- OCCUPATION / SALARY / Current Role — no new plumbing. The ×12
-- headcount and the salary band apply unchanged by design (a CEO
-- hire brings a 72-head org — flag to retune).
--
--   job_openings.track CHECK widened. post_job_opening re-emitted
--   byte-faithful to 20270798 except the track gate + title CASE.
--   _roll_job_applicants regrows a p_track argument (old signature
--   dropped): leadership-flavored NPC current-titles and longer
--   careers at rungs 5-6. promote_employee re-emitted byte-faithful
--   to 20270824 except the track-aware title CASE — leadership
--   promotes all the way to CEO; operations still caps at rung 3.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.job_openings
    DROP CONSTRAINT IF EXISTS job_openings_track_check;
ALTER TABLE public.job_openings
    ADD CONSTRAINT job_openings_track_check
    CHECK (track IN ('operations', 'leadership'));

DROP FUNCTION IF EXISTS public._roll_job_applicants(uuid, uuid, text, int, bigint, numeric, int);

-- ── _roll_job_applicants (internal) ───────────────────────────────
CREATE OR REPLACE FUNCTION public._roll_job_applicants(
    p_opening_id    uuid,
    p_hq_nation_id  uuid,
    p_reach         text,
    p_track         text,
    p_rung          int,
    p_salary_yearly bigint,
    p_expected      numeric,
    p_tick          int
) RETURNS void
LANGUAGE plpgsql VOLATILE
AS $$
DECLARE
    v_n          int;
    v_city       text;
    v_nation_id  uuid;
    v_first_pool text[];
    v_last_pool  text[];
    v_first      text;
    v_last       text;
    v_exp        int;
    v_employment text;
    v_title      text;
BEGIN
    -- 2-4 base; global reach adds 1-2; generosity adds, lowballing
    -- sheds (never below 1 — somebody always wants the work).
    v_n := 2 + floor(random() * 3)::int;
    IF p_reach = 'global' THEN
        v_n := v_n + 1 + floor(random() * 2)::int;
    END IF;
    IF p_salary_yearly >= p_expected * 1.5 THEN
        v_n := v_n + 2;
    ELSIF p_salary_yearly >= p_expected THEN
        v_n := v_n + 1;
    ELSIF p_salary_yearly < p_expected * 0.75 THEN
        v_n := GREATEST(1, v_n - 2);
    END IF;

    FOR i IN 1..v_n LOOP
        -- Jobs-weighted city draw: a city's JOBS stat is its pool of
        -- people looking for work, so it weights the sample.
        SELECT c.city_name, c.nation_id
          INTO v_city, v_nation_id
          FROM cities c
         WHERE p_reach = 'global' OR c.nation_id = p_hq_nation_id
         ORDER BY random() ^ (1.0 / GREATEST(c.jobs, 1)) DESC
         LIMIT 1;
        IF v_city IS NULL THEN
            v_city      := 'Abroad';
            v_nation_id := p_hq_nation_id;
        END IF;

        SELECT first_name_pool, last_name_pool
          INTO v_first_pool, v_last_pool
          FROM nations WHERE id = v_nation_id;
        v_first := COALESCE(pick_random_pool_name(v_first_pool), 'Alex');
        v_last  := COALESCE(pick_random_pool_name(v_last_pool),  'Smith');

        -- Experience scales with the rung being hired for; senior
        -- leadership rungs skew long careers.
        v_exp := CASE
            WHEN p_rung = 1 THEN floor(random() * 5)::int        -- 0-4
            WHEN p_rung = 2 THEN 3 + floor(random() * 7)::int    -- 3-9
            WHEN p_rung >= 5 THEN 12 + floor(random() * 14)::int -- 12-25
            ELSE                 6 + floor(random() * 10)::int   -- 6-15
        END;

        -- ~35% are between jobs (greenhorns with 0 years always are);
        -- the rest hold a one-rung-down title at a small local firm.
        IF v_exp = 0 OR random() < 0.35 THEN
            v_employment := 'Unemployed';
            v_title      := '—';
        ELSE
            v_employment := pick_random_pool_name(ARRAY[
                v_last || ' & Sons Construction',
                v_city || ' Construction Co.',
                v_city || ' Builders Ltd.',
                COALESCE(pick_random_pool_name(v_last_pool), 'Mercado') || ' Contracting'
            ]);
            v_title := pick_random_pool_name(CASE
                WHEN p_track = 'leadership' THEN CASE
                    WHEN p_rung = 1 THEN ARRAY['Junior Estimator', 'Sales Associate', 'Marketing Coordinator']
                    WHEN p_rung = 2 THEN ARRAY['Account Executive', 'Estimator', 'Client Relations Lead']
                    WHEN p_rung = 3 THEN ARRAY['Business Development Manager', 'Branch Manager', 'Sales Director']
                    WHEN p_rung = 4 THEN ARRAY['Regional General Manager', 'Director of Strategy', 'Corporate Planner']
                    WHEN p_rung = 5 THEN ARRAY['Vice President of Strategy', 'VP of Operations', 'Managing Director']
                    ELSE                 ARRAY['President', 'Chief Operating Officer', 'Group Managing Director']
                END
                WHEN p_rung = 1 THEN ARRAY['Site Supervisor', 'Foreman', 'Project Coordinator', 'Assistant Project Manager']
                WHEN p_rung = 2 THEN ARRAY['Project Manager', 'Site Manager', 'Construction Manager']
                ELSE                 ARRAY['Senior Project Manager', 'Operations Manager', 'District Operations Manager']
            END);
        END IF;

        INSERT INTO job_applicants (
            opening_id, applicant_faction_id, name, city,
            current_employment, current_title, years_experience, applied_at_tick
        ) VALUES (
            p_opening_id, NULL, v_first || ' ' || v_last, v_city,
            v_employment, v_title, v_exp, p_tick
        );
    END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION public._roll_job_applicants(uuid, uuid, text, text, int, bigint, numeric, int) FROM PUBLIC;

COMMENT ON FUNCTION public._roll_job_applicants(uuid, uuid, text, text, int, bigint, numeric, int) IS
    'Internal: rolls the immediate NPC applicant batch for a freshly posted job opening. Called by post_job_opening only — not granted to authenticated.';

-- ── post_job_opening — leadership titles ──────────────────────────
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
    IF p_track NOT IN ('operations', 'leadership') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_track');
    END IF;
    -- The LEADERSHIP ladder is postable top to bottom; Operations
    -- rungs 4-6 still await their charters.
    v_title := CASE WHEN p_track = 'leadership' THEN
        CASE p_rung
            WHEN 1 THEN 'Estimator / Business Development Associate'
            WHEN 2 THEN 'Business Development Manager'
            WHEN 3 THEN 'Regional General Manager'
            WHEN 4 THEN 'Vice President of Strategy'
            WHEN 5 THEN 'President / Chief Operating Officer'
            WHEN 6 THEN 'Chief Executive Officer (CEO)'
            ELSE NULL
        END
    ELSE
        CASE p_rung
            WHEN 1 THEN 'Project Manager (PM)'
            WHEN 2 THEN 'Senior Project Manager'
            WHEN 3 THEN 'Regional Director of Operations'
            ELSE NULL
        END
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

    -- The posting hits the street: NPC candidates apply immediately.
    PERFORM _roll_job_applicants(v_id, v_corp.hq_nation_id, p_reach, p_track, p_rung,
                                 p_salary_yearly, v_expected, v_tick);

    RETURN jsonb_build_object(
        'success',    true,
        'opening_id', v_id,
        'title',      v_title
    );
END $$;

-- ── promote_employee — track-aware promotions ─────────────────────
CREATE OR REPLACE FUNCTION public.promote_employee(p_applicant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v RECORD;
    v_nation     nations%ROWTYPE;
    v_expected   numeric;
    v_new_rung   int;
    v_new_title  text;
    v_new_salary bigint;
    v_tick       int;
BEGIN
    SELECT * INTO v FROM _job_board_owner_check(p_applicant_id, auth.uid());
    IF v.o_reason IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', v.o_reason);
    END IF;
    IF (v.o_applicant).status <> 'hired' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_hired');
    END IF;

    v_new_rung := (v.o_opening).rung + 1;
    v_new_title := CASE WHEN (v.o_opening).track = 'leadership' THEN
        CASE v_new_rung
            WHEN 2 THEN 'Business Development Manager'
            WHEN 3 THEN 'Regional General Manager'
            WHEN 4 THEN 'Vice President of Strategy'
            WHEN 5 THEN 'President / Chief Operating Officer'
            WHEN 6 THEN 'Chief Executive Officer (CEO)'
            ELSE NULL
        END
    ELSE
        CASE v_new_rung
            WHEN 2 THEN 'Senior Project Manager'
            WHEN 3 THEN 'Regional Director of Operations'
            ELSE NULL
        END
    END;
    IF v_new_title IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'max_rung');
    END IF;

    -- +25%, clamped to the nation band's 200% ceiling.
    SELECT * INTO v_nation FROM nations WHERE id = (v.o_corp).hq_nation_id;
    v_expected := GREATEST(1, COALESCE(v_nation.wages, 50))
                  * GREATEST(1, COALESCE(v_nation.standard_of_living, 50))
                  * 30;
    v_new_salary := LEAST(ROUND(v_expected * 2.0),
                          ROUND((v.o_opening).salary_yearly * 1.25))::bigint;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE job_openings
       SET rung = v_new_rung, title = v_new_title, salary_yearly = v_new_salary
     WHERE id = (v.o_opening).id;
    -- The promotion brings a bigger team: +1 tier × 12.
    UPDATE entrepreneur_corps
       SET employee_count = COALESCE(employee_count, 1) + 12
     WHERE id = (v.o_corp).id;

    IF (v.o_applicant).applicant_faction_id IS NOT NULL THEN
        UPDATE factions
           SET biz_job_title      = v_new_title,
               biz_salary_yearly  = v_new_salary,
               biz_career_history = COALESCE(biz_career_history, '[]'::jsonb)
                   || jsonb_build_array(jsonb_build_object(
                          'year',  2000 + (v_tick / 12),
                          'label', 'Promoted to ' || v_new_title,
                          'sub',   (v.o_corp).name))
         WHERE id = (v.o_applicant).applicant_faction_id;
    END IF;

    RETURN jsonb_build_object('success', true,
        'title', v_new_title, 'salary_yearly', v_new_salary);
END $$;

REVOKE EXECUTE ON FUNCTION public.promote_employee(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.promote_employee(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
