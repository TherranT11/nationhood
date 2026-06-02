-- ════════════════════════════════════════════════════════════════════
-- Bar Exam — Advocate-tier judiciary entry path
--
-- A politician sits the Bar Exam (multiple-choice test on the
-- Statutes of their nation). Pass → admitted as judicial Advocate.
-- Fail → -2 Political Capital + 3-tick cooldown. The exam is the
-- only path onto the judiciary ladder via player action; once
-- admitted, the Advocate rung is "held" and the rest of the bench
-- ladder unlocks.
--
-- Three new columns on factions, one new table, two RPCs.
--
-- ── Schema ──────────────────────────────────────────────────────────
--   factions.bar_admitted_nation_id  uuid → nations.id
--   factions.bar_admitted_at_tick    int   — tick at admission
--   factions.bar_last_attempt_tick   int   — for cooldown gate
--   bar_exam_questions               table — per-nation question bank
--
-- A politician can be admitted to only ONE nation's bar at a time
-- (single column, not a join table). Out-of-scope today: bar transfer
-- when a politician changes nation — handled when nation-change for
-- politicians lands.
--
-- ── RLS ─────────────────────────────────────────────────────────────
-- bar_exam_questions has NO authenticated SELECT policy. Clients can't
-- read the `correct` column directly — they MUST go through
-- bar_exam_start, which returns the four answer choices WITHOUT the
-- correct letter. bar_exam_submit looks the correct letter up
-- server-side. Without this gate, any client could trivially cheat by
-- querying the table.
--
-- ── Cooldown semantics ──────────────────────────────────────────────
-- bar_last_attempt_tick is stamped on SUBMIT, not START. Starting
-- the exam (loading 3 questions) doesn't burn the cooldown — only
-- finalising the attempt does. Players can preview questions if they
-- want without penalty; cooldown only protects against repeated full
-- attempts.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Factions columns ─────────────────────────────────────────────
ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS bar_admitted_nation_id uuid REFERENCES nations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS bar_admitted_at_tick   int,
    ADD COLUMN IF NOT EXISTS bar_last_attempt_tick  int;

REVOKE UPDATE (bar_admitted_nation_id, bar_admitted_at_tick, bar_last_attempt_tick)
    ON factions FROM PUBLIC, anon, authenticated;

COMMENT ON COLUMN factions.bar_admitted_nation_id IS
    'Nation whose bar this politician is admitted to. NULL = not admitted anywhere. Set by bar_exam_submit on pass. Server-only writes (REVOKE UPDATE on this column).';
COMMENT ON COLUMN factions.bar_admitted_at_tick IS
    'Game tick at which the politician was admitted to the bar. Paired with bar_admitted_nation_id; clears together on bar transfer (future).';
COMMENT ON COLUMN factions.bar_last_attempt_tick IS
    'Game tick of the most recent bar_exam_submit call (success OR failure). Drives the 3-tick cooldown gate in bar_exam_start.';

-- ── 2. Question bank ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bar_exam_questions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id   uuid NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    law_id      uuid REFERENCES committee_proposals(id) ON DELETE SET NULL,
    domain      text NOT NULL,
    prompt      text NOT NULL,
    answer_a    text NOT NULL,
    answer_b    text NOT NULL,
    answer_c    text NOT NULL,
    answer_d    text NOT NULL,
    correct     char(1) NOT NULL CHECK (correct IN ('A','B','C','D')),
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bar_exam_questions_nation_idx
    ON bar_exam_questions(nation_id);

ALTER TABLE bar_exam_questions ENABLE ROW LEVEL SECURITY;

-- No authenticated SELECT — clients cannot read the correct column.
-- service_role can do everything (for seeding / admin).
DROP POLICY IF EXISTS bar_exam_questions_service_all ON bar_exam_questions;
CREATE POLICY bar_exam_questions_service_all ON bar_exam_questions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE bar_exam_questions IS
    'Per-nation multiple-choice question bank for the Bar Exam. RLS deliberately denies authenticated SELECT so clients can''t read the correct answer — access is through bar_exam_start (returns questions without the correct letter) and bar_exam_submit (server validates).';

-- ── 3. Seed 9 questions per nation (3 per starter law × 3 laws) ─────
DO $$
DECLARE
    rec        RECORD;
    v_nation   uuid;
    v_law      uuid;
