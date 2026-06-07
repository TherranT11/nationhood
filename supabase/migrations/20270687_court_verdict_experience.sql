-- ════════════════════════════════════════════════════════════════════
-- 20270687 — Court verdicts: Experience awards for both sides
--
-- User design change. Every resolved trial now grants the
-- advocate on each side a small Experience bump:
--   • Winner   → +0.3 politician_skill
--   • Loser    → +0.2 politician_skill
--
-- Rationale: courtroom reps generate experience either way (you
-- learned something from the loss too). +0.3/+0.2 is small enough
-- not to overshadow Reputation or Influence as the "real" career
-- currency. Awards apply to ALL trial modes — civil bench, criminal
-- jury, appellate, Supreme Court — wherever _apply_verdict lands.
--
-- Implementation: re-emits _apply_verdict from its latest body in
-- 20270646 (capital_influence_column_rename) verbatim, with two new
-- UPDATE blocks added next to the existing winner-influence write,
-- and the deltas surfaced in the response jsonb for the client to
-- show. Career-event metadata for won_case / lost_case also picks
-- up the new skill_delta so the political-history log can render
-- it if it ever wants to.
--
-- No behavioral changes elsewhere in the function — totals,
-- chaos, witness/objection deltas, settlement-decline penalties,
-- appeal payouts (regular + SC), event_log copy, and queue
-- advancement are all preserved exactly.
--
-- Apply after 20270686.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    v_win_skill_delta     constant numeric := 0.3;
    v_loss_skill_delta    constant numeric := 0.2;
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
           SET politician_capital = COALESCE(politician_capital, 0) + 1
         WHERE id = v_trial.plaintiff_advocate_id;
    ELSIF v_winner = 'defendant' AND v_trial.defendant_advocate_id IS NOT NULL THEN
        UPDATE public.factions
           SET politician_capital = COALESCE(politician_capital, 0) + 1
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
                       politician_influence     = COALESCE(politician_influence, 0) + v_appellant_pc_delta
                 WHERE id = v_appellant_id;
            ELSE
                v_appellant_rep_delta := CASE WHEN v_is_sc THEN -v_sc_loss_rep ELSE -5 END;
                v_appellant_pc_delta  := CASE WHEN v_is_sc THEN -v_sc_loss_pc  ELSE -3 END;
                UPDATE public.factions
                   SET politician_reputation = GREATEST(0,
                          COALESCE(politician_reputation, 0) + v_appellant_rep_delta),
                       politician_influence     = GREATEST(0,
                          COALESCE(politician_influence, 0) + v_appellant_pc_delta)
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

    -- ── Experience awards (20270687) ─────────────────────────────
    -- Win → +0.3 politician_skill, Loss → +0.2. politician_skill is
    -- the column behind the "Experience" display label (8d3bd59).
    -- Both advocates get something — courtroom reps generate
    -- experience either way.
    IF v_winner_adv_id IS NOT NULL THEN
        UPDATE public.factions
           SET politician_skill = COALESCE(politician_skill, 0) + v_win_skill_delta
         WHERE id = v_winner_adv_id;
    END IF;
    IF v_loser_adv_id IS NOT NULL THEN
        UPDATE public.factions
           SET politician_skill = COALESCE(politician_skill, 0) + v_loss_skill_delta
         WHERE id = v_loser_adv_id;
    END IF;

    IF v_winner_adv_id IS NOT NULL THEN
        INSERT INTO public.politician_career_events (
            faction_id, event_tick, event_type, target_name, metadata
        ) VALUES (
            v_winner_adv_id, p_tick, 'won_case', v_case_caption,
            jsonb_build_object(
                'trial_id',    p_trial_id,
                'nation_name', v_nation_name,
                'side',        v_winner,
                'skill_delta', v_win_skill_delta
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
                'side',        CASE WHEN v_winner = 'plaintiff' THEN 'defendant' ELSE 'plaintiff' END,
                'skill_delta', v_loss_skill_delta
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
        'winner_influence_delta',    1,
        'winner_skill_delta',       CASE WHEN v_winner_adv_id IS NOT NULL THEN v_win_skill_delta END,
        'loser_skill_delta',        CASE WHEN v_loser_adv_id  IS NOT NULL THEN v_loss_skill_delta END,
        'appeal_flipped',           CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN v_appeal_flipped END,
        'appellant_rep_delta',      CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN v_appellant_rep_delta END,
        'appellant_pc_delta',       CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN v_appellant_pc_delta END
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
