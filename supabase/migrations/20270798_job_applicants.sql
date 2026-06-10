-- ════════════════════════════════════════════════════════════════════
-- 20270798 — Job applicants: NPC candidates on post + player APPLY
--
-- Posting a role now draws a batch of NPC applicants immediately, and
-- real businessmen can apply from the career page. Both land in one
-- table the corp owner reads: Name, City, Current Employment, Current
-- Title, Years of Experience.
--
--   job_applicants: opening FK (CASCADE), applicant_faction_id (NULL =
--   NPC, set = a real player's businessman faction), and the five
--   display columns snapshotted at apply time. One application per
--   player faction per opening (partial unique index).
--
--   _roll_job_applicants (internal): rolls 1-8 NPCs per posting.
--   Count scales with reach (global adds more) and generosity (offers
--   at/above expected attract extras; lowball offers shed them).
--   Each NPC's city is a jobs-weighted draw (Efraimidis-Spirakis
--   A-Res: ORDER BY random()^(1/jobs) DESC) — LOCAL from the HQ
--   nation's cities, GLOBAL from every city — because the city JOBS
--   stat represents how many people there are looking for work.
--   Names come from that city's nation pools via the canonical
--   pick_random_pool_name (20270415). Experience and current titles
--   scale with the rung being hired for; ~35% are between jobs.
--
--   post_job_opening: byte-faithful to 20270797 except the applicant
--   roll after the INSERT.
--
--   apply_to_job_opening(p_opening_id, p_faction_id): player
--   application. Guards: your businessman faction, not arrested,
--   opening open, not your own corp, local-reach postings only accept
--   home-nation businessmen, no double-applies. Row values are
--   derived server-side: name from the character, city from
--   biz_home_city, employment from corp ownership ("Owner of {corp}"
--   / "Unemployed"), experience 0 — no player has held an in-game job
--   yet; this becomes ticks-employed ÷ 12 when hiring lands.
--
-- Accepting/hiring an applicant is the next phase.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.job_applicants (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    opening_id           uuid NOT NULL REFERENCES public.job_openings(id) ON DELETE CASCADE,
    applicant_faction_id uuid REFERENCES public.factions(id) ON DELETE CASCADE,
    name                 text NOT NULL,
    city                 text NOT NULL,
    current_employment   text NOT NULL,
    current_title        text NOT NULL,
    years_experience     int  NOT NULL DEFAULT 0 CHECK (years_experience >= 0),
    status               text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'rejected', 'hired')),
    applied_at_tick      int  NOT NULL DEFAULT 0,
    created_at           timestamptz NOT NULL DEFAULT now()
);

-- One application per player faction per opening (NPCs are unlimited).
CREATE UNIQUE INDEX IF NOT EXISTS job_applicants_one_per_player
    ON public.job_applicants (opening_id, applicant_faction_id)
    WHERE applicant_faction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS job_applicants_opening_idx
    ON public.job_applicants (opening_id);

ALTER TABLE public.job_applicants ENABLE ROW LEVEL SECURITY;

-- Public game data, same as the openings board; all writes go through
-- the SECURITY DEFINER RPCs.
DROP POLICY IF EXISTS "Allow select for all" ON public.job_applicants;
CREATE POLICY "Allow select for all" ON public.job_applicants
    FOR SELECT USING (true);

-- ── _roll_job_applicants (internal) ───────────────────────────────
CREATE OR REPLACE FUNCTION public._roll_job_applicants(
    p_opening_id    uuid,
    p_hq_nation_id  uuid,
    p_reach         text,
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

        -- Experience scales with the rung being hired for.
        v_exp := CASE p_rung
            WHEN 1 THEN floor(random() * 5)::int        -- 0-4
            WHEN 2 THEN 3 + floor(random() * 7)::int    -- 3-9
            ELSE        6 + floor(random() * 10)::int   -- 6-15
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
            v_title := pick_random_pool_name(CASE p_rung
                WHEN 1 THEN ARRAY['Site Supervisor', 'Foreman', 'Project Coordinator', 'Assistant Project Manager']
                WHEN 2 THEN ARRAY['Project Manager', 'Site Manager', 'Construction Manager']
                ELSE        ARRAY['Senior Project Manager', 'Operations Manager', 'District Operations Manager']
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

REVOKE EXECUTE ON FUNCTION public._roll_job_applicants(uuid, uuid, text, int, bigint, numeric, int) FROM PUBLIC;

COMMENT ON FUNCTION public._roll_job_applicants(uuid, uuid, text, int, bigint, numeric, int) IS
    'Internal: rolls the immediate NPC applicant batch for a freshly posted job opening. Called by post_job_opening only — not granted to authenticated.';

-- ── post_job_opening — roll NPC applicants after the INSERT ───────
-- Body byte-faithful to 20270797 except the _roll_job_applicants
-- call after the INSERT succeeds.
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

    -- The posting hits the street: NPC candidates apply immediately.
    PERFORM _roll_job_applicants(v_id, v_corp.hq_nation_id, p_reach, p_rung,
                                 p_salary_yearly, v_expected, v_tick);

    RETURN jsonb_build_object(
        'success',    true,
        'opening_id', v_id,
        'title',      v_title
    );
END $$;

-- ── apply_to_job_opening ──────────────────────────────────────────
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

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_opening.corp_id;
    IF v_corp.owner_faction_id = v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'own_corp');
    END IF;
    IF v_opening.reach = 'local' AND v_fac.nation_id IS DISTINCT FROM v_corp.hq_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'local_only');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- The row is a server-derived snapshot of who's applying: home
    -- city, corp ownership as current employment, and 0 years —
    -- no player has held an in-game job yet (this becomes
    -- ticks-employed ÷ 12 once hiring exists).
    v_city := COALESCE(v_fac.biz_home_city,
        (SELECT capital FROM nations WHERE id = v_fac.nation_id), '—');
    SELECT name INTO v_corp_name FROM entrepreneur_corps
     WHERE owner_faction_id = v_fac.id ORDER BY created_at LIMIT 1;

    BEGIN
        INSERT INTO job_applicants (
            opening_id, applicant_faction_id, name, city,
            current_employment, current_title, years_experience, applied_at_tick
        ) VALUES (
            p_opening_id, v_fac.id,
            COALESCE(NULLIF(TRIM(COALESCE(v_fac.leader_first_name, '') || ' ' || COALESCE(v_fac.leader_last_name, '')), ''), v_fac.faction_name, '—'),
            v_city,
            CASE WHEN v_corp_name IS NULL THEN 'Unemployed' ELSE 'Owner of ' || v_corp_name END,
            CASE WHEN v_corp_name IS NULL THEN '—'          ELSE 'Owner' END,
            0, v_tick
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
