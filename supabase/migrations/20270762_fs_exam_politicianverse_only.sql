-- ════════════════════════════════════════════════════════════════════
-- 20270762 — Foreign Service exam: Politicianverse nations only
--
-- The 20270759 + 20270761 versions of foreign_service_exam_start and
-- foreign_service_exam_submit pull from every row in the `nations`
-- table, so questions and assignments can surface non-Politicianverse
-- nations (e.g. "Dravka") that the player has never seen in their
-- politician dashboards. Per user spec, the exam scope is the four
-- Politicianverse nations only: Melizea, Sierramar, Avelia,
-- Montequilla — flagged by `nations.foundable_for_politician = TRUE`
-- (column shipped in 20270725, same predicate the
-- create_politician_with_tier_stats RPC uses).
--
-- Fix: every nation-side query in both RPCs gains
-- `AND foundable_for_politician = TRUE`:
--
--   • count gate that requires ≥4 foreign nations
--   • target-nation draw for each of the 5 questions
--   • 4 distractor-pool draws (population / HoG / capital / seats)
--   • the government_type DISTINCT distractor pool
--   • the post-pass "assign a foreign nation" random draw
--
-- The DISTINCT-then-random fix from 20270761 is preserved inside the
-- government_type branch.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. foreign_service_exam_start — Politicianverse filter on every
--    nation query. Byte-faithful to 20270761 outside those WHEREs.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.foreign_service_exam_start(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_foreign_count int;
    v_qtypes        text[] := ARRAY['population','head_of_government','capital','seats','government_type'];
    v_qtype         text;
    v_target        nations%ROWTYPE;
    v_correct       text;
    v_distractors   text[];
    v_prompt        text;
    v_opt_pair      jsonb;
    v_questions     jsonb := '[]'::jsonb;
    v_visible       jsonb := '[]'::jsonb;
    v_attempt_id    uuid;
    i               int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;
    IF v_pol.politician_foreign_service_nation_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_in_service',
            'posted_nation_id', v_pol.politician_foreign_service_nation_id);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.foreign_service_last_attempt_tick IS NOT NULL
       AND v_pol.foreign_service_last_attempt_tick + 1 > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.foreign_service_last_attempt_tick + 1);
    END IF;

    -- 20270762: Politicianverse scope. Count the foundable-for-politician
    -- nations only, exclude the player's own.
    SELECT count(*) INTO v_foreign_count FROM nations
     WHERE id <> v_pol.nation_id
       AND foundable_for_politician = TRUE;
    IF v_foreign_count < 4 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_foreign_nations',
            'have', v_foreign_count, 'need', 4);
    END IF;

    FOR i IN 1..array_length(v_qtypes, 1) LOOP
        v_qtype := v_qtypes[i];
        SELECT * INTO v_target FROM nations
         WHERE id <> v_pol.nation_id
           AND foundable_for_politician = TRUE
         ORDER BY random()
         LIMIT 1;

        IF v_qtype = 'population' THEN
            v_correct := _fs_format_pop(COALESCE(v_target.population, 0)::bigint);
            SELECT array_agg(_fs_format_pop(COALESCE(population, 0)::bigint)) INTO v_distractors
              FROM (SELECT population FROM nations
                     WHERE id <> v_pol.nation_id AND id <> v_target.id
                       AND foundable_for_politician = TRUE
                     ORDER BY random() LIMIT 3) d;
            v_prompt := 'What is the population of ' || COALESCE(v_target.name, '—') || '?';
        ELSIF v_qtype = 'head_of_government' THEN
            v_correct := btrim(COALESCE(v_target.head_of_state_first_name, '') || ' ' ||
                               COALESCE(v_target.head_of_state_last_name, ''));
            IF v_correct = '' THEN v_correct := 'Vacant'; END IF;
            SELECT array_agg(btrim(COALESCE(head_of_state_first_name, '') || ' ' ||
                                    COALESCE(head_of_state_last_name, ''))) INTO v_distractors
              FROM (SELECT head_of_state_first_name, head_of_state_last_name FROM nations
                     WHERE id <> v_pol.nation_id AND id <> v_target.id
                       AND foundable_for_politician = TRUE
                     ORDER BY random() LIMIT 3) d;
            v_prompt := 'Who is the Head of Government of ' || COALESCE(v_target.name, '—') || '?';
        ELSIF v_qtype = 'capital' THEN
            v_correct := COALESCE(v_target.capital, '—');
            SELECT array_agg(COALESCE(capital, '—')) INTO v_distractors
              FROM (SELECT capital FROM nations
                     WHERE id <> v_pol.nation_id AND id <> v_target.id
                       AND foundable_for_politician = TRUE
                     ORDER BY random() LIMIT 3) d;
            v_prompt := 'What is the capital of ' || COALESCE(v_target.name, '—') || '?';
        ELSIF v_qtype = 'seats' THEN
            v_correct := COALESCE(v_target.total_seats::text, '—');
            SELECT array_agg(COALESCE(total_seats::text, '—')) INTO v_distractors
              FROM (SELECT total_seats FROM nations
                     WHERE id <> v_pol.nation_id AND id <> v_target.id
                       AND foundable_for_politician = TRUE
                     ORDER BY random() LIMIT 3) d;
            v_prompt := 'How many seats does the legislature of ' || COALESCE(v_target.name, '—') || ' have?';
        ELSE   -- government_type
            v_correct := COALESCE(v_target.government_type, '—');
            -- 20270761: DISTINCT can't share an ORDER BY random() select,
            -- so we wrap the distinct set then order randomly outside.
            -- 20270762: foundable filter added to the inner distinct.
            SELECT array_agg(g) INTO v_distractors
              FROM (
                  SELECT g FROM (
                      SELECT DISTINCT government_type AS g FROM nations
                       WHERE id <> v_pol.nation_id
                         AND foundable_for_politician = TRUE
                         AND government_type IS NOT NULL
                         AND government_type <> v_correct
                  ) gov_distinct
                  ORDER BY random() LIMIT 3
              ) d;
            v_prompt := 'What type of government does ' || COALESCE(v_target.name, '—') || ' have?';
        END IF;

        v_distractors := COALESCE(v_distractors, ARRAY[]::text[]);
        WHILE array_length(v_distractors, 1) IS NULL OR array_length(v_distractors, 1) < 3 LOOP
            v_distractors := array_append(v_distractors, '— Not Recorded —');
        END LOOP;

        v_opt_pair := _fs_build_options(v_correct, v_distractors);
        v_questions := v_questions || jsonb_build_array(jsonb_build_object(
            'qtype',     v_qtype,
            'nation_id', v_target.id,
            'prompt',    v_prompt,
            'options',   v_opt_pair->'options',
            'correct',   v_opt_pair->>'correct'
        ));
        v_visible := v_visible || jsonb_build_array(jsonb_build_object(
            'idx',     i,
            'qtype',   v_qtype,
            'prompt',  v_prompt,
            'options', v_opt_pair->'options'
        ));
    END LOOP;

    INSERT INTO foreign_service_exam_attempts (
        faction_id, started_at_tick, questions
    ) VALUES (
        v_pol.id, v_tick, v_questions
    ) RETURNING id INTO v_attempt_id;

    RETURN jsonb_build_object(
        'success',    true,
        'attempt_id', v_attempt_id,
        'questions',  v_visible
    );
