-- ════════════════════════════════════════════════════════════════════
-- 20270763 — Foreign Service exam: 4-nation Politicianverse fits
--
-- User report: with 4 Politicianverse nations seeded today (Melizea,
-- Sierramar, Avelia, Montequilla), every politician sees a "Not
-- enough other nations on the shard for an exam yet" gate, because
-- 20270762's count check requires ≥4 FOREIGN (player-excluded)
-- foundable nations. The player's own nation collapses one off the
-- foreign pool — 4 - 1 = 3 — and the gate trips.
--
-- The user's point: 5 questions with random target reuse can run
-- against 3 foreign nations; the bottleneck is distractor depth, and
-- the player's own nation is a perfectly plausible distractor
-- (they know it's their own, but the question text doesn't name the
-- nation — only the values).
--
-- Fix:
--   1. Count gate drops from ≥4 to ≥3 foreign foundable nations.
--      With 3 foreign + 1 player = 4 foundable total, every question
--      gets a foreign target AND 3 distinct distractors.
--   2. Distractor pool queries drop the `id <> v_pol.nation_id` exclu-
--      sion. The player's own nation now joins the option pool — it
--      only ever appears as a distractor (target draws still require
--      `id <> v_pol.nation_id`), so the question scope stays foreign.
--   3. government_type DISTINCT pool likewise drops the player-exclu-
--      sion; the existing `<> v_correct` guard already prevents the
--      correct answer from collapsing into the distractor set.
--
-- The post-pass nation-assignment draw in foreign_service_exam_submit
-- stays foreign-only (the player gets posted abroad, not to their own
-- nation) — no change there.
--
-- Apply after 20270762.
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

    -- 20270763: 4-nation Politicianverse fits the exam — 3 foreign
    -- target candidates + player's own nation as a distractor pad
    -- gives every question a foreign target AND 3 distinct distractors.
    SELECT count(*) INTO v_foreign_count FROM nations
     WHERE id <> v_pol.nation_id
       AND foundable_for_politician = TRUE;
    IF v_foreign_count < 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_foreign_nations',
            'have', v_foreign_count, 'need', 3);
    END IF;

    FOR i IN 1..array_length(v_qtypes, 1) LOOP
        v_qtype := v_qtypes[i];
        -- Target stays foreign — the player isn't asked about their
        -- own nation.
        SELECT * INTO v_target FROM nations
         WHERE id <> v_pol.nation_id
           AND foundable_for_politician = TRUE
         ORDER BY random()
         LIMIT 1;

        IF v_qtype = 'population' THEN
            v_correct := _fs_format_pop(COALESCE(v_target.population, 0)::bigint);
            -- 20270763: distractor pool excludes only the current
            -- target, NOT the player's own nation — player's own
            -- value is a plausible option (the prompt doesn't name
            -- the value's source nation).
            SELECT array_agg(_fs_format_pop(COALESCE(population, 0)::bigint)) INTO v_distractors
              FROM (SELECT population FROM nations
                     WHERE id <> v_target.id
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
                     WHERE id <> v_target.id
                       AND foundable_for_politician = TRUE
                     ORDER BY random() LIMIT 3) d;
            v_prompt := 'Who is the Head of Government of ' || COALESCE(v_target.name, '—') || '?';
        ELSIF v_qtype = 'capital' THEN
            v_correct := COALESCE(v_target.capital, '—');
            SELECT array_agg(COALESCE(capital, '—')) INTO v_distractors
              FROM (SELECT capital FROM nations
                     WHERE id <> v_target.id
                       AND foundable_for_politician = TRUE
                     ORDER BY random() LIMIT 3) d;
            v_prompt := 'What is the capital of ' || COALESCE(v_target.name, '—') || '?';
        ELSIF v_qtype = 'seats' THEN
            v_correct := COALESCE(v_target.total_seats::text, '—');
            SELECT array_agg(COALESCE(total_seats::text, '—')) INTO v_distractors
              FROM (SELECT total_seats FROM nations
                     WHERE id <> v_target.id
                       AND foundable_for_politician = TRUE
                     ORDER BY random() LIMIT 3) d;
            v_prompt := 'How many seats does the legislature of ' || COALESCE(v_target.name, '—') || ' have?';
        ELSE   -- government_type
            v_correct := COALESCE(v_target.government_type, '—');
            -- 20270761: DISTINCT can't share an ORDER BY random() select.
            -- 20270763: drop the player-nation exclusion from the
            -- distinct pool; <> v_correct still prevents the correct
            -- type from collapsing into a distractor.
            SELECT array_agg(g) INTO v_distractors
              FROM (
                  SELECT g FROM (
                      SELECT DISTINCT government_type AS g FROM nations
                       WHERE foundable_for_politician = TRUE
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
