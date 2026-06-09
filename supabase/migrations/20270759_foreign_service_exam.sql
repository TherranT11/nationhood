-- ════════════════════════════════════════════════════════════════════
-- 20270759 — Foreign Service: exam + Tier 1 (Attaché) activation
--
-- Activates the Foreign Service ladder's first rung. The flow:
--
--   1. Player clicks [JOIN THE SERVICE] on politician-career.html →
--      foreign_service_exam_start creates an attempt row holding 5
--      auto-generated multiple-choice questions about randomly-picked
--      active nations (other than the player's own). Returns the
--      visible question payload (prompt + 4 options each) and the
--      attempt id. Correct letter is NOT included in the response.
--
--   2. Player answers all 5; foreign_service_exam_submit takes the
--      attempt id + the 5 chosen letters, looks the stored
--      `questions` jsonb out of the attempt row, scores against the
--      hidden correct letters.
--
--      • All 5 correct → assign a random active foreign nation,
--        stamp politician_foreign_service_nation_id +
--        politician_foreign_service_at_tick, log a career event.
--      • Any wrong → −1 politician_reputation (floored at 0), stamp
--        foreign_service_last_attempt_tick. Retry available next tick
--        (= "next month").
--
--   3. politician-home.html surfaces a Foreign Attaché affiliation
--      card alongside the player's existing affiliation. The three
--      stub actions (Day to Day / Build Contacts / Send Cable) ride
--      that variant disabled per spec — RPCs come in a follow-up.
--
-- Schema rationale: the attempt row holds the entire question set
-- (including correct letters) so the start RPC can return a
-- server-trusted slate without leaking answers, and submit can score
-- without needing a persistent question bank. Bar exam (20270503) uses
-- a static bank; foreign service questions are derived per-attempt
-- from live nation data, so the per-attempt row replaces the bank.
--
-- Cooldown: 1 tick = 1 month (12 ticks/year per utils.js tickToDate).
-- Bar exam runs 3 ticks; foreign service runs 1 because the user spec
-- is explicit ("may try again next month").
--
-- Apply after 20270758.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ────────────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_foreign_service_nation_id uuid REFERENCES nations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS politician_foreign_service_at_tick   int,
    ADD COLUMN IF NOT EXISTS foreign_service_last_attempt_tick    int;

COMMENT ON COLUMN public.factions.politician_foreign_service_nation_id IS
    'Foreign nation the politician is stationed at as a Tier-1 Attaché. NULL while uncommitted. Stamped on a passing foreign_service_exam_submit; reserved for future promotion / recall RPCs. 20270759.';

CREATE TABLE IF NOT EXISTS public.foreign_service_exam_attempts (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id        uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    started_at_tick   int  NOT NULL,
    questions         jsonb NOT NULL,        -- 5 × {qtype, nation_id, prompt, options:[{letter,text}], correct:'A|B|C|D'}
    submitted_at_tick int,
    correct_count     int,
    passed            boolean,
    assigned_nation_id uuid REFERENCES nations(id) ON DELETE SET NULL,
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS foreign_service_exam_attempts_faction_idx
    ON public.foreign_service_exam_attempts (faction_id, started_at_tick DESC);

COMMENT ON TABLE public.foreign_service_exam_attempts IS
    'One row per call to foreign_service_exam_start. `questions` holds the full slate including the hidden correct letter; the visible payload returned to the client strips that field. Submit RPC reads this row to score against the stored correct letters. 20270759.';

ALTER TABLE public.foreign_service_exam_attempts ENABLE ROW LEVEL SECURITY;

-- Players can read their own attempt rows (for client-side post-submit
-- result view); writes are RPC-only.
DROP POLICY IF EXISTS fs_attempts_select_self ON public.foreign_service_exam_attempts;
CREATE POLICY fs_attempts_select_self ON public.foreign_service_exam_attempts
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM factions f
            WHERE f.id = foreign_service_exam_attempts.faction_id
              AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS fs_attempts_service_all ON public.foreign_service_exam_attempts;
CREATE POLICY fs_attempts_service_all ON public.foreign_service_exam_attempts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 2. Helpers ───────────────────────────────────────────────────
-- Shuffle correct + 3 distractors into A/B/C/D, return options jsonb
-- plus the letter that ended up holding the correct answer.
CREATE OR REPLACE FUNCTION public._fs_build_options(
    p_correct_text text, p_distractors text[]
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
    v_pool          text[];
    v_shuffled      text[];
    v_options       jsonb := '[]'::jsonb;
    v_correct_letter char(1);
    i               int;
    v_letter        char(1);
BEGIN
    v_pool := array_prepend(p_correct_text, p_distractors);
    SELECT array_agg(elem) INTO v_shuffled
      FROM (SELECT unnest(v_pool) AS elem ORDER BY random()) sub;
    FOR i IN 1..array_length(v_shuffled, 1) LOOP
        v_letter := chr(64 + i);   -- 1→A, 2→B, 3→C, 4→D
        v_options := v_options || jsonb_build_array(
            jsonb_build_object('letter', v_letter, 'text', v_shuffled[i])
        );
        IF v_shuffled[i] = p_correct_text THEN
            v_correct_letter := v_letter;
        END IF;
    END LOOP;
    RETURN jsonb_build_object('options', v_options, 'correct', v_correct_letter);
END $$;

-- Pretty-print a population integer with thousands separators. Used by
-- the population question + its distractors so the rendered options
-- match. Defensive cast: anything non-finite → '—'.
CREATE OR REPLACE FUNCTION public._fs_format_pop(p_n bigint)
RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    IF p_n IS NULL THEN RETURN '—'; END IF;
    RETURN to_char(p_n, 'FM999,999,999,999');
END $$;

-- ── 3. foreign_service_exam_start ────────────────────────────────
-- Builds 5 questions about randomly-picked foreign nations and
-- returns the visible payload (prompts + options minus correct).
-- Requires ≥4 non-self nations on the shard so we have at least one
-- target + 3 distractors per question.
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

    -- Need ≥4 foreign nations so every question has 1 target +
    -- 3 distinct distractors.
    SELECT count(*) INTO v_foreign_count FROM nations WHERE id <> v_pol.nation_id;
    IF v_foreign_count < 4 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_foreign_nations',
            'have', v_foreign_count, 'need', 4);
    END IF;

    -- Build 5 questions, one per qtype, each about a randomly-picked
    -- foreign nation (each draw is independent — same target may
    -- appear twice across the slate, which is fine).
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
            -- DISTINCT so two distractors don't collapse to the same
            -- government type as the correct answer or each other.
            SELECT array_agg(g) INTO v_distractors
              FROM (SELECT DISTINCT government_type AS g FROM nations
                     WHERE id <> v_pol.nation_id
                       AND government_type IS NOT NULL
                       AND government_type <> v_correct
                     ORDER BY random() LIMIT 3) d;
            v_prompt := 'What type of government does ' || COALESCE(v_target.name, '—') || ' have?';
        END IF;

        -- Defensive: pad with placeholder if a category came up short
        -- (e.g. only 2 distinct government types in play). Padding
        -- text is intentionally implausible so the exam is still
        -- answerable.
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

REVOKE EXECUTE ON FUNCTION public.foreign_service_exam_start(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.foreign_service_exam_start(uuid) TO authenticated;

-- ── 4. foreign_service_exam_submit ───────────────────────────────
-- Score the 5 answers against the stored correct letters. All 5
-- correct → assign a random foreign nation, stamp the posting. Any
-- wrong → −1 reputation, set retry cooldown.
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

    -- Score each question. Positions are matched by index: p_answers[i]
    -- ↔ v_questions[i-1] (jsonb arrays are 0-indexed).
    FOR i IN 1..v_n LOOP
        v_chosen := upper(p_answers[i]);
        IF v_chosen NOT IN ('A','B','C','D') THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_answer', 'index', i);
        END IF;
        v_q := v_questions->(i-1);
        v_correct_letter := v_q->>'correct';
        v_was_correct := (v_chosen = v_correct_letter);
        IF v_was_correct THEN v_correct_count := v_correct_count + 1; END IF;

        -- Pick the correct option's text for the result row.
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
        -- Pick a random foreign nation to assign. Independent draw —
        -- not necessarily one of the quizzed nations.
        SELECT * INTO v_assigned_nation FROM nations
         WHERE id <> v_pol.nation_id
         ORDER BY random()
         LIMIT 1;
        IF v_assigned_nation.id IS NULL THEN
            -- Vanishingly unlikely (we checked ≥4 at start) but if
            -- nations got dropped between start and submit, fail
            -- the post.
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

REVOKE EXECUTE ON FUNCTION public.foreign_service_exam_submit(uuid, uuid, char(1)[]) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.foreign_service_exam_submit(uuid, uuid, char(1)[]) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