BEGIN
    FOR rec IN
        SELECT * FROM (VALUES
            -- ── Avelia · Tax Evasion (Criminal Code) ──
            ('Avelia', 'criminal', 'Tax Evasion', 'Criminal Code · Tax Evasion',
             'What is the threshold of undeclared income that triggers Avelian tax evasion charges?',
             '25,000','50,000','100,000','250,000','B'),
            ('Avelia', 'criminal', 'Tax Evasion', 'Criminal Code · Tax Evasion',
             'Under Avelian law, what is the minimum sentence for tax evasion at threshold?',
             '4 years','8 years','12 years','20 years','B'),
            ('Avelia', 'criminal', 'Tax Evasion', 'Criminal Code · Tax Evasion',
             'Voluntary disclosure before any audit notice has been issued has what effect under Avelian §44?',
             'The taxpayer is absolved entirely.',
             'Restitution is reduced to 100% of the evaded amount.',
             'The otherwise-applicable sentence is reduced by half.',
             'It has no legal effect.','C'),

            -- ── Avelia · Statute of Limitations (Civil Code) ──
            ('Avelia', 'civil', 'Statute of Limitations', 'Civil Code · Statute of Limitations',
             'How long after a contract breach in Avelia must a civil claim be filed?',
             '3 years','6 years','10 years','20 years','B'),
            ('Avelia', 'civil', 'Statute of Limitations', 'Civil Code · Statute of Limitations',
             'An Avelian fraud claim must be brought within how many years of the date the fraud was discovered?',
             '6','10','15','20','B'),
            ('Avelia', 'civil', 'Statute of Limitations', 'Civil Code · Statute of Limitations',
             'Under Avelian §218, what is the absolute outer limit on filing any civil claim, regardless of continuing concealment?',
             '6 years','10 years','20 years','There is no absolute limit.','C'),

            -- ── Avelia · Personal Bankruptcy (Commercial Code) ──
            ('Avelia', 'commercial', 'Personal Bankruptcy', 'Commercial Code · Personal Bankruptcy',
             'After how many years does an Avelian personal bankruptcy discharge, assuming a good-faith repayment effort?',
             '5 years','7 years','10 years','There is no time limit.','B'),
            ('Avelia', 'commercial', 'Personal Bankruptcy', 'Commercial Code · Personal Bankruptcy',
             'If an Avelian debtor is found to have filed a fraudulent bankruptcy, the consequence is:',
             'A discharge with double restitution.',
             'No discharge ever and 5–10 years imprisonment.',
             'A discharge after a 14-year delay.',
             'A lifetime ban from holding bank accounts.','B'),
            ('Avelia', 'commercial', 'Personal Bankruptcy', 'Commercial Code · Personal Bankruptcy',
             'Under Avelian Insolvency §15, what is the effect of reaffirming a secured debt during bankruptcy?',
             'The debt is automatically discharged.',
             'The debtor remains personally liable on that debt after discharge.',
             'The creditor must repossess the underlying asset.',
             'The reaffirmation has no legal effect.','B'),

            -- ── Melizea · Bribery of Public Officials (Criminal Code) ──
            ('Melizea', 'criminal', 'Bribery of Public Officials', 'Criminal Code · Bribery',
             'Under Melizean §62, who is liable for bribery of a public official?',
             'Only the public official.',
             'Only the briber.',
             'Both the giver and the receiver.',
             'Only the receiver, and only if the bribe exceeded one million.','C'),
            ('Melizea', 'criminal', 'Bribery of Public Officials', 'Criminal Code · Bribery',
             'When a bribe exceeds one million in Melizea, what additional consequences apply?',
             'A doubled sentence and a permanent ban from public office.',
             'A tripled sentence with no ban.',
             'The standard sentence with a lifetime ban only for the receiver.',
             'No additional penalty beyond the standard sentence.','A'),
            ('Melizea', 'criminal', 'Bribery of Public Officials', 'Criminal Code · Bribery',
             'A participant in a Melizean bribery scheme who reports it to authorities earns immunity if the report is filed within:',
             '7 days','30 days','90 days','1 year','B'),

            -- ── Melizea · Defamation (Civil Code) ──
            ('Melizea', 'civil', 'Defamation', 'Civil Code · Defamation',
             'Under Melizean §144, what standard must a public figure meet to win a defamation claim?',
             'Negligence.',
             'Strict liability.',
             'Actual malice — knowing falsehood, or reckless disregard for truth.',
             'Mere reputational injury.','C'),
            ('Melizea', 'civil', 'Defamation', 'Civil Code · Defamation',
             'A private individual claiming defamation in Melizea must prove:',
             'Actual malice.',
             'Negligence on the part of the defendant.',
             'That the statement was published in print.',
             'That the defendant intended specific harm.','B'),
            ('Melizea', 'civil', 'Defamation', 'Civil Code · Defamation',
             'What is the cap on non-economic damages in a Melizean defamation action?',
             '100,000','500,000','1,000,000','There is no cap.','B'),

            -- ── Melizea · Whistleblower Protection (Commercial Code) ──
            ('Melizea', 'commercial', 'Whistleblower Protection', 'Commercial Code · Whistleblower Protection',
             'For how long after their report is a Melizean whistleblower protected from termination?',
             '12 months','24 months','36 months','For life.','C'),
            ('Melizea', 'commercial', 'Whistleblower Protection', 'Commercial Code · Whistleblower Protection',
             'If a protected Melizean whistleblower is unlawfully terminated, they are entitled to:',
             'Reinstatement only.',
             'One year''s salary.',
             'Three times annual salary plus reinstatement at the employee''s option.',
             'Five times annual salary, with no reinstatement.','C'),
            ('Melizea', 'commercial', 'Whistleblower Protection', 'Commercial Code · Whistleblower Protection',
             'Under Melizean §31, what is the consequence of filing a whistleblower report in bad faith?',
             'A fine equal to the employee''s annual salary.',
             'Mandatory counselling.',
             'Forfeiture of protection and potential prosecution for false accusations.',
             'No legal consequence.','C')
        ) AS t(nation_name, category, section, domain, prompt, a, b, c, d, correct)
    LOOP
        SELECT id INTO v_nation FROM nations WHERE name = rec.nation_name LIMIT 1;
        IF v_nation IS NULL THEN CONTINUE; END IF;

        SELECT id INTO v_law FROM committee_proposals
         WHERE nation_id = v_nation AND category = rec.category AND section = rec.section
         LIMIT 1;
        -- v_law NULL is OK (FK is SET NULL); the seed continues so questions
        -- still exist even if the underlying law row got renamed later.

        -- Idempotency: skip if a question with this prompt for this nation
        -- already exists. Same (prompt, nation_id) combinations are unique
        -- in practice because the seed is the only writer.
        IF EXISTS (
            SELECT 1 FROM bar_exam_questions
             WHERE nation_id = v_nation AND prompt = rec.prompt
        ) THEN
            CONTINUE;
        END IF;

        INSERT INTO bar_exam_questions (
            nation_id, law_id, domain, prompt,
            answer_a, answer_b, answer_c, answer_d, correct
        ) VALUES (
            v_nation, v_law, rec.domain, rec.prompt,
            rec.a, rec.b, rec.c, rec.d, rec.correct
        );
    END LOOP;
