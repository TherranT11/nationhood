-- ════════════════════════════════════════════════════════════════════
-- 20270561 — Supreme Court Phase 2: bench, queue, gates, payout
--
-- Phase 1 (20270560) shipped SC appeal FILING — a parked
-- pre_trial row with no judge, no advancement. Phase 2 turns that
-- into a working pipeline:
--
--   1. Supreme Court Justice rung. New column
--      politician_supreme_court_justice_at_tick on factions, one-shot
--      tracking just like other rungs. The in-game appointment
--      mechanism is DEFERRED — admins set this column directly for
--      now; the prereq (must be Magistrate or Appellate Justice) +
--      the per-nation cap of 3 will be enforced by the future
--      appointment RPC when it ships. Appellate Justice itself is
--      still visual-only (no schema), so today the prereq is just
--      Magistrate.
--
--   2. Single-court queue model. Each nation has one Supreme Court
--      with up to three Justices on the bench. The court hears ONE
--      case at a time. Filed SC appeals park at the new status
--      'awaiting_hearing' once both attorneys are seated. When the
--      nation's active SC case resolves (or when a freshly-filed SC
--      trial finds no active case ahead of it), the oldest queued
--      'awaiting_hearing' is promoted to in_progress and an SC
--      Justice is auto-assigned via _assign_sc_justice_to_trial.
--      Mirrors _assign_magistrate_to_trial — least-busy by active
--      caseload, random tie-break, excludes counsels on the same
--      trial.
--
--   3. Filing bonus. The filer of an SC appeal gets +1 Reputation
--      and +2 Political Capital at filing time (not floored at 0
--      since they're additions, but the math uses GREATEST/no-floor
--      patterns consistent with other PC adds in the codebase).
--
--   4. Join restriction. Manual pickup of the SC trial's open seat
--      via represent_pretrial requires the joining attorney to hold
--      politician_experienced_advocate_at_tick. State Advocate
--      auto-fill at filing time is unchanged — that mechanism seats
--      a State Advocate directly without going through pickup.
--
--   5. Verdict escalation. SC trials (chain depth 2 — the trial's
--      parent appeal itself has appeal_of_trial_id set) apply
--      +5 Rep / +8 PC win, -8 Rep / -5 PC loss, replacing the
--      regular appeal's +3/+5 win and -5/-3 loss. _apply_verdict
--      detects SC via the same parent-chain EXISTS check used by
--      represent_pretrial. Verdict chat message + event_log entry
--      reflect Supreme Court framing.
--
--   6. Pressing Issues visibility. list_active_trials_for_advocate
--      now also returns trials in 'awaiting_hearing' so the player
--      sees their SC case as a Pressing Issue while it queues. Each
--      row carries an is_supreme_court flag so the client can render
--      the Supreme Court Case tag.
--
-- Chain-depth check (used as SC detection in three places — start_appeal
-- terminal guard from Phase 1, represent_pretrial SC short-circuit
-- from Phase 1, and _apply_verdict SC payout new in this migration):
-- the trial's appeal_of_trial_id parent itself has appeal_of_trial_id
-- set. Original → appeal (depth 1) → SC (depth 2). Phase 1's terminal
-- guard already enforces "no third level" so depth never exceeds 2.
--
-- ── Known coupling ────────────────────────────────────────────────
-- Until an appointment mechanism ships, no SC Justice column will be
-- set in normal play, so _activate_sc_queue_for_nation's "pick a
-- justice" select returns NULL and the queue stays parked. Tests can
-- admin-insert politician_supreme_court_justice_at_tick = current
-- tick to advance.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: SC Justice rung + awaiting_hearing status ───────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_supreme_court_justice_at_tick int;

COMMENT ON COLUMN public.factions.politician_supreme_court_justice_at_tick IS
    'Tick at which this politician was appointed Supreme Court Justice (Judiciary Tier 5). NULL = not appointed. One-shot, never cleared. Appointment RPC deferred — admins set this directly for now.';

ALTER TABLE public.court_case_trials
    DROP CONSTRAINT IF EXISTS court_case_trials_status_check;
ALTER TABLE public.court_case_trials
    ADD CONSTRAINT court_case_trials_status_check
    CHECK (status IN ('pre_trial', 'settlement_conference', 'awaiting_hearing',
                      'in_progress', 'resolved', 'settled', 'expired'));

