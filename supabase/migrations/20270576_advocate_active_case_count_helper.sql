-- ════════════════════════════════════════════════════════════════════
-- 20270576 — Advocate active-case count helper (SoT extraction)
--
-- The query "how many active trials does this advocate have on their
-- desk?" was inlined verbatim in two live RPCs (draw_court_case in
-- 20270545, start_appeal in 20270561) and was about to land a third
-- time in 20270577's read_statute_books. Three copies of the same
-- predicate is the textbook ONE-SOURCE-OF-TRUTH bug, and the two
-- existing copies had already drifted:
--
--   draw_court_case (20270545):
--     status IN ('pre_trial','settlement_conference','in_progress')
--   start_appeal (20270561):
--     status IN ('pre_trial','settlement_conference','awaiting_hearing','in_progress')
--
-- `awaiting_hearing` (the SC queue state) was added to start_appeal
-- when the Supreme Court landed but draw_court_case was never
-- updated. Net effect: a politician whose only open slot was an SC
-- queue trial would correctly be blocked from filing another appeal
-- but could still draw a fresh regular case past their cap. A latent
-- bug.
--
-- This migration:
--   1. Introduces public._advocate_active_case_count(uuid) → int as
--      the single source. Uses the SC-aware status list
--      ('pre_trial','settlement_conference','awaiting_hearing',
--      'in_progress') — matches start_appeal's truth, fixes the
--      draw_court_case oversight.
--   2. Re-emits draw_court_case (body verbatim from 20270545) with
--      the inlined SELECT swapped for a helper call.
--   3. Re-emits start_appeal (body verbatim from 20270561) with the
--      same swap. start_appeal's behavior is unchanged — it was
--      already using the right list, just inlined.
--
-- Behavior change for draw_court_case: an advocate at cap with an
-- awaiting_hearing SC trial in the count now correctly cannot draw a
-- new regular case. Read as a bug fix, not a feature.
--
-- read_statute_books (20270577) consumes the helper from day one.
-- Future cap-aware RPCs should also use it; do not inline the
-- predicate.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Helper ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._advocate_active_case_count(p_faction_id uuid)
RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT COUNT(*)::int
      FROM public.court_case_trials t
     WHERE (t.plaintiff_advocate_id = p_faction_id
            OR t.defendant_advocate_id = p_faction_id)
       AND t.status IN ('pre_trial', 'settlement_conference', 'awaiting_hearing', 'in_progress');
$$;

COMMENT ON FUNCTION public._advocate_active_case_count(uuid) IS
    'Single source of truth for an advocate''s active case-load. Counts trials where the politician is seated as plaintiff or defendant advocate AND status is one of the live phases. Consumed by draw_court_case + start_appeal (case cap) and read_statute_books (active=0 gate). Do not inline the predicate elsewhere.';

-- Internal helper, not a PostgREST surface.
REVOKE EXECUTE ON FUNCTION public._advocate_active_case_count(uuid) FROM PUBLIC;

-- ── 1. draw_court_case — body from 20270545 with helper swap ───────
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
    v_active_count       int;
    v_cap                int;
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
    IF v_pol.politician_magistrate_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'magistrate_cannot_try');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.try_case_cooldown_until_tick IS NOT NULL
       AND v_pol.try_case_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.try_case_cooldown_until_tick);
    END IF;

    v_active_count := public._advocate_active_case_count(v_pol.id);
    v_cap := CASE
        WHEN v_pol.politician_experienced_advocate_at_tick IS NOT NULL THEN 4
        WHEN v_pol.politician_state_prosecutor_at_tick    IS NOT NULL THEN 4
        ELSE 3
    END;
    IF v_active_count >= v_cap THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_cap_reached',
            'active', v_active_count, 'cap', v_cap);
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
           SET try_case_cooldown_until_tick = v_tick + 1
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
            'cooldown_until_tick',    v_tick + 1
        );
    END LOOP;

    RETURN jsonb_build_object('success', false, 'reason', 'no_viable_case');
END $$;