END $$;

-- ── 4. bar_exam_start — return 3 random questions (no correct field) ─
CREATE OR REPLACE FUNCTION public.bar_exam_start()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_pol   factions%ROWTYPE;
    v_tick  int;
    v_nation_id uuid;
    v_questions jsonb;
    v_count int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
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

    -- 3-tick cooldown from last attempt (success or failure).
    IF v_pol.bar_last_attempt_tick IS NOT NULL
       AND v_pol.bar_last_attempt_tick + 3 > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.bar_last_attempt_tick + 3);
    END IF;

    v_nation_id := v_pol.nation_id;

    -- Pool must have at least 3 questions to draw from.
    SELECT count(*) INTO v_count FROM bar_exam_questions WHERE nation_id = v_nation_id;
    IF v_count < 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_question_bank');
    END IF;

    -- Pick 3 random questions, build the client payload WITHOUT the
    -- correct letter. answers field is an array of {letter,text} for
    -- predictable client iteration order.
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

REVOKE EXECUTE ON FUNCTION public.bar_exam_start() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.bar_exam_start() TO authenticated;

-- ── 5. bar_exam_submit — validate, apply effects, return result ─────
CREATE OR REPLACE FUNCTION public.bar_exam_submit(
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

    -- FOR UPDATE: serialise concurrent submits on this politician
    -- row so two tabs can't both pass the cooldown check, both
    -- UPDATE political_capital, and double-apply the -2 penalty (or
    -- double-grant admission). Matches the lock pattern used by
    -- found_entrepreneur_corp / process_corp_loans elsewhere.
    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
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

    -- Walk the 3 (question, chosen) pairs, accumulate results.
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

    -- Always stamp the last-attempt tick. Apply pass/fail effects.
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

    -- Career event + Politics-tab dispatch.
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

    -- event_log description — see politician-home CAREER_EVENT_TEMPLATES
    -- entries for admitted_to_bar / failed_bar_exam; keep identical.
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

REVOKE EXECUTE ON FUNCTION public.bar_exam_submit(uuid[], char(1)[]) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.bar_exam_submit(uuid[], char(1)[]) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