-- ── 2. _assign_sc_justice_to_trial helper ──────────────────────────
-- Mirrors _assign_magistrate_to_trial (20270536). Picks the least-busy
-- SC Justice in the trial's nation, excluding both counsels on the
-- trial. Returns the assigned faction id or NULL when no eligible SC
-- Justice exists. Caller (the queue activator below) treats NULL as
-- "queue stays parked — try again when an SC Justice is appointed."
CREATE OR REPLACE FUNCTION public._assign_sc_justice_to_trial(
    p_trial_id uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_trial      court_case_trials%ROWTYPE;
    v_tick       int;
    v_chosen_id  uuid;
BEGIN
    SELECT * INTO v_trial FROM public.court_case_trials WHERE id = p_trial_id;
    IF v_trial.id IS NULL THEN RETURN NULL; END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    SELECT j.id INTO v_chosen_id
      FROM public.factions j
      LEFT JOIN public.court_case_trials t
        ON t.judge_faction_id = j.id
       AND t.status IN ('in_progress', 'settlement_conference')
       AND t.id <> p_trial_id
     WHERE j.politician_supreme_court_justice_at_tick IS NOT NULL
       AND j.abandoned_at IS NULL
       AND j.faction_type = 'politician'
       AND j.nation_id = v_trial.nation_id
       AND j.id IS DISTINCT FROM v_trial.plaintiff_advocate_id
       AND j.id IS DISTINCT FROM v_trial.defendant_advocate_id
     GROUP BY j.id
     ORDER BY COUNT(t.id) ASC, random() ASC
     LIMIT 1;

    IF v_chosen_id IS NULL THEN RETURN NULL; END IF;

    UPDATE public.court_case_trials
       SET judge_faction_id          = v_chosen_id,
           judge_assigned_at_tick    = COALESCE(v_tick, 0),
           judge_last_action_at_tick = COALESCE(v_tick, 0)
     WHERE id = p_trial_id;
    RETURN v_chosen_id;
END $$;

-- ── 3. _activate_sc_queue_for_nation helper ────────────────────────
-- Promotes the oldest awaiting_hearing SC trial in this nation to
-- in_progress IF the Supreme Court has no active case there. "Active"
-- = any in_progress SC trial in this nation. Assigns an SC Justice
-- via _assign_sc_justice_to_trial and calls _begin_trial_arguments to
-- deal hands. Returns the promoted trial's id (or NULL when nothing
-- moves — already-active SC case, no awaiting_hearing trials, or no
-- SC Justice available). No-op safe to call from anywhere; the
-- "do nothing if a case is already in progress" guard is the queue.
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

    -- Active-case guard. Only consider SC trials (chain depth 2).
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

    -- Pick the oldest awaiting_hearing SC trial in this nation.
    -- pre_trial_started_at_tick is the closest "filed at" stamp we
    -- have; matched_at_tick gets set when both seats fill so it
    -- serves the same "ready to go" ordering for the queue.
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

    -- Try to seat a justice. If none available, leave the trial in
    -- awaiting_hearing — a future _activate call (after appointment)
    -- will retry.
    v_judge_id := public._assign_sc_justice_to_trial(v_next_id);
    IF v_judge_id IS NULL THEN RETURN NULL; END IF;

    -- Flip to in_progress and deal hands. _begin_trial_arguments sets
    -- status='in_progress', current_round=1, current_turn='plaintiff'
    -- and inserts the 10 hand rows.
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

-- ── 4. start_appeal — SC filing bonus + awaiting_hearing + activate ─
-- Same body as 20270560 plus three SC-branch additions:
--   • +1 Rep / +2 PC filer bonus applied immediately on SC filing.
--   • SC trial status starts at 'awaiting_hearing' when both seats
--     are filled at creation (state auto-fill case), 'pre_trial'
--     otherwise. (Phase 1 forced 'pre_trial' always; Phase 2 promotes
--     to awaiting_hearing when both seated so the queue picks it up.)
--   • _activate_sc_queue_for_nation called after SC trial created.
--     No-op if a case is already active or no Justice available.
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

    SELECT COUNT(*) INTO v_active_count
      FROM public.court_case_trials t
     WHERE (t.plaintiff_advocate_id = v_pol.id
            OR t.defendant_advocate_id = v_pol.id)
       AND t.status IN ('pre_trial', 'settlement_conference', 'awaiting_hearing', 'in_progress');
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
    --   Regular appeal, both seats  → in_progress (current behavior).
    --   Regular appeal, one open    → pre_trial (current behavior).
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

    -- Bench routing and filing bonus diverge by SC vs regular.
    IF v_is_sc THEN
        -- Filing bonus: +1 Rep, +2 PC to the filer for getting in
        -- front of the Supreme Court. Applied once at filing,
        -- independent of verdict.
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

    -- Activate the queue if this SC trial is ready (both attorneys
    -- seated, status=awaiting_hearing). _activate_sc_queue_for_nation
    -- handles the "is the court busy?" check internally.
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

