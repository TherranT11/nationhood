-- ════════════════════════════════════════════════════════════════════
-- 20270536 — Player Magistrate as Judge of trials
--
-- A trial in a nation that has a player Magistrate (Judiciary Tier 4,
-- 20270531) gets a judge auto-assigned when both counsels commit
-- (settlement-conference flip). The judge:
--
--   • SEES the trial bench-side — get_trial_state reveals beat
--     strengths + witness QA strengths to the judge (lawyers still
--     never see opponent strengths).
--   • RULES objections manually. With a judge assigned, send_objection
--     no longer rolls 1d10 — it sets a pending_objection state on
--     the trial. All action RPCs (send_trial_message, send_objection,
--     call_witness_qa, end_turn) reject with 'objection_pending'
--     until the judge calls judge_rule_objection with sustain /
--     overrule. The dice fallback stays for trials with no judge
--     (nation has no Magistrate).
--   • ENTERS the verdict manually. At the close of defendant's
--     round-4 turn, the trial flips to awaiting_verdict instead of
--     auto-firing _apply_verdict. The judge clicks ENTER VERDICT to
--     finalise. No-judge trials still auto-fire at round 4 close.
--
-- 5-tick inactivity reassignment. judge_last_action_at_tick is set
-- on assignment and bumped on every judge action (rule, verdict —
-- speak comes later). resolve_due_judge_timeouts() sweeps assigned
-- judges past the 5-tick window and rotates to the next least-busy
-- Magistrate (excluding the current one + both counsels). If no
-- substitute exists, the trial falls back to no-judge mode (dice +
-- auto-verdict). politician-home bootstrap calls the sweep on every
-- load so the docket keeps moving without a dedicated tick processor.
--
-- Assignment algorithm. _assign_magistrate_to_trial picks the
-- Magistrate in the trial's nation with the FEWEST active (in-progress
-- or settlement-conference) trials as judge, breaking ties at
-- random. Excludes the current judge (on reassignment) and both
-- counsels (can't judge their own case).
--
-- Ships:
--   • court_case_trials columns: judge_faction_id, judge_assigned_at_tick,
--     judge_last_action_at_tick, pending_objection_message_id,
--     awaiting_verdict.
--   • Trial messages.kind CHECK widened with 'judge_speech' (kept for
--     the next-phase Speak From The Bench UI — not yet used, but
--     reserving the kind value avoids a follow-up ALTER).
--   • _assign_magistrate_to_trial helper.
--   • represent_pretrial v4 — assigns judge on SC flip.
--   • send_objection v4 — pending state when judge present.
--   • send_trial_message v4, end_turn v3, call_witness_qa v3 —
--     pending-objection check on every action; defendant-round-4 close
--     defers verdict to judge when present.
--   • judge_rule_objection — sustain/overrule the pending objection.
--   • judge_enter_verdict — fires _apply_verdict manually.
--   • resolve_due_judge_timeouts — sweep + reassign inactive judges.
--   • get_trial_state v6 — allow judge as caller, reveal strengths to
--     them, surface judge identity + pending_objection + awaiting_verdict.
--   • list_active_trials_for_advocate v3 — surfaces trials the caller
--     is judging (role='judge') alongside their advocate trials.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema additions ────────────────────────────────────────────
ALTER TABLE public.court_case_trials
    ADD COLUMN IF NOT EXISTS judge_faction_id            uuid REFERENCES public.factions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS judge_assigned_at_tick      int,
    ADD COLUMN IF NOT EXISTS judge_last_action_at_tick   int,
    ADD COLUMN IF NOT EXISTS pending_objection_message_id uuid REFERENCES public.court_case_trial_messages(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS awaiting_verdict            boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_trials_judge_faction
    ON public.court_case_trials (judge_faction_id)
    WHERE judge_faction_id IS NOT NULL;

COMMENT ON COLUMN public.court_case_trials.judge_faction_id IS
    'Player Magistrate assigned to preside. NULL = no Magistrate available in nation → dice fallback for objections, auto-verdict at round 4.';
COMMENT ON COLUMN public.court_case_trials.judge_last_action_at_tick IS
    'Most recent tick at which the judge acted (assignment counts as initial action). resolve_due_judge_timeouts reassigns when current_tick - this > 5.';
COMMENT ON COLUMN public.court_case_trials.pending_objection_message_id IS
    'When non-null, an objection is awaiting the judge''s ruling. All action RPCs reject with objection_pending. judge_rule_objection clears it.';
COMMENT ON COLUMN public.court_case_trials.awaiting_verdict IS
    'Set true at the close of defendant''s round-4 turn when a judge is assigned. judge_enter_verdict fires _apply_verdict and clears.';

-- Widen kind CHECK for the (next-phase) Speak From The Bench message.
ALTER TABLE public.court_case_trial_messages
    DROP CONSTRAINT IF EXISTS court_case_trial_messages_kind_check;
ALTER TABLE public.court_case_trial_messages
    ADD CONSTRAINT court_case_trial_messages_kind_check
    CHECK (kind IN ('argument', 'objection', 'settle_offer', 'settle_response',
                    'judge_note', 'verdict', 'judge_ruling',
                    'witness_q', 'witness_a',
                    'settlement_offer', 'settlement_outcome',
                    'judge_speech'));

-- ── 2. _assign_magistrate_to_trial helper ──────────────────────────
-- Picks the least-busy Magistrate in the trial's nation, excluding
-- (a) the current judge if any (used by reassignment after timeout),
-- (b) both counsels (a Magistrate who is also counsel here can't be
-- their own judge). Sets judge_faction_id + judge_assigned_at_tick +
-- judge_last_action_at_tick. Returns the assigned faction id, or
-- NULL if no eligible Magistrate exists (caller falls back).
CREATE OR REPLACE FUNCTION public._assign_magistrate_to_trial(
    p_trial_id            uuid,
    p_exclude_faction_id  uuid DEFAULT NULL
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

    SELECT m.id INTO v_chosen_id
      FROM public.factions m
      LEFT JOIN public.court_case_trials t
        ON t.judge_faction_id = m.id
       AND t.status IN ('in_progress', 'settlement_conference')
       AND t.id <> p_trial_id
     WHERE m.politician_magistrate_at_tick IS NOT NULL
       AND m.abandoned_at IS NULL
       AND m.faction_type = 'politician'
       AND m.nation_id = v_trial.nation_id
       AND m.id IS DISTINCT FROM p_exclude_faction_id
       AND m.id IS DISTINCT FROM v_trial.plaintiff_advocate_id
       AND m.id IS DISTINCT FROM v_trial.defendant_advocate_id
     GROUP BY m.id
     ORDER BY COUNT(t.id) ASC, random() ASC
     LIMIT 1;

    UPDATE public.court_case_trials
       SET judge_faction_id          = v_chosen_id,
           judge_assigned_at_tick    = COALESCE(v_tick, 0),
           judge_last_action_at_tick = COALESCE(v_tick, 0)
     WHERE id = p_trial_id;

    RETURN v_chosen_id;
END $$;

-- ── 3. represent_pretrial v4 — assign judge on SC flip ─────────────
CREATE OR REPLACE FUNCTION public.represent_pretrial(
    p_faction_id uuid,
    p_trial_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_trial     court_case_trials%ROWTYPE;
    v_tick      int;
    v_open_side text;
    v_decision  text;
    v_inserted  int;
    v_judge_id  uuid;
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
        v_open_side := 'plaintiff';
    ELSIF v_trial.defendant_advocate_id IS NULL THEN
        v_open_side := 'defendant';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'both_sides_filled');
    END IF;

    v_decision := CASE WHEN v_open_side = 'plaintiff'
                         THEN 'representing_plaintiff'
                       ELSE 'representing_defendant' END;

    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, v_trial.case_draft_id, v_decision)
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
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

    -- Auto-assign a player Magistrate now that both counsels are in.
    -- NULL is acceptable (dice fallback for the whole trial).
    v_judge_id := public._assign_magistrate_to_trial(p_trial_id);

    -- Judge's opening prompt + (if assigned) bench introduction.
    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, 'system', 0, 0,
        'The court is convened. Before motions and argument, are either of you willing to discuss settlement?',
        'judge_note'
    );

    RETURN jsonb_build_object(
        'success',         true,
        'decision',        v_decision,
        'side',            v_open_side,
        'trial_id',        p_trial_id,
        'case_id',         v_trial.case_draft_id,
        'trial_status',    'settlement_conference',
        'matched_at_tick', v_tick,
        'judge_assigned',  v_judge_id IS NOT NULL,
        'judge_faction_id', v_judge_id
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.represent_pretrial(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.represent_pretrial(uuid, uuid) TO authenticated;

-- ── 4. send_objection v4 — pending state when judge present ────────
-- Same gates as 20270525. With a judge assigned, skip the dice and
-- set pending_objection_message_id; the judge rules later via
-- judge_rule_objection. With no judge assigned, keep the 1d10 +
-- immediate effects flow.
CREATE OR REPLACE FUNCTION public.send_objection(
    p_faction_id  uuid,
    p_trial_id    uuid,
    p_beat_index  int,
    p_text        text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_trial        court_case_trials%ROWTYPE;
    v_case         court_case_drafts%ROWTYPE;
    v_side         text;
    v_opp_side     text;
    v_beat_support text;
    v_beat_in_hand int;
    v_used         int;
    v_clean_text   text;
    v_roll         int;
    v_sustained    boolean;
    v_judge_text   text;
    v_target_idx   int;
    v_next_seq     int;
    v_new_count    int;
    v_flipped      boolean := false;
    v_verdict      jsonb := NULL;
    v_tick         int;
    v_msg_id       uuid;
    v_has_judge    boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL OR p_beat_index IS NULL THEN
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

    SELECT * INTO v_trial FROM public.court_case_trials
     WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'in_progress' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_active');
    END IF;
    IF v_trial.pending_objection_message_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'objection_pending');
    END IF;

    IF v_trial.plaintiff_advocate_id = v_pol.id THEN
        v_side := 'plaintiff'; v_opp_side := 'defendant';
    ELSIF v_trial.defendant_advocate_id = v_pol.id THEN
        v_side := 'defendant'; v_opp_side := 'plaintiff';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_trial');
    END IF;
    IF v_trial.current_turn <> v_side THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_turn');
    END IF;
    IF v_trial.messages_sent_this_turn >= 4 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'turn_message_cap');
    END IF;

    v_used := CASE WHEN v_side = 'plaintiff' THEN v_trial.plaintiff_objections_used
                                              ELSE v_trial.defendant_objections_used END;
    IF v_used >= 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'objection_cap_reached');
    END IF;

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;
    v_beat_support := v_case.beats -> p_beat_index ->> 'support';
    IF v_beat_support IS DISTINCT FROM v_opp_side THEN
        RETURN jsonb_build_object('success', false, 'reason', 'beat_not_objection_material');
    END IF;
    SELECT 1 INTO v_beat_in_hand
      FROM public.court_case_trial_hands
     WHERE trial_id = p_trial_id
       AND side = v_side
       AND beat_index = p_beat_index
       AND played_at_round IS NULL
       AND objected_at_round IS NULL;
    IF v_beat_in_hand IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'beat_not_in_hand');
    END IF;

    SELECT h.beat_index INTO v_target_idx
      FROM public.court_case_trial_hands h
      JOIN public.court_case_trial_messages m
        ON m.trial_id = h.trial_id
       AND m.side     = h.side
       AND m.beat_played_index = h.beat_index
     WHERE h.trial_id = p_trial_id
       AND h.side     = v_opp_side
       AND h.played_at_round IS NOT NULL
       AND h.nullified = false
     ORDER BY m.created_at DESC
     LIMIT 1;
    IF v_target_idx IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_objection_target');
    END IF;

    -- Consume ammo + bump objection counter regardless of path. The
    -- lawyer's committed; the dice / judge ruling decides outcome.
    UPDATE public.court_case_trial_hands
       SET objected_at_round = v_trial.current_round
     WHERE trial_id = p_trial_id AND side = v_side AND beat_index = p_beat_index;

    IF v_side = 'plaintiff' THEN
        UPDATE public.court_case_trials SET plaintiff_objections_used = plaintiff_objections_used + 1
         WHERE id = p_trial_id;
    ELSE
        UPDATE public.court_case_trials SET defendant_objections_used = defendant_objections_used + 1
         WHERE id = p_trial_id;
    END IF;

    v_clean_text := btrim(COALESCE(p_text, ''));
    IF length(v_clean_text) = 0 THEN
        v_clean_text := 'Objection, your Honor.';
    END IF;
    IF length(v_clean_text) > 240 THEN
        v_clean_text := substring(v_clean_text from 1 for 240);
    END IF;

    -- Counsel's objection (always consumes the action slot).
    v_next_seq := v_trial.messages_sent_this_turn + 1;
    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind,
        beat_played_index, objected_beat_index
    ) VALUES (
        p_trial_id, v_side, v_trial.current_round, v_next_seq,
        v_clean_text, 'objection',
        p_beat_index, v_target_idx
    ) RETURNING id INTO v_msg_id;

    v_has_judge := v_trial.judge_faction_id IS NOT NULL;

    IF v_has_judge THEN
        -- Pause the trial for the judge. No dice, no effects yet.
        -- Action slot still consumed (it cost the lawyer their slot
        -- to raise the objection).
        UPDATE public.court_case_trials
           SET pending_objection_message_id = v_msg_id,
               messages_sent_this_turn      = v_next_seq
         WHERE id = p_trial_id;

        RETURN jsonb_build_object(
            'success',              true,
            'side',                 v_side,
            'consumed_beat_index',  p_beat_index,
            'target_beat_index',    v_target_idx,
            'pending_judge_ruling', true,
            'objections_used',      v_used + 1,
            'objections_remaining', 3 - (v_used + 1)
        );
    END IF;

    -- No judge: existing 1d10 path. 1-5 sustained, 6-10 overruled.
    v_roll      := 1 + floor(random() * 10)::int;
    v_sustained := v_roll <= 5;

    IF v_sustained THEN
        v_judge_text := 'Objection sustained.';
        UPDATE public.court_case_trial_hands
           SET nullified = true
         WHERE trial_id = p_trial_id AND side = v_opp_side AND beat_index = v_target_idx;
        IF v_opp_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET plaintiff_objection_strength_delta = plaintiff_objection_strength_delta - 3
             WHERE id = p_trial_id;
        ELSE
            UPDATE public.court_case_trials
               SET defendant_objection_strength_delta = defendant_objection_strength_delta - 3
             WHERE id = p_trial_id;
        END IF;
    ELSE
        v_judge_text := 'Objection overruled.';
        IF v_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET plaintiff_objection_strength_delta = plaintiff_objection_strength_delta - 3
             WHERE id = p_trial_id;
        ELSE
            UPDATE public.court_case_trials
               SET defendant_objection_strength_delta = defendant_objection_strength_delta - 3
             WHERE id = p_trial_id;
        END IF;
    END IF;

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, 'system', v_trial.current_round, 0,
        v_judge_text, 'judge_ruling'
    );

    -- Turn-flip / verdict-trigger.
    v_new_count := v_next_seq;
    IF v_new_count >= 4 THEN
        IF v_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET current_turn = 'defendant',
                   messages_sent_this_turn = 0
             WHERE id = p_trial_id;
            v_flipped := true;
        ELSE
            IF v_trial.current_round < 4 THEN
                UPDATE public.court_case_trials
                   SET current_turn  = 'plaintiff',
                       current_round = v_trial.current_round + 1,
                       messages_sent_this_turn = 0
                 WHERE id = p_trial_id;
                v_flipped := true;
            ELSE
                UPDATE public.court_case_trials
                   SET messages_sent_this_turn = 0
                 WHERE id = p_trial_id;
                SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
                v_verdict := public._apply_verdict(p_trial_id, COALESCE(v_tick, 0));
                v_flipped := true;
            END IF;
        END IF;
    ELSE
        UPDATE public.court_case_trials
           SET messages_sent_this_turn = v_new_count
         WHERE id = p_trial_id;
    END IF;

    RETURN jsonb_build_object(
        'success',              true,
        'side',                 v_side,
        'consumed_beat_index',  p_beat_index,
        'target_beat_index',    v_target_idx,
        'nullified_beat_index', CASE WHEN v_sustained THEN v_target_idx END,
        'roll',                 v_roll,
        'sustained',            v_sustained,
        'ruling_text',          v_judge_text,
        'objections_used',      v_used + 1,
        'objections_remaining', 3 - (v_used + 1),
        'flipped',              v_flipped,
        'verdict',              v_verdict
    );
