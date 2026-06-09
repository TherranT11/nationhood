-- ════════════════════════════════════════════════════════════════════
-- 20270761 — Fix DISTINCT + ORDER BY random() in foreign_service_exam_start
--
-- 20270759 ships the government_type question's distractor query as
--
--   SELECT DISTINCT government_type AS g FROM nations
--    WHERE ...
--    ORDER BY random() LIMIT 3
--
-- which Postgres rejects with
--
--   for SELECT DISTINCT, ORDER BY expressions must appear in select list
--
-- because random() isn't a column the DISTINCT-resolved row carries.
-- Every other question type avoids this since they don't use DISTINCT.
--
-- Fix: wrap the DISTINCT in a non-ordered inner subquery, then
-- ORDER BY random() on the distinct set in an outer wrapper. Semantics
-- preserved (still draws 3 random distinct government types ≠ the
-- correct answer).
--
-- The rest of the function is byte-faithful to 20270759 — this is a
-- CREATE OR REPLACE that swaps in only the corrected govt_type block.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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

    SELECT count(*) INTO v_foreign_count FROM nations WHERE id <> v_pol.nation_id;
    IF v_foreign_count < 4 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_foreign_nations',
            'have', v_foreign_count, 'need', 4);
    END IF;

    FOR i IN 1..array_length(v_qtypes, 1) LOOP
        v_qtype := v_qtypes[i];
        SELECT * INTO v_target FROM nations
         WHERE id <> v_pol.nation_id
         ORDER BY random()
         LIMIT 1;

        IF v_qtype = 'population' THEN
            v_correct := _fs_format_pop(COALESCE(v_target.population, 0)::bigint);
            SELECT array_agg(_fs_format_pop(COALESCE(population, 0)::bigint)) INTO v_distractors
              FROM (SELECT population FROM nations
                     WHERE id <> v_pol.nation_id AND id <> v_target.id
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
                     ORDER BY random() LIMIT 3) d;
            v_prompt := 'Who is the Head of Government of ' || COALESCE(v_target.name, '—') || '?';
        ELSIF v_qtype = 'capital' THEN
            v_correct := COALESCE(v_target.capital, '—');
            SELECT array_agg(COALESCE(capital, '—')) INTO v_distractors
              FROM (SELECT capital FROM nations
                     WHERE id <> v_pol.nation_id AND id <> v_target.id
                     ORDER BY random() LIMIT 3) d;
            v_prompt := 'What is the capital of ' || COALESCE(v_target.name, '—') || '?';
        ELSIF v_qtype = 'seats' THEN
            v_correct := COALESCE(v_target.total_seats::text, '—');
            SELECT array_agg(COALESCE(total_seats::text, '—')) INTO v_distractors
              FROM (SELECT total_seats FROM nations
                     WHERE id <> v_pol.nation_id AND id <> v_target.id
                     ORDER BY random() LIMIT 3) d;
            v_prompt := 'How many seats does the legislature of ' || COALESCE(v_target.name, '—') || ' have?';
        ELSE   -- government_type
            v_correct := COALESCE(v_target.government_type, '—');
            -- 20270761 fix: DISTINCT and ORDER BY random() can't share a
            -- single SELECT — Postgres rejects "ORDER BY expressions must
            -- appear in select list" because random() isn't a column the
            -- DISTINCT row carries. Wrap the DISTINCT in an inner
            -- subquery, then apply random ordering on the resulting set.
            SELECT array_agg(g) INTO v_distractors
              FROM (
                  SELECT g FROM (
                      SELECT DISTINCT government_type AS g FROM nations
                       WHERE id <> v_pol.nation_id
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

NOTIFY pgrst, 'reload schema';

COMMIT;
