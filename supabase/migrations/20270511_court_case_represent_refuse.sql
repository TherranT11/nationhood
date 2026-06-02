-- ════════════════════════════════════════════════════════════════════
-- 20270511 — Try a Case: represent / refuse (replaces accept / reject)
--
-- Spec change to the Advocate's TRY A CASE flow:
--
--   Old (20270509):
--     • ACCEPT  → +0.2 Political Standing
--     • REJECT  → -1 Reputation
--
--   New:
--     • REPRESENT PLAINTIFF / DEFENDANT → commits the advocate to a
--       side and activates the trial. No immediate stat change;
--       reputation flows from winning the trial (sum of opposing
--       side's beats / 10).
--     • REFUSE → -2 Political Capital, case marked refused.
--
-- The lawyer also now sees aggregate strength sums + beat counts per
-- side BEFORE picking a side, but does NOT see individual beats until
-- after committing. draw_court_case is re-authored to expose the
-- aggregates and hide the beats array.
--
-- politician_court_case_attempts.decision CHECK is widened to:
--   'representing_plaintiff' | 'representing_defendant' | 'refused'
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- Drop the old commitment RPCs; the new pair takes their slots.
DROP FUNCTION IF EXISTS public.accept_drawn_case(uuid, uuid);
DROP FUNCTION IF EXISTS public.reject_drawn_case(uuid, uuid);

-- Swap the decision CHECK constraint to the new value set. Any rows
-- left over from the brief life of the accept/reject flow (20270509)
-- would otherwise fail validation and break the migration mid-apply.
-- The attempts log is just "this lawyer drew this case" — replay-
-- tolerant, so deleting the orphans is safe; the lawyer can re-draw.
DELETE FROM public.politician_court_case_attempts
 WHERE decision IN ('accepted', 'rejected');

ALTER TABLE public.politician_court_case_attempts
    DROP CONSTRAINT IF EXISTS politician_court_case_attempts_decision_check;
ALTER TABLE public.politician_court_case_attempts
    ADD CONSTRAINT politician_court_case_attempts_decision_check
    CHECK (decision IN ('representing_plaintiff', 'representing_defendant', 'refused'));

-- ── draw_court_case (re-authored) ───────────────────────────────────
-- Returns aggregate strength sums + beat counts per side, plus the
-- reputation each side's winning lawyer earns. Individual beats are
-- NOT returned at this stage — they're revealed after representation.
CREATE OR REPLACE FUNCTION public.draw_court_case(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_nation       nations%ROWTYPE;
    v_case         court_case_drafts%ROWTYPE;
    v_first_pool   text[];
    v_last_pool    text[];
    v_first_len    int;
    v_last_len     int;
    v_plaintiff    text;
    v_defendant    text;
    v_corp_name    text;
    v_skipped      uuid[] := ARRAY[]::uuid[];
    v_max_tries    int := 20;
    v_tries        int := 0;
    v_industry     text;
    v_p_sum        int;
    v_d_sum        int;
    v_p_count      int;
    v_d_count      int;
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

        IF v_case.plaintiff_party_type = 'person' THEN
            v_plaintiff := v_first_pool[1 + floor(random() * v_first_len)::int]
                        || ' '
                        || v_last_pool[1 + floor(random() * v_last_len)::int];
        ELSE
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

        -- Aggregate strengths per side. Beats without a Supports pick
        -- are ignored. Beats without a numeric strength are treated as 0.
        SELECT
            COALESCE(sum(CASE WHEN b.support = 'plaintiff' THEN b.strength END), 0),
            COALESCE(sum(CASE WHEN b.support = 'defendant' THEN b.strength END), 0),
            COALESCE(count(*) FILTER (WHERE b.support = 'plaintiff'), 0),
            COALESCE(count(*) FILTER (WHERE b.support = 'defendant'), 0)
          INTO v_p_sum, v_d_sum, v_p_count, v_d_count
          FROM (
            SELECT
                elem ->> 'support' AS support,
                COALESCE((elem ->> 'strength')::int, 0) AS strength
              FROM jsonb_array_elements(v_case.beats) elem
          ) b;

        -- Hide individual beats. Reputation per side = (sum of beats
        -- favoring the OPPOSING side) / 10 — the upset pays more.
        RETURN jsonb_build_object(
            'success',                true,
            'case_id',                v_case.id,
            'case_type',              v_case.case_type,
            'litigation_type',        v_case.litigation_type,
            'overview',               v_case.overview,
            'plaintiff_name',         v_plaintiff,
            'plaintiff_party_type',   v_case.plaintiff_party_type,
            'plaintiff_corp_type',    v_case.plaintiff_corp_type,
            'plaintiff_strength_sum', v_p_sum,
            'plaintiff_beat_count',   v_p_count,
            'plaintiff_rep_on_win',   round(v_d_sum::numeric / 10.0, 1),
            'defendant_name',         v_defendant,
            'defendant_party_type',   v_case.defendant_party_type,
            'defendant_corp_type',    v_case.defendant_corp_type,
            'defendant_strength_sum', v_d_sum,
            'defendant_beat_count',   v_d_count,
            'defendant_rep_on_win',   round(v_p_sum::numeric / 10.0, 1)
        );
    END LOOP;

    RETURN jsonb_build_object('success', false, 'reason', 'no_viable_case');
END $$;

REVOKE EXECUTE ON FUNCTION public.draw_court_case(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.draw_court_case(uuid) TO authenticated;

-- ── represent_drawn_case ────────────────────────────────────────────
-- Locks the advocate to a side. No stat change at this moment; the
-- reputation award is paid by the trial system on victory.
CREATE OR REPLACE FUNCTION public.represent_drawn_case(
    p_faction_id uuid,
    p_case_id    uuid,
    p_side       text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_pol         factions%ROWTYPE;
    v_case_status text;
    v_decision    text;
    v_inserted    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_case_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;
    IF p_side NOT IN ('plaintiff', 'defendant') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_side');
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

    v_decision := CASE WHEN p_side = 'plaintiff'
                         THEN 'representing_plaintiff'
                       ELSE 'representing_defendant' END;

    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, p_case_id, v_decision)
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
    END IF;

    RETURN jsonb_build_object(
        'success',  true,
        'decision', v_decision,
        'side',     p_side,
        'case_id',  p_case_id
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.represent_drawn_case(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.represent_drawn_case(uuid, uuid, text) TO authenticated;

-- ── refuse_drawn_case ───────────────────────────────────────────────
-- -2 Political Capital. Same idempotency gate as before: a re-fire
-- can't double-penalize because the INSERT is uniquely keyed and the
-- UPDATE only runs when the row actually landed.
CREATE OR REPLACE FUNCTION public.refuse_drawn_case(p_faction_id uuid, p_case_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_pol         factions%ROWTYPE;
    v_case_status text;
    v_pc          numeric;
    v_inserted    int;
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
    VALUES (v_pol.id, p_case_id, 'refused')
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
    END IF;

    UPDATE public.factions
       SET political_capital = GREATEST(0, COALESCE(political_capital, 0) - 2)
     WHERE id = v_pol.id
    RETURNING political_capital INTO v_pc;

    RETURN jsonb_build_object(
        'success',                 true,
        'decision',                'refused',
        'case_id',                 p_case_id,
        'political_capital_delta', -2,
        'new_political_capital',   v_pc
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.refuse_drawn_case(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.refuse_drawn_case(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
