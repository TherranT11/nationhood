-- ════════════════════════════════════════════════════════════════════
-- 20270727 — Bigger verdict Experience awards + Experienced Advocate
--              gate moves from Reputation to Experience
--
-- Two related judicial tuning changes per user spec:
--
-- 1. Verdict Experience rewards bump up. 20270687 set 0.3 on win /
--    0.2 on loss — too small to feel meaningful at the bar-step-up
--    timescale. Bumping to:
--        Win  → +1.5 politician_skill
--        Loss → +1.0 politician_skill
--    Loser still gets something (courtroom reps generate XP either
--    way), win is meaningfully larger.
--
-- 2. Experienced Advocate (Tier 2) gate moves from "30 Reputation"
--    to "15 Experience." With the new verdict awards an advocate
--    nets +1.0-1.5 per trial; 15 Experience is roughly 10-15 cases
--    in the bar. The Reputation column stays available for the
--    upstream gates (State Advocate / Magistrate / etc.) but the
--    junior-to-senior step is now Experience-driven.
--
-- Both changes are forward-only — existing politicians don't get
-- retro-bumped; an already-stamped Experienced Advocate stays
-- stamped regardless of which stat got them there.
--
-- Two re-emits:
--   • _apply_verdict — body byte-faithful to 20270687 except the
--     two constants at the top of the DECLARE block.
--   • politician_step_up_experienced_advocate — body byte-faithful
--     to 20270699 except the gate (column / threshold / reason
--     code / return-field naming all flip to skill/Experience).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. _apply_verdict re-emit ─────────────────────────────────────
-- Body byte-faithful to 20270687 except:
--   v_win_skill_delta  := 1.5  (was 0.3)
--   v_loss_skill_delta := 1.0  (was 0.2)
-- Everything else — strength sums, settlement-decline penalty,
-- appeal payout, event_log dispatch, career-event metadata, SC
-- queue advancement — preserved exactly.
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
    -- 20270727: bumped from 0.3 / 0.2 per user spec.
    v_win_skill_delta     constant numeric := 1.5;
    v_loss_skill_delta    constant numeric := 1.0;
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

    -- Experience awards (20270727 bump). Win → +1.5 politician_skill,
    -- Loss → +1.0. Both advocates get something — courtroom reps
    -- generate experience either way.
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


-- ── 2. politician_step_up_experienced_advocate re-emit ────────────
-- Body byte-faithful to 20270699 except:
--   • Gate checks politician_skill >= 15 (was politician_reputation >= 30)
--   • Reason 'experience_too_low' (was 'reputation_too_low')
--   • Return fields 'experience' / 'required' (was 'reputation' / 'required')
-- The career_events + event_log dispatches and the at_tick stamp are
-- preserved exactly.
CREATE OR REPLACE FUNCTION public.politician_step_up_experienced_advocate(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_full_name text;
    v_nation_nm text;
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
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    IF v_pol.bar_admitted_nation_id IS NULL
       OR v_pol.bar_admitted_nation_id IS DISTINCT FROM v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    -- 20270727: gate moves from 30 Reputation to 15 Experience.
    IF COALESCE(v_pol.politician_skill, 0) < 15 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'experience_too_low',
            'experience', COALESCE(v_pol.politician_skill, 0),
            'required',   15);
    END IF;

    IF v_pol.politician_experienced_advocate_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_stepped_up');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE public.factions
       SET politician_experienced_advocate_at_tick = COALESCE(v_tick, 0)
     WHERE id = v_pol.id;

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' || COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'A politician');
    END IF;
    SELECT name INTO v_nation_nm FROM public.nations WHERE id = v_pol.nation_id;

    INSERT INTO public.event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        'Experienced Advocate',
        v_full_name
            || ' has been widely recognized as one of the more experienced attorneys in '
            || COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation')
            || ', and their name has been mentioned in national circles.',
        'politician', 'politician_experienced_advocate',
        COALESCE(v_tick, 0)
    );

    INSERT INTO public.politician_career_events
        (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, COALESCE(v_tick, 0),
        'experienced_advocate',
        COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation'),
        '{}'::jsonb
    );

    RETURN jsonb_build_object(
        'success',   true,
        'at_tick',   COALESCE(v_tick, 0)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.politician_step_up_experienced_advocate(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