-- ── 5. represent_pretrial — Experienced gate + awaiting_hearing ────
-- Phase 1 short-circuited SC joins (no judge, no in_progress flip).
-- Phase 2 adds:
--   • Experienced Advocate-only gate for SC joins. State Advocates
--     can still appear as auto-filled appellees but cannot manually
--     pick up an open SC seat. Rejection: sc_join_requires_experienced.
--   • Status flips to 'awaiting_hearing' (not 'pre_trial') after
--     seating, signaling "both seats filled, queueing for the court."
--   • _activate_sc_queue_for_nation call after seating.
CREATE OR REPLACE FUNCTION public.represent_pretrial(
    p_faction_id uuid,
    p_trial_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_pol             factions%ROWTYPE;
    v_trial           court_case_trials%ROWTYPE;
    v_tick            int;
    v_open_side       text;
    v_decision        text;
    v_inserted        int;
    v_judge_id        uuid;
    v_is_appeal       boolean;
    v_is_sc           boolean;
    v_opp_advocate_id uuid;
    v_opp_owner       uuid;
    v_my_owner        uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL THEN
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

    SELECT * INTO v_trial FROM public.court_case_trials
     WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'pre_trial' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_pretrial');
    END IF;
    IF v_trial.nation_id <> v_pol.bar_admitted_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_mismatch');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_trial.pre_trial_expires_at_tick < v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'pre_trial_expired');
    END IF;

    IF v_trial.plaintiff_advocate_id IS NULL THEN
        v_open_side       := 'plaintiff';
        v_opp_advocate_id := v_trial.defendant_advocate_id;
    ELSIF v_trial.defendant_advocate_id IS NULL THEN
        v_open_side       := 'defendant';
        v_opp_advocate_id := v_trial.plaintiff_advocate_id;
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'both_sides_filled');
    END IF;

    IF v_opp_advocate_id IS NOT NULL THEN
        SELECT COALESCE(linked_user_id, id) INTO v_opp_owner
          FROM public.factions WHERE id = v_opp_advocate_id;
        v_my_owner := COALESCE(v_pol.linked_user_id, v_pol.id);
        IF v_opp_owner IS NOT NULL AND v_opp_owner = v_my_owner THEN
            RETURN jsonb_build_object('success', false, 'reason', 'same_user_already_seated');
        END IF;
    END IF;

    v_decision := CASE WHEN v_open_side = 'plaintiff'
                         THEN 'representing_plaintiff'
                       ELSE 'representing_defendant' END;
    v_is_appeal := v_trial.appeal_of_trial_id IS NOT NULL;
    v_is_sc     := v_is_appeal AND EXISTS (
        SELECT 1 FROM public.court_case_trials parent
         WHERE parent.id = v_trial.appeal_of_trial_id
           AND parent.appeal_of_trial_id IS NOT NULL
    );

    -- SC join gate. Manual pickup requires Experienced Advocate.
    -- Run BEFORE the attempts-row insert so a rejected attempt
    -- doesn't burn the case slot.
    IF v_is_sc AND v_pol.politician_experienced_advocate_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'sc_join_requires_experienced');
    END IF;

    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, v_trial.case_draft_id, v_decision)
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
    END IF;

    IF v_is_appeal THEN
        IF v_open_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET plaintiff_advocate_id = v_pol.id,
                   matched_at_tick       = v_tick
             WHERE id = p_trial_id;
        ELSE
            UPDATE public.court_case_trials
               SET defendant_advocate_id = v_pol.id,
                   matched_at_tick       = v_tick
             WHERE id = p_trial_id;
        END IF;

        IF v_is_sc THEN
            -- Both seats now filled — flip to awaiting_hearing and
            -- ask the queue to activate. Queue is a no-op if a case
            -- is already in progress or no SC Justice available.
            UPDATE public.court_case_trials
               SET status = 'awaiting_hearing'
             WHERE id = p_trial_id;

            INSERT INTO public.court_case_trial_messages (
                trial_id, side, round, turn_seq, text, kind
            ) VALUES (
                p_trial_id, 'system', 0, 0,
                'Both counsels are seated. The case is queued for the Supreme Court.',
                'judge_note'
            );

            PERFORM public._activate_sc_queue_for_nation(v_trial.nation_id);

            RETURN jsonb_build_object(
                'success',          true,
                'decision',         v_decision,
                'side',             v_open_side,
                'trial_id',         p_trial_id,
                'case_id',          v_trial.case_draft_id,
                'trial_status',     'awaiting_hearing',
                'matched_at_tick',  v_tick,
                'judge_assigned',   false,
                'judge_faction_id', NULL,
                'is_appeal',        true
            );
        END IF;

        v_judge_id := v_trial.judge_faction_id;
        IF v_judge_id IS NULL THEN
            v_judge_id := public._assign_magistrate_to_trial(p_trial_id);
        END IF;
        PERFORM public._begin_trial_arguments(p_trial_id);

        INSERT INTO public.court_case_trial_messages (
            trial_id, side, round, turn_seq, text, kind
        ) VALUES (
            p_trial_id, 'system', 1, 0,
            'Both counsels are seated. The Appellate Court will hear arguments. Plaintiff opens.',
            'judge_note'
        );

        RETURN jsonb_build_object(
            'success',          true,
            'decision',         v_decision,
            'side',             v_open_side,
            'trial_id',         p_trial_id,
            'case_id',          v_trial.case_draft_id,
            'trial_status',     'in_progress',
            'matched_at_tick',  v_tick,
            'judge_assigned',   v_judge_id IS NOT NULL,
            'judge_faction_id', v_judge_id,
            'is_appeal',        true
        );
    END IF;

    IF v_open_side = 'plaintiff' THEN
        UPDATE public.court_case_trials
           SET plaintiff_advocate_id = v_pol.id,
               status                = 'settlement_conference',
               matched_at_tick       = v_tick
         WHERE id = p_trial_id;
    ELSE
        UPDATE public.court_case_trials
           SET defendant_advocate_id = v_pol.id,
               status                = 'settlement_conference',
               matched_at_tick       = v_tick
         WHERE id = p_trial_id;
    END IF;

    v_judge_id := public._assign_magistrate_to_trial(p_trial_id);

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, 'system', 0, 0,
        'The court is convened. Before motions and argument, are either of you willing to discuss settlement?',
        'judge_note'
    );

    RETURN jsonb_build_object(
        'success',          true,
        'decision',         v_decision,
        'side',             v_open_side,
        'trial_id',         p_trial_id,
        'case_id',          v_trial.case_draft_id,
        'trial_status',     'settlement_conference',
        'matched_at_tick',  v_tick,
        'judge_assigned',   v_judge_id IS NOT NULL,
        'judge_faction_id', v_judge_id,
        'is_appeal',        false
    );
