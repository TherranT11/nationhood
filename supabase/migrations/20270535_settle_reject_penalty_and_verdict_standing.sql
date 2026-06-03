-- ════════════════════════════════════════════════════════════════════
-- 20270535 — Settle-reject penalty + verdict Standing bump
--
-- Two trial-resolution tweaks:
--
--   1. Settlement-conference asymmetric penalty. If you offer to
--      settle and opposing counsel rejects, you immediately lose
--      1 Reputation. The rejecter takes no hit. Both-reject is
--      neutral (neither offered). Both-offer settles as before
--      with the +2 Rep reward.
--
--      Implemented in respond_settlement_conference's
--      "proceed to trial" branch (the both-offer branch returns
--      before reaching it). Existing rep floor at 0 preserved.
--
--   2. Verdict-winner Standing bump. When _apply_verdict resolves
--      a trial (points-based or settle-declined-then-verdict),
--      the winning advocate gains +1 Standing immediately, on top
--      of the existing Reputation delta from the strength tally.
--      No Standing change on the losing side, and no Standing
--      change on the settle path (settle gives both sides +2 Rep
--      and the trial doesn't go through _apply_verdict).
--
-- Both functions re-issued with these additions; everything else
-- is byte-identical to the prior version.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. respond_settlement_conference — penalise rejected offerer ───
CREATE OR REPLACE FUNCTION public.respond_settlement_conference(
    p_faction_id uuid,
    p_trial_id   uuid,
    p_decision   text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_trial   court_case_trials%ROWTYPE;
    v_case    court_case_drafts%ROWTYPE;
    v_side    text;
    v_tick    int;
    v_p_dec   text;
    v_d_dec   text;
    v_amount  int;
    v_outcome text;
    v_p_name  text;
    v_d_name  text;
    v_snubbed_id uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL OR p_decision IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;
    IF p_decision NOT IN ('offer', 'reject') THEN
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
    IF v_trial.status <> 'settlement_conference' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_settlement_conference');
    END IF;

    IF v_trial.plaintiff_advocate_id = v_pol.id THEN
        v_side := 'plaintiff';
        IF v_trial.plaintiff_settlement_decision IS NOT NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
        END IF;
        UPDATE public.court_case_trials
           SET plaintiff_settlement_decision = p_decision
         WHERE id = p_trial_id;
    ELSIF v_trial.defendant_advocate_id = v_pol.id THEN
        v_side := 'defendant';
        IF v_trial.defendant_settlement_decision IS NOT NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
        END IF;
        UPDATE public.court_case_trials
           SET defendant_settlement_decision = p_decision
         WHERE id = p_trial_id;
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_trial');
    END IF;

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, v_side, 0, 0,
        CASE WHEN p_decision = 'offer'
             THEN 'Counsel offers to settle.'
             ELSE 'Counsel rejects settlement — we proceed to trial.' END,
        'settlement_offer'
    );

    SELECT plaintiff_settlement_decision, defendant_settlement_decision
      INTO v_p_dec, v_d_dec
      FROM public.court_case_trials
     WHERE id = p_trial_id;

    IF v_p_dec IS NULL OR v_d_dec IS NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'side',    v_side,
            'decision', p_decision,
            'waiting_for_opponent', true
        );
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    IF v_p_dec = 'offer' AND v_d_dec = 'offer' THEN
        SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;

        IF v_case.case_type = 'commercial' THEN
            v_amount  := 1 + floor(random() * 20)::int;
            v_outcome := 'The parties have settled the matter privately for $'
                         || v_amount || ' million. Court is adjourned.';
        ELSIF v_case.case_type = 'criminal' THEN
            v_amount  := 4 + floor(random() * 6)::int;
            v_outcome := 'The defendant has entered a plea bargain — the recommended sentence is reduced by '
                         || v_amount || ' years. Court is adjourned.';
        ELSE
            v_amount  := 1 + floor(random() * 10)::int;
            v_outcome := 'The parties have settled the matter privately for $'
                         || v_amount || ' million. Court is adjourned.';
        END IF;

        UPDATE public.court_case_trials
           SET status          = 'settled',
               settle_resolved = 'accepted',
               verdict_winner  = 'settled',
               verdict_at_tick = COALESCE(v_tick, 0)
         WHERE id = p_trial_id;

        UPDATE public.factions
           SET politician_reputation = COALESCE(politician_reputation, 0) + 2
         WHERE id IN (v_trial.plaintiff_advocate_id, v_trial.defendant_advocate_id);

        INSERT INTO public.court_case_trial_messages (
            trial_id, side, round, turn_seq, text, kind
        ) VALUES (
            p_trial_id, 'system', 0, 0, v_outcome, 'settlement_outcome'
        );

        v_p_name := COALESCE(NULLIF(btrim(v_trial.plaintiff_name), ''), 'Plaintiff');
        v_d_name := COALESCE(NULLIF(btrim(v_trial.defendant_name), ''), 'Defendant');
        INSERT INTO public.event_log (
            nation_id, faction_id,
            event_name, description_used,
            category, trigger_key,
            fired_at_tick
        ) VALUES (
            v_trial.nation_id, NULL,
            'Case Settled',
            'The case of ' || v_p_name || ' vs ' || v_d_name
                || ' has been settled out of court.',
            'politician', 'trial_settled',
            COALESCE(v_tick, 0)
        );

        RETURN jsonb_build_object(
            'success',          true,
            'settled',          true,
            'settlement_amount', v_amount,
            'settlement_text',   v_outcome
        );
    END IF;

    -- Proceed-to-trial path. If exactly one side offered and the
    -- other rejected, the offerer takes -1 Rep for the snub. Both
    -- reject = neutral. Rep floored at 0 (matches _apply_verdict).
    IF v_p_dec = 'offer' AND v_d_dec = 'reject' THEN
        v_snubbed_id := v_trial.plaintiff_advocate_id;
    ELSIF v_p_dec = 'reject' AND v_d_dec = 'offer' THEN
        v_snubbed_id := v_trial.defendant_advocate_id;
    END IF;
    IF v_snubbed_id IS NOT NULL THEN
        UPDATE public.factions
           SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) - 1)
         WHERE id = v_snubbed_id;
    END IF;

    PERFORM public._begin_trial_arguments(p_trial_id);

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, 'system', 1, 0,
        'No settlement reached. Court will now hear arguments. Plaintiff opens.',
        'judge_note'
    );

    RETURN jsonb_build_object(
        'success',           true,
        'settled',           false,
        'proceed_to_trial',  true,
        'snubbed_offerer',   v_snubbed_id IS NOT NULL
    );