END $$;

-- ── 5. judge_rule_objection ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.judge_rule_objection(
    p_faction_id uuid,
    p_trial_id   uuid,
    p_ruling     text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_trial     court_case_trials%ROWTYPE;
    v_msg       court_case_trial_messages%ROWTYPE;
    v_obj_side  text;
    v_opp_side  text;
    v_target    int;
    v_tick      int;
    v_text      text;
    v_sustained boolean;
    v_new_count int;
    v_flipped   boolean := false;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL OR p_ruling IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;
    IF p_ruling NOT IN ('sustain', 'overrule') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_ruling');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_trial FROM public.court_case_trials
     WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.judge_faction_id IS NULL OR v_trial.judge_faction_id <> v_pol.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_the_judge');
    END IF;
    IF v_trial.pending_objection_message_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_pending_objection');
    END IF;

    SELECT * INTO v_msg FROM public.court_case_trial_messages
     WHERE id = v_trial.pending_objection_message_id;
    IF v_msg.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'pending_message_missing');
    END IF;

    v_obj_side := v_msg.side;
    v_opp_side := CASE WHEN v_obj_side = 'plaintiff' THEN 'defendant' ELSE 'plaintiff' END;
    v_target   := v_msg.objected_beat_index;
    v_sustained := p_ruling = 'sustain';
    v_text     := CASE WHEN v_sustained THEN 'Objection sustained.' ELSE 'Objection overruled.' END;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    IF v_sustained THEN
        UPDATE public.court_case_trial_hands
           SET nullified = true
         WHERE trial_id = p_trial_id AND side = v_opp_side AND beat_index = v_target;
        IF v_opp_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET plaintiff_objection_strength_delta = plaintiff_objection_strength_delta - 3
             WHERE id = p_trial_id;
        ELSE
            UPDATE public.court_case_trials
               SET defendant_objection_strength_delta = defendant_objection_strength_delta - 3
             WHERE id = p_trial_id;
        END IF;
    ELSE
        IF v_obj_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET plaintiff_objection_strength_delta = plaintiff_objection_strength_delta - 3
             WHERE id = p_trial_id;
        ELSE
            UPDATE public.court_case_trials
               SET defendant_objection_strength_delta = defendant_objection_strength_delta - 3
             WHERE id = p_trial_id;
        END IF;
    END IF;

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, 'system', v_trial.current_round, 0,
        v_text, 'judge_ruling'
    );

    -- Clear pending + bump judge's last-action tick. Turn-flip /
    -- verdict trigger now runs since the action slot was already
    -- consumed by send_objection.
    UPDATE public.court_case_trials
       SET pending_objection_message_id = NULL,
           judge_last_action_at_tick    = COALESCE(v_tick, judge_last_action_at_tick, 0)
     WHERE id = p_trial_id;

    v_new_count := v_trial.messages_sent_this_turn;
    IF v_new_count >= 4 THEN
        IF v_obj_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET current_turn = 'defendant',
                   messages_sent_this_turn = 0
             WHERE id = p_trial_id;
            v_flipped := true;
        ELSE
            IF v_trial.current_round < 4 THEN
                UPDATE public.court_case_trials
                   SET current_turn  = 'plaintiff',
                       current_round = v_trial.current_round + 1,
                       messages_sent_this_turn = 0
                 WHERE id = p_trial_id;
                v_flipped := true;
            ELSE
                -- End of trial → judge enters verdict manually.
                UPDATE public.court_case_trials
                   SET messages_sent_this_turn = 0,
                       awaiting_verdict        = true
                 WHERE id = p_trial_id;
                v_flipped := true;
            END IF;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success',   true,
        'ruling',    p_ruling,
        'sustained', v_sustained,
        'flipped',   v_flipped
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.judge_rule_objection(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.judge_rule_objection(uuid, uuid, text) TO authenticated;

-- ── 6. judge_enter_verdict ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.judge_enter_verdict(
    p_faction_id uuid,
    p_trial_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_trial   court_case_trials%ROWTYPE;
    v_tick    int;
    v_verdict jsonb;
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
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_trial FROM public.court_case_trials
     WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.judge_faction_id IS NULL OR v_trial.judge_faction_id <> v_pol.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_the_judge');
    END IF;
    IF NOT v_trial.awaiting_verdict THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_awaiting_verdict');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    v_verdict := public._apply_verdict(p_trial_id, COALESCE(v_tick, 0));

    UPDATE public.court_case_trials
       SET judge_last_action_at_tick = COALESCE(v_tick, judge_last_action_at_tick, 0)
     WHERE id = p_trial_id;

    RETURN jsonb_build_object('success', true, 'verdict', v_verdict);
END $$;

REVOKE EXECUTE ON FUNCTION public.judge_enter_verdict(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.judge_enter_verdict(uuid, uuid) TO authenticated;

-- ── 7. resolve_due_judge_timeouts ───────────────────────────────────
-- Sweeps trials whose assigned judge has been silent for more than 5
-- ticks. Rotates each one to the next least-busy Magistrate (or NULL
-- if none available — dice fallback then). Idempotent. Called by
-- politician-home bootstrap.
CREATE OR REPLACE FUNCTION public.resolve_due_judge_timeouts()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick    int;
    v_row     record;
    v_rotated int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'rotated', 0);
    END IF;

    FOR v_row IN
        SELECT id, judge_faction_id
          FROM public.court_case_trials
         WHERE status IN ('in_progress', 'settlement_conference')
           AND judge_faction_id IS NOT NULL
           AND COALESCE(judge_last_action_at_tick, 0) + 5 < v_tick
         FOR UPDATE SKIP LOCKED
    LOOP
        PERFORM public._assign_magistrate_to_trial(v_row.id, v_row.judge_faction_id);
        v_rotated := v_rotated + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'rotated', v_rotated);
END $$;

REVOKE EXECUTE ON FUNCTION public.resolve_due_judge_timeouts() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.resolve_due_judge_timeouts() TO authenticated;

-- ── 8. send_trial_message v4 / end_turn v3 / call_witness_qa v3 ────
-- Pending-objection check on every action; defer verdict to judge
-- when judge present at end of defendant's round-4 turn. To keep
-- this migration manageable, we reuse the existing function bodies
-- and inject the two new checks via re-issue.

-- send_trial_message body — same as 20270524 plus pending check +
-- verdict-defer. Note: 20270524 wasn't re-issued in this migration's
-- bench arc; this re-author copies the most recent version.
CREATE OR REPLACE FUNCTION public.send_trial_message(
    p_faction_id  uuid,
    p_trial_id    uuid,
    p_text        text,
    p_beat_index  int DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_trial        court_case_trials%ROWTYPE;
    v_case         court_case_drafts%ROWTYPE;
    v_side         text;
    v_clean_text   text;
    v_next_seq     int;
    v_new_count    int;
    v_flipped      boolean := false;
    v_beat_in_hand int;
    v_beat_support text;
    v_verdict      jsonb := NULL;
    v_tick         int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL OR p_text IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    v_clean_text := btrim(p_text);
    IF length(v_clean_text) = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'empty_text');
    END IF;
    IF length(v_clean_text) > 240 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'text_too_long');
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

    SELECT * INTO v_trial FROM public.court_case_trials
     WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'in_progress' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_active');
    END IF;
    IF v_trial.pending_objection_message_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'objection_pending');
    END IF;
    IF v_trial.awaiting_verdict THEN
        RETURN jsonb_build_object('success', false, 'reason', 'awaiting_verdict');
    END IF;

    IF v_trial.plaintiff_advocate_id = v_pol.id THEN
        v_side := 'plaintiff';
    ELSIF v_trial.defendant_advocate_id = v_pol.id THEN
        v_side := 'defendant';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_trial');
    END IF;
    IF v_trial.current_turn <> v_side THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_turn');
    END IF;
    IF v_trial.messages_sent_this_turn >= 4 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'turn_message_cap');
    END IF;

    IF p_beat_index IS NOT NULL THEN
        SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;
        v_beat_support := v_case.beats -> p_beat_index ->> 'support';
        IF v_beat_support IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_beat_index');
        END IF;
        IF v_beat_support <> v_side THEN
            RETURN jsonb_build_object('success', false, 'reason', 'beat_favours_opponent');
        END IF;
        SELECT 1 INTO v_beat_in_hand
          FROM public.court_case_trial_hands
         WHERE trial_id = p_trial_id
           AND side = v_side
           AND beat_index = p_beat_index
           AND played_at_round IS NULL
           AND objected_at_round IS NULL;
        IF v_beat_in_hand IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'beat_not_in_hand');
        END IF;
        PERFORM 1 FROM public.court_case_trial_hands
         WHERE trial_id = p_trial_id
           AND side = v_side
           AND played_at_round = v_trial.current_round;
        IF FOUND THEN
            RETURN jsonb_build_object('success', false, 'reason', 'beat_already_played_this_turn');
        END IF;
        UPDATE public.court_case_trial_hands
           SET played_at_round = v_trial.current_round
         WHERE trial_id = p_trial_id AND side = v_side AND beat_index = p_beat_index;
    END IF;

    v_next_seq := v_trial.messages_sent_this_turn + 1;
    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind, beat_played_index
    ) VALUES (
        p_trial_id, v_side, v_trial.current_round, v_next_seq,
        v_clean_text, 'argument', p_beat_index
    );

    v_new_count := v_next_seq;
    IF v_new_count >= 4 THEN
        IF v_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET current_turn = 'defendant',
                   messages_sent_this_turn = 0
             WHERE id = p_trial_id;
            v_flipped := true;
        ELSE
            IF v_trial.current_round < 4 THEN
                UPDATE public.court_case_trials
                   SET current_turn  = 'plaintiff',
                       current_round = v_trial.current_round + 1,
                       messages_sent_this_turn = 0
                 WHERE id = p_trial_id;
                v_flipped := true;
            ELSE
                -- End of trial. If a judge is presiding, defer the
                -- verdict to their manual click; otherwise auto-fire.
                IF v_trial.judge_faction_id IS NOT NULL THEN
                    UPDATE public.court_case_trials
                       SET messages_sent_this_turn = 0,
                           awaiting_verdict        = true
                     WHERE id = p_trial_id;
                    v_flipped := true;
                ELSE
                    UPDATE public.court_case_trials
                       SET messages_sent_this_turn = 0
                     WHERE id = p_trial_id;
                    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
                    v_verdict := public._apply_verdict(p_trial_id, COALESCE(v_tick, 0));
                    v_flipped := true;
                END IF;
            END IF;
        END IF;
    ELSE
        UPDATE public.court_case_trials
           SET messages_sent_this_turn = v_new_count
         WHERE id = p_trial_id;
    END IF;

    RETURN jsonb_build_object(
        'success',     true,
        'side',        v_side,
        'turn_seq',    v_next_seq,
        'beat_played', p_beat_index,
        'flipped',     v_flipped,
        'verdict',     v_verdict,
        'awaiting_verdict', v_trial.judge_faction_id IS NOT NULL
                            AND v_trial.current_round = 4
                            AND v_side = 'defendant'
                            AND v_new_count >= 4
    );