END $$;

-- ════════════════════════════════════════════════════════════════════
-- 2. foreign_service_exam_submit — same Politicianverse filter on the
--    post-pass "assign a foreign nation" draw. Byte-faithful to
--    20270759 otherwise.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.foreign_service_exam_submit(
    p_faction_id uuid,
    p_attempt_id uuid,
    p_answers    char(1)[]
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid              uuid := auth.uid();
    v_pol              factions%ROWTYPE;
    v_attempt          foreign_service_exam_attempts%ROWTYPE;
    v_questions        jsonb;
    v_n                int;
    i                  int;
    v_chosen           char(1);
    v_q                jsonb;
    v_correct_letter   text;
    v_correct_count    int := 0;
    v_results          jsonb := '[]'::jsonb;
    v_was_correct      boolean;
    v_correct_text     text;
    v_passed           boolean;
    v_tick             int;
    v_assigned_nation  nations%ROWTYPE;
    v_full_name        text;
    v_rep_delta        int := 0;
    v_new_rep          int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_attempt_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_attempt FROM foreign_service_exam_attempts
     WHERE id = p_attempt_id
       AND faction_id = v_pol.id
     FOR UPDATE;
    IF v_attempt.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'attempt_not_found');
    END IF;
    IF v_attempt.submitted_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'attempt_already_submitted',
            'passed', v_attempt.passed);
    END IF;

    v_questions := v_attempt.questions;
    v_n := jsonb_array_length(v_questions);
    IF v_n <> 5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_attempt_state');
    END IF;
    IF COALESCE(array_length(p_answers, 1), 0) <> 5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_submission');
    END IF;

    FOR i IN 1..v_n LOOP
        v_chosen := upper(p_answers[i]);
        IF v_chosen NOT IN ('A','B','C','D') THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_answer', 'index', i);
        END IF;
        v_q := v_questions->(i-1);
        v_correct_letter := v_q->>'correct';
        v_was_correct := (v_chosen = v_correct_letter);
        IF v_was_correct THEN v_correct_count := v_correct_count + 1; END IF;

        SELECT opt->>'text' INTO v_correct_text
          FROM jsonb_array_elements(v_q->'options') opt
         WHERE opt->>'letter' = v_correct_letter;

        v_results := v_results || jsonb_build_array(jsonb_build_object(
            'idx',         i,
            'qtype',       v_q->>'qtype',
            'prompt',      v_q->>'prompt',
            'chosen',      v_chosen,
            'correct',     v_correct_letter,
            'correct_text', v_correct_text,
            'was_correct', v_was_correct
        ));
    END LOOP;

    v_passed := (v_correct_count = 5);

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_passed THEN
        -- 20270762: Politicianverse scope on assignment too.
        SELECT * INTO v_assigned_nation FROM nations
         WHERE id <> v_pol.nation_id
           AND foundable_for_politician = TRUE
         ORDER BY random()
         LIMIT 1;
        IF v_assigned_nation.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_assignable_nation');
        END IF;

        UPDATE factions
           SET politician_foreign_service_nation_id = v_assigned_nation.id,
               politician_foreign_service_at_tick   = v_tick,
               foreign_service_last_attempt_tick    = v_tick
         WHERE id = v_pol.id;
    ELSE
        v_rep_delta := -1;
        UPDATE factions
           SET politician_reputation             = GREATEST(0, COALESCE(politician_reputation, 0) - 1),
               foreign_service_last_attempt_tick = v_tick
         WHERE id = v_pol.id
        RETURNING politician_reputation INTO v_new_rep;
    END IF;

    UPDATE foreign_service_exam_attempts
       SET submitted_at_tick = v_tick,
           correct_count     = v_correct_count,
           passed            = v_passed,
           assigned_nation_id = CASE WHEN v_passed THEN v_assigned_nation.id ELSE NULL END
     WHERE id = v_attempt.id;

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' || COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'A politician');
    END IF;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick,
        CASE WHEN v_passed THEN 'foreign_service_admitted' ELSE 'foreign_service_failed_exam' END,
        COALESCE(v_assigned_nation.name, ''),
        jsonb_build_object(
            'correct', v_correct_count,
            'total',   5,
            'assigned_nation_id', v_assigned_nation.id,
            'attempt_id', v_attempt.id
        )
    );

    RETURN jsonb_build_object(
        'success',         true,
        'passed',          v_passed,
        'correct_count',   v_correct_count,
        'total',           5,
        'results',         v_results,
        'rep_delta',       v_rep_delta,
        'new_reputation',  v_new_rep,
        'assigned_nation_id',   v_assigned_nation.id,
        'assigned_nation_name', v_assigned_nation.name,
        'assigned_capital',     v_assigned_nation.capital,
        'ready_at_tick',   v_tick + 1
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
