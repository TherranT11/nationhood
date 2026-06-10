-- ════════════════════════════════════════════════════════════════════
-- 20270796 — Job openings: storage + post/withdraw lifecycle
--
-- The Post Job Opening modal goes live. One table feeds both boards:
-- the corp page's ROLES panel and every businessman's Available Roles
-- on the career page ("Posted {X} months ago" — one tick is one
-- month).
--
--   job_openings: corp, track ('operations' for now), rung (1-3, the
--   chartered Operations rungs), server-derived title, the yearly
--   salary offering, reach ('local' = corp's home nation only /
--   'global'), status open → withdrawn (filled arrives with the
--   application flow).
--
-- post_job_opening guards: businessman owner, not arrested,
-- construction corp, chartered track/rung, one OPEN posting per
-- (corp, track, rung), and the salary must sit within 25%-200% of
-- the HQ nation's expected salary (wages × standard_of_living × 100
-- — the same formula the modal displays) so a tampered client can't
-- post absurd numbers. Titles are derived server-side from the rung,
-- never trusted from the client.
--
-- Applying/accepting is the next phase; this ships post + list +
-- withdraw.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.job_openings (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id              uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    track                text NOT NULL CHECK (track IN ('operations')),
    rung                 int  NOT NULL CHECK (rung BETWEEN 1 AND 6),
    title                text NOT NULL,
    salary_yearly        bigint NOT NULL CHECK (salary_yearly > 0),
    reach                text NOT NULL CHECK (reach IN ('local', 'global')),
    status               text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'withdrawn', 'filled')),
    posted_by_faction_id uuid REFERENCES public.factions(id) ON DELETE SET NULL,
    posted_at_tick       int  NOT NULL DEFAULT 0,
    created_at           timestamptz NOT NULL DEFAULT now()
);

-- One live posting per role per corp.
CREATE UNIQUE INDEX IF NOT EXISTS job_openings_one_open_per_role
    ON public.job_openings (corp_id, track, rung)
    WHERE status = 'open';

CREATE INDEX IF NOT EXISTS job_openings_open_idx
    ON public.job_openings (status) WHERE status = 'open';

ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;

-- The job board is public game data; all writes go through the
-- SECURITY DEFINER RPCs below.
DROP POLICY IF EXISTS "Allow select for all" ON public.job_openings;
CREATE POLICY "Allow select for all" ON public.job_openings
    FOR SELECT USING (true);

-- ── post_job_opening ──────────────────────────────────────────────
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
    -- same wages × standard_of_living × 100 the modal shows.
    SELECT * INTO v_nation FROM nations WHERE id = v_corp.hq_nation_id;
    v_expected := GREATEST(1, COALESCE(v_nation.wages, 50))
                  * GREATEST(1, COALESCE(v_nation.standard_of_living, 50))
                  * 100;
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

REVOKE EXECUTE ON FUNCTION public.post_job_opening(uuid, text, int, bigint, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.post_job_opening(uuid, text, int, bigint, text) TO authenticated;

-- ── withdraw_job_opening ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.withdraw_job_opening(p_opening_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_opening job_openings%ROWTYPE;
    v_owner   uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_opening FROM job_openings WHERE id = p_opening_id FOR UPDATE;
    IF v_opening.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_found');
    END IF;
    IF v_opening.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_open',
            'status', v_opening.status);
    END IF;

    SELECT ec.owner_faction_id INTO v_owner
      FROM entrepreneur_corps ec
      JOIN factions f ON f.id = ec.owner_faction_id
     WHERE ec.id = v_opening.corp_id
       AND (f.id = v_uid OR f.linked_user_id = v_uid)
       AND f.abandoned_at IS NULL;
    IF v_owner IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    UPDATE job_openings SET status = 'withdrawn' WHERE id = p_opening_id;

    RETURN jsonb_build_object('success', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.withdraw_job_opening(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.withdraw_job_opening(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
