-- ════════════════════════════════════════════════════════════════════
-- 20270562 — SC Phase 2 audit fix: queue race
--
-- _activate_sc_queue_for_nation's active-case EXISTS check runs
-- without a lock. Under concurrent activates (two SC filings landing
-- in the same nation back-to-back, or a verdict + a new filing
-- colliding) both callers can pass the "no in_progress SC trial"
-- guard before either commits, then both proceed to lock different
-- awaiting_hearing rows and promote them — violating the one-case-
-- at-a-time rule. Fix: take a transaction-scoped advisory lock
-- keyed by nation id at the top of the helper so concurrent calls
-- for the same nation serialize.
--
-- The column-level REVOKE UPDATE on politician_supreme_court_justice
-- _at_tick that this migration originally also carried was folded
-- into 20270561 directly so the column add and the lock-down ship
-- atomically — otherwise a partial-apply of 20270561 (or 20270562
-- running ahead of it) would error on a column that didn't exist.
--
-- Function body is byte-identical to 20270561 with one inserted
-- line (the pg_advisory_xact_lock call) at the top of the body.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public._activate_sc_queue_for_nation(
    p_nation_id uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick      int;
    v_next_id   uuid;
    v_judge_id  uuid;
BEGIN
    IF p_nation_id IS NULL THEN RETURN NULL; END IF;

    -- Serialize concurrent activates within the same nation. Without
    -- this, two callers can both pass the in_progress EXISTS check
    -- before either commits and both end up promoting a trial,
    -- breaking the one-case-at-a-time rule. hashtext returns int4;
    -- cast to bigint for the lock function. Transaction-scoped, so
    -- the lock releases automatically on commit/abort.
    PERFORM pg_advisory_xact_lock(hashtext(p_nation_id::text)::bigint);

    IF EXISTS (
        SELECT 1 FROM public.court_case_trials t
          JOIN public.court_case_trials p ON p.id = t.appeal_of_trial_id
         WHERE t.nation_id = p_nation_id
           AND t.status = 'in_progress'
           AND t.appeal_of_trial_id IS NOT NULL
           AND p.appeal_of_trial_id IS NOT NULL
    ) THEN
        RETURN NULL;
    END IF;

    SELECT t.id INTO v_next_id
      FROM public.court_case_trials t
      JOIN public.court_case_trials p ON p.id = t.appeal_of_trial_id
     WHERE t.nation_id = p_nation_id
       AND t.status = 'awaiting_hearing'
       AND t.appeal_of_trial_id IS NOT NULL
       AND p.appeal_of_trial_id IS NOT NULL
     ORDER BY COALESCE(t.matched_at_tick, t.pre_trial_started_at_tick) ASC,
              t.id ASC
     LIMIT 1
     FOR UPDATE OF t;

    IF v_next_id IS NULL THEN RETURN NULL; END IF;

    v_judge_id := public._assign_sc_justice_to_trial(v_next_id);
    IF v_judge_id IS NULL THEN RETURN NULL; END IF;

    PERFORM public._begin_trial_arguments(v_next_id);

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        v_next_id, 'system', 1, 0,
        'The Supreme Court is convened. Arguments will be heard. Plaintiff opens.',
        'judge_note'
    );

    RETURN v_next_id;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
