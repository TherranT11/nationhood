-- ════════════════════════════════════════════════════════════════════
-- 20270540 — draw_court_case: corp can't sue itself
--
-- Edge case bug: when both plaintiff_party_type AND defendant_party_type
-- are 'corporation' in a case draft, the two corp-pick SELECTs ran
-- independently. If a nation had only one corp of the matching
-- industry (or random happened to land on the same one twice), the
-- generated case read e.g. "Gurjar Shipping v. Gurjar Shipping".
--
-- Fix: track the plaintiff's chosen corp_id and exclude it from the
-- defendant corp pool. If the exclusion empties the pool (only one
-- eligible corp in this nation for the defendant's industry filter),
-- skip the case_draft and try another — same loop pattern that
-- already handles the no-eligible-corp case.
--
-- Same body as 20270521's draw_court_case otherwise. The diff is:
--   • new local v_plaintiff_corp_id uuid (NULL when plaintiff isn't
--     a corp);
--   • plaintiff corp SELECT now reads c.id, c.name INTO v_plaintiff_corp_id,
--     v_corp_name (was just c.name);
--   • defendant corp SELECT gains AND c.id IS DISTINCT FROM v_plaintiff_corp_id.
--
-- IS DISTINCT FROM is null-safe: when v_plaintiff_corp_id is NULL
-- (plaintiff was a person or the state), every corp row passes the
-- guard and the defendant pick behaves identically to before.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.draw_court_case(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                uuid := auth.uid();
    v_pol                factions%ROWTYPE;
    v_nation             nations%ROWTYPE;
    v_case               court_case_drafts%ROWTYPE;
    v_first_pool         text[];
    v_last_pool          text[];
    v_first_len          int;
    v_last_len           int;
    v_plaintiff          text;
    v_defendant          text;
    v_corp_name          text;
    v_plaintiff_corp_id  uuid;
    v_skipped            uuid[] := ARRAY[]::uuid[];
    v_max_tries          int := 20;
    v_tries              int := 0;
    v_industry           text;
    v_p_sum              int;
    v_d_sum              int;
    v_p_count            int;
    v_d_count            int;
    v_tick               int;
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
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.try_case_cooldown_until_tick IS NOT NULL
       AND v_pol.try_case_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.try_case_cooldown_until_tick);
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
           AND NOT EXISTS (
               SELECT 1 FROM public.court_case_trials t
                WHERE t.case_draft_id = d.id
                  AND t.status IN ('pre_trial', 'in_progress')
           )
           AND NOT EXISTS (
               SELECT 1 FROM public.court_case_nation_cooldowns nc
                WHERE nc.case_draft_id      = d.id
                  AND nc.nation_id          = v_nation.id
                  AND nc.cooldown_until_tick > v_tick
           )
         ORDER BY random() LIMIT 1;
        IF v_case.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_cases_available');
        END IF;

        v_plaintiff         := NULL;
        v_defendant         := NULL;
        v_plaintiff_corp_id := NULL;

        -- Plaintiff: state → nation name; person → name pool;
        -- corporation → random matching corp (also remembering id
        -- so the defendant pick can exclude it).
        IF v_case.plaintiff_party_type = 'state' THEN
            v_plaintiff := v_nation.name;
        ELSIF v_case.plaintiff_party_type = 'person' THEN
            v_plaintiff := v_first_pool[1 + floor(random() * v_first_len)::int]
                        || ' '
                        || v_last_pool[1 + floor(random() * v_last_len)::int];
        ELSE
            v_industry := CASE WHEN v_case.plaintiff_corp_type = 'aviation'
                                 THEN 'aviation_manufacturing'
                               ELSE v_case.plaintiff_corp_type END;
            SELECT c.id, c.name INTO v_plaintiff_corp_id, v_corp_name
              FROM public.entrepreneur_corps c
              JOIN public.factions owner ON owner.id = c.owner_faction_id
             WHERE c.industry = v_industry
               AND EXISTS (
                   SELECT 1 FROM public.corp_buildings b
                    WHERE b.owner_corp_id = c.id
                      AND b.nation_id     = v_nation.id
                      AND b.status        = 'completed'
               )
               AND (owner.party_cooldown_until_tick IS NULL
                    OR owner.party_cooldown_until_tick <= v_tick)
             ORDER BY random() LIMIT 1;
            IF v_corp_name IS NULL THEN
                v_skipped := array_append(v_skipped, v_case.id);
                CONTINUE;
            END IF;
            v_plaintiff := v_corp_name;
        END IF;

        -- Defendant: same three-way branch, with the corp pool
        -- excluding the plaintiff's corp by id (null-safe — non-corp
        -- plaintiffs leave v_plaintiff_corp_id NULL, so every corp
        -- row passes the IS DISTINCT FROM guard).
        IF v_case.defendant_party_type = 'state' THEN
            v_defendant := v_nation.name;
        ELSIF v_case.defendant_party_type = 'person' THEN
            v_defendant := v_first_pool[1 + floor(random() * v_first_len)::int]
                        || ' '
                        || v_last_pool[1 + floor(random() * v_last_len)::int];
        ELSE
            v_industry := CASE WHEN v_case.defendant_corp_type = 'aviation'
                                 THEN 'aviation_manufacturing'
                               ELSE v_case.defendant_corp_type END;
            SELECT c.name INTO v_corp_name
              FROM public.entrepreneur_corps c
              JOIN public.factions owner ON owner.id = c.owner_faction_id
             WHERE c.industry = v_industry
               AND c.id IS DISTINCT FROM v_plaintiff_corp_id
               AND EXISTS (
                   SELECT 1 FROM public.corp_buildings b
                    WHERE b.owner_corp_id = c.id
                      AND b.nation_id     = v_nation.id
                      AND b.status        = 'completed'
               )
               AND (owner.party_cooldown_until_tick IS NULL
                    OR owner.party_cooldown_until_tick <= v_tick)
             ORDER BY random() LIMIT 1;
            IF v_corp_name IS NULL THEN
                -- Could be no eligible corp at all, or the only
                -- eligible one is already the plaintiff. Same
                -- handling either way: skip and try another draft.
                v_skipped := array_append(v_skipped, v_case.id);
                CONTINUE;
            END IF;
            v_defendant := v_corp_name;
        END IF;

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

        UPDATE public.factions
           SET try_case_cooldown_until_tick = v_tick + 3
         WHERE id = v_pol.id;

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
            'defendant_rep_on_win',   round(v_p_sum::numeric / 10.0, 1),
            'cooldown_until_tick',    v_tick + 3
        );
    END LOOP;

    RETURN jsonb_build_object('success', false, 'reason', 'no_viable_case');
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
