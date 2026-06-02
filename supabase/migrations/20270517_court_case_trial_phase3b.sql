-- ════════════════════════════════════════════════════════════════════
-- 20270517 — Trial loop Phase 3b: objection, settle, verdict
--
-- The final layer of the trial loop. Phase 3a wired messages and
-- the turn flip; 3b ships:
--
--   • send_objection — spend one of the lawyer's 3 objections to
--     nullify the opponent's most recently played, unobjected beat.
--     Consumes one opponent-favouring beat from your hand (the
--     "lemons into lemonade" mechanic: beats that would help the
--     other side become your ammo to neutralise theirs).
--   • offer_settle — propose a settlement (1 use per lawyer per
--     trial). Writes a settle_offer message and stamps
--     settle_offered_by_side on the trial.
--   • respond_settle — opponent's accept / decline. Accept ends
--     the trial as 'settled', both sides +2 Reputation. Decline
--     records the refusal; the trial continues but the settle
--     state shapes the eventual verdict reputation per the spec.
--   • resolve_trial_verdict — internal. Called automatically from
--     send_trial_message and end_turn when the defendant's round-4
--     turn finishes. Sums each side's played, non-nullified beat
--     strengths from the case beats jsonb, flags a winner (tie →
--     defendant), then applies:
--
--        No settle:            winner +base, loser 0
--        Settle accepted:      handled by respond_settle, both +2
--        Settle refused →
--          offerer wins:       offerer -1, non-offerer 0
--          offerer loses:      offerer -3, non-offerer +5
--
--     where base = (opposing strength sum / 10), the same upset-pays
--     formula the courtcase composer previewed.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. send_objection ──────────────────────────────────────────────
-- Caller spends one of their 3 objection slots + one opponent-favouring
-- beat from their hand. Target: the opponent's most recently played,
-- not-yet-nullified beat (looked up by joining hands → messages →
-- created_at). Inserts an 'objection' message with both consumed-beat
-- and objected-target indices for the chat record.
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
    v_target_idx   int;
    v_clean_text   text;
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

    IF v_trial.plaintiff_advocate_id = v_pol.id THEN
        v_side := 'plaintiff'; v_opp_side := 'defendant';
    ELSIF v_trial.defendant_advocate_id = v_pol.id THEN
        v_side := 'defendant'; v_opp_side := 'plaintiff';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_trial');
    END IF;
    -- Objections fire during your own turn (you stand up and object).
    IF v_trial.current_turn <> v_side THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_turn');
    END IF;

    -- 3-objection cap per lawyer.
    v_used := CASE WHEN v_side = 'plaintiff' THEN v_trial.plaintiff_objections_used
                                              ELSE v_trial.defendant_objections_used END;
    IF v_used >= 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'objection_cap_reached');
    END IF;

    -- The beat must be in caller's hand, unconsumed, AND favour the
    -- opponent (you can only object WITH a beat that would have
    -- helped them).
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

    -- Find opponent's most recently played, not-yet-nullified beat.
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

    -- Mark objection-beat consumed, opponent's beat nullified.
    UPDATE public.court_case_trial_hands
       SET objected_at_round = v_trial.current_round
     WHERE trial_id = p_trial_id AND side = v_side AND beat_index = p_beat_index;
    UPDATE public.court_case_trial_hands
       SET nullified = true
     WHERE trial_id = p_trial_id AND side = v_opp_side AND beat_index = v_target_idx;

    -- Bump caller's objection counter on the trial row.
    IF v_side = 'plaintiff' THEN
        UPDATE public.court_case_trials
           SET plaintiff_objections_used = plaintiff_objections_used + 1
         WHERE id = p_trial_id;
    ELSE
        UPDATE public.court_case_trials
           SET defendant_objections_used = defendant_objections_used + 1
         WHERE id = p_trial_id;
    END IF;

    -- Objection text is optional; default to the standard line.
    v_clean_text := btrim(COALESCE(p_text, ''));
    IF length(v_clean_text) = 0 THEN
        v_clean_text := 'Objection, your Honor.';
    END IF;
    IF length(v_clean_text) > 240 THEN
        v_clean_text := substring(v_clean_text from 1 for 240);
    END IF;

    -- Objection writes a message but does NOT consume one of the 4
    -- turn-message slots — it's a trial action, not regular speech.
    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind,
        beat_played_index, objected_beat_index
    ) VALUES (
        p_trial_id, v_side, v_trial.current_round,
        v_trial.messages_sent_this_turn,  -- shares slot with last argument
        v_clean_text, 'objection',
        p_beat_index, v_target_idx
    );

    RETURN jsonb_build_object(
        'success',                true,
        'side',                   v_side,
        'consumed_beat_index',    p_beat_index,
        'nullified_beat_index',   v_target_idx,
        'objections_used',        v_used + 1,
        'objections_remaining',   3 - (v_used + 1)
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.send_objection(uuid, uuid, int, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.send_objection(uuid, uuid, int, text) TO authenticated;

-- ── 2. offer_settle ────────────────────────────────────────────────
-- 1 use per lawyer. Writes a settle_offer message + stamps the
-- trial's settle_offered_by_side; the opposite side sees the offer
-- on their next view and can accept (trial ends) or decline (trial
-- continues, refusal shapes the verdict reputation).
CREATE OR REPLACE FUNCTION public.offer_settle(
    p_faction_id uuid,
    p_trial_id   uuid,
    p_text       text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid        uuid := auth.uid();
    v_pol        factions%ROWTYPE;
    v_trial      court_case_trials%ROWTYPE;
    v_side       text;
    v_used       boolean;
    v_clean_text text;
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

    IF v_trial.plaintiff_advocate_id = v_pol.id THEN
        v_side := 'plaintiff';
        v_used := v_trial.plaintiff_settle_used;
    ELSIF v_trial.defendant_advocate_id = v_pol.id THEN
        v_side := 'defendant';
        v_used := v_trial.defendant_settle_used;
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_trial');
    END IF;
    IF v_trial.current_turn <> v_side THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_turn');
    END IF;
    IF v_used THEN
        RETURN jsonb_build_object('success', false, 'reason', 'settle_already_used');
    END IF;
    IF v_trial.settle_offered_by_side IS NOT NULL
       AND v_trial.settle_resolved IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'settle_already_on_table');
    END IF;

    v_clean_text := btrim(COALESCE(p_text, ''));
    IF length(v_clean_text) = 0 THEN
        v_clean_text := 'Your Honor, defense and counsel propose a settlement.';
    END IF;
    IF length(v_clean_text) > 240 THEN
        v_clean_text := substring(v_clean_text from 1 for 240);
    END IF;

    IF v_side = 'plaintiff' THEN
        UPDATE public.court_case_trials
           SET plaintiff_settle_used  = true,
               settle_offered_by_side = 'plaintiff',
               settle_resolved        = NULL
         WHERE id = p_trial_id;
    ELSE
        UPDATE public.court_case_trials
           SET defendant_settle_used  = true,
               settle_offered_by_side = 'defendant',
               settle_resolved        = NULL
         WHERE id = p_trial_id;
    END IF;

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, v_side, v_trial.current_round,
        v_trial.messages_sent_this_turn,
        v_clean_text, 'settle_offer'
    );

    RETURN jsonb_build_object(
        'success', true,
        'side',    v_side
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.offer_settle(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.offer_settle(uuid, uuid, text) TO authenticated;

-- ── 3. _apply_settle_accept (helper) ───────────────────────────────
-- Marks the trial settled and awards both lawyers +2 Reputation.
-- Separated so respond_settle stays readable; not a public RPC.
CREATE OR REPLACE FUNCTION public._apply_settle_accept(
    p_trial_id  uuid,
    p_plaintiff_id uuid,
    p_defendant_id uuid,
    p_tick      int
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    UPDATE public.court_case_trials
       SET status          = 'settled',
           settle_resolved = 'accepted',
           verdict_winner  = 'settled',
           verdict_at_tick = p_tick
     WHERE id = p_trial_id;
    UPDATE public.factions
       SET politician_reputation = COALESCE(politician_reputation, 0) + 2
     WHERE id IN (p_plaintiff_id, p_defendant_id);
END $$;

-- ── 4. _apply_verdict (helper) ─────────────────────────────────────
-- Sums each side's played, non-nullified beat strengths from the
-- case beats jsonb; declares a winner (tie → defendant); applies the
-- settle-aware reputation deltas; flips trial status to 'resolved'.
-- Called by send_trial_message / end_turn at the close of defendant's
-- round-4 turn and by respond_settle for the decline path that
-- happens to coincide with the verdict trigger.
CREATE OR REPLACE FUNCTION public._apply_verdict(p_trial_id uuid, p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_trial      court_case_trials%ROWTYPE;
    v_case       court_case_drafts%ROWTYPE;
    v_p_sum      int := 0;
    v_d_sum      int := 0;
    v_winner     text;
    v_offerer    text;
    v_p_delta    numeric := 0;
    v_d_delta    numeric := 0;
    v_base       numeric;
BEGIN
    SELECT * INTO v_trial FROM public.court_case_trials WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    -- Re-entry guard: don't re-resolve a finished trial.
    IF v_trial.status <> 'in_progress' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved');
    END IF;

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;

    -- Tally each side: sum of played, non-nullified beat strengths.
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

    -- Tie → defendant (status quo prevails; plaintiff carries the burden).
    IF v_p_sum > v_d_sum THEN
        v_winner := 'plaintiff';
    ELSE
        v_winner := 'defendant';
    END IF;

    v_offerer := v_trial.settle_offered_by_side;
    -- Reputation math:
    --   no settle / offer never made: winner +base, loser 0
    --   settle accepted: handled by respond_settle (we shouldn't reach here)
    --   settle refused (offerer wins): offerer -1, non-offerer 0
    --   settle refused (offerer loses): offerer -3, non-offerer +5
    IF v_offerer IS NOT NULL AND v_trial.settle_resolved = 'declined' THEN
        IF v_offerer = v_winner THEN
            -- Offerer won the verdict they tried to settle out of: -1.
            IF v_winner = 'plaintiff' THEN v_p_delta := -1; ELSE v_d_delta := -1; END IF;
        ELSE
            -- Offerer lost: -3 for them, +5 for the non-offerer who held.
            IF v_offerer = 'plaintiff' THEN
                v_p_delta := -3; v_d_delta := 5;
            ELSE
                v_d_delta := -3; v_p_delta := 5;
            END IF;
        END IF;
    ELSE
        -- Standard verdict: winner gets opposing strength sum / 10.
        v_base := round(
            (CASE WHEN v_winner = 'plaintiff' THEN v_d_sum ELSE v_p_sum END)::numeric / 10.0,
            1);
        IF v_winner = 'plaintiff' THEN v_p_delta := v_base; ELSE v_d_delta := v_base; END IF;
    END IF;

    -- Politicians table uses INT for politician_reputation; round to
    -- nearest whole then clamp at 0 on the floor.
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

    UPDATE public.court_case_trials
       SET status          = 'resolved',
           verdict_winner  = v_winner,
           verdict_at_tick = p_tick
     WHERE id = p_trial_id;

    -- Drop a system message into the log so the chat has the verdict.
    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, 'system', v_trial.current_round, 0,
        'Verdict: judgment for the ' || v_winner ||
            '. (plaintiff strength ' || v_p_sum ||
            ' vs defendant strength ' || v_d_sum || ')',
        'verdict'
    );

    RETURN jsonb_build_object(
        'success',           true,
        'winner',            v_winner,
        'plaintiff_strength', v_p_sum,
        'defendant_strength', v_d_sum,
        'plaintiff_rep_delta', v_p_delta,
        'defendant_rep_delta', v_d_delta
    );
END $$;

-- ── 5. respond_settle ──────────────────────────────────────────────
-- The non-offerer's accept / decline. Accept ends the trial (status
-- = 'settled', both +2 Rep). Decline marks settle_resolved =
-- 'declined' and the trial continues; the asymmetric reputation lands
-- at verdict time (handled by _apply_verdict).
CREATE OR REPLACE FUNCTION public.respond_settle(
    p_faction_id uuid,
    p_trial_id   uuid,
    p_decision   text,
    p_text       text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid        uuid := auth.uid();
    v_pol        factions%ROWTYPE;
    v_trial      court_case_trials%ROWTYPE;
    v_tick       int;
    v_side       text;
    v_clean_text text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;
    IF p_decision NOT IN ('accept', 'decline') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_decision');
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
    IF v_trial.settle_offered_by_side IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_settle_on_table');
    END IF;
    IF v_trial.settle_resolved IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'settle_already_resolved');
    END IF;

    IF v_trial.plaintiff_advocate_id = v_pol.id THEN
        v_side := 'plaintiff';
    ELSIF v_trial.defendant_advocate_id = v_pol.id THEN
        v_side := 'defendant';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_trial');
    END IF;
    -- Only the OPPOSITE side from the offerer can decide.
    IF v_side = v_trial.settle_offered_by_side THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cannot_respond_to_own_offer');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    v_clean_text := btrim(COALESCE(p_text, ''));
    IF length(v_clean_text) = 0 THEN
        v_clean_text := CASE WHEN p_decision = 'accept'
                                 THEN 'Counsel accepts the proposed settlement.'
                             ELSE 'Counsel respectfully declines the settlement.' END;
    END IF;
    IF length(v_clean_text) > 240 THEN
        v_clean_text := substring(v_clean_text from 1 for 240);
    END IF;

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind, settle_decision
    ) VALUES (
        p_trial_id, v_side, v_trial.current_round,
        v_trial.messages_sent_this_turn,
        v_clean_text, 'settle_response', p_decision
    );

    IF p_decision = 'accept' THEN
        PERFORM public._apply_settle_accept(
            p_trial_id,
            v_trial.plaintiff_advocate_id,
            v_trial.defendant_advocate_id,
            v_tick
        );
        RETURN jsonb_build_object(
            'success',  true,
            'decision', 'accept',
            'trial_status', 'settled'
        );
    ELSE
        UPDATE public.court_case_trials
           SET settle_resolved = 'declined'
         WHERE id = p_trial_id;
        RETURN jsonb_build_object(
            'success',  true,
            'decision', 'decline',
            'trial_status', 'in_progress'
        );
    END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.respond_settle(uuid, uuid, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.respond_settle(uuid, uuid, text, text) TO authenticated;

-- ── 6. send_trial_message + end_turn — verdict trigger ─────────────
-- Both flip-turn paths now call _apply_verdict when defendant
-- finishes round 4. Body otherwise unchanged from 20270516.
CREATE OR REPLACE FUNCTION public.send_trial_message(
    p_faction_id uuid,
    p_trial_id   uuid,
    p_text       text,
    p_beat_index int DEFAULT NULL
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
    v_already_played int;
    v_beat_support text;
    v_beat_in_hand int;
    v_new_count    int;
    v_msg_id       uuid;
    v_flipped      boolean := false;
    v_next_turn    text;
    v_next_round   int;
    v_verdict      jsonb := NULL;
    v_tick         int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    v_clean_text := btrim(COALESCE(p_text, ''));
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
        IF p_beat_index < 0 OR p_beat_index > 9 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_beat_index');
        END IF;
        SELECT count(*) INTO v_already_played
          FROM public.court_case_trial_messages
         WHERE trial_id = p_trial_id AND side = v_side
           AND round = v_trial.current_round
           AND beat_played_index IS NOT NULL;
        IF v_already_played > 0 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'beat_already_played_this_turn');
        END IF;
        SELECT 1 INTO v_beat_in_hand
          FROM public.court_case_trial_hands
         WHERE trial_id = p_trial_id AND side = v_side AND beat_index = p_beat_index
           AND played_at_round IS NULL AND objected_at_round IS NULL;
        IF v_beat_in_hand IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'beat_not_in_hand');
        END IF;
        SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;
        v_beat_support := v_case.beats -> p_beat_index ->> 'support';
        IF v_beat_support IS DISTINCT FROM v_side THEN
            RETURN jsonb_build_object('success', false, 'reason', 'beat_favours_opponent');
        END IF;
    END IF;

    v_next_seq := v_trial.messages_sent_this_turn + 1;

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind, beat_played_index
    ) VALUES (
        p_trial_id, v_side, v_trial.current_round, v_next_seq,
        v_clean_text, 'argument', p_beat_index
    ) RETURNING id INTO v_msg_id;

    IF p_beat_index IS NOT NULL THEN
        UPDATE public.court_case_trial_hands
           SET played_at_round = v_trial.current_round
         WHERE trial_id = p_trial_id AND side = v_side AND beat_index = p_beat_index;
    END IF;

    v_new_count := v_next_seq;
    IF v_new_count >= 4 THEN
        IF v_side = 'plaintiff' THEN
            v_next_turn  := 'defendant';
            v_next_round := v_trial.current_round;
            UPDATE public.court_case_trials
               SET current_turn = v_next_turn, current_round = v_next_round,
                   messages_sent_this_turn = 0
             WHERE id = p_trial_id;
        ELSE
            IF v_trial.current_round < 4 THEN
                v_next_turn  := 'plaintiff';
                v_next_round := v_trial.current_round + 1;
                UPDATE public.court_case_trials
                   SET current_turn = v_next_turn, current_round = v_next_round,
                       messages_sent_this_turn = 0
                 WHERE id = p_trial_id;
            ELSE
                -- Defendant just finished round 4 → resolve verdict.
                UPDATE public.court_case_trials
                   SET messages_sent_this_turn = 0
                 WHERE id = p_trial_id;
                SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
                v_verdict := public._apply_verdict(p_trial_id, COALESCE(v_tick, 0));
            END IF;
        END IF;
        v_flipped := true;
    ELSE
        UPDATE public.court_case_trials
           SET messages_sent_this_turn = v_new_count
         WHERE id = p_trial_id;
    END IF;

    RETURN jsonb_build_object(
        'success',                 true,
        'message_id',              v_msg_id,
        'side',                    v_side,
        'round',                   v_trial.current_round,
        'turn_seq',                v_next_seq,
        'beat_played_index',       p_beat_index,
        'messages_sent_this_turn', CASE WHEN v_flipped THEN 0 ELSE v_new_count END,
        'turn_flipped',            v_flipped,
        'verdict',                 v_verdict
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.send_trial_message(uuid, uuid, text, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.send_trial_message(uuid, uuid, text, int) TO authenticated;

CREATE OR REPLACE FUNCTION public.end_turn(p_faction_id uuid, p_trial_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_trial     court_case_trials%ROWTYPE;
    v_side      text;
    v_next_turn text;
    v_next_round int;
    v_verdict   jsonb := NULL;
    v_tick      int;
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
        v_next_turn  := 'defendant';
        v_next_round := v_trial.current_round;
        UPDATE public.court_case_trials
           SET current_turn = v_next_turn, current_round = v_next_round,
               messages_sent_this_turn = 0
         WHERE id = p_trial_id;
    ELSE
        IF v_trial.current_round < 4 THEN
            v_next_turn  := 'plaintiff';
            v_next_round := v_trial.current_round + 1;
            UPDATE public.court_case_trials
               SET current_turn = v_next_turn, current_round = v_next_round,
                   messages_sent_this_turn = 0
             WHERE id = p_trial_id;
        ELSE
            UPDATE public.court_case_trials
               SET messages_sent_this_turn = 0
             WHERE id = p_trial_id;
            SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
            v_verdict := public._apply_verdict(p_trial_id, COALESCE(v_tick, 0));
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success',      true,
        'turn_flipped', true,
        'next_turn',    v_next_turn,
        'next_round',   v_next_round,
        'verdict',      v_verdict
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.end_turn(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.end_turn(uuid, uuid) TO authenticated;

-- ── 7. get_trial_state — expose objection/settle resources ─────────
-- Phase 3a's get_trial_state already returned status (and refuses
-- non-in_progress trials). 3b extends the live response with the
-- counters / flags the UI needs to render OBJECTION / SETTLE
-- buttons + handle a settle offer on the table.
CREATE OR REPLACE FUNCTION public.get_trial_state(p_faction_id uuid, p_trial_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_trial     court_case_trials%ROWTYPE;
    v_case      court_case_drafts%ROWTYPE;
    v_side      text;
    v_opp_id    uuid;
    v_opp_name  text;
    v_hand      jsonb;
    v_messages  jsonb;
    v_obj_used  int;
    v_set_used  boolean;
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
    IF v_trial.status <> 'in_progress' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_active',
            'status', v_trial.status, 'verdict_winner', v_trial.verdict_winner);
    END IF;

    IF v_trial.plaintiff_advocate_id = v_pol.id THEN
        v_side := 'plaintiff'; v_opp_id := v_trial.defendant_advocate_id;
        v_obj_used := v_trial.plaintiff_objections_used;
        v_set_used := v_trial.plaintiff_settle_used;
    ELSIF v_trial.defendant_advocate_id = v_pol.id THEN
        v_side := 'defendant'; v_opp_id := v_trial.plaintiff_advocate_id;
        v_obj_used := v_trial.defendant_objections_used;
        v_set_used := v_trial.defendant_settle_used;
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_trial');
    END IF;

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;
    IF v_case.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_found');
    END IF;

    IF v_opp_id IS NOT NULL THEN
        SELECT btrim(COALESCE(leader_first_name, '') || ' ' || COALESCE(leader_last_name, ''))
          INTO v_opp_name FROM public.factions WHERE id = v_opp_id;
    END IF;

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
        'settle_decision',   m.settle_decision,
        'created_at',        m.created_at
    ) ORDER BY m.created_at ASC), '[]'::jsonb)
      INTO v_messages
      FROM public.court_case_trial_messages m
     WHERE m.trial_id = p_trial_id;

    RETURN jsonb_build_object(
        'success',                 true,
        'trial_id',                p_trial_id,
        'case_id',                 v_case.id,
        'case_type',               v_case.case_type,
        'litigation_type',         v_case.litigation_type,
        'overview',                v_case.overview,
        'plaintiff_name',          v_trial.plaintiff_name,
        'defendant_name',          v_trial.defendant_name,
        'side',                    v_side,
        'opponent_name',           COALESCE(NULLIF(v_opp_name, ''), 'Opposing Counsel'),
        'current_round',           v_trial.current_round,
        'current_turn',            v_trial.current_turn,
        'your_turn',               v_trial.current_turn = v_side,
        'messages_sent_this_turn', v_trial.messages_sent_this_turn,
        'status',                  v_trial.status,
        'objections_used',         v_obj_used,
        'objections_remaining',    3 - v_obj_used,
        'settle_used',             v_set_used,
        'settle_offered_by_side',  v_trial.settle_offered_by_side,
        'settle_resolved',         v_trial.settle_resolved,
        'hand',                    v_hand,
        'messages',                v_messages
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.get_trial_state(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_trial_state(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
