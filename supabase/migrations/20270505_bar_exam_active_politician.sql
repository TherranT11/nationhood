-- ════════════════════════════════════════════════════════════════════
-- Bar Exam — pass active politician explicitly (multi-politician fix)
--
-- 20270503's bar_exam_start() / bar_exam_submit(uuid[], char(1)[])
-- resolve the politician via:
--
--   SELECT * FROM factions
--    WHERE (id = v_uid OR linked_user_id = v_uid)
--      AND faction_type = 'politician'
--      AND abandoned_at IS NULL
--    ORDER BY created_at ASC LIMIT 1;
--
-- That picks the OLDEST politician on the account. With the 2.8.0
-- multi-politician feature (up to 4 politicians per user, switched via
-- sessionStorage active_faction_id), the politician the CLIENT is
-- viewing can be anything from #1 to #4 — but the server ignored that
-- and always served the oldest one. Visible symptom: a user with a
-- Melizean politician (#1) and a Montequillan politician (#2)
-- triggers the Montequilla bar exam from the career page, sees "The
-- Montequilla Bar Examination" header, but receives Melizean Bribery
-- questions because the RPC fetched questions for politician #1.
--
-- Fix: both RPCs take p_faction_id as the first argument. The server
-- still verifies the faction belongs to the calling user via
-- (id = v_uid OR linked_user_id = v_uid). Same auth boundary, but
-- now the client gets to say WHICH politician.
--
-- The same pattern issue exists across every other politician RPC
-- (politician_sit_the_exam, politician_door_knock, politician_give_speech,
-- politician_mp_fundraising_dinner, politician_stand_for_election,
-- politician_resolve_due_elections, politician_resign_office,
-- politician_register_for_office, _mp_action_check, committee_propose_law,
-- committee_hold_hearing, accept_hearing_testimony, close_committee_hearing,
-- submit_hearing_testimony, apply_for_committee, …). Each needs the same
-- p_faction_id rewrite. Out of scope for this migration; the bar exam
-- is the surface the bug was reported against and the user-spec'd
-- design also calls for the active politician anyway.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- Drop the old single-arg signatures.
DROP FUNCTION IF EXISTS public.bar_exam_start();
DROP FUNCTION IF EXISTS public.bar_exam_submit(uuid[], char(1)[]);

-- ── bar_exam_start(p_faction_id) ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bar_exam_start(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_nation_id uuid;
    v_questions jsonb;
    v_count     int;
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
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;
    IF v_pol.bar_admitted_nation_id = v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_admitted');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.bar_last_attempt_tick IS NOT NULL
       AND v_pol.bar_last_attempt_tick + 3 > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.bar_last_attempt_tick + 3);
    END IF;

    v_nation_id := v_pol.nation_id;

    SELECT count(*) INTO v_count FROM bar_exam_questions WHERE nation_id = v_nation_id;
    IF v_count < 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_question_bank');
    END IF;

    SELECT jsonb_agg(jsonb_build_object(
        'id',      id,
        'domain',  domain,
        'prompt',  prompt,
        'answers', jsonb_build_array(
            jsonb_build_object('letter','A','text', answer_a),
            jsonb_build_object('letter','B','text', answer_b),
            jsonb_build_object('letter','C','text', answer_c),
            jsonb_build_object('letter','D','text', answer_d)
        )
    )) INTO v_questions
    FROM (
        SELECT * FROM bar_exam_questions
         WHERE nation_id = v_nation_id
         ORDER BY random()
         LIMIT 3
    ) q;

    RETURN jsonb_build_object(
        'success',   true,
        'nation_id', v_nation_id,
        'questions', v_questions
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.bar_exam_start(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.bar_exam_start(uuid) TO authenticated;

-- ── bar_exam_submit(p_faction_id, p_question_ids, p_answers) ────────
CREATE OR REPLACE FUNCTION public.bar_exam_submit(
    p_faction_id   uuid,
    p_question_ids uuid[],
    p_answers      char(1)[]
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_nation_id     uuid;
    v_nation_name   text;
    v_n             int;
    i               int;
    v_qid           uuid;
    v_chosen        char(1);
    v_q             bar_exam_questions%ROWTYPE;
    v_correct_count int := 0;
    v_results       jsonb := '[]'::jsonb;
    v_passed        boolean;
    v_pc_delta      int := 0;
    v_new_pc        numeric;
    v_full_name     text;
    v_career_type   text;
    v_desc          text;
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
    IF v_pol.bar_admitted_nation_id = v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_admitted');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.bar_last_attempt_tick IS NOT NULL
       AND v_pol.bar_last_attempt_tick + 3 > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.bar_last_attempt_tick + 3);
    END IF;

    v_n := COALESCE(array_length(p_question_ids, 1), 0);
    IF v_n <> 3 OR COALESCE(array_length(p_answers, 1), 0) <> 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_submission');
    END IF;

    v_nation_id := v_pol.nation_id;
    SELECT name INTO v_nation_name FROM nations WHERE id = v_nation_id;

    FOR i IN 1..v_n LOOP
        v_qid    := p_question_ids[i];
        v_chosen := upper(p_answers[i]);
        IF v_chosen NOT IN ('A','B','C','D') THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_answer',
                'index', i);
        END IF;

        SELECT * INTO v_q FROM bar_exam_questions
         WHERE id = v_qid AND nation_id = v_nation_id;
        IF v_q.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'question_not_found',
                'index', i);
        END IF;

        IF v_chosen = v_q.correct THEN
            v_correct_count := v_correct_count + 1;
        END IF;

        v_results := v_results || jsonb_build_array(jsonb_build_object(
            'question_id', v_q.id,
            'prompt',      v_q.prompt,
            'domain',      v_q.domain,
            'chosen',      v_chosen,
            'correct',     v_q.correct,
            'correct_text', CASE v_q.correct
                              WHEN 'A' THEN v_q.answer_a
                              WHEN 'B' THEN v_q.answer_b
                              WHEN 'C' THEN v_q.answer_c
                              WHEN 'D' THEN v_q.answer_d
                            END,
            'was_correct', (v_chosen = v_q.correct)
        ));
    END LOOP;

    v_passed := (v_correct_count = 3);

    IF v_passed THEN
        UPDATE factions
           SET bar_admitted_nation_id = v_nation_id,
               bar_admitted_at_tick   = v_tick,
               bar_last_attempt_tick  = v_tick
         WHERE id = v_pol.id;
        v_career_type := 'admitted_to_bar';
    ELSE
        v_pc_delta := -2;
        UPDATE factions
           SET political_capital      = GREATEST(0, COALESCE(political_capital, 0) - 2),
               bar_last_attempt_tick  = v_tick
         WHERE id = v_pol.id
        RETURNING political_capital INTO v_new_pc;
        v_career_type := 'failed_bar_exam';
    END IF;

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' || COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'A politician');
    END IF;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick, v_career_type, v_nation_name,
        jsonb_build_object(
            'nation_id', v_nation_id,
            'correct',   v_correct_count,
            'total',     3
        )
    );

    IF v_passed THEN
        v_desc := v_full_name
               || ' has successfully passed the Bar Exam of '
               || COALESCE(v_nation_name, 'their nation')
               || ' and has been admitted as a judicial advocate.';
    ELSE
        v_desc := v_full_name
               || ' has failed the Bar Exam of '
               || COALESCE(v_nation_name, 'their nation')
               || '; it is unknown if they will re-attempt it in the future.';
    END IF;

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_nation_id, v_pol.id,
        CASE WHEN v_passed THEN 'Bar Exam Passed' ELSE 'Bar Exam Failed' END,
        v_desc,
        'politician',
        CASE WHEN v_passed THEN 'politician_passed_bar' ELSE 'politician_failed_bar' END,
        v_tick
    );

    RETURN jsonb_build_object(
        'success',         true,
        'passed',          v_passed,
        'correct_count',   v_correct_count,
        'total',           3,
        'results',         v_results,
        'pc_delta',        v_pc_delta,
        'new_political_capital', v_new_pc,
        'nation_name',     v_nation_name,
        'ready_at_tick',   v_tick + 3
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.bar_exam_submit(uuid, uuid[], char(1)[]) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.bar_exam_submit(uuid, uuid[], char(1)[]) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