END $$;

-- ── 6. _apply_verdict — SC payout + advance queue ──────────────────
-- Same body as 20270549 with two SC additions:
--   • SC payout escalation. When the verdict is on an SC trial
--     (chain depth 2), the appellant payout becomes +5 Rep / +8 PC
--     on flip vs -8 Rep / -5 PC on stand. Regular appeals keep the
--     +3/+5 vs -5/-3 numbers from 20270545. Both still floor at 0
--     for losses.
--   • Queue advancement. After SC verdict, call
--     _activate_sc_queue_for_nation so the next queued case takes
--     the bench. No-op for non-SC verdicts.
--   • SC verdict chat + event_log text. The "Appellate" framing
--     becomes "Supreme Court" for depth-2 trials.
CREATE OR REPLACE FUNCTION public._apply_verdict(p_trial_id uuid, p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_trial               court_case_trials%ROWTYPE;
    v_case                court_case_drafts%ROWTYPE;
    v_p_sum               int := 0;
    v_d_sum               int := 0;
    v_p_wit               int := 0;
    v_d_wit               int := 0;
    v_p_obj               int := 0;
    v_d_obj               int := 0;
    v_p_chaos             int := 0;
    v_d_chaos             int := 0;
    v_is_criminal         boolean;
    v_p_total             int;
    v_d_total             int;
    v_winner              text;
    v_offerer             text;
    v_p_delta             numeric := 0;
    v_d_delta             numeric := 0;
    v_base                numeric;
    v_p_name              text;
    v_d_name              text;
    v_winner_name         text;
    v_winning_adv_id      uuid;
    v_winning_attorney    text;
    v_event_text          text;
    v_verdict_text        text;
    v_original_winner     text;
    v_appellant_id        uuid;
    v_appeal_flipped      boolean := false;
    v_appellant_rep_delta int := 0;
    v_appellant_pc_delta  int := 0;
    v_case_caption        text;
    v_nation_name         text;
    v_winner_adv_id       uuid;
    v_loser_adv_id        uuid;
    v_is_sc               boolean := false;
    v_sc_win_rep          int := 5;
    v_sc_win_pc           int := 8;
    v_sc_loss_rep         int := 8;
    v_sc_loss_pc          int := 5;
BEGIN
    SELECT * INTO v_trial FROM public.court_case_trials WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'in_progress' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved');
    END IF;

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;
    v_is_criminal := v_case.case_type = 'criminal';

    SELECT
        COALESCE(sum(CASE WHEN h.side = 'plaintiff'
                            THEN COALESCE((v_case.beats -> h.beat_index ->> 'strength')::int, 0)
                          ELSE 0 END), 0),
        COALESCE(sum(CASE WHEN h.side = 'defendant'
                            THEN COALESCE((v_case.beats -> h.beat_index ->> 'strength')::int, 0)
                          ELSE 0 END), 0)
      INTO v_p_sum, v_d_sum
      FROM public.court_case_trial_hands h
     WHERE h.trial_id = p_trial_id
       AND h.played_at_round IS NOT NULL
       AND h.nullified = false;

    IF v_is_criminal THEN
        v_p_chaos := floor(random() * 13)::int - 6;
        v_d_chaos := floor(random() * 13)::int - 6;
        v_p_total := v_p_sum + v_p_chaos;
        v_d_total := v_d_sum + v_d_chaos;
    ELSE
        SELECT
            COALESCE(sum(CASE WHEN supports = 'plaintiff' THEN strength ELSE 0 END), 0),
            COALESCE(sum(CASE WHEN supports = 'defendant' THEN strength ELSE 0 END), 0)
          INTO v_p_wit, v_d_wit
          FROM public.court_case_trial_witness_qa
         WHERE trial_id = p_trial_id;

        v_p_obj := v_trial.plaintiff_objection_strength_delta;
        v_d_obj := v_trial.defendant_objection_strength_delta;

        v_p_total := v_p_sum + v_p_wit + v_p_obj;
        v_d_total := v_d_sum + v_d_wit + v_d_obj;
    END IF;

    IF v_p_total > v_d_total THEN
        v_winner := 'plaintiff';
    ELSE
        v_winner := 'defendant';
    END IF;

    v_offerer := v_trial.settle_offered_by_side;
    IF v_offerer IS NOT NULL AND v_trial.settle_resolved = 'declined' THEN
        IF v_offerer = v_winner THEN
            IF v_winner = 'plaintiff' THEN v_p_delta := -1; ELSE v_d_delta := -1; END IF;
        ELSE
            IF v_offerer = 'plaintiff' THEN
                v_p_delta := -3; v_d_delta := 5;
            ELSE
                v_d_delta := -3; v_p_delta := 5;
            END IF;
        END IF;
    ELSE
        v_base := round(
            (CASE WHEN v_winner = 'plaintiff' THEN v_d_total ELSE v_p_total END)::numeric / 10.0,
            1);
        v_base := GREATEST(v_base, 0);
        IF v_winner = 'plaintiff' THEN v_p_delta := v_base; ELSE v_d_delta := v_base; END IF;
    END IF;

    IF v_trial.plaintiff_advocate_id IS NOT NULL THEN
        UPDATE public.factions
           SET politician_reputation = GREATEST(0,
               COALESCE(politician_reputation, 0) + ROUND(v_p_delta)::int)
         WHERE id = v_trial.plaintiff_advocate_id;
    END IF;
    IF v_trial.defendant_advocate_id IS NOT NULL THEN
        UPDATE public.factions
           SET politician_reputation = GREATEST(0,
               COALESCE(politician_reputation, 0) + ROUND(v_d_delta)::int)
         WHERE id = v_trial.defendant_advocate_id;
    END IF;

    IF v_winner = 'plaintiff' AND v_trial.plaintiff_advocate_id IS NOT NULL THEN
        UPDATE public.factions
           SET politician_standing = COALESCE(politician_standing, 0) + 1
         WHERE id = v_trial.plaintiff_advocate_id;
    ELSIF v_winner = 'defendant' AND v_trial.defendant_advocate_id IS NOT NULL THEN
        UPDATE public.factions
           SET politician_standing = COALESCE(politician_standing, 0) + 1
         WHERE id = v_trial.defendant_advocate_id;
    END IF;

    -- Appeal payout. Regular appeals get +3/+5 win, -5/-3 loss.
    -- SC trials (chain depth 2) get +5/+8 win, -8/-5 loss.
    IF v_trial.appeal_of_trial_id IS NOT NULL THEN
        SELECT verdict_winner INTO v_original_winner
          FROM public.court_case_trials WHERE id = v_trial.appeal_of_trial_id;
        IF v_original_winner = 'plaintiff' THEN
            v_appellant_id := v_trial.defendant_advocate_id;
        ELSIF v_original_winner = 'defendant' THEN
            v_appellant_id := v_trial.plaintiff_advocate_id;
        END IF;
        v_appeal_flipped := v_winner IS DISTINCT FROM v_original_winner;

        v_is_sc := EXISTS (
            SELECT 1 FROM public.court_case_trials parent
             WHERE parent.id = v_trial.appeal_of_trial_id
               AND parent.appeal_of_trial_id IS NOT NULL
        );

        IF v_appellant_id IS NOT NULL THEN
            IF v_appeal_flipped THEN
                v_appellant_rep_delta := CASE WHEN v_is_sc THEN v_sc_win_rep ELSE 3 END;
                v_appellant_pc_delta  := CASE WHEN v_is_sc THEN v_sc_win_pc  ELSE 5 END;
                UPDATE public.factions
                   SET politician_reputation = COALESCE(politician_reputation, 0) + v_appellant_rep_delta,
                       political_capital     = COALESCE(political_capital, 0) + v_appellant_pc_delta
                 WHERE id = v_appellant_id;
            ELSE
                v_appellant_rep_delta := CASE WHEN v_is_sc THEN -v_sc_loss_rep ELSE -5 END;
                v_appellant_pc_delta  := CASE WHEN v_is_sc THEN -v_sc_loss_pc  ELSE -3 END;
                UPDATE public.factions
                   SET politician_reputation = GREATEST(0,
                          COALESCE(politician_reputation, 0) + v_appellant_rep_delta),
                       political_capital     = GREATEST(0,
                          COALESCE(political_capital, 0) + v_appellant_pc_delta)
                 WHERE id = v_appellant_id;
            END IF;
        END IF;
    END IF;

    UPDATE public.court_case_trials
       SET status           = 'resolved',
           verdict_winner   = v_winner,
           verdict_at_tick  = p_tick,
           awaiting_verdict = false
     WHERE id = p_trial_id;

    -- Verdict chat line. SC framing replaces the generic "appellate"
    -- when chain depth is 2.
    IF v_is_criminal THEN
        v_verdict_text := 'Jury verdict: ' ||
            'plaintiff ' || v_p_sum ||
            ' (chaos ' || (CASE WHEN v_p_chaos >= 0 THEN '+' ELSE '' END) || v_p_chaos || ' = ' || v_p_total || ') ' ||
            'vs defendant ' || v_d_sum ||
            ' (chaos ' || (CASE WHEN v_d_chaos >= 0 THEN '+' ELSE '' END) || v_d_chaos || ' = ' || v_d_total || '). ' ||
            'Judgment for the ' || v_winner || '.';
    ELSIF v_is_sc THEN
        v_verdict_text := 'Supreme Court ruling: judgment for the ' || v_winner ||
            CASE WHEN v_appeal_flipped THEN '. The appellate decision is reversed.'
                                       ELSE '. The appellate decision is affirmed.' END;
    ELSIF v_trial.appeal_of_trial_id IS NOT NULL THEN
        v_verdict_text := 'Appellate verdict: judgment for the ' || v_winner ||
            CASE WHEN v_appeal_flipped THEN '. The lower court is reversed.'
                                       ELSE '. The lower court is affirmed.' END;
    ELSE
        v_verdict_text := 'Verdict: judgment for the ' || v_winner ||
            '. (plaintiff ' || v_p_total ||
            ' vs defendant ' || v_d_total || ')';
    END IF;

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, 'system', v_trial.current_round, 0,
        v_verdict_text, 'verdict'
    );

    v_p_name := COALESCE(NULLIF(btrim(v_trial.plaintiff_name), ''), 'Plaintiff');
    v_d_name := COALESCE(NULLIF(btrim(v_trial.defendant_name), ''), 'Defendant');
    IF v_winner = 'plaintiff' THEN
        v_winner_name    := v_p_name;
        v_winning_adv_id := v_trial.plaintiff_advocate_id;
    ELSE
        v_winner_name    := v_d_name;
        v_winning_adv_id := v_trial.defendant_advocate_id;
    END IF;

    IF v_winning_adv_id IS NOT NULL THEN
        SELECT btrim(COALESCE(leader_first_name, '') || ' ' || COALESCE(leader_last_name, ''))
          INTO v_winning_attorney
          FROM public.factions WHERE id = v_winning_adv_id;
        IF v_winning_attorney = '' OR v_winning_attorney IS NULL THEN
            SELECT faction_name INTO v_winning_attorney
              FROM public.factions WHERE id = v_winning_adv_id;
        END IF;
    END IF;

    IF v_is_sc THEN
        v_event_text :=
            'The Supreme Court has ruled in ' || v_p_name || ' vs ' || v_d_name
            || ', ' || (CASE WHEN v_appeal_flipped
                          THEN 'reversing the appellate judgment in favor of ' || v_winner_name
                          ELSE 'affirming the appellate judgment for ' || v_winner_name END) || '.';
    ELSIF v_trial.appeal_of_trial_id IS NOT NULL THEN
        v_event_text :=
            'The appellate court has ruled in ' || v_p_name || ' vs ' || v_d_name
            || ', ' || (CASE WHEN v_appeal_flipped
                          THEN 'reversing the prior judgment in favor of ' || v_winner_name
                          ELSE 'affirming the prior judgment for ' || v_winner_name END) || '.';
    ELSIF v_is_criminal THEN
        v_event_text :=
            'The jury has returned a verdict in ' || v_p_name || ' vs ' || v_d_name
            || ', finding for ' || v_winner_name || '.';
    ELSE
        v_event_text :=
            'The case of ' || v_p_name || ' vs ' || v_d_name
            || ' has finished, with the court ruling in favor of ' || v_winner_name || '.';
    END IF;
    IF v_winning_attorney IS NOT NULL AND v_winning_attorney <> '' THEN
        v_event_text := v_event_text
            || ' ' || v_winning_attorney || ' scores a major win in court.';
    END IF;

    INSERT INTO public.event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_trial.nation_id, v_winning_adv_id,
        CASE WHEN v_is_sc                                  THEN 'Supreme Court Ruling'
             WHEN v_trial.appeal_of_trial_id IS NOT NULL    THEN 'Appellate Verdict'
             WHEN v_is_criminal                             THEN 'Jury Verdict'
             ELSE                                                'Verdict Rendered' END,
        v_event_text,
        'politician',
        CASE WHEN v_is_sc                                  THEN 'trial_supreme_court_ruling'
             WHEN v_trial.appeal_of_trial_id IS NOT NULL    THEN 'trial_appellate_verdict'
             WHEN v_is_criminal                             THEN 'trial_jury_verdict'
             ELSE                                                'trial_verdict_rendered' END,
        p_tick
    );

    v_case_caption := v_p_name || ' vs ' || v_d_name;
    SELECT name INTO v_nation_name FROM public.nations WHERE id = v_trial.nation_id;
    v_winner_adv_id := v_winning_adv_id;
    v_loser_adv_id  := CASE WHEN v_winner = 'plaintiff'
                              THEN v_trial.defendant_advocate_id
                              ELSE v_trial.plaintiff_advocate_id END;

    IF v_winner_adv_id IS NOT NULL THEN
        INSERT INTO public.politician_career_events (
            faction_id, event_tick, event_type, target_name, metadata
        ) VALUES (
            v_winner_adv_id, p_tick, 'won_case', v_case_caption,
            jsonb_build_object(
                'trial_id',    p_trial_id,
                'nation_name', v_nation_name,
                'side',        v_winner
            )
        );
    END IF;
    IF v_loser_adv_id IS NOT NULL THEN
        INSERT INTO public.politician_career_events (
            faction_id, event_tick, event_type, target_name, metadata
        ) VALUES (
            v_loser_adv_id, p_tick, 'lost_case', v_case_caption,
            jsonb_build_object(
                'trial_id',    p_trial_id,
                'nation_name', v_nation_name,
                'side',        CASE WHEN v_winner = 'plaintiff' THEN 'defendant' ELSE 'plaintiff' END
            )
        );
    END IF;

    -- Queue advancement. After an SC trial resolves, promote the next
    -- awaiting_hearing case in this nation (if any) to in_progress.
    -- No-op for non-SC verdicts.
    IF v_is_sc THEN
        PERFORM public._activate_sc_queue_for_nation(v_trial.nation_id);
    END IF;

    RETURN jsonb_build_object(
        'success',                  true,
        'winner',                   v_winner,
        'mode',                     CASE WHEN v_is_sc                              THEN 'supreme_court'
                                         WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN 'appeal'
                                         WHEN v_is_criminal THEN 'jury' ELSE 'bench' END,
        'plaintiff_strength',       v_p_total,
        'defendant_strength',       v_d_total,
        'plaintiff_beat_sum',       v_p_sum,
        'defendant_beat_sum',       v_d_sum,
        'plaintiff_witness_sum',    v_p_wit,
        'defendant_witness_sum',    v_d_wit,
        'plaintiff_objection_delta', v_p_obj,
        'defendant_objection_delta', v_d_obj,
        'plaintiff_jury_chaos',     CASE WHEN v_is_criminal THEN v_p_chaos END,
        'defendant_jury_chaos',     CASE WHEN v_is_criminal THEN v_d_chaos END,
        'plaintiff_rep_delta',      v_p_delta,
        'defendant_rep_delta',      v_d_delta,
        'winner_standing_delta',    1,
        'appeal_flipped',           CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN v_appeal_flipped END,
        'appellant_rep_delta',      CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN v_appellant_rep_delta END,
        'appellant_pc_delta',       CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN v_appellant_pc_delta END
    );