-- ── 2. start_appeal — body from 20270561 with helper swap ──────────
CREATE OR REPLACE FUNCTION public.start_appeal(
    p_faction_id        uuid,
    p_original_trial_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                uuid := auth.uid();
    v_pol                factions%ROWTYPE;
    v_orig               court_case_trials%ROWTYPE;
    v_case               court_case_drafts%ROWTYPE;
    v_tick               int;
    v_appellant_side     text;
    v_appellee_side      text;
    v_appellee_party     text;
    v_state_advocate_id  uuid;
    v_trial_id           uuid;
    v_p_advocate         uuid;
    v_d_advocate         uuid;
    v_status             text;
    v_judge_id           uuid;
    v_active_count       int;
    v_cap                int;
    v_my_owner           uuid;
    v_is_sc              boolean;
    v_can_sc             boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_original_trial_id IS NULL THEN
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
    IF v_pol.politician_magistrate_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'magistrate_cannot_appeal');
    END IF;

    v_active_count := public._advocate_active_case_count(v_pol.id);
    v_cap := CASE
        WHEN v_pol.politician_experienced_advocate_at_tick IS NOT NULL THEN 4
        WHEN v_pol.politician_state_prosecutor_at_tick    IS NOT NULL THEN 4
        ELSE 3
    END;
    IF v_active_count >= v_cap THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_cap_reached',
            'active', v_active_count, 'cap', v_cap);
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT * INTO v_orig FROM public.court_case_trials
     WHERE id = p_original_trial_id FOR UPDATE;
    IF v_orig.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_orig.status <> 'resolved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'original_not_resolved');
    END IF;
    IF v_orig.nation_id <> v_pol.bar_admitted_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_mismatch');
    END IF;
    IF v_orig.verdict_at_tick IS NULL
       OR (v_tick - v_orig.verdict_at_tick) > 12 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'appeal_window_closed');
    END IF;
    IF v_orig.verdict_winner NOT IN ('plaintiff', 'defendant') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_verdict_to_appeal');
    END IF;
    IF EXISTS (SELECT 1 FROM public.court_case_trials
                WHERE appeal_of_trial_id = v_orig.id
                  AND status IN ('pre_trial','settlement_conference','awaiting_hearing','in_progress')) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'appeal_in_flight');
    END IF;

    v_is_sc  := v_orig.appeal_of_trial_id IS NOT NULL;
    v_can_sc := v_pol.politician_experienced_advocate_at_tick IS NOT NULL
             OR v_pol.politician_state_prosecutor_at_tick    IS NOT NULL;
    IF v_is_sc AND NOT v_can_sc THEN
        RETURN jsonb_build_object('success', false, 'reason', 'sc_requires_experienced_or_state');
    END IF;
    IF v_is_sc AND EXISTS (
         SELECT 1 FROM public.court_case_trials parent
          WHERE parent.id = v_orig.appeal_of_trial_id
            AND parent.appeal_of_trial_id IS NOT NULL
       ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'sc_is_terminal');
    END IF;

    IF v_orig.verdict_winner = 'plaintiff' THEN
        v_appellant_side := 'defendant';
        v_appellee_side  := 'plaintiff';
    ELSE
        v_appellant_side := 'plaintiff';
        v_appellee_side  := 'defendant';
    END IF;

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_orig.case_draft_id;
    v_appellee_party := CASE WHEN v_appellee_side = 'plaintiff'
                               THEN v_case.plaintiff_party_type
                               ELSE v_case.defendant_party_type END;

    v_my_owner := COALESCE(v_pol.linked_user_id, v_pol.id);

    IF v_appellee_party = 'state' THEN
        SELECT sa.id INTO v_state_advocate_id
          FROM public.factions sa
          LEFT JOIN public.court_case_trials t
            ON (t.plaintiff_advocate_id = sa.id OR t.defendant_advocate_id = sa.id)
           AND t.status IN ('in_progress', 'settlement_conference', 'awaiting_hearing', 'pre_trial')
         WHERE sa.politician_state_prosecutor_at_tick IS NOT NULL
           AND sa.bar_admitted_nation_id = v_pol.bar_admitted_nation_id
           AND sa.abandoned_at IS NULL
           AND sa.id <> v_pol.id
           AND COALESCE(sa.linked_user_id, sa.id) <> v_my_owner
         GROUP BY sa.id
         ORDER BY COUNT(t.id) ASC, random() ASC
         LIMIT 1;
    END IF;

    IF v_appellant_side = 'plaintiff' THEN
        v_p_advocate := v_pol.id;
        v_d_advocate := v_state_advocate_id;
    ELSE
        v_p_advocate := v_state_advocate_id;
        v_d_advocate := v_pol.id;
    END IF;

    -- Status routing:
    --   SC trial, both seats filled → awaiting_hearing (queue).
    --   SC trial, one seat open     → pre_trial (waiting for join).
    --   Regular appeal, both seats  → in_progress.
    --   Regular appeal, one open    → pre_trial.
    IF v_is_sc THEN
        IF v_p_advocate IS NOT NULL AND v_d_advocate IS NOT NULL THEN
            v_status := 'awaiting_hearing';
        ELSE
            v_status := 'pre_trial';
        END IF;
    ELSIF v_p_advocate IS NOT NULL AND v_d_advocate IS NOT NULL THEN
        v_status := 'in_progress';
    ELSE
        v_status := 'pre_trial';
    END IF;

    INSERT INTO public.court_case_trials (
        case_draft_id, nation_id,
        plaintiff_advocate_id, defendant_advocate_id,
        plaintiff_name, defendant_name,
        witness_names,
        status,
        pre_trial_started_at_tick, pre_trial_expires_at_tick,
        matched_at_tick,
        current_round, current_turn,
        appeal_of_trial_id
    ) VALUES (
        v_orig.case_draft_id, v_orig.nation_id,
        v_p_advocate, v_d_advocate,
        v_orig.plaintiff_name, v_orig.defendant_name,
        v_orig.witness_names,
        v_status,
        v_tick, v_tick + 3,
        CASE WHEN v_status IN ('in_progress', 'awaiting_hearing') THEN v_tick END,
        CASE WHEN v_status = 'in_progress' THEN 1   END,
        CASE WHEN v_status = 'in_progress' THEN 'plaintiff' END,
        v_orig.id
    ) RETURNING id INTO v_trial_id;

    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, v_orig.case_draft_id,
            CASE WHEN v_appellant_side = 'plaintiff'
                   THEN 'representing_plaintiff'
                   ELSE 'representing_defendant' END)
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    IF v_state_advocate_id IS NOT NULL THEN
        INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
        VALUES (v_state_advocate_id, v_orig.case_draft_id,
                CASE WHEN v_appellee_side = 'plaintiff'
                       THEN 'representing_plaintiff'
                       ELSE 'representing_defendant' END)
        ON CONFLICT (politician_id, case_id) DO NOTHING;
    END IF;

    IF v_is_sc THEN
        -- Filing bonus: +1 Rep, +2 PC for getting in front of the
        -- Supreme Court. Applied once at filing, independent of verdict.
        UPDATE public.factions
           SET politician_reputation = COALESCE(politician_reputation, 0) + 1,
               political_capital     = COALESCE(political_capital, 0) + 2
         WHERE id = v_pol.id;

        v_judge_id := NULL;
    ELSE
        v_judge_id := public._assign_magistrate_to_trial(v_trial_id);
        IF v_status = 'in_progress' THEN
            PERFORM public._begin_trial_arguments(v_trial_id);
        END IF;
    END IF;

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        v_trial_id, 'system', 0, 0,
        CASE WHEN v_is_sc
             THEN 'A Supreme Court appeal has been filed. The case is queued for hearing.'
             ELSE 'Appeal of the prior verdict is convened. Counsel for the appellant has filed; the court will hear arguments.'
        END,
        'judge_note'
    );

    IF v_is_sc AND v_status = 'awaiting_hearing' THEN
        PERFORM public._activate_sc_queue_for_nation(v_orig.nation_id);
    END IF;

    RETURN jsonb_build_object(
        'success',           true,
        'appeal_trial_id',   v_trial_id,
        'appellant_side',    v_appellant_side,
        'status',            v_status,
        'state_advocate_id', v_state_advocate_id,
        'judge_faction_id',  v_judge_id
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
