-- ════════════════════════════════════════════════════════════════════
-- 20270765 — Foreign Service exam: event_log surface
--
-- 20270759 emits a politician_career_events row on submit but no
-- event_log row, so a passing exam doesn't show up on the player's
-- Political Career timeline on politician-home.html (the timeline
-- renders from event_log, not from the structured career_events
-- table). Bar exam (20270505) already writes both.
--
-- Per user spec, the pass description reads:
--
--   "{Politician} has successfully completed the Foreign Service
--    Exam and has been assigned to the embassy in {Capital}, {Nation}."
--
-- A matching fail line mirrors the bar-exam pattern so failures also
-- surface on the timeline:
--
--   "{Politician} has failed the Foreign Service Exam."
--
-- nation_id on the event_log row is the politician's home nation
-- (the event happened there — they sat the exam from their
-- domestic posting). category 'politician', trigger_key
-- politician_passed_fs_exam / politician_failed_fs_exam mirrors the
-- bar exam's politician_passed_bar / politician_failed_bar keys.
--
-- Body byte-faithful to 20270762 except for the inserted event_log
-- block. The Politicianverse + distractor-pool tweaks from 20270763
-- + 20270764 live in foreign_service_exam_start, so the submit
-- function only carries the Politicianverse-only assignment-draw
-- patch from 20270762.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    v_event_desc       text;
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

    -- 20270765: event_log surface so the Political Career timeline on
    -- politician-home.html picks the exam result up. nation_id is the
    -- politician's home nation — the event happened there (they sat
    -- the exam from their domestic posting). category + trigger_key
    -- mirror the bar exam keys for consistency.
    IF v_passed THEN
        v_event_desc := v_full_name
                     || ' has successfully completed the Foreign Service Exam and has been assigned to the embassy in '
                     || COALESCE(v_assigned_nation.capital, 'the capital')
                     || ', '
                     || COALESCE(v_assigned_nation.name, 'a foreign nation')
                     || '.';
    ELSE
        v_event_desc := v_full_name || ' has failed the Foreign Service Exam.';
    END IF;

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        CASE WHEN v_passed THEN 'Foreign Service Exam Passed' ELSE 'Foreign Service Exam Failed' END,
        v_event_desc,
        'politician',
        CASE WHEN v_passed THEN 'politician_passed_fs_exam' ELSE 'politician_failed_fs_exam' END,
        v_tick
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
