-- ════════════════════════════════════════════════════════════════════
-- 20270899 — Banking career #2: the CREDIT track
--
-- Six rungs, the file to the whole book (read the paper, sit the
-- desk, price the risk, say the no, own the book):
--   1. Credit Analyst   2. Loan Officer   3. Underwriter
--   4. Credit Risk Manager   5. Director of Lending
--   6. Chief Lending Officer (CLO)
--
-- LADDER + AFFILIATIONS ONLY (user ruling: no career actions yet) —
-- the same job-board rails the Management track (20270898) rides.
--
-- WHY A NEW MIGRATION rather than editing 20270898: that migration
-- is already applied in prod (merged in #3091), so an in-place edit
-- would silently never run. CREATE OR REPLACE is whole-function, so
-- this re-emits post_job_opening / promote_employee /
-- _roll_job_applicants in full — every existing track (operations,
-- leadership, the three automotive careers, management) byte-
-- identical to their 20270898 bodies, plus the credit branch — and
-- widens the job_openings track CHECK to admit 'credit'. Banking now
-- hires Management AND Credit; every rung title stays globally unique
-- so the title→track resolution never collides.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.job_openings
    DROP CONSTRAINT IF EXISTS job_openings_track_check;
ALTER TABLE public.job_openings
    ADD CONSTRAINT job_openings_track_check
    CHECK (track IN ('operations', 'leadership', 'manufacturing', 'product',
                     'commercial', 'management', 'credit'));

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
        -- Unemployment-weighted city draw (20270881 renamed
        -- cities.jobs to unemployment — same meaning, a city's pool
        -- of people looking for work, so it weights the sample).
        -- NOTE: the merged 20270837 emission still read c.jobs and
        -- has been broken since the rename; this re-emission is the
        -- production fix.
        SELECT c.city_name, c.nation_id
          INTO v_city, v_nation_id
          FROM cities c
         WHERE p_reach = 'global' OR c.nation_id = p_hq_nation_id
         ORDER BY random() ^ (1.0 / GREATEST(c.unemployment, 1)) DESC
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
            v_employment := CASE WHEN p_track IN ('management', 'credit')
                THEN pick_random_pool_name(ARRAY[
                    v_city || ' Savings & Loan',
                    'First Bank of ' || v_city,
                    v_last || ' Trust',
                    v_city || ' Credit Union'
                ])
                ELSE pick_random_pool_name(ARRAY[
                    v_last || ' & Sons Construction',
                    v_city || ' Construction Co.',
                    v_city || ' Builders Ltd.',
                    COALESCE(pick_random_pool_name(v_last_pool), 'Mercado') || ' Contracting'
                ]) END;
            v_title := pick_random_pool_name(CASE
                WHEN p_track = 'manufacturing' THEN CASE
                    WHEN p_rung = 1 THEN ARRAY['Manufacturing Technician', 'Line Supervisor', 'Quality Inspector']
                    WHEN p_rung = 2 THEN ARRAY['Production Engineer', 'Process Engineer', 'Shift Supervisor']
                    WHEN p_rung = 3 THEN ARRAY['Production Manager', 'Area Manager', 'Operations Supervisor']
                    WHEN p_rung = 4 THEN ARRAY['Plant Manager', 'Factory Manager', 'Site Director']
                    WHEN p_rung = 5 THEN ARRAY['Director of Manufacturing', 'Director of Plant Operations', 'Regional Manufacturing Director']
                    ELSE                 ARRAY['VP of Manufacturing', 'VP of Operations', 'Group Manufacturing Director']
                END
                WHEN p_track = 'product' THEN CASE
                    WHEN p_rung = 1 THEN ARRAY['Design Intern', 'CAD Technician', 'Test Engineer']
                    WHEN p_rung = 2 THEN ARRAY['Product Engineer', 'Component Engineer', 'Systems Engineer']
                    WHEN p_rung = 3 THEN ARRAY['Engineering Manager', 'Lead Engineer', 'Powertrain Team Lead']
                    WHEN p_rung = 4 THEN ARRAY['Vehicle Program Manager', 'Platform Manager', 'Program Chief Engineer']
                    WHEN p_rung = 5 THEN ARRAY['Director of Product Development', 'Director of Engineering', 'Advanced Concepts Director']
                    ELSE                 ARRAY['VP of Engineering', 'VP of Product Planning', 'Head of Global Product']
                END
                WHEN p_track = 'commercial' THEN CASE
                    WHEN p_rung = 1 THEN ARRAY['Showroom Sales Associate', 'Junior Marketing Analyst', 'Customer Relations Rep']
                    WHEN p_rung = 2 THEN ARRAY['Field Sales Representative', 'Marketing Analyst', 'Dealer Account Rep']
                    WHEN p_rung = 3 THEN ARRAY['District Sales Manager', 'Marketing Manager', 'Fleet Sales Manager']
                    WHEN p_rung = 4 THEN ARRAY['Regional Sales Director', 'Director of Marketing', 'Brand Manager']
                    WHEN p_rung = 5 THEN ARRAY['VP of Sales', 'VP of Marketing', 'National Sales Director']
                    ELSE                 ARRAY['Senior VP of Commercial Operations', 'Commercial Director', 'Head of Global Sales']
                END
                WHEN p_track = 'management' THEN CASE
                    WHEN p_rung = 1 THEN ARRAY['Assistant Branch Manager', 'Personal Banker', 'Branch Operations Lead']
                    WHEN p_rung = 2 THEN ARRAY['Branch Manager', 'Area Manager', 'District Banking Manager']
                    WHEN p_rung = 3 THEN ARRAY['Regional Director', 'Director of Branch Operations', 'Retail Banking Director']
                    WHEN p_rung = 4 THEN ARRAY['Head of Retail Banking', 'VP of Treasury Operations', 'Controller']
                    ELSE                 ARRAY['Treasurer', 'Deputy CFO', 'VP of Finance']
                END
                WHEN p_track = 'credit' THEN CASE
                    WHEN p_rung = 1 THEN ARRAY['Junior Credit Analyst', 'Credit Bureau Analyst', 'Loan Processor']
                    WHEN p_rung = 2 THEN ARRAY['Loan Officer', 'Mortgage Officer', 'Commercial Lending Officer']
                    WHEN p_rung = 3 THEN ARRAY['Underwriter', 'Senior Underwriter', 'Credit Underwriter']
                    WHEN p_rung = 4 THEN ARRAY['Credit Risk Manager', 'Portfolio Risk Manager', 'Collections Lead']
                    WHEN p_rung = 5 THEN ARRAY['Director of Lending', 'Director of Credit', 'Head of Underwriting']
                    ELSE                 ARRAY['Chief Credit Officer', 'Head of Credit Risk', 'Group Lending Director']
                END
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
    IF p_track NOT IN ('operations', 'leadership', 'manufacturing', 'product', 'commercial', 'management', 'credit') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_track');
    END IF;
    -- Leadership and the three automotive careers (20270837) post
    -- top to bottom; Operations rungs 4-6 still await their charters.
    v_title := CASE WHEN p_track = 'manufacturing' THEN
        CASE p_rung
            WHEN 1 THEN 'Production Engineer'
            WHEN 2 THEN 'Production Manager'
            WHEN 3 THEN 'Plant Manager'
            WHEN 4 THEN 'Director of Manufacturing'
            WHEN 5 THEN 'VP of Manufacturing'
            WHEN 6 THEN 'Chief Manufacturing Officer (CMO)'
            ELSE NULL
        END
    WHEN p_track = 'product' THEN
        CASE p_rung
            WHEN 1 THEN 'Product Engineer'
            WHEN 2 THEN 'Engineering Manager'
            WHEN 3 THEN 'Vehicle Program Manager'
            WHEN 4 THEN 'Director of Product Development'
            WHEN 5 THEN 'VP of Product Planning / VP of Engineering'
            WHEN 6 THEN 'Chief Product Officer (CPO)'
            ELSE NULL
        END
    WHEN p_track = 'commercial' THEN
        CASE p_rung
            WHEN 1 THEN 'Field Sales Representative / Marketing Analyst'
            WHEN 2 THEN 'District Sales Manager / Marketing Manager'
            WHEN 3 THEN 'Regional Sales Director / Director of Marketing'
            WHEN 4 THEN 'VP of Sales / VP of Marketing'
            WHEN 5 THEN 'Senior VP of Commercial Operations'
            WHEN 6 THEN 'Chief Commercial Officer (CCO)'
            ELSE NULL
        END
    WHEN p_track = 'management' THEN
        -- Banking's Management track (20270898): five rungs, field
        -- to headquarters, ending at the books.
        CASE p_rung
            WHEN 1 THEN 'Branch Manager'
            WHEN 2 THEN 'Regional Director'
            WHEN 3 THEN 'Head of Retail Banking'
            WHEN 4 THEN 'Treasurer'
            WHEN 5 THEN 'Chief Financial Officer (CFO)'
            ELSE NULL
        END
    WHEN p_track = 'credit' THEN
        -- Banking's Credit track (20270898): six rungs, the file to
        -- the whole book.
        CASE p_rung
            WHEN 1 THEN 'Credit Analyst'
            WHEN 2 THEN 'Loan Officer'
            WHEN 3 THEN 'Underwriter'
            WHEN 4 THEN 'Credit Risk Manager'
            WHEN 5 THEN 'Director of Lending'
            WHEN 6 THEN 'Chief Lending Officer (CLO)'
            ELSE NULL
        END
    WHEN p_track = 'leadership' THEN
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
    IF v_corp.industry NOT IN ('construction', 'automotive', 'banking') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;
    -- Tracks pair with their industry: construction hires Operations
    -- and Leadership; automotive hires its three careers; banking
    -- hires Management and Credit (two of three, 20270898).
    IF (v_corp.industry = 'construction' AND p_track NOT IN ('operations', 'leadership'))
       OR (v_corp.industry = 'automotive' AND p_track NOT IN ('manufacturing', 'product', 'commercial'))
       OR (v_corp.industry = 'banking' AND p_track NOT IN ('management', 'credit')) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_track');
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
    v_new_title := CASE WHEN (v.o_opening).track = 'manufacturing' THEN
        CASE v_new_rung
            WHEN 2 THEN 'Production Manager'
            WHEN 3 THEN 'Plant Manager'
            WHEN 4 THEN 'Director of Manufacturing'
            WHEN 5 THEN 'VP of Manufacturing'
            WHEN 6 THEN 'Chief Manufacturing Officer (CMO)'
            ELSE NULL
        END
    WHEN (v.o_opening).track = 'product' THEN
        CASE v_new_rung
            WHEN 2 THEN 'Engineering Manager'
            WHEN 3 THEN 'Vehicle Program Manager'
            WHEN 4 THEN 'Director of Product Development'
            WHEN 5 THEN 'VP of Product Planning / VP of Engineering'
            WHEN 6 THEN 'Chief Product Officer (CPO)'
            ELSE NULL
        END
    WHEN (v.o_opening).track = 'commercial' THEN
        CASE v_new_rung
            WHEN 2 THEN 'District Sales Manager / Marketing Manager'
            WHEN 3 THEN 'Regional Sales Director / Director of Marketing'
            WHEN 4 THEN 'VP of Sales / VP of Marketing'
            WHEN 5 THEN 'Senior VP of Commercial Operations'
            WHEN 6 THEN 'Chief Commercial Officer (CCO)'
            ELSE NULL
        END
    WHEN (v.o_opening).track = 'management' THEN
        CASE v_new_rung
            WHEN 2 THEN 'Regional Director'
            WHEN 3 THEN 'Head of Retail Banking'
            WHEN 4 THEN 'Treasurer'
            WHEN 5 THEN 'Chief Financial Officer (CFO)'
            ELSE NULL
        END
    WHEN (v.o_opening).track = 'credit' THEN
        CASE v_new_rung
            WHEN 2 THEN 'Loan Officer'
            WHEN 3 THEN 'Underwriter'
            WHEN 4 THEN 'Credit Risk Manager'
            WHEN 5 THEN 'Director of Lending'
            WHEN 6 THEN 'Chief Lending Officer (CLO)'
            ELSE NULL
        END
    WHEN (v.o_opening).track = 'leadership' THEN
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

NOTIFY pgrst, 'reload schema';

COMMIT;