END $$;

-- end_turn v3: pending check + judge-defer at round-4 close.
CREATE OR REPLACE FUNCTION public.end_turn(
    p_faction_id uuid,
    p_trial_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_trial   court_case_trials%ROWTYPE;
    v_side    text;
    v_flipped boolean := false;
    v_verdict jsonb := NULL;
    v_tick    int;
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

    SELECT * INTO v_trial FROM public.court_case_trials
     WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'in_progress' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_active');
    END IF;
    IF v_trial.pending_objection_message_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'objection_pending');
    END IF;
    IF v_trial.awaiting_verdict THEN
        RETURN jsonb_build_object('success', false, 'reason', 'awaiting_verdict');
    END IF;

    IF v_trial.plaintiff_advocate_id = v_pol.id THEN
        v_side := 'plaintiff';
    ELSIF v_trial.defendant_advocate_id = v_pol.id THEN
        v_side := 'defendant';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_trial');
    END IF;
    IF v_trial.current_turn <> v_side THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_turn');
    END IF;

    IF v_side = 'plaintiff' THEN
        UPDATE public.court_case_trials
           SET current_turn = 'defendant',
               messages_sent_this_turn = 0
         WHERE id = p_trial_id;
        v_flipped := true;
    ELSE
        IF v_trial.current_round < 4 THEN
            UPDATE public.court_case_trials
               SET current_turn  = 'plaintiff',
                   current_round = v_trial.current_round + 1,
                   messages_sent_this_turn = 0
             WHERE id = p_trial_id;
            v_flipped := true;
        ELSE
            IF v_trial.judge_faction_id IS NOT NULL THEN
                UPDATE public.court_case_trials
                   SET messages_sent_this_turn = 0,
                       awaiting_verdict        = true
                 WHERE id = p_trial_id;
                v_flipped := true;
            ELSE
                UPDATE public.court_case_trials
                   SET messages_sent_this_turn = 0
                 WHERE id = p_trial_id;
                SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
                v_verdict := public._apply_verdict(p_trial_id, COALESCE(v_tick, 0));
                v_flipped := true;
            END IF;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 'flipped', v_flipped, 'verdict', v_verdict
    );