END $$;

-- ── 7. list_active_trials_for_advocate — include awaiting_hearing ──
-- Pressing Issues feed needs to surface SC trials in the queue so
-- the player sees their filed case. Adds awaiting_hearing to the
-- status filter and is_supreme_court to each row (chain-depth EXISTS
-- check) so the client can render the Supreme Court Case tag.
CREATE OR REPLACE FUNCTION public.list_active_trials_for_advocate(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_trials jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'trial_id',        t.id,
        'case_id',         t.case_draft_id,
        'case_type',       d.case_type,
        'litigation_type', d.litigation_type,
        'plaintiff_name',  t.plaintiff_name,
        'defendant_name',  t.defendant_name,
        'status',          t.status,
        'role',            CASE WHEN t.plaintiff_advocate_id = v_pol.id THEN 'plaintiff'
                                WHEN t.defendant_advocate_id = v_pol.id THEN 'defendant'
                                WHEN t.judge_faction_id      = v_pol.id THEN 'judge' END,
        'side',            CASE WHEN t.plaintiff_advocate_id = v_pol.id THEN 'plaintiff'
                                WHEN t.defendant_advocate_id = v_pol.id THEN 'defendant' END,
        'your_turn',       (t.current_turn = CASE WHEN t.plaintiff_advocate_id = v_pol.id THEN 'plaintiff'
                                                    WHEN t.defendant_advocate_id = v_pol.id THEN 'defendant' END),
        'current_round',   t.current_round,
        'own_settlement_decision', CASE WHEN t.plaintiff_advocate_id = v_pol.id THEN t.plaintiff_settlement_decision
                                          WHEN t.defendant_advocate_id = v_pol.id THEN t.defendant_settlement_decision END,
        'pending_objection', t.pending_objection_message_id IS NOT NULL,
        'awaiting_verdict',  t.awaiting_verdict,
        'is_supreme_court',  (
            t.appeal_of_trial_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.court_case_trials parent
                 WHERE parent.id = t.appeal_of_trial_id
                   AND parent.appeal_of_trial_id IS NOT NULL
            )
        )
    ) ORDER BY t.matched_at_tick ASC NULLS LAST), '[]'::jsonb)
      INTO v_trials
      FROM public.court_case_trials t
      JOIN public.court_case_drafts d ON d.id = t.case_draft_id
     WHERE t.status IN ('in_progress', 'settlement_conference', 'awaiting_hearing')
       AND (t.plaintiff_advocate_id = v_pol.id
            OR t.defendant_advocate_id = v_pol.id
            OR t.judge_faction_id      = v_pol.id);

    RETURN jsonb_build_object('success', true, 'trials', v_trials);
END $$;

-- ── 8. Data migration: rescue stuck Phase 1 SC trials ─────────────
-- Phase 1 forced SC trial status to 'pre_trial' even when the state
-- auto-fill seated the appellee — meaning trials with both seats
-- filled were stranded at pre_trial with no path forward (both_sides_
-- filled rejected by represent_pretrial; not picked up by the queue
-- which filters on awaiting_hearing). Normalize them here so the
-- queue can pick them up on the next activation.
UPDATE public.court_case_trials t
   SET status = 'awaiting_hearing'
 WHERE t.status = 'pre_trial'
   AND t.plaintiff_advocate_id IS NOT NULL
   AND t.defendant_advocate_id IS NOT NULL
   AND t.appeal_of_trial_id IS NOT NULL
   AND EXISTS (
       SELECT 1 FROM public.court_case_trials p
        WHERE p.id = t.appeal_of_trial_id
          AND p.appeal_of_trial_id IS NOT NULL
   );

NOTIFY pgrst, 'reload schema';

COMMIT;
