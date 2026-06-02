-- ════════════════════════════════════════════════════════════════════
-- 20270509 — Court Case draw / accept / reject + Advocate stat plumbing
--
-- The Advocate's TRY A CASE action draws a random approved case from
-- the court_case_drafts pool (status='approved'), fills the parties
-- with real entities pulled from the lawyer's nation, and presents it
-- to the player. The player then either:
--   • ACCEPTS: +0.2 Political Standing
--   • REJECTS: -1 Reputation
--
-- Party resolution:
--   • person      → random first + last from nations.first_name_pool
--                   and last_name_pool
--   • corporation → random entrepreneur_corps row with industry
--                   matching corp_type AND a completed building in
--                   the lawyer's nation. If none exists for that
--                   corp_type, the case is silently skipped and the
--                   draw tries another case in the pool.
--
-- One case per advocate: once a lawyer has accepted or rejected a
-- case, they won't see it again (politician_court_case_attempts
-- uniqueness on politician_id + case_id).
--
-- politician_standing widened from INT to numeric so the +0.2 award
-- actually accrues. Same pattern 20270461 used for credibility.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Widen politician_standing to numeric ─────────────────────────
ALTER TABLE public.factions
    ALTER COLUMN politician_standing TYPE numeric USING politician_standing::numeric;

COMMENT ON COLUMN public.factions.politician_standing IS
    'Politician stat: 1 at creation. Widened from INT to numeric in 20270509 so fractional gains (e.g., +0.2 on accept_drawn_case) accrue cleanly.';

-- ── 2. Attempt log ──────────────────────────────────────────────────
-- Tracks which advocates have seen which cases and what they did.
-- The UNIQUE constraint enforces "one shot per case per advocate" —
-- the draw RPC filters cases by exclusion against this table.
CREATE TABLE IF NOT EXISTS public.politician_court_case_attempts (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    case_id       uuid NOT NULL REFERENCES public.court_case_drafts(id) ON DELETE CASCADE,
    decision      text NOT NULL CHECK (decision IN ('accepted', 'rejected')),
    created_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (politician_id, case_id)
);

CREATE INDEX IF NOT EXISTS politician_court_case_attempts_pol_idx
    ON public.politician_court_case_attempts (politician_id, created_at DESC);

ALTER TABLE public.politician_court_case_attempts ENABLE ROW LEVEL SECURITY;