END $$;

-- call_witness_qa v3: pending-objection check (rest unchanged from 20270526).
CREATE OR REPLACE FUNCTION public.call_witness_qa(
    p_faction_id    uuid,
    p_trial_id      uuid,
    p_witness_idx   int,
    p_phase         text,
    p_qa_idx        int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_trial         court_case_trials%ROWTYPE;
    v_case          court_case_drafts%ROWTYPE;
    v_side          text;
    v_witness       jsonb;
    v_qa            jsonb;
    v_question      text;
    v_answer        text;
    v_supports      text;
    v_strength      int;
    v_req_beat      int;
    v_in_evidence   int;
    v_witness_name  text;
    v_next_seq      int;
    v_new_count     int;
    v_flipped       boolean := false;
    v_verdict       jsonb := NULL;
    v_tick          int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL OR p_witness_idx IS NULL
       OR p_phase IS NULL OR p_qa_idx IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;
    IF p_phase NOT IN ('direct', 'cross') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_phase');
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

    SELECT * INTO v_trial FROM public.court_case_trials
     WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'in_progress' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_active');
    END IF;
    IF v_trial.pending_objection_message_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'objection_pending');
    END IF;
    IF v_trial.awaiting_verdict THEN
        RETURN jsonb_build_object('success', false, 'reason', 'awaiting_verdict');
    END IF;

    IF v_trial.plaintiff_advocate_id = v_pol.id THEN
        v_side := 'plaintiff';
    ELSIF v_trial.defendant_advocate_id = v_pol.id THEN
        v_side := 'defendant';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_trial');
    END IF;
    IF v_trial.current_turn <> v_side THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_turn');
    END IF;
    IF v_trial.messages_sent_this_turn >= 4 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'turn_message_cap');
    END IF;

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;
    v_witness := v_case.witnesses -> p_witness_idx;
    IF v_witness IS NULL OR jsonb_typeof(v_witness) <> 'object' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'witness_not_found');
    END IF;
    v_witness_name := COALESCE(NULLIF(btrim(v_trial.witness_names ->> p_witness_idx), ''), 'Witness');
    v_qa := v_witness -> p_phase -> p_qa_idx;
    IF v_qa IS NULL OR jsonb_typeof(v_qa) <> 'object' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'qa_not_found');
    END IF;

    PERFORM 1 FROM public.court_case_trial_witness_qa
     WHERE trial_id = p_trial_id
       AND witness_index = p_witness_idx
       AND phase = p_phase
       AND qa_index = p_qa_idx;
    IF FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'qa_already_asked');
    END IF;

    v_req_beat := NULLIF(v_qa ->> 'requires_beat', '')::int;
    IF v_req_beat IS NOT NULL THEN
        SELECT 1 INTO v_in_evidence
          FROM public.court_case_trial_hands
         WHERE trial_id = p_trial_id
           AND beat_index = v_req_beat
           AND played_at_round IS NOT NULL
         LIMIT 1;
        IF v_in_evidence IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'requires_beat_not_in_evidence',
                'requires_beat', v_req_beat);
        END IF;
    END IF;

    v_question := COALESCE(v_qa ->> 'question', '');
    v_answer   := COALESCE(v_qa ->> 'answer', '');
    v_supports := COALESCE(v_qa ->> 'supports', '');
    v_strength := COALESCE(NULLIF(v_qa ->> 'strength', '')::int, 0);
    IF length(v_question) > 240 THEN v_question := substring(v_question from 1 for 240); END IF;
    IF length(v_answer)   > 240 THEN v_answer   := substring(v_answer   from 1 for 240); END IF;
    IF v_supports NOT IN ('plaintiff','defendant') OR v_strength <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'qa_data_invalid');
    END IF;

    INSERT INTO public.court_case_trial_witness_qa (
        trial_id, witness_index, phase, qa_index,
        asked_at_round, asked_by_side, strength, supports
    ) VALUES (
        p_trial_id, p_witness_idx, p_phase, p_qa_idx,
        v_trial.current_round, v_side, v_strength, v_supports
    );

    v_next_seq := v_trial.messages_sent_this_turn + 1;
    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, v_side, v_trial.current_round, v_next_seq,
        'Q: ' || v_question, 'witness_q'
    );
    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, 'system', v_trial.current_round, 0,
        v_witness_name || ': ' || v_answer, 'witness_a'
    );

    v_new_count := v_next_seq;
    IF v_new_count >= 4 THEN
        IF v_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET current_turn = 'defendant', messages_sent_this_turn = 0
             WHERE id = p_trial_id;
            v_flipped := true;
        ELSE
            IF v_trial.current_round < 4 THEN
                UPDATE public.court_case_trials
                   SET current_turn = 'plaintiff',
                       current_round = v_trial.current_round + 1,
                       messages_sent_this_turn = 0
                 WHERE id = p_trial_id;
                v_flipped := true;
            ELSE
                IF v_trial.judge_faction_id IS NOT NULL THEN
                    UPDATE public.court_case_trials
                       SET messages_sent_this_turn = 0, awaiting_verdict = true
                     WHERE id = p_trial_id;
                    v_flipped := true;
                ELSE
                    UPDATE public.court_case_trials
                       SET messages_sent_this_turn = 0
                     WHERE id = p_trial_id;
                    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
                    v_verdict := public._apply_verdict(p_trial_id, COALESCE(v_tick, 0));
                    v_flipped := true;
                END IF;
            END IF;
        END IF;
    ELSE
        UPDATE public.court_case_trials
           SET messages_sent_this_turn = v_new_count
         WHERE id = p_trial_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 'side', v_side, 'witness_index', p_witness_idx,
        'phase', p_phase, 'qa_index', p_qa_idx, 'supports', v_supports,
        'flipped', v_flipped, 'verdict', v_verdict
    );
