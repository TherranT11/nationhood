-- ════════════════════════════════════════════════════════════════════
-- 20270589 — Trial turn timeout: auto-flip after 4 ticks of inaction
--
-- Design: an in-progress trial's current_turn flips automatically if
-- the side on the clock doesn't end their turn within 4 ticks. Mirrors
-- the same flow as end_turn (20270538) — plaintiff timeout flips to
-- defendant; defendant timeout flips to plaintiff and increments
-- current_round; defendant timeout at round 4 closes the trial via
-- _close_trial_at_round_four. Objection-pending and awaiting-verdict
-- states are excluded from the auto-flip — the modal already locks the
-- clock there.
--
-- Mechanism:
--   1. New column court_case_trials.current_turn_started_at_tick (int).
--      Backfilled on apply for any existing in_progress trial so they
--      get a sensible timeout window starting from "now" rather than
--      auto-flipping on the first tick after deploy.
--
--   2. Trigger BEFORE UPDATE on court_case_trials. When current_turn
--      changes (NULL → value, value → other, value → NULL), stamp the
--      column with the shard's current_tick. This means every place
--      that already mutates current_turn (end_turn, call_witness_qa,
--      judge_rule_objection, represent_pretrial, accept_drawn_case,
--      objection-resume paths …) gets the stamp for free without
--      re-emission. Single source of truth.
--
--   3. NEW RPC process_trial_turn_timeouts(p_tick int). Per-tick.
--      Finds in_progress trials where the stamp is ≥ 4 ticks old,
--      excluding awaiting_verdict and pending_objection_message_id,
--      and applies the same flip logic as end_turn. p_tick honoured
--      over the shard read (same pattern as 20270585's fix).
--
--   4. Wired into advance-tick (see same-PR JS edit).
--
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Stamp column + backfill ──────────────────────────────────────
ALTER TABLE public.court_case_trials
    ADD COLUMN IF NOT EXISTS current_turn_started_at_tick int;

COMMENT ON COLUMN public.court_case_trials.current_turn_started_at_tick IS
    'Tick at which the current_turn began (auto-stamped by trg_stamp_trial_turn_start whenever current_turn changes). Consumed by process_trial_turn_timeouts: stamp + 4 ≤ current_tick triggers an auto-flip mimicking end_turn (20270538). NULL on trials that have never had current_turn set (pre-Phase-2 rows, pre_trial state).';

-- Backfill existing in_progress trials so they don't all auto-flip
-- the moment the processor first runs. Pretrial / resolved / settled
-- trials don't need a stamp.
UPDATE public.court_case_trials
   SET current_turn_started_at_tick = (SELECT current_tick FROM public.shard WHERE name = 'Alpha Shard')
 WHERE status = 'in_progress'
   AND current_turn IS NOT NULL
   AND current_turn_started_at_tick IS NULL;

-- ── 2. Trigger: stamp the column on every current_turn change ──────
CREATE OR REPLACE FUNCTION public._stamp_trial_turn_start()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_tick int;
BEGIN
    -- IS DISTINCT FROM handles NULL→value, value→other, value→NULL
    -- transitions identically. NULL→NULL and value→same are no-ops.
    IF NEW.current_turn IS DISTINCT FROM OLD.current_turn THEN
        IF NEW.current_turn IS NULL THEN
            -- Turn cleared (trial closing / resetting). Clear the stamp too.
            NEW.current_turn_started_at_tick := NULL;
        ELSE
            SELECT current_tick INTO v_tick
              FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
            NEW.current_turn_started_at_tick := COALESCE(v_tick, 0);
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_trial_turn_start ON public.court_case_trials;
CREATE TRIGGER trg_stamp_trial_turn_start
BEFORE UPDATE ON public.court_case_trials
FOR EACH ROW EXECUTE FUNCTION public._stamp_trial_turn_start();

-- ── 3. process_trial_turn_timeouts — per-tick auto-flip ────────────
CREATE OR REPLACE FUNCTION public.process_trial_turn_timeouts(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    TIMEOUT_TICKS  CONSTANT int := 4;

    v_tick     int;
    r          RECORD;
    v_flipped  int := 0;
    v_closed   int := 0;
    v_verdict  jsonb;
BEGIN
    v_tick := COALESCE(p_tick,
                       (SELECT current_tick FROM shard WHERE name = 'Alpha Shard'),
                       0);

    FOR r IN
        SELECT id, current_turn, current_round
          FROM court_case_trials
         WHERE status = 'in_progress'
           AND COALESCE(awaiting_verdict, false) = false
           AND pending_objection_message_id IS NULL
           AND current_turn IS NOT NULL
           AND current_turn_started_at_tick IS NOT NULL
           AND current_turn_started_at_tick + TIMEOUT_TICKS <= v_tick
         FOR UPDATE
    LOOP
        IF r.current_turn = 'plaintiff' THEN
            -- Plaintiff timeout: flip to defendant. Same round.
            UPDATE court_case_trials
               SET current_turn = 'defendant', messages_sent_this_turn = 0
             WHERE id = r.id;
            v_flipped := v_flipped + 1;

        ELSE
            -- Defendant timeout.
            IF r.current_round < 4 THEN
                -- Advance to next round, back to plaintiff.
                UPDATE court_case_trials
                   SET current_turn = 'plaintiff',
                       current_round = r.current_round + 1,
                       messages_sent_this_turn = 0
                 WHERE id = r.id;
                v_flipped := v_flipped + 1;
            ELSE
                -- Round 4 defendant timeout: close the trial via
                -- the same helper end_turn calls (20270538).
                SELECT (public._close_trial_at_round_four(r.id) -> 'verdict')
                  INTO v_verdict;
                v_closed := v_closed + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick,
        'flipped', v_flipped, 'closed', v_closed);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_trial_turn_timeouts(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_trial_turn_timeouts(int) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