-- ── 3. draw_court_case ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.draw_court_case(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_pol         factions%ROWTYPE;
    v_nation      nations%ROWTYPE;
    v_case        court_case_drafts%ROWTYPE;
    v_first_pool  text[];
    v_last_pool   text[];
    v_first_len   int;
    v_last_len    int;
    v_plaintiff   text;
    v_defendant   text;
    v_corp_name   text;
    v_skipped     uuid[] := ARRAY[]::uuid[];
    v_max_tries   int := 20;
    v_tries       int := 0;
    v_industry    text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    SELECT * INTO v_nation FROM public.nations WHERE id = v_pol.nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    v_first_pool := COALESCE(v_nation.first_name_pool, ARRAY[]::text[]);
    v_last_pool  := COALESCE(v_nation.last_name_pool,  ARRAY[]::text[]);
    v_first_len  := COALESCE(array_length(v_first_pool, 1), 0);
    v_last_len   := COALESCE(array_length(v_last_pool,  1), 0);
    IF v_first_len = 0 OR v_last_len = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_name_pool');
    END IF;

    -- Try up to v_max_tries random cases. Cases where a party-type =
    -- corporation but no corp matches the requested industry get added
    -- to v_skipped so the loop doesn't keep re-picking them.
    LOOP
        v_tries := v_tries + 1;
        EXIT WHEN v_tries > v_max_tries;

        SELECT * INTO v_case FROM public.court_case_drafts d
         WHERE d.status = 'approved'
           AND NOT (d.id = ANY(v_skipped))
           AND NOT EXISTS (
               SELECT 1 FROM public.politician_court_case_attempts a
                WHERE a.politician_id = v_pol.id
                  AND a.case_id       = d.id
           )
         ORDER BY random() LIMIT 1;
        IF v_case.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_cases_available');
        END IF;

        v_plaintiff := NULL;
        v_defendant := NULL;

        -- Resolve plaintiff
        IF v_case.plaintiff_party_type = 'person' THEN
            v_plaintiff := v_first_pool[1 + floor(random() * v_first_len)::int]
                        || ' '
                        || v_last_pool[1 + floor(random() * v_last_len)::int];
        ELSE
            -- The form's 'aviation' corp_type maps to the
            -- 'aviation_manufacturing' industry slug.
            v_industry := CASE WHEN v_case.plaintiff_corp_type = 'aviation'
                                 THEN 'aviation_manufacturing'
                               ELSE v_case.plaintiff_corp_type END;
            SELECT c.name INTO v_corp_name FROM public.entrepreneur_corps c
             WHERE c.industry = v_industry
               AND EXISTS (
                   SELECT 1 FROM public.corp_buildings b
                    WHERE b.owner_corp_id = c.id
                      AND b.nation_id     = v_nation.id
                      AND b.status        = 'completed'
               )
             ORDER BY random() LIMIT 1;
            IF v_corp_name IS NULL THEN
                v_skipped := array_append(v_skipped, v_case.id);
                CONTINUE;
            END IF;
            v_plaintiff := v_corp_name;
        END IF;

        -- Resolve defendant
        IF v_case.defendant_party_type = 'person' THEN
            v_defendant := v_first_pool[1 + floor(random() * v_first_len)::int]
                        || ' '
                        || v_last_pool[1 + floor(random() * v_last_len)::int];
        ELSE
            v_industry := CASE WHEN v_case.defendant_corp_type = 'aviation'
                                 THEN 'aviation_manufacturing'
                               ELSE v_case.defendant_corp_type END;
            SELECT c.name INTO v_corp_name FROM public.entrepreneur_corps c
             WHERE c.industry = v_industry
               AND EXISTS (
                   SELECT 1 FROM public.corp_buildings b
                    WHERE b.owner_corp_id = c.id
                      AND b.nation_id     = v_nation.id
                      AND b.status        = 'completed'
               )
             ORDER BY random() LIMIT 1;
            IF v_corp_name IS NULL THEN
                v_skipped := array_append(v_skipped, v_case.id);
                CONTINUE;
            END IF;
            v_defendant := v_corp_name;
        END IF;

        -- Viable case. Strip hidden strengths from the beats payload —
        -- the judge sees those, not the advocate. Name + support are
        -- public so the advocate can read the beat's title and which
        -- party it favors before deciding to take the case.
        RETURN jsonb_build_object(
            'success',              true,
            'case_id',              v_case.id,
            'case_type',            v_case.case_type,
            'litigation_type',      v_case.litigation_type,
            'overview',             v_case.overview,
            'plaintiff_name',       v_plaintiff,
            'plaintiff_party_type', v_case.plaintiff_party_type,
            'plaintiff_corp_type',  v_case.plaintiff_corp_type,
            'defendant_name',       v_defendant,
            'defendant_party_type', v_case.defendant_party_type,
            'defendant_corp_type',  v_case.defendant_corp_type,
            'beats',                (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    'name',        b ->> 'name',
                    'type',        b ->> 'type',
                    'description', b ->> 'description',
                    'support',     b ->> 'support'
                )), '[]'::jsonb)
                FROM jsonb_array_elements(v_case.beats) b
            )
        );
    END LOOP;

    -- Exhausted v_max_tries without finding a corp-resolvable case.
    RETURN jsonb_build_object('success', false, 'reason', 'no_viable_case');
END $$;

REVOKE EXECUTE ON FUNCTION public.draw_court_case(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.draw_court_case(uuid) TO authenticated;

-- ── 4. accept_drawn_case ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.accept_drawn_case(p_faction_id uuid, p_case_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_pol         factions%ROWTYPE;
    v_case_status text;
    v_standing    numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_case_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    SELECT status INTO v_case_status FROM public.court_case_drafts WHERE id = p_case_id;
    IF v_case_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_found');
    END IF;
    IF v_case_status <> 'approved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_approved');
    END IF;

    -- Idempotent: UNIQUE(politician_id, case_id) blocks a double-fire.
    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, p_case_id, 'accepted')
    ON CONFLICT (politician_id, case_id) DO NOTHING;

    UPDATE public.factions
       SET politician_standing = COALESCE(politician_standing, 0) + 0.2
     WHERE id = v_pol.id
    RETURNING politician_standing INTO v_standing;

    RETURN jsonb_build_object(
        'success',           true,
        'decision',          'accepted',
        'case_id',           p_case_id,
        'standing_delta',    0.2,
        'new_standing',      v_standing
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.accept_drawn_case(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.accept_drawn_case(uuid, uuid) TO authenticated;

-- ── 5. reject_drawn_case ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_drawn_case(p_faction_id uuid, p_case_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_pol         factions%ROWTYPE;
    v_case_status text;
    v_reputation  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_case_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    SELECT status INTO v_case_status FROM public.court_case_drafts WHERE id = p_case_id;
    IF v_case_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_found');
    END IF;
    IF v_case_status <> 'approved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_approved');
    END IF;

    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, p_case_id, 'rejected')
    ON CONFLICT (politician_id, case_id) DO NOTHING;

    UPDATE public.factions
       SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) - 1)
     WHERE id = v_pol.id
    RETURNING politician_reputation INTO v_reputation;

    RETURN jsonb_build_object(
        'success',         true,
        'decision',        'rejected',
        'case_id',         p_case_id,
        'reputation_delta', -1,
        'new_reputation',  v_reputation
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.reject_drawn_case(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.reject_drawn_case(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