END $$;

-- ── 9. get_trial_state v6 — judge access + strength reveal ─────────
CREATE OR REPLACE FUNCTION public.get_trial_state(p_faction_id uuid, p_trial_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_trial     court_case_trials%ROWTYPE;
    v_case      court_case_drafts%ROWTYPE;
    v_role      text;          -- 'plaintiff' | 'defendant' | 'judge'
    v_side      text;          -- caller's advocacy side or NULL when judge
    v_opp_id    uuid;
    v_opp_name  text;
    v_judge_name text;
    v_hand      jsonb;
    v_case_beats jsonb;
    v_messages  jsonb;
    v_witnesses jsonb;
    v_asked_qa  jsonb;
    v_evidence  jsonb;
    v_obj_used  int;
    v_reveal    boolean;
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
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_trial FROM public.court_case_trials WHERE id = p_trial_id;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status NOT IN ('in_progress', 'settlement_conference') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_active',
            'status', v_trial.status, 'verdict_winner', v_trial.verdict_winner);
    END IF;

    IF v_trial.plaintiff_advocate_id = v_pol.id THEN
        v_role := 'plaintiff'; v_side := 'plaintiff'; v_opp_id := v_trial.defendant_advocate_id;
        v_obj_used := v_trial.plaintiff_objections_used;
    ELSIF v_trial.defendant_advocate_id = v_pol.id THEN
        v_role := 'defendant'; v_side := 'defendant'; v_opp_id := v_trial.plaintiff_advocate_id;
        v_obj_used := v_trial.defendant_objections_used;
    ELSIF v_trial.judge_faction_id = v_pol.id THEN
        v_role := 'judge'; v_side := NULL;
        v_obj_used := 0;
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_trial');
    END IF;

    -- Strength reveal: judges see everything; lawyers see nothing
    -- about opponent strengths (own hand strength still hidden, per
    -- the original lawyer convention — 20270526).
    v_reveal := v_role = 'judge';

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;
    IF v_case.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_found');
    END IF;

    IF v_opp_id IS NOT NULL THEN
        SELECT btrim(COALESCE(leader_first_name, '') || ' ' || COALESCE(leader_last_name, ''))
          INTO v_opp_name FROM public.factions WHERE id = v_opp_id;
    END IF;
    IF v_trial.judge_faction_id IS NOT NULL THEN
        SELECT btrim(COALESCE(leader_first_name, '') || ' ' || COALESCE(leader_last_name, ''))
          INTO v_judge_name FROM public.factions WHERE id = v_trial.judge_faction_id;
    END IF;

    -- Hand: judges get both sides' hands with strength revealed.
    -- Lawyers get only their own side, strength hidden.
    IF v_role = 'judge' THEN
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'beat_index',        h.beat_index,
            'side',              h.side,
            'name',              v_case.beats -> h.beat_index ->> 'name',
            'type',              v_case.beats -> h.beat_index ->> 'type',
            'description',       v_case.beats -> h.beat_index ->> 'description',
            'support',           v_case.beats -> h.beat_index ->> 'support',
            'strength',          (v_case.beats -> h.beat_index ->> 'strength')::int,
            'played_at_round',   h.played_at_round,
            'objected_at_round', h.objected_at_round,
            'nullified',         h.nullified
        ) ORDER BY h.side, h.beat_index), '[]'::jsonb)
          INTO v_hand
          FROM public.court_case_trial_hands h
         WHERE h.trial_id = p_trial_id;
    ELSE
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'beat_index',        h.beat_index,
            'name',              v_case.beats -> h.beat_index ->> 'name',
            'type',              v_case.beats -> h.beat_index ->> 'type',
            'description',       v_case.beats -> h.beat_index ->> 'description',
            'support',           v_case.beats -> h.beat_index ->> 'support',
            'played_at_round',   h.played_at_round,
            'objected_at_round', h.objected_at_round,
            'nullified',         h.nullified
        ) ORDER BY h.beat_index), '[]'::jsonb)
          INTO v_hand
          FROM public.court_case_trial_hands h
         WHERE h.trial_id = p_trial_id AND h.side = v_side;
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'beat_index', (ord - 1)::int,
        'name',       b ->> 'name',
        'type',       b ->> 'type',
        'strength',   CASE WHEN v_reveal THEN (b ->> 'strength')::int END,
        'support',    CASE WHEN v_reveal THEN b ->> 'support' END
    ) ORDER BY ord), '[]'::jsonb)
      INTO v_case_beats
      FROM jsonb_array_elements(COALESCE(v_case.beats, '[]'::jsonb))
          WITH ORDINALITY arr_b(b, ord);

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id',                m.id,
        'side',              m.side,
        'round',             m.round,
        'turn_seq',          m.turn_seq,
        'text',              m.text,
        'kind',              m.kind,
        'beat_played_index', m.beat_played_index,
        'beat_name',         CASE WHEN m.beat_played_index IS NOT NULL
                                  THEN v_case.beats -> m.beat_played_index ->> 'name' END,
        'beat_type',         CASE WHEN m.beat_played_index IS NOT NULL
                                  THEN v_case.beats -> m.beat_played_index ->> 'type' END,
        'beat_strength',     CASE WHEN m.beat_played_index IS NOT NULL AND v_reveal
                                  THEN (v_case.beats -> m.beat_played_index ->> 'strength')::int END,
        'objected_beat_index', m.objected_beat_index,
        'settle_decision',   m.settle_decision,
        'created_at',        m.created_at
    ) ORDER BY m.created_at ASC), '[]'::jsonb)
      INTO v_messages
      FROM public.court_case_trial_messages m
     WHERE m.trial_id = p_trial_id;

    SELECT COALESCE(jsonb_agg(witness_obj ORDER BY w_idx), '[]'::jsonb)
      INTO v_witnesses
      FROM (
        SELECT
            (ord_w - 1)::int AS w_idx,
            jsonb_build_object(
                'witness_index', (ord_w - 1)::int,
                'name',          COALESCE(NULLIF(btrim(v_trial.witness_names ->> ((ord_w - 1)::int)), ''),
                                          'Witness'),
                'gender',        w ->> 'gender',
                'description',   w ->> 'description',
                'direct', (
                    SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'qa_index',      (ord_q - 1)::int,
                        'question',      q ->> 'question',
                        'requires_beat', NULLIF(q ->> 'requires_beat', '')::int
                    ) ORDER BY ord_q), '[]'::jsonb)
                    FROM jsonb_array_elements(COALESCE(w -> 'direct', '[]'::jsonb))
                        WITH ORDINALITY arr_q(q, ord_q)
                ),
                'cross', (
                    SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'qa_index',      (ord_q - 1)::int,
                        'question',      q ->> 'question',
                        'requires_beat', NULLIF(q ->> 'requires_beat', '')::int
                    ) ORDER BY ord_q), '[]'::jsonb)
                    FROM jsonb_array_elements(COALESCE(w -> 'cross', '[]'::jsonb))
                        WITH ORDINALITY arr_q(q, ord_q)
                )
            ) AS witness_obj
        FROM jsonb_array_elements(COALESCE(v_case.witnesses, '[]'::jsonb))
            WITH ORDINALITY arr_w(w, ord_w)
      ) sub;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'witness_index',  q.witness_index,
        'phase',          q.phase,
        'qa_index',       q.qa_index,
        'asked_by_side',  q.asked_by_side,
        'asked_at_round', q.asked_at_round,
        'supports',       q.supports,
        'strength',       q.strength
    )), '[]'::jsonb)
      INTO v_asked_qa
      FROM public.court_case_trial_witness_qa q
     WHERE q.trial_id = p_trial_id;

    SELECT COALESCE(jsonb_agg(h.beat_index ORDER BY h.beat_index), '[]'::jsonb)
      INTO v_evidence
      FROM public.court_case_trial_hands h
     WHERE h.trial_id = p_trial_id
       AND h.played_at_round IS NOT NULL;

    RETURN jsonb_build_object(
        'success',                 true,
        'trial_id',                p_trial_id,
        'case_id',                 v_case.id,
        'case_type',               v_case.case_type,
        'litigation_type',         v_case.litigation_type,
        'overview',                v_case.overview,
        'plaintiff_name',          v_trial.plaintiff_name,
        'defendant_name',          v_trial.defendant_name,
        'role',                    v_role,
        'side',                    v_side,
        'opponent_name',           COALESCE(NULLIF(v_opp_name, ''), 'Opposing Counsel'),
        'judge_faction_id',        v_trial.judge_faction_id,
        'judge_name',              COALESCE(NULLIF(v_judge_name, ''), CASE WHEN v_trial.judge_faction_id IS NOT NULL THEN 'Presiding Magistrate' END),
        'pending_objection_message_id', v_trial.pending_objection_message_id,
        'awaiting_verdict',        v_trial.awaiting_verdict,
        'current_round',           v_trial.current_round,
        'current_turn',            v_trial.current_turn,
        'your_turn',               v_role IN ('plaintiff','defendant') AND v_trial.current_turn = v_side,
        'messages_sent_this_turn', v_trial.messages_sent_this_turn,
        'status',                  v_trial.status,
        'objections_used',         v_obj_used,
        'objections_remaining',    3 - v_obj_used,
        'plaintiff_settlement_decision', v_trial.plaintiff_settlement_decision,
        'defendant_settlement_decision', v_trial.defendant_settlement_decision,
        'hand',                    v_hand,
        'case_beats',              v_case_beats,
        'messages',                v_messages,
        'witnesses',               v_witnesses,
        'asked_witness_qa',        v_asked_qa,
        'in_evidence_beats',       v_evidence
    );
END $$;

-- ── 10. list_active_trials_for_advocate v3 — include judge trials ──
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
        'awaiting_verdict',  t.awaiting_verdict
    ) ORDER BY t.matched_at_tick ASC NULLS LAST), '[]'::jsonb)
      INTO v_trials
      FROM public.court_case_trials t
      JOIN public.court_case_drafts d ON d.id = t.case_draft_id
     WHERE t.status IN ('in_progress', 'settlement_conference')
       AND (t.plaintiff_advocate_id = v_pol.id
            OR t.defendant_advocate_id = v_pol.id
            OR t.judge_faction_id      = v_pol.id);

    RETURN jsonb_build_object('success', true, 'trials', v_trials);
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
