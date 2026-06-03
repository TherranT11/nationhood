-- ════════════════════════════════════════════════════════════════════
-- 20270538 — Criminal jury auto-verdict
--
-- Criminal cases no longer wait for the judge to click ENTER VERDICT.
-- At the close of defendant's round-4 turn, the jury decides
-- immediately:
--
--   • Plaintiff total = sum of plaintiff's played, non-nullified
--     beat strengths + a per-side ±6 chaos delta (uniform int).
--   • Defendant total = same on the other side, with its OWN ±6
--     chaos delta (rolled independently).
--   • Higher total wins. Tie → defendant (matches existing rule).
--
-- Beats only. Witness QA strengths and per-side objection deltas
-- (the bench-style tally for civil/commercial) are intentionally
-- IGNORED for the criminal jury — the jury sees the evidence
-- presented as beats, not the legal procedural ledger.
--
-- A judge still presides over criminal cases (and rules on
-- objections via judge_rule_objection unchanged), but they do NOT
-- enter the verdict. judge_enter_verdict rejects with reason
-- 'jury_decides_criminal' if called against a criminal trial.
--
-- Civil + commercial verdicts UNCHANGED: judge present → defer to
-- judge_enter_verdict (awaiting_verdict=true); judge absent →
-- auto-fire _apply_verdict with the existing tally (beats +
-- witness QA + objection deltas).
--
-- Reputation + Standing rules unchanged:
--   • Winner: +1 Standing (20270535) + rep delta = round(loser_total
--     / 10, 1), floored at 0.
--   • Loser: rep stays (no negative deltas on a verdict won by
--     legitimate means; floors at 0 already protect over-objected
--     losers from the existing -3 objection deltas).
--
-- Event_log text reflects the jury vs bench distinction.
--
-- Refactor included: the round-4 close logic was already inlined in
-- four RPCs (send_trial_message, end_turn, call_witness_qa,
-- judge_rule_objection). Adding the case_type check would have
-- duplicated again; extracted to _close_trial_at_round_four so the
-- 4 callsites become a single call.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. _close_trial_at_round_four helper ───────────────────────────
-- Single source of truth for what happens when defendant's round-4
-- turn closes. Three paths:
--   • case_type='criminal'     → jury auto-fires _apply_verdict.
--   • judge_faction_id IS NULL → no-judge auto-fires _apply_verdict.
--   • else                     → judge-defer (awaiting_verdict=true).
-- Returns the verdict jsonb (null when deferred) so callers can pass
-- it back to the client.
CREATE OR REPLACE FUNCTION public._close_trial_at_round_four(p_trial_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_trial     court_case_trials%ROWTYPE;
    v_case_type text;
    v_tick      int;
    v_verdict   jsonb := NULL;
BEGIN
    SELECT * INTO v_trial FROM public.court_case_trials WHERE id = p_trial_id;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('verdict', NULL, 'reason', 'trial_not_found');
    END IF;
    SELECT case_type INTO v_case_type
      FROM public.court_case_drafts
     WHERE id = v_trial.case_draft_id;

    IF v_case_type = 'criminal' OR v_trial.judge_faction_id IS NULL THEN
        UPDATE public.court_case_trials
           SET messages_sent_this_turn = 0
         WHERE id = p_trial_id;
        SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
        v_verdict := public._apply_verdict(p_trial_id, COALESCE(v_tick, 0));
    ELSE
        UPDATE public.court_case_trials
           SET messages_sent_this_turn = 0,
               awaiting_verdict        = true
         WHERE id = p_trial_id;
    END IF;

    RETURN jsonb_build_object('verdict', v_verdict);
END $$;

-- ── 2. _apply_verdict — criminal jury branch ───────────────────────
-- Same body as 20270535 EXCEPT the tally now branches on case_type.
-- Criminal: beats + per-side ±6 chaos. Other: existing beats +
-- witness QA + objection deltas. Standing + rep deltas + event_log
-- common to both, with text adjusted for the jury vs court distinction.
CREATE OR REPLACE FUNCTION public._apply_verdict(p_trial_id uuid, p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_trial            court_case_trials%ROWTYPE;
    v_case             court_case_drafts%ROWTYPE;
    v_p_sum            int := 0;
    v_d_sum            int := 0;
    v_p_wit            int := 0;
    v_d_wit            int := 0;
    v_p_obj            int := 0;
    v_d_obj            int := 0;
    v_p_chaos          int := 0;
    v_d_chaos          int := 0;
    v_is_criminal      boolean;
    v_p_total          int;
    v_d_total          int;
    v_winner           text;
    v_offerer          text;
    v_p_delta          numeric := 0;
    v_d_delta          numeric := 0;
    v_base             numeric;
    v_p_name           text;
    v_d_name           text;
    v_winner_name      text;
    v_winning_adv_id   uuid;
    v_winning_attorney text;
    v_event_text       text;
    v_verdict_text     text;
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

    -- Played, non-nullified beat strengths. Same query for both paths
    -- — what differs is what gets added on top.
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
        -- Jury formula: beats only + per-side ±6 chaos (uniform
        -- integer). Each side rolls independently.
        v_p_chaos := floor(random() * 13)::int - 6;
        v_d_chaos := floor(random() * 13)::int - 6;
        v_p_total := v_p_sum + v_p_chaos;
        v_d_total := v_d_sum + v_d_chaos;
    ELSE
        -- Bench tally: beats + witness QA + objection deltas.
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

    -- Tie → defendant (status quo, both paths).
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

    -- Winner +1 Standing (20270535). Loser unchanged. Settle path
    -- doesn't reach here so Standing only moves on verdicts.
    IF v_winner = 'plaintiff' AND v_trial.plaintiff_advocate_id IS NOT NULL THEN
        UPDATE public.factions
           SET politician_standing = COALESCE(politician_standing, 0) + 1
         WHERE id = v_trial.plaintiff_advocate_id;
    ELSIF v_winner = 'defendant' AND v_trial.defendant_advocate_id IS NOT NULL THEN
        UPDATE public.factions
           SET politician_standing = COALESCE(politician_standing, 0) + 1
         WHERE id = v_trial.defendant_advocate_id;
    END IF;

    UPDATE public.court_case_trials
       SET status           = 'resolved',
           verdict_winner   = v_winner,
           verdict_at_tick  = p_tick,
           awaiting_verdict = false
     WHERE id = p_trial_id;

    -- Chat verdict line. Criminal shows the chaos breakdown so the
    -- jury's reasoning is transparent; bench shows the raw totals.
    IF v_is_criminal THEN
        v_verdict_text := 'Jury verdict: ' ||
            'plaintiff ' || v_p_sum ||
            ' (chaos ' || (CASE WHEN v_p_chaos >= 0 THEN '+' ELSE '' END) || v_p_chaos || ' = ' || v_p_total || ') ' ||
            'vs defendant ' || v_d_sum ||
            ' (chaos ' || (CASE WHEN v_d_chaos >= 0 THEN '+' ELSE '' END) || v_d_chaos || ' = ' || v_d_total || '). ' ||
            'Judgment for the ' || v_winner || '.';
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

    -- World-events dispatch. Criminal text reads as a jury outcome.
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

    IF v_is_criminal THEN
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
        CASE WHEN v_is_criminal THEN 'Jury Verdict' ELSE 'Verdict Rendered' END,
        v_event_text,
        'politician',
        CASE WHEN v_is_criminal THEN 'trial_jury_verdict' ELSE 'trial_verdict_rendered' END,
        p_tick
    );

    RETURN jsonb_build_object(
        'success',                  true,
        'winner',                   v_winner,
        'mode',                     CASE WHEN v_is_criminal THEN 'jury' ELSE 'bench' END,
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
        'winner_standing_delta',    1
    );
END $$;

-- ── 3. judge_enter_verdict — reject for criminal ────────────────────
-- Criminal cases auto-fire jury at round-4 close; the judge has no
-- verdict to enter. Reject early with a clear reason so the client
-- can hide the button instead of showing a generic failure.
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
    v_case_type text;
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

    SELECT case_type INTO v_case_type
      FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;
    IF v_case_type = 'criminal' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'jury_decides_criminal');
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