END $$;

-- ── 2. _apply_verdict — +1 Standing for winner on verdict ──────────
-- Same body as 20270528 except the winning advocate's
-- politician_standing gets bumped by 1 alongside the existing
-- reputation delta. Settle path never reaches _apply_verdict so
-- Standing only moves on actual verdicts.
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
BEGIN
    SELECT * INTO v_trial FROM public.court_case_trials WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'in_progress' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved');
    END IF;

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;

    -- Beats: played, non-nullified. The nullified carve-out strips
    -- any beat that a sustained objection nullified (20270525
    -- restored that path on top of 20270524's dice roll).
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

    -- Tie → defendant (status quo).
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
        -- Floor at 0: over-objected loser can land negative; winner
        -- doesn't lose Rep on a verdict they won.
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

    -- Winner's +1 Standing on verdict. Loser unchanged. Settle
    -- path doesn't reach _apply_verdict, so Standing only moves on
    -- actual verdicts (per design).
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
       SET status          = 'resolved',
           verdict_winner  = v_winner,
           verdict_at_tick = p_tick
     WHERE id = p_trial_id;

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, 'system', v_trial.current_round, 0,
        'Verdict: judgment for the ' || v_winner ||
            '. (plaintiff ' || v_p_total ||
            ' vs defendant ' || v_d_total || ')',
        'verdict'
    );

    -- World-events dispatch (20270528).
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

    v_event_text :=
        'The case of ' || v_p_name || ' vs ' || v_d_name
        || ' has finished, with the court ruling in favor of ' || v_winner_name || '.';
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
        'Verdict Rendered',
        v_event_text,
        'politician', 'trial_verdict_rendered',
        p_tick
    );

    RETURN jsonb_build_object(
        'success',                  true,
        'winner',                   v_winner,
        'plaintiff_strength',       v_p_total,
        'defendant_strength',       v_d_total,
        'plaintiff_beat_sum',       v_p_sum,
        'defendant_beat_sum',       v_d_sum,
        'plaintiff_witness_sum',    v_p_wit,
        'defendant_witness_sum',    v_d_wit,
        'plaintiff_objection_delta', v_p_obj,
        'defendant_objection_delta', v_d_obj,
        'plaintiff_rep_delta',      v_p_delta,
        'defendant_rep_delta',      v_d_delta,
        'winner_standing_delta',    1
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