-- ── 4. send_trial_message v5 — round-4 close via helper ─────────────
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
               SET current_turn = 'defendant', messages_sent_this_turn = 0
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
                SELECT (public._close_trial_at_round_four(p_trial_id) -> 'verdict')
                  INTO v_verdict;
                v_flipped := true;
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
        'verdict',     v_verdict
    );
END $$;

-- ── 5. end_turn v4 — round-4 close via helper ───────────────────────
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
           SET current_turn = 'defendant', messages_sent_this_turn = 0
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
            SELECT (public._close_trial_at_round_four(p_trial_id) -> 'verdict')
              INTO v_verdict;
            v_flipped := true;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 'flipped', v_flipped, 'verdict', v_verdict
    );
END $$;

-- ── 6. call_witness_qa v4 — round-4 close via helper ────────────────
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
                SELECT (public._close_trial_at_round_four(p_trial_id) -> 'verdict')
                  INTO v_verdict;
                v_flipped := true;
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

-- ── 7. judge_rule_objection v2 — round-4 close via helper ───────────
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
    v_verdict   jsonb := NULL;
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

    UPDATE public.court_case_trials
       SET pending_objection_message_id = NULL,
           judge_last_action_at_tick    = COALESCE(v_tick, judge_last_action_at_tick, 0)
     WHERE id = p_trial_id;

    v_new_count := v_trial.messages_sent_this_turn;
    IF v_new_count >= 4 THEN
        IF v_obj_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET current_turn = 'defendant', messages_sent_this_turn = 0
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
                SELECT (public._close_trial_at_round_four(p_trial_id) -> 'verdict')
                  INTO v_verdict;
                v_flipped := true;
            END IF;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success',   true,
        'ruling',    p_ruling,
        'sustained', v_sustained,
        'flipped',   v_flipped,
        'verdict',   v_verdict
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
