-- ════════════════════════════════════════════════════════════════════
-- 20270646 — Capital / Influence column rename (display ↔ column align)
--
-- The two stat columns have been displaying under swapped labels since
-- 20270632:
--   politician_influence — display label "Capital" (the money stat)
--   political_capital    — display label "Influence" (the network stat)
--
-- Every new RPC has to remember that the display name doesn't match the
-- column name, and we've shipped three bugs from getting the swap wrong
-- in this session alone. Cleaning up by renaming the columns to match
-- the display labels:
--
--   politician_influence → politician_capital
--   political_capital   → politician_influence
--
-- The ALTER + the re-emits all run in one transaction so any function
-- referencing the old names breaks atomically and can be caught at
-- migration apply time, not silently at next call.
--
-- Apply after 20270645.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Reconcile column state ──────────────────────────────────────
-- Single self-healing block that handles every plausible live shape.
-- Diagnostic sampling on the linked DB confirmed the rename was already
-- done manually on the dashboard before this migration ever applied
-- (politician_capital + politician_influence both present, political_
-- capital absent, semantics already correct: small ints in _capital,
-- larger decimals in _influence). The fresh-state branch still does
-- the proper swap on databases that haven't been touched.
DO $$
DECLARE
    v_has_pol_capital   boolean;
    v_has_pol_influence boolean;
    v_has_old_capital   boolean;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema='public' AND table_name='factions'
                      AND column_name='politician_capital')   INTO v_has_pol_capital;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema='public' AND table_name='factions'
                      AND column_name='politician_influence') INTO v_has_pol_influence;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema='public' AND table_name='factions'
                      AND column_name='political_capital')    INTO v_has_old_capital;

    -- Target state — manual rename already landed correctly. No-op.
    IF v_has_pol_capital AND v_has_pol_influence AND NOT v_has_old_capital THEN
        RAISE NOTICE 'Columns already in target state; skipping renames.';

    -- Fresh pre-rename state — do the atomic swap.
    ELSIF v_has_pol_influence AND v_has_old_capital AND NOT v_has_pol_capital THEN
        ALTER TABLE public.factions RENAME COLUMN politician_influence TO politician_capital;
        ALTER TABLE public.factions RENAME COLUMN political_capital   TO politician_influence;

    -- Anything else (e.g. all three exist, or only old shape) is
    -- unexpected — bail with the observed shape so reconciliation can
    -- be designed deliberately rather than guessed.
    ELSE
        RAISE EXCEPTION
            'Unexpected column shape: politician_capital=%, politician_influence=%, political_capital=%',
            v_has_pol_capital, v_has_pol_influence, v_has_old_capital;
    END IF;
END $$;

COMMENT ON COLUMN public.factions.politician_capital IS
    'The "Capital" stat on the politician role card — money / favors banked. Liquid, transactional. Earned via salaries, party funds, kickbacks, File a Memo, race payouts. Spent on race entry fees, party donations, action costs. (Display label finally matches the column name as of 20270646; previously stored as politician_influence per 20270632''s swap.)';

COMMENT ON COLUMN public.factions.politician_influence IS
    'The "Influence" stat on the politician role card — network reach. Earned via chamber time, MP race wins, speeches, fundraising, sponsoring resolutions. Spent on lobbying, vote-whipping, calling in favours, pushing for appointments. (Display label finally matches the column name as of 20270646; previously stored as political_capital per 20270632''s swap.)';

-- ── 2. Re-emit every function whose body referenced the old column names ──
-- 30 functions touched.

-- From 20270583_consolidate_faction_stats.sql — public._apply_verdict
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
        'winner_influence_delta',    1,
        'appeal_flipped',           CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN v_appeal_flipped END,
        'appellant_rep_delta',      CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN v_appellant_rep_delta END,
        'appellant_pc_delta',       CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN v_appellant_pc_delta END
    );
END $$;

-- ── _complete_state_advocate_appointment — restore on recovery ──

-- From 20270583_consolidate_faction_stats.sql — public._complete_state_advocate_appointment
CREATE OR REPLACE FUNCTION public._complete_state_advocate_appointment(
    p_applicant_id  uuid,
    p_incumbent_id  uuid,
    p_request_id    uuid,
    p_tick          int
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_applicant   factions%ROWTYPE;
    v_incumbent   factions%ROWTYPE;
    v_nation_nm   text;
    v_app_name    text;
    v_inc_name    text;
    r_trial       record;
BEGIN
    SELECT * INTO v_applicant FROM public.factions WHERE id = p_applicant_id;
    IF v_applicant.id IS NULL THEN
        RAISE EXCEPTION 'applicant_not_found';
    END IF;

    IF p_incumbent_id IS NOT NULL THEN
        SELECT * INTO v_incumbent FROM public.factions WHERE id = p_incumbent_id;
        UPDATE public.factions
           SET politician_state_prosecutor_at_tick = NULL
         WHERE id = p_incumbent_id;
        UPDATE public.court_case_trials
           SET plaintiff_advocate_id = NULL
         WHERE nation_id = v_applicant.nation_id
           AND status = 'pre_trial'
           AND plaintiff_advocate_id = p_incumbent_id;
        UPDATE public.court_case_trials
           SET defendant_advocate_id = NULL
         WHERE nation_id = v_applicant.nation_id
           AND status = 'pre_trial'
           AND defendant_advocate_id = p_incumbent_id;
    END IF;

    UPDATE public.factions
       SET politician_state_prosecutor_at_tick = COALESCE(p_tick, 0),
           politician_capital      = COALESCE(politician_capital,      1) + 3,
           politician_influence        = COALESCE(politician_influence,        0) + 7
     WHERE id = p_applicant_id;

    FOR r_trial IN
        SELECT t.id
          FROM public.court_case_trials t
          JOIN public.court_case_drafts d ON d.id = t.case_draft_id
         WHERE t.nation_id = v_applicant.nation_id
           AND t.status    = 'pre_trial'
           AND ((d.plaintiff_party_type = 'state' AND t.plaintiff_advocate_id IS NULL)
             OR (d.defendant_party_type = 'state' AND t.defendant_advocate_id IS NULL))
    LOOP
        PERFORM public._attach_state_advocate_to_trial(r_trial.id);
    END LOOP;

    IF p_request_id IS NOT NULL THEN
        UPDATE public.state_advocate_appointment_requests
           SET status = 'approved', resolved_at_tick = COALESCE(p_tick, 0)
         WHERE id = p_request_id;
    END IF;

    v_app_name := btrim(COALESCE(v_applicant.leader_first_name, '') || ' ' || COALESCE(v_applicant.leader_last_name, ''));
    IF length(v_app_name) = 0 THEN
        v_app_name := COALESCE(v_applicant.faction_name, 'A politician');
    END IF;
    SELECT name INTO v_nation_nm FROM public.nations WHERE id = v_applicant.nation_id;

    INSERT INTO public.event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_applicant.nation_id, v_applicant.id,
        'State Advocate Appointed',
        v_app_name
            || ' has been appointed State Advocate of '
            || COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation')
            || ', charged with pursuing cases on behalf of the people.',
        'politician', 'politician_state_advocate_appt',
        COALESCE(p_tick, 0)
    );

    IF p_incumbent_id IS NOT NULL AND v_incumbent.id IS NOT NULL THEN
        v_inc_name := btrim(COALESCE(v_incumbent.leader_first_name, '') || ' ' || COALESCE(v_incumbent.leader_last_name, ''));
        IF length(v_inc_name) = 0 THEN
            v_inc_name := COALESCE(v_incumbent.faction_name, 'The previous State Advocate');
        END IF;
        INSERT INTO public.event_log (
            nation_id, faction_id,
            event_name, description_used,
            category, trigger_key,
            fired_at_tick
        ) VALUES (
            v_applicant.nation_id, v_incumbent.id,
            'State Advocate Replaced',
            v_inc_name || ' has been replaced as State Advocate by ' || v_app_name || '.',
            'politician', 'politician_state_advocate_displaced',
            COALESCE(p_tick, 0)
        );
    END IF;
END $$;

-- ── _corp_highest_standing_counsel — pick best counsel by Influence ──

-- From 20270583_consolidate_faction_stats.sql — public._corp_highest_standing_counsel
CREATE OR REPLACE FUNCTION public._corp_highest_standing_counsel(p_corp_id uuid)
RETURNS uuid
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
    SELECT f.id
      FROM public.corp_advocate_offers o
      JOIN public.factions f ON f.id = o.politician_id
     WHERE o.corp_id  = p_corp_id
       AND o.status   = 'accepted'
       AND f.abandoned_at IS NULL
       AND f.bar_admitted_nation_id IS NOT NULL
     ORDER BY COALESCE(f.politician_capital, 0) DESC, random()
     LIMIT 1;
$$;

-- ── _mp_action_check — MP action roll context ──

-- From 20270583_consolidate_faction_stats.sql — public._mp_action_check
CREATE OR REPLACE FUNCTION public._mp_action_check()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_pol   factions%ROWTYPE;
    v_party factions%ROWTYPE;
    v_tick  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office NOT IN ('member_of_parliament', 'senior_mp') THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'wrong_office',
            'have', v_pol.politician_office);
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_in_party');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_mp_action_tick IS NOT NULL AND v_pol.next_mp_action_tick > v_tick THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_mp_action_tick, 'current_tick', v_tick);
    END IF;

    SELECT * INTO v_party FROM factions WHERE id = v_pol.politician_party_id FOR UPDATE;
    IF v_party.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'party_not_found');
    END IF;

    RETURN jsonb_build_object(
        'ok',                true,
        'politician_id',     v_pol.id,
        'skill',       COALESCE(v_pol.politician_skill, 0),
        'charisma',          COALESCE(v_pol.politician_capital, 0),
        'reputation',        COALESCE(v_pol.politician_reputation, 0),
        'politician_influence', COALESCE(v_pol.politician_influence, 0),
        'party_id',          v_party.id,
        'party_name',        v_party.faction_name,
        'party_funds',       COALESCE(v_party.party_funds, 0),
        'current_tick',      v_tick
    );
END;
$$;

-- ── accept_drawn_case — Influence award on draw acceptance ──

-- From 20270583_consolidate_faction_stats.sql — public.accept_drawn_case
CREATE OR REPLACE FUNCTION public.accept_drawn_case(p_faction_id uuid, p_case_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_pol         factions%ROWTYPE;
    v_case_status text;
    v_standing    numeric;
    v_inserted    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_case_id IS NULL THEN
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

    SELECT status INTO v_case_status FROM public.court_case_drafts WHERE id = p_case_id;
    IF v_case_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_found');
    END IF;
    IF v_case_status <> 'approved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_approved');
    END IF;

    -- Gate the stat award on the INSERT actually landing. UNIQUE
    -- (politician_id, case_id) means a double-fire / replay only
    -- inserts once; v_inserted = 0 on the second try, and we bail
    -- before applying +0.2 again.
    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, p_case_id, 'accepted')
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
    END IF;

    UPDATE public.factions
       SET politician_capital = COALESCE(politician_capital, 0) + 0.2
     WHERE id = v_pol.id
    RETURNING politician_capital INTO v_standing;

    RETURN jsonb_build_object(
        'success',           true,
        'decision',          'accepted',
        'case_id',           p_case_id,
        'influence_delta',    0.2,
        'new_influence',      v_standing
    );
END $$;

-- ── begin_construction — building start, increments Influence ──

-- From 20270499_committee_hearings.sql — public.accept_hearing_testimony
CREATE OR REPLACE FUNCTION public.accept_hearing_testimony(p_testimony_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_test    committee_hearing_testimonies%ROWTYPE;
    v_hearing committee_hearings%ROWTYPE;
    v_sub     factions%ROWTYPE;
    v_tick    int;
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

    SELECT * INTO v_test FROM committee_hearing_testimonies WHERE id = p_testimony_id;
    IF v_test.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'testimony_not_found');
    END IF;
    IF v_test.accepted THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_accepted');
    END IF;

    SELECT * INTO v_hearing FROM committee_hearings WHERE id = v_test.hearing_id;
    IF v_hearing.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_not_found');
    END IF;

    PERFORM 1 FROM committee_members
     WHERE committee_id = v_hearing.committee_id AND politician_faction_id = v_pol.id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Conditional UPDATE so two members racing to accept the same
    -- testimony don't both fire the stat reward. The first writer wins;
    -- the second's UPDATE matches zero rows and the function returns
    -- without granting a second +1.
    UPDATE committee_hearing_testimonies
       SET accepted               = true,
           accepted_by_faction_id = v_pol.id,
           accepted_at_tick       = v_tick
     WHERE id = v_test.id
       AND accepted = false;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', true, 'testimony_id', v_test.id, 'already_accepted', true);
    END IF;

    -- Submitter reward. Skipped silently if the submitter faction is
    -- gone (ON DELETE SET NULL would have nulled submitter_faction_id).
    IF v_test.submitter_faction_id IS NOT NULL THEN
        SELECT * INTO v_sub FROM factions WHERE id = v_test.submitter_faction_id;
        IF v_sub.faction_type = 'politician' THEN
            UPDATE factions
               SET politician_influence = COALESCE(politician_influence, 0) + 1
             WHERE id = v_sub.id;
        ELSIF v_sub.faction_type = 'entrepreneur' THEN
            UPDATE factions
               SET ent_reputation = COALESCE(ent_reputation, 0) + 1
             WHERE id = v_sub.id;
        END IF;
        -- All other faction types: no stat reward (acceptance is the
        -- public-record reward).
    END IF;

    RETURN jsonb_build_object('success', true, 'testimony_id', v_test.id);
END $$;

GRANT EXECUTE ON FUNCTION public.accept_hearing_testimony(uuid) TO authenticated;

-- ── 7. close_committee_hearing ──────────────────────────────────────
-- Committee member only. Marks hearing closed. Idempotent — closing
-- an already-closed hearing is a no-op success.

-- From 20270505_bar_exam_active_politician.sql — public.bar_exam_submit
CREATE OR REPLACE FUNCTION public.bar_exam_submit(
    p_faction_id   uuid,
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
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
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
           SET politician_influence      = GREATEST(0, COALESCE(politician_influence, 0) - 2),
               bar_last_attempt_tick  = v_tick
         WHERE id = v_pol.id
        RETURNING politician_influence INTO v_new_pc;
        v_career_type := 'failed_bar_exam';
    END IF;

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
        'new_politician_influence', v_new_pc,
        'nation_name',     v_nation_name,
        'ready_at_tick',   v_tick + 3
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.bar_exam_submit(uuid, uuid[], char(1)[]) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.bar_exam_submit(uuid, uuid[], char(1)[]) TO authenticated;

-- From 20270583_consolidate_faction_stats.sql — public.list_available_advocates
CREATE OR REPLACE FUNCTION public.list_available_advocates(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_corp          entrepreneur_corps%ROWTYPE;
    v_owner_user_id uuid;
    v_advocates     jsonb;
    v_pending_count int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_corp FROM public.entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.hq_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_no_nation');
    END IF;

    SELECT COALESCE(linked_user_id, id) INTO v_owner_user_id
      FROM public.factions WHERE id = v_corp.owner_faction_id;
    IF v_owner_user_id IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT count(*) INTO v_pending_count
      FROM public.corp_advocate_offers
     WHERE corp_id = p_corp_id AND status = 'pending';

    -- Only advocates admitted to THIS corp's HQ nation. Excludes
    -- politicians already accepted/declined for this corp; pending
    -- stay so the OFFER SENT pill renders.
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id',           p.id,
        'name',         btrim(COALESCE(p.leader_first_name, '') || ' ' || COALESCE(p.leader_last_name, '')),
        'nation_id',    p.bar_admitted_nation_id,
        'nation_name',  n.name,
        'influence',     p.politician_capital,
        'skill',  p.politician_skill,
        'reputation',   p.politician_reputation,
        'offer_status', o.status
    ) ORDER BY p.politician_capital DESC NULLS LAST), '[]'::jsonb)
      INTO v_advocates
      FROM public.factions p
      LEFT JOIN public.nations n ON n.id = p.bar_admitted_nation_id
      LEFT JOIN public.corp_advocate_offers o
             ON o.corp_id = p_corp_id AND o.politician_id = p.id
     WHERE p.faction_type = 'politician'
       AND p.bar_admitted_nation_id = v_corp.hq_nation_id
       AND p.abandoned_at IS NULL
       AND (o.status IS NULL OR o.status = 'pending');

    RETURN jsonb_build_object(
        'success',        true,
        'corp_id',        p_corp_id,
        'corp_name',      v_corp.name,
        'pending_offers', v_pending_count,
        'max_offers',     3,
        'advocates',      v_advocates
    );
END $$;

-- ── list_corp_trial_alerts_for_owner — counsel display payload ──

-- From 20270583_consolidate_faction_stats.sql — public.list_corp_trial_alerts_for_owner
CREATE OR REPLACE FUNCTION public.list_corp_trial_alerts_for_owner(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_owner   factions%ROWTYPE;
    v_alerts  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_owner FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'entrepreneur'
       AND abandoned_at IS NULL;
    IF v_owner.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- For each pre-trial where one of the caller's corps is the open
    -- party, gather: trial info + corp + side info + the open side's
    -- pending advocate offers (with stats).
    WITH owner_corps AS (
        SELECT c.id, c.name, c.hq_nation_id
          FROM public.entrepreneur_corps c
         WHERE c.owner_faction_id = v_owner.id
    ),
    matches AS (
        SELECT
            t.id AS trial_id,
            t.case_draft_id,
            t.plaintiff_name,
            t.defendant_name,
            t.pre_trial_expires_at_tick,
            d.case_type,
            d.litigation_type,
            d.plaintiff_party_type,
            d.defendant_party_type,
            CASE WHEN t.plaintiff_advocate_id IS NULL THEN 'plaintiff' ELSE 'defendant' END AS open_side,
            oc_p.name AS plaintiff_corp_name,
            oc_d.name AS defendant_corp_name
          FROM public.court_case_trials t
          JOIN public.court_case_drafts d ON d.id = t.case_draft_id
          LEFT JOIN owner_corps oc_p
                 ON d.plaintiff_party_type = 'corporation'
                AND oc_p.hq_nation_id = t.nation_id
                AND oc_p.name = t.plaintiff_name
          LEFT JOIN owner_corps oc_d
                 ON d.defendant_party_type = 'corporation'
                AND oc_d.hq_nation_id = t.nation_id
                AND oc_d.name = t.defendant_name
         WHERE t.status = 'pre_trial'
           AND (
                (t.plaintiff_advocate_id IS NULL AND oc_p.id IS NOT NULL)
             OR (t.defendant_advocate_id IS NULL AND oc_d.id IS NOT NULL)
           )
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'trial_id',                  m.trial_id,
        'case_id',                   m.case_draft_id,
        'case_type',                 m.case_type,
        'litigation_type',           m.litigation_type,
        'plaintiff_name',            m.plaintiff_name,
        'defendant_name',            m.defendant_name,
        'open_side',                 m.open_side,
        'corp_name',                 CASE WHEN m.open_side = 'plaintiff'
                                            THEN m.plaintiff_corp_name
                                          ELSE m.defendant_corp_name END,
        'pre_trial_expires_at_tick', m.pre_trial_expires_at_tick,
        'offers', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'offer_id',     o.id,
                'advocate_id',  o.advocate_id,
                'advocate_name', btrim(COALESCE(f.leader_first_name, '') || ' ' || COALESCE(f.leader_last_name, '')),
                'influence',     f.politician_capital,
                'skill',  f.politician_skill,
                'reputation',   f.politician_reputation,
                'initiated_at', o.initiated_at
            ) ORDER BY o.initiated_at ASC), '[]'::jsonb)
              FROM public.trial_counsel_offers o
              JOIN public.factions f ON f.id = o.advocate_id
             WHERE o.trial_id = m.trial_id
               AND o.status = 'pending'
        )
    ) ORDER BY m.pre_trial_expires_at_tick ASC), '[]'::jsonb)
      INTO v_alerts
      FROM matches m;

    RETURN jsonb_build_object('success', true, 'alerts', v_alerts);
END $$;

-- ── politician_civic_meeting — local action, Skill check ──

-- From 20270583_consolidate_faction_stats.sql — public.list_pending_state_advocate_requests_for_reviewer
CREATE OR REPLACE FUNCTION public.list_pending_state_advocate_requests_for_reviewer(
    p_faction_id uuid
) RETURNS TABLE (
    request_id              uuid,
    applicant_faction_id    uuid,
    applicant_name          text,
    applicant_influence      int,
    applicant_reputation    int,
    applicant_skill   int,
    incumbent_name          text,
    created_at_tick         int
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
BEGIN
    IF v_uid IS NULL OR p_faction_id IS NULL THEN
        RETURN;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.factions
         WHERE id = p_faction_id
           AND (id = v_uid OR linked_user_id = v_uid)
           AND abandoned_at IS NULL
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        r.id,
        r.applicant_faction_id,
        NULLIF(btrim(COALESCE(a.leader_first_name, '') || ' ' || COALESCE(a.leader_last_name, '')), '')
            ::text AS applicant_name,
        r.applicant_influence,
        r.applicant_reputation,
        r.applicant_skill,
        NULLIF(btrim(COALESCE(i.leader_first_name, '') || ' ' || COALESCE(i.leader_last_name, '')), '')
            ::text AS incumbent_name,
        r.created_at_tick
      FROM public.state_advocate_appointment_requests r
      JOIN public.factions a ON a.id = r.applicant_faction_id AND a.abandoned_at IS NULL
 LEFT JOIN public.factions i ON i.id = r.incumbent_faction_id
     WHERE r.reviewer_faction_id = p_faction_id
       AND r.status = 'pending'
     ORDER BY r.created_at_tick ASC, r.id ASC;
END $$;


REVOKE EXECUTE ON FUNCTION public.list_pending_state_advocate_requests_for_reviewer(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_pending_state_advocate_requests_for_reviewer(uuid) TO authenticated;



-- ── politician_found_party — fix stale `politician_capital` reference ──
-- Pre-existing latent bug: this function's only definition (20270379)
-- pre-dates the 20270463 rename of politician_capital → politician_influence.
-- It has referenced a non-existent column since 20270463 (silently broken
-- for ~120 migrations). The 20270583 rename of politician_standing →
-- politician_capital would otherwise RESURRECT the column with WRONG
-- semantics (the new Influence stat instead of Political Capital).
-- Re-emit here with the correct column. Reason code updated:
-- 'insufficient_influence' → 'insufficient_capital'.

-- From 20270584_committee_chair_bid.sql — public.politician_bid_for_chair
CREATE OR REPLACE FUNCTION public.politician_bid_for_chair(
    p_faction_id   uuid,
    p_committee_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    -- Tunables.
    SKILL_THRESHOLD       CONSTANT numeric := 8;
    CAPITAL_COST          CONSTANT numeric := 15;
    COOLDOWN_TICKS        CONSTANT int     := 8;
    MEMBERSHIP_TICKS      CONSTANT int     := 4;
    NPC_CHAIR_SKILL_BASE  CONSTANT numeric := 7;
    REPUTATION_REWARD     CONSTANT int     := 2;
    REPUTATION_PENALTY    CONSTANT int     := 1;

    v_uid                 uuid := auth.uid();
    v_bidder              factions%ROWTYPE;
    v_bidder_row          committee_members%ROWTYPE;
    v_chair_row           committee_members%ROWTYPE;
    v_chair_pol           factions%ROWTYPE;
    v_tick                int;
    v_bid_d6              int;
    v_def_d6              int;
    v_bid_roll            numeric;
    v_def_roll            numeric;
    v_def_skill           numeric;
    v_won                 boolean;
    v_kind                text;  -- 'player' | 'npc' | 'vacant' (rejected before resolve)
    v_incumbent_name      text;
    v_bidder_name         text;
    v_new_capital         numeric;
    v_new_reputation      int;
    v_old_chair_pol_id    uuid;
    v_old_chair_party_id  uuid;
    v_old_chair_first     text;
    v_old_chair_last      text;
BEGIN
    -- ── Auth + politician ownership ──
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_committee_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bad_args');
    END IF;

    SELECT * INTO v_bidder
      FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_bidder.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    -- ── Tick (resolve once, reuse everywhere) ──
    SELECT current_tick INTO v_tick
      FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- ── Bidder must be a seated member of this committee. Lock the row. ──
    SELECT * INTO v_bidder_row
      FROM committee_members
     WHERE committee_id = p_committee_id
       AND politician_faction_id = v_bidder.id
     FOR UPDATE;
    IF v_bidder_row.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    IF v_bidder_row.role = 'chair' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_chair');
    END IF;
    IF (v_tick - COALESCE(v_bidder_row.seated_at_tick, v_tick)) < MEMBERSHIP_TICKS THEN
        RETURN jsonb_build_object('success', false, 'reason', 'membership_too_short',
            'need_ticks', MEMBERSHIP_TICKS,
            'have_ticks', v_tick - COALESCE(v_bidder_row.seated_at_tick, v_tick));
    END IF;

    -- ── Stat + cost + cooldown gates ──
    IF COALESCE(v_bidder.politician_skill, 0) < SKILL_THRESHOLD THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_skill',
            'required', SKILL_THRESHOLD,
            'have',     COALESCE(v_bidder.politician_skill, 0));
    END IF;
    IF COALESCE(v_bidder.politician_influence, 0) < CAPITAL_COST THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capital',
            'required', CAPITAL_COST,
            'have',     COALESCE(v_bidder.politician_influence, 0));
    END IF;
    IF COALESCE(v_bidder.next_chair_bid_tick, 0) > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'next_tick', v_bidder.next_chair_bid_tick);
    END IF;

    -- ── Lock the chair row. Two players racing in the same tick
    --    serialise here; the second one re-reads the (now-updated)
    --    chair row and rolls against whoever just took the seat. ──
    SELECT * INTO v_chair_row
      FROM committee_members
     WHERE committee_id = p_committee_id
       AND role = 'chair'
     FOR UPDATE;
    IF v_chair_row.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_chair_seat');
    END IF;

    -- ── Identify the incumbent + their defence stat ──
    IF v_chair_row.politician_faction_id IS NOT NULL THEN
        -- Plain SELECT (no FOR UPDATE): we only read Skill + name. Locking
        -- the chair's faction row here would create a cross-bid deadlock
        -- when Player A bids on Player B's seat while Player B
        -- simultaneously bids on Player A's seat — each tx holds its own
        -- faction lock and waits on the other's. The bid-time stat is a
        -- snapshot regardless of concurrent grinds, so no UPDATE is needed.
        SELECT * INTO v_chair_pol
          FROM factions WHERE id = v_chair_row.politician_faction_id;
        v_def_skill := COALESCE(v_chair_pol.politician_skill, 0);
        v_kind := 'player';
        v_incumbent_name := NULLIF(btrim(COALESCE(v_chair_pol.leader_first_name, '') || ' ' ||
                                          COALESCE(v_chair_pol.leader_last_name,  '')), '');
    ELSIF v_chair_row.npc_first_name IS NOT NULL THEN
        v_def_skill := NPC_CHAIR_SKILL_BASE;
        v_kind := 'npc';
        v_incumbent_name := NULLIF(btrim(COALESCE(v_chair_row.npc_first_name, '') || ' ' ||
                                          COALESCE(v_chair_row.npc_last_name,  '')), '');
    ELSE
        -- Genuinely vacant chair seat — fall through to the seed/refill
        -- path. We don't auto-promote here (would steal the open-seat
        -- moment from any other applicant).
        RETURN jsonb_build_object('success', false, 'reason', 'no_chair_seat');
    END IF;

    -- ── Resolve the roll ──
    v_bid_d6   := 1 + floor(random() * 6)::int;
    v_def_d6   := 1 + floor(random() * 6)::int;
    v_bid_roll := v_bid_d6 + COALESCE(v_bidder.politician_skill, 0);
    v_def_roll := v_def_d6 + v_def_skill;
    v_won      := v_bid_roll > v_def_roll;  -- ties favour the incumbent

    -- ── Debit Capital + stamp cooldown unconditionally ──
    UPDATE factions
       SET politician_influence   = GREATEST(0, COALESCE(politician_influence, 0) - CAPITAL_COST),
           next_chair_bid_tick = v_tick + COOLDOWN_TICKS
     WHERE id = v_bidder.id
    RETURNING politician_influence INTO v_new_capital;

    v_bidder_name := NULLIF(btrim(COALESCE(v_bidder.leader_first_name, '') || ' ' ||
                                   COALESCE(v_bidder.leader_last_name,  '')), '');

    IF v_won THEN
        -- +Reputation reward.
        UPDATE factions
           SET politician_reputation = GREATEST(0,
                   COALESCE(politician_reputation, 0) + REPUTATION_REWARD)
         WHERE id = v_bidder.id
        RETURNING politician_reputation INTO v_new_reputation;

        -- Snapshot displaced chair's identity BEFORE the swap.
        v_old_chair_pol_id   := v_chair_row.politician_faction_id;
        v_old_chair_party_id := v_chair_row.party_id;
        v_old_chair_first    := v_chair_row.npc_first_name;
        v_old_chair_last     := v_chair_row.npc_last_name;

        -- Promote bidder onto the chair row. Role stays 'chair'.
        UPDATE committee_members
           SET politician_faction_id = v_bidder.id,
               party_id              = v_bidder.politician_party_id,
               npc_first_name        = NULL,
               npc_last_name         = NULL,
               seated_at_tick        = v_tick
         WHERE id = v_chair_row.id;

        -- Demote old chair into bidder's old slot. Role stays whatever
        -- the bidder's old slot was (member / vice_chair / ranking_minority).
        UPDATE committee_members
           SET politician_faction_id = v_old_chair_pol_id,
               party_id              = v_old_chair_party_id,
               npc_first_name        = v_old_chair_first,
               npc_last_name         = v_old_chair_last,
               seated_at_tick        = v_tick
         WHERE id = v_bidder_row.id;

        -- Career events.
        INSERT INTO politician_career_events
               (faction_id,   event_tick, event_type,       target_name,      metadata)
        VALUES (v_bidder.id,  v_tick,    'bid_won_chair',  v_incumbent_name,
                jsonb_build_object(
                    'committee_id',    p_committee_id,
                    'bid_roll',        v_bid_roll,
                    'defender_roll',   v_def_roll,
                    'incumbent_kind',  v_kind));

        IF v_kind = 'player' AND v_old_chair_pol_id IS NOT NULL THEN
            INSERT INTO politician_career_events
                   (faction_id,         event_tick, event_type,           target_name,     metadata)
            VALUES (v_old_chair_pol_id, v_tick,     'lost_chair_to_bid',  v_bidder_name,
                    jsonb_build_object(
                        'committee_id',  p_committee_id,
                        'bid_roll',      v_bid_roll,
                        'defender_roll', v_def_roll));
        END IF;
    ELSE
        -- -Reputation penalty.
        UPDATE factions
           SET politician_reputation = GREATEST(0,
                   COALESCE(politician_reputation, 0) - REPUTATION_PENALTY)
         WHERE id = v_bidder.id
        RETURNING politician_reputation INTO v_new_reputation;

        INSERT INTO politician_career_events
               (faction_id,   event_tick, event_type,        target_name,      metadata)
        VALUES (v_bidder.id,  v_tick,    'bid_lost_chair',  v_incumbent_name,
                jsonb_build_object(
                    'committee_id',   p_committee_id,
                    'bid_roll',       v_bid_roll,
                    'defender_roll',  v_def_roll,
                    'incumbent_kind', v_kind));

        IF v_kind = 'player' AND v_chair_row.politician_faction_id IS NOT NULL THEN
            INSERT INTO politician_career_events
                   (faction_id,                          event_tick, event_type,                  target_name,    metadata)
            VALUES (v_chair_row.politician_faction_id,   v_tick,    'defended_chair_from_bid',   v_bidder_name,
                    jsonb_build_object(
                        'committee_id',  p_committee_id,
                        'bid_roll',      v_bid_roll,
                        'defender_roll', v_def_roll));
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success',             true,
        'won',                 v_won,
        'bid_roll',            v_bid_roll,
        'defender_roll',       v_def_roll,
        'incumbent_kind',      v_kind,
        'incumbent_name',      v_incumbent_name,
        'new_chair',           CASE WHEN v_won THEN v_bidder_name ELSE v_incumbent_name END,
        'new_capital',         v_new_capital,
        'new_reputation',      v_new_reputation,
        'cooldown_until_tick', v_tick + COOLDOWN_TICKS
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_bid_for_chair(uuid, uuid) TO authenticated;

-- From 20270641_city_council_member_actions.sql — public.politician_build_the_base
CREATE OR REPLACE FUNCTION public.politician_build_the_base(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_roll          int;
    v_cap_delta     int := 0;
    v_new_capital   numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    IF v_pol.politician_office IS DISTINCT FROM 'city_council_member' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_city_council');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;

    v_roll := 1 + floor(random() * 6)::int;
    IF v_roll = 6 THEN
        v_cap_delta := 2;
    ELSIF v_roll >= 2 THEN
        v_cap_delta := 1;
    END IF;
    -- v_roll = 1: no gain. Tick still burns (the action's cost is the
    -- opportunity, not the resource).

    UPDATE factions
       SET politician_capital       = COALESCE(politician_capital, 0) + v_cap_delta,
           next_local_action_tick     = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_capital INTO v_new_capital;

    RETURN jsonb_build_object(
        'success',         true,
        'action',          'build_the_base',
        'roll',            v_roll,
        'capital_delta',   v_cap_delta,
        'new_capital',     v_new_capital,
        'next_action_tick', v_tick + 1
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_build_the_base(uuid) TO authenticated;

-- ── 4. politician_lobby_minister ──────────────────────────────────
-- Random ministry pick mirrors the politician_sit_the_exam slug list
-- (20270471) — keep the four-slot CASE in lockstep when ministries
-- are added or renamed. Ministry display name comes back in the
-- response so the client doesn't need a slug→label map for this
-- single surface (the existing utils.js MINISTRY_NAMES is the SoT
-- it could use later if more clients need this mapping).

-- From 20270591_campaign_actions_member_candidate_split.sql — public.politician_door_knock
CREATE OR REPLACE FUNCTION public.politician_door_knock(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_roll      int;
    v_delta     int;
    v_new_inf   int;
    v_next      int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    v_roll  := 1 + floor(random() * 6)::int;
    v_delta := CASE WHEN v_roll = 1 THEN -1
                    WHEN v_roll <= 5 THEN  1
                    ELSE                   2 END;
    v_next  := v_tick + 1;

    UPDATE factions
       SET politician_influence       = GREATEST(0, COALESCE(politician_influence, 0) + v_delta),
           next_member_action_tick = v_next
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_inf;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'door_knock',
        'roll',                    v_roll,
        'influence_delta',         v_delta,
        'politician_influence',       v_new_inf,
        'next_member_action_tick', v_next
    );
END;
$$;

-- ── 3. politician_give_speech — Skill/Capital random 50/50 ─────────
-- Replaces the 20270588 1d6-polling body. Coin-flip between +1 Skill
-- (politician_skill) and +1 Capital (politician_capital). 3-tick
-- speech-specific cooldown on top of the shared 1-per-tick gate.

-- From 20270632_civil_servant_file_memo_and_action_lock.sql — public.politician_file_a_memo
CREATE OR REPLACE FUNCTION public.politician_file_a_memo()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_new_cap       int;
    v_new_inf       numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND politician_ministry IS NOT NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Per-tick cooldown — shared across FILE PAPERWORK + FILE A MEMO.
    IF v_pol.next_civil_service_action_tick IS NOT NULL
       AND v_pol.next_civil_service_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_civil_service_action_tick);
    END IF;

    -- +1 Capital (politician_capital), -1 Influence (political_
    -- capital, floored at 0). Single UPDATE for atomicity.
    UPDATE factions
       SET politician_capital            = COALESCE(politician_capital,   0) + 1,
           politician_influence               = GREATEST(0, COALESCE(politician_influence, 0) - 1),
           next_civil_service_action_tick  = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_influence, politician_capital
        INTO v_new_cap, v_new_inf;

    RETURN jsonb_build_object(
        'success',           true,
        'action',            'file_a_memo',
        'capital_delta',     1,
        'influence_delta',  -1,
        'new_capital',       v_new_inf,   -- "CAPITAL" pill reads politician_capital
        'new_influence',     v_new_cap,   -- "INFLUENCE" pill reads politician_influence
        'next_action_tick',  v_tick + 1
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_file_a_memo() TO authenticated;

-- ── 3. submit_paperwork_routing — share the per-tick lock ─────────
-- Body byte-identical to 20270630 except (a) the cooldown check
-- before any work and (b) the cooldown stamp on the post-grade
-- UPDATE. The per-dispatch 12-tick cooldown stays unchanged.

-- From 20270619_mp_races_use_skill.sql — public.politician_get_election_offer
CREATE OR REPLACE FUNCTION public.politician_get_election_offer(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_pol         factions%ROWTYPE;
    v_tick        int;
    v_shard_id    uuid;
    v_nation      nations%ROWTYPE;
    v_first_len   int;
    v_last_len    int;
    v_offer       politician_election_offers%ROWTYPE;
    v_has_active  boolean;
    v_com_district     text;
    v_com_opp_first    text;
    v_com_opp_last     text;
    v_com_opp_blurb    text;
    v_com_your         int;
    v_com_opp          int;
    v_com_odds         int;
    v_parl_district    text;
    v_parl_opp_first   text;
    v_parl_opp_last    text;
    v_parl_opp_blurb   text;
    v_parl_your        int;
    v_parl_opp         int;
    v_parl_odds        int;
    v_parl_opp_party_name  text;
    v_parl_opp_party_color text;
    v_com_suffixes constant text[] := ARRAY[
        '14th Ward','7th Ward','3rd Ward','Old Quarter','Market District',
        'Riverside','Hillside','Lower Quarter','Upper Quarter','Mercado',
        'Vieja','Antigua','Central','Costa','Plaza','Barrio Alto'
    ];
    v_parl_suffixes constant text[] := ARRAY[
        'Norte','Sur','Centro','Este','Oeste','Capital','Distrito Federal',
        'Litoral','Interior','Frontera'
    ];
    v_com_blurbs constant text[] := ARRAY[
        'pensioner, attends every meeting',
        'longtime block organizer',
        'retired schoolteacher',
        'small shopkeeper, well-liked',
        'local football coach',
        'former priest',
        'union retiree',
        'building superintendent'
    ];
    v_parl_blurbs constant text[] := ARRAY[
        'party fixer',
        'former union steward',
        'rising star, well-funded',
        'incumbent''s chosen successor',
        'lawyer, deep donor network',
        'media-savvy populist',
        'ex-cabinet aide',
        'celebrity outsider candidate'
    ];
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick, id INTO v_tick, v_shard_id FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM politician_active_election WHERE politician_id = v_pol.id
    ) INTO v_has_active;
    IF v_has_active THEN
        RETURN jsonb_build_object('success', false, 'reason', 'race_in_progress');
    END IF;

    SELECT * INTO v_offer FROM politician_election_offers WHERE politician_id = v_pol.id;
    IF v_offer.politician_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'community',  jsonb_build_object(
                'district',  v_offer.com_district,
                'opp_first', v_offer.com_opp_first,
                'opp_last',  v_offer.com_opp_last,
                'opp_blurb', v_offer.com_opp_blurb,
                'your_stat', v_offer.com_your_stat,
                'opp_stat',  v_offer.com_opp_stat,
                'odds_pct',  v_offer.com_odds_pct,
                'stake_win', v_offer.com_stake_win,
                'stake_lose', v_offer.com_stake_lose
            ),
            'parliament', jsonb_build_object(
                'district',  v_offer.parl_district,
                'opp_first', v_offer.parl_opp_first,
                'opp_last',  v_offer.parl_opp_last,
                'opp_blurb', v_offer.parl_opp_blurb,
                'opp_party_name',  v_offer.parl_opp_party_name,
                'opp_party_color', v_offer.parl_opp_party_color,
                'your_stat', v_offer.parl_your_stat,
                'opp_stat',  v_offer.parl_opp_stat,
                'odds_pct',  v_offer.parl_odds_pct,
                'stake_win', v_offer.parl_stake_win,
                'stake_lose', v_offer.parl_stake_lose
            )
        );
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_pol.nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    v_first_len := GREATEST(COALESCE(array_length(v_nation.first_name_pool, 1), 0), 1);
    v_last_len  := GREATEST(COALESCE(array_length(v_nation.last_name_pool,  1), 0), 1);

    v_com_district  := COALESCE(v_nation.last_name_pool[1 + floor(random() * v_last_len)::int], v_nation.name)
                       || ' ' || v_com_suffixes[1 + floor(random() * array_length(v_com_suffixes, 1))::int];
    v_parl_district := COALESCE(v_nation.last_name_pool[1 + floor(random() * v_last_len)::int], v_nation.name)
                       || ' ' || v_parl_suffixes[1 + floor(random() * array_length(v_parl_suffixes, 1))::int];

    v_com_opp_first  := COALESCE(v_nation.first_name_pool[1 + floor(random() * v_first_len)::int], 'Alex');
    v_com_opp_last   := COALESCE(v_nation.last_name_pool [1 + floor(random() * v_last_len )::int], 'Vargas');
    v_parl_opp_first := COALESCE(v_nation.first_name_pool[1 + floor(random() * v_first_len)::int], 'Sam');
    v_parl_opp_last  := COALESCE(v_nation.last_name_pool [1 + floor(random() * v_last_len )::int], 'Rivas');

    v_com_opp_blurb  := v_com_blurbs [1 + floor(random() * array_length(v_com_blurbs,  1))::int];
    v_parl_opp_blurb := v_parl_blurbs[1 + floor(random() * array_length(v_parl_blurbs, 1))::int];

    v_com_your  := COALESCE(v_pol.politician_skill, 1);
    v_com_opp   := GREATEST(1, v_com_your  + floor(random() * 5)::int - 2);
    -- 20270619: parl matchup now reads Skill too (was politician_capital).
    v_parl_your := COALESCE(v_pol.politician_skill, 1);
    v_parl_opp  := GREATEST(1, v_parl_your + floor(random() * 5)::int - 2);

    v_com_odds  := GREATEST(15, LEAST(85, 50 + 10 * (v_com_your  - v_com_opp )));
    v_parl_odds := GREATEST(15, LEAST(85, 50 + 10 * (v_parl_your - v_parl_opp)));

    SELECT faction_name, party_color
      INTO v_parl_opp_party_name, v_parl_opp_party_color
      FROM factions
     WHERE nation_id = v_pol.nation_id
       AND faction_type = 'movement_party'
       AND id <> p_party_id
       AND abandoned_at IS NULL
     ORDER BY random() LIMIT 1;

    INSERT INTO politician_election_offers (
        politician_id, shard_id,
        com_district, com_opp_first, com_opp_last, com_opp_blurb,
        com_your_stat, com_opp_stat, com_odds_pct,
        com_stake_win, com_stake_lose,
        parl_district, parl_opp_first, parl_opp_last, parl_opp_blurb,
        parl_opp_party_name, parl_opp_party_color,
        parl_your_stat, parl_opp_stat, parl_odds_pct,
        parl_stake_win, parl_stake_lose
    ) VALUES (
        v_pol.id, v_shard_id,
        v_com_district, v_com_opp_first, v_com_opp_last, v_com_opp_blurb,
        v_com_your, v_com_opp, v_com_odds,
        1, 0,
        v_parl_district, v_parl_opp_first, v_parl_opp_last, v_parl_opp_blurb,
        v_parl_opp_party_name, v_parl_opp_party_color,
        v_parl_your, v_parl_opp, v_parl_odds,
        3, -4
    )
    ON CONFLICT (politician_id) DO NOTHING;

    SELECT * INTO v_offer FROM politician_election_offers WHERE politician_id = v_pol.id;

    RETURN jsonb_build_object(
        'success', true,
        'community',  jsonb_build_object(
            'district',  v_offer.com_district,
            'opp_first', v_offer.com_opp_first,
            'opp_last',  v_offer.com_opp_last,
            'opp_blurb', v_offer.com_opp_blurb,
            'your_stat', v_offer.com_your_stat,
            'opp_stat',  v_offer.com_opp_stat,
            'odds_pct',  v_offer.com_odds_pct,
            'stake_win', v_offer.com_stake_win,
            'stake_lose', v_offer.com_stake_lose
        ),
        'parliament', jsonb_build_object(
            'district',  v_offer.parl_district,
            'opp_first', v_offer.parl_opp_first,
            'opp_last',  v_offer.parl_opp_last,
            'opp_blurb', v_offer.parl_opp_blurb,
            'opp_party_name',  v_offer.parl_opp_party_name,
            'opp_party_color', v_offer.parl_opp_party_color,
            'your_stat', v_offer.parl_your_stat,
            'opp_stat',  v_offer.parl_opp_stat,
            'odds_pct',  v_offer.parl_odds_pct,
            'stake_win', v_offer.parl_stake_win,
            'stake_lose', v_offer.parl_stake_lose
        )
    );
END;
$$;

-- ── politician_register_for_office — senior_mp branch reads Skill ──

-- From 20270591_campaign_actions_member_candidate_split.sql — public.politician_give_speech
CREATE OR REPLACE FUNCTION public.politician_give_speech(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    SPEECH_COOLDOWN CONSTANT int := 3;
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_pick      text;
    v_next      int;
    v_new_skill int;
    v_new_cap   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- Shared 1-per-tick gate (any member or candidate action).
    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;
    -- Speech-specific 3-tick cooldown.
    IF v_pol.next_speech_tick IS NOT NULL
       AND v_pol.next_speech_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'speech_cooldown',
            'ready_at_tick', v_pol.next_speech_tick);
    END IF;

    v_pick := CASE WHEN random() < 0.5 THEN 'skill' ELSE 'capital' END;
    v_next := v_tick + 1;

    IF v_pick = 'skill' THEN
        UPDATE factions
           SET politician_skill        = COALESCE(politician_skill, 0) + 1,
               next_member_action_tick = v_next,
               next_speech_tick        = v_tick + SPEECH_COOLDOWN
         WHERE id = v_pol.id
        RETURNING politician_skill INTO v_new_skill;
    ELSE
        UPDATE factions
           SET politician_capital    = COALESCE(politician_capital, 0) + 1,
               next_member_action_tick = v_next,
               next_speech_tick        = v_tick + SPEECH_COOLDOWN
         WHERE id = v_pol.id
        RETURNING politician_capital INTO v_new_cap;
    END IF;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'speech',
        'reward',                  v_pick,
        'politician_skill',        v_new_skill,
        'politician_capital',    v_new_cap,
        'next_member_action_tick', v_next,
        'next_speech_tick',        v_tick + SPEECH_COOLDOWN
    );
END;
$$;

-- ── 4. politician_run_political_ads — candidate Ads ────────────────
-- 1d10 + 6 → polling. Cost 1 Capital (politician_capital). Shared gate.

-- From 20270463_rename_influence_to_political_capital.sql — public.politician_join_party
CREATE OR REPLACE FUNCTION public.politician_join_party(
    p_politician_id uuid,
    p_party_id      uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_party     factions%ROWTYPE;
    v_tick      int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_pol FROM factions WHERE id = p_politician_id FOR UPDATE;
    IF v_pol.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_not_found'); END IF;
    IF v_pol.faction_type <> 'politician' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_a_politician'); END IF;
    IF v_pol.id <> v_uid AND v_pol.linked_user_id IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_pol.abandoned_at IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_inactive'); END IF;

    SELECT * INTO v_party FROM factions WHERE id = p_party_id;
    IF v_party.id IS NULL OR v_party.faction_type <> 'movement_party' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;
    IF v_party.abandoned_at IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'party_inactive'); END IF;
    IF v_party.nation_id IS DISTINCT FROM v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'different_nation');
    END IF;

    IF v_pol.politician_party_id = p_party_id THEN
        RETURN jsonb_build_object('success', true, 'party_name', v_party.faction_name, 'already_member', true);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    DECLARE
        v_first_join boolean := NOT EXISTS (
            SELECT 1 FROM politician_career_events
             WHERE faction_id = p_politician_id AND event_type = 'joined_party'
        );
    BEGIN
        UPDATE factions
           SET politician_party_id = p_party_id,
               politician_influence   = COALESCE(politician_influence, 0)
                                   + CASE WHEN v_first_join THEN 3 ELSE 0 END
         WHERE id = p_politician_id;

        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
        VALUES (p_politician_id, v_tick, 'joined_party', v_party.faction_name);

        RETURN jsonb_build_object('success', true,
            'party_id', p_party_id, 'party_name', v_party.faction_name,
            'politician_influence_delta', CASE WHEN v_first_join THEN 3 ELSE 0 END);
    END;
END;
$$;

-- ── 5. politician_leave_party — -5 Political Capital cost preserved ─
-- Re-paste of the 20270372 body with the column + return-key renamed.
-- The -5 cost is intact (clamp at 0). First-join +3 is in
-- politician_join_party; the combination makes leave + rejoin a net
-- loss, killing affiliation-churn farming.

-- From 20270463_rename_influence_to_political_capital.sql — public.politician_leave_party
CREATE OR REPLACE FUNCTION public.politician_leave_party(
    p_politician_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_party     factions%ROWTYPE;
    v_tick      int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_pol FROM factions WHERE id = p_politician_id FOR UPDATE;
    IF v_pol.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_not_found'); END IF;
    IF v_pol.faction_type <> 'politician' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_a_politician'); END IF;
    IF v_pol.id <> v_uid AND v_pol.linked_user_id IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_pol.abandoned_at IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_inactive'); END IF;

    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'already_independent', true);
    END IF;

    SELECT * INTO v_party FROM factions WHERE id = v_pol.politician_party_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET politician_party_id = NULL,
           politician_influence   = GREATEST(0, COALESCE(politician_influence, 0) - 5)
     WHERE id = p_politician_id;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
    VALUES (p_politician_id, v_tick, 'left_party', COALESCE(v_party.faction_name, 'a political party'));

    RETURN jsonb_build_object('success', true,
        'party_name', v_party.faction_name,
        'politician_influence_delta', -5);
END;
$$;

-- ── 6. politician_mp_fundraising_dinner ─────────────────────────────

-- From 20270642_city_council_actions_tuning.sql — public.politician_lobby_minister
CREATE OR REPLACE FUNCTION public.politician_lobby_minister(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_pol             factions%ROWTYPE;
    v_tick            int;
    v_roll            int;
    v_ministry_roll   int;
    v_ministry_slug   text;
    v_ministry_name   text;
    v_capital_delta   int := 0;
    v_rep_delta       numeric := 0;
    v_vol_delta       int := 0;
    v_inf_delta       int := -1;
    v_bracket         text;
    v_new_capital     numeric;
    v_new_influence   numeric;
    v_new_rep         numeric;
    v_new_volunteers  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    IF v_pol.politician_office IS DISTINCT FROM 'city_council_member' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_city_council');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;
    IF v_pol.next_lobby_minister_tick IS NOT NULL
       AND v_pol.next_lobby_minister_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'lobby_cooldown',
            'ready_at_tick', v_pol.next_lobby_minister_tick);
    END IF;
    IF COALESCE(v_pol.politician_influence, 0) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_influence',
            'have', COALESCE(v_pol.politician_influence, 0), 'need', 1);
    END IF;

    v_ministry_roll := 1 + floor(random() * 4)::int;
    v_ministry_slug := CASE v_ministry_roll
        WHEN 1 THEN 'defense'
        WHEN 2 THEN 'foreign_affairs'
        WHEN 3 THEN 'economic_development'
        WHEN 4 THEN 'interior'
    END;
    v_ministry_name := CASE v_ministry_roll
        WHEN 1 THEN 'Defense'
        WHEN 2 THEN 'Foreign Affairs & Trade'
        WHEN 3 THEN 'Economic Development'
        WHEN 4 THEN 'Interior'
    END;

    v_roll := 1 + floor(random() * 6)::int;
    IF v_roll = 1 THEN
        v_bracket := 'rebuffed';
        v_rep_delta := -1;
        -- 20270642: rebuff now also peels off a volunteer (floored).
        v_vol_delta := -1;
    ELSIF v_roll >= 5 THEN
        v_bracket := 'delivered';
        v_capital_delta := 1;
        v_rep_delta := 1;
    ELSE
        v_bracket := 'null_result';
    END IF;

    -- 20270642: cooldown 8 → 3 ticks.
    UPDATE factions
       SET politician_influence            = GREATEST(0, COALESCE(politician_influence, 0) + v_inf_delta),
           politician_capital         = COALESCE(politician_capital, 0)         + v_capital_delta,
           politician_reputation        = GREATEST(0, COALESCE(politician_reputation, 0) + v_rep_delta),
           volunteers                   = GREATEST(0, COALESCE(volunteers, 0) + v_vol_delta),
           next_local_action_tick       = v_tick + 1,
           next_lobby_minister_tick     = v_tick + 3
     WHERE id = v_pol.id
    RETURNING politician_capital, politician_influence, politician_reputation, volunteers
        INTO v_new_capital, v_new_influence, v_new_rep, v_new_volunteers;

    RETURN jsonb_build_object(
        'success',           true,
        'action',            'lobby_minister',
        'roll',              v_roll,
        'bracket',           v_bracket,
        'ministry',          v_ministry_slug,
        'ministry_name',     v_ministry_name,
        'capital_delta',     v_capital_delta,
        'reputation_delta',  v_rep_delta,
        'influence_delta',   v_inf_delta,
        'volunteer_delta',   v_vol_delta,
        'new_capital',       v_new_capital,
        'new_influence',     v_new_influence,
        'new_reputation',    v_new_rep,
        'new_volunteers',    v_new_volunteers,
        'next_action_tick',      v_tick + 1,
        'next_lobby_minister_tick', v_tick + 3
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_lobby_minister(uuid) TO authenticated;

-- From 20270642_city_council_actions_tuning.sql — public.politician_mobilize_volunteers
CREATE OR REPLACE FUNCTION public.politician_mobilize_volunteers(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_volunteers    int;
    v_pop_delta     numeric;
    v_new_capital   numeric;
    v_new_pop       numeric;
    v_party_name    text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    IF v_pol.politician_office IS DISTINCT FROM 'city_council_member' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_city_council');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;

    v_volunteers := COALESCE(v_pol.volunteers, 0);
    IF v_volunteers < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_volunteers');
    END IF;
    IF COALESCE(v_pol.politician_capital, 0) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capital',
            'have', COALESCE(v_pol.politician_capital, 0), 'need', 1);
    END IF;

    -- 20270642: multiplier 0.1 → 0.05 per Volunteer.
    v_pop_delta := 0.05 * v_volunteers;

    UPDATE factions
       SET politician_capital       = GREATEST(0, COALESCE(politician_capital, 0) - 1),
           next_local_action_tick     = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_capital INTO v_new_capital;

    UPDATE factions
       SET popularity_pct = LEAST(popularity_cap_pct,
                                  GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
    RETURNING popularity_pct, faction_name INTO v_new_pop, v_party_name;

    RETURN jsonb_build_object(
        'success',         true,
        'action',          'mobilize_volunteers',
        'volunteers',      v_volunteers,
        'popularity_delta', v_pop_delta,
        'new_popularity',  v_new_pop,
        'new_capital',     v_new_capital,
        'party_name',      v_party_name,
        'next_action_tick', v_tick + 1
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_mobilize_volunteers(uuid) TO authenticated;

-- ── 2. politician_lobby_minister — 3-tick cooldown, rebuff costs a volunteer ─

-- From 20270484_politician_resign_decrement_seats.sql — public.politician_resign_office
CREATE OR REPLACE FUNCTION public.politician_resign_office()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_party        factions%ROWTYPE;
    v_tick         int;
    v_office       text;
    v_office_label text;
    v_new_cap      int;
    v_new_pop      numeric;
    v_new_seats    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office IS NULL THEN
        RETURN jsonb_build_object('success', true, 'already_resigned', true);
    END IF;

    v_office       := v_pol.politician_office;
    v_office_label := CASE v_office
        WHEN 'community_organizer'  THEN 'Community Organizer'
        WHEN 'city_council_member'  THEN 'City Council Member'
        WHEN 'member_of_parliament' THEN 'Member of Parliament'
        WHEN 'senior_mp'            THEN 'Senior MP'
        ELSE initcap(replace(v_office, '_', ' '))
    END;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET politician_influence            = GREATEST(0, COALESCE(politician_influence, 0) - 2),
           politician_office            = NULL,
           politician_office_won_at_tick = NULL
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_cap;

    IF v_pol.politician_party_id IS NOT NULL THEN
        SELECT * INTO v_party FROM factions WHERE id = v_pol.politician_party_id FOR UPDATE;
        IF v_party.id IS NOT NULL THEN
            -- Popularity hit applies to every office tier.
            UPDATE factions
               SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 2)
             WHERE id = v_party.id
            RETURNING popularity_pct INTO v_new_pop;

            -- Seat decrement: parliament tier only. Mirrors the +1 bump
            -- on parliament wins in 20270418.
            IF v_office IN ('member_of_parliament', 'senior_mp') THEN
                UPDATE factions
                   SET seats = GREATEST(0, COALESCE(seats, 0) - 1)
                 WHERE id = v_party.id
                   AND faction_type = 'movement_party'
                   AND abandoned_at IS NULL
                RETURNING seats INTO v_new_seats;
            END IF;
        END IF;
    END IF;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (v_pol.id, v_tick, 'resigned_office', v_office_label,
            '{"seats_decremented": true}'::jsonb);

    RETURN jsonb_build_object(
        'success',               true,
        'office',                v_office_label,
        'new_politician_influence', v_new_cap,
        'new_party_popularity',  v_new_pop,
        'new_party_seats',       v_new_seats
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resign_office() TO authenticated;

-- ── One-time backfill ──────────────────────────────────────────────
-- Any existing parliament-tier resignation event (logged by the
-- previous version of politician_resign_office) didn't decrement
-- factions.seats. Mark each affected event with
-- metadata.seats_decremented = true after we apply the -1, so a
-- re-run of this migration is a no-op.

WITH pending AS (
    SELECT e.id AS event_id, f.politician_party_id
      FROM politician_career_events e
      JOIN factions f ON f.id = e.faction_id
     WHERE e.event_type = 'resigned_office'
       AND e.target_name IN ('Member of Parliament', 'Senior MP')
       AND f.politician_party_id IS NOT NULL
       AND NOT COALESCE((e.metadata->>'seats_decremented')::boolean, false)
),
seats_decremented AS (
    UPDATE factions
       SET seats = GREATEST(0, COALESCE(seats, 0) - 1)
      FROM pending
     WHERE factions.id = pending.politician_party_id
       AND factions.faction_type = 'movement_party'
       AND factions.abandoned_at IS NULL
    RETURNING factions.id
)
UPDATE politician_career_events
   SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"seats_decremented": true}'::jsonb
 WHERE id IN (SELECT event_id FROM pending);

-- From 20270635_city_council_run_or_former_co.sql — public.politician_resolve_due_elections
CREATE OR REPLACE FUNCTION public.politician_resolve_due_elections()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_tick         int;
    v_race         politician_active_election%ROWTYPE;
    v_won          boolean;
    v_stake        int;
    v_cap_before   numeric;
    v_new_cap      numeric;
    v_actual_delta numeric;
    v_event        text;
    v_opp_full     text;
    v_party_seats  int;
    v_party_pop    numeric;
    v_party_pop_cap numeric;
    v_party_funds  bigint;
    v_party_name   text;
    v_party_reward jsonb;
    v_party_penalty jsonb;
    v_new_cha      int;
    v_new_cred     numeric;
    v_new_rep      numeric;
    v_stat_reward  jsonb;
    v_office       text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'no_shard');
    END IF;

    SELECT f.* INTO v_pol
      FROM factions f
      JOIN politician_active_election pae ON pae.politician_id = f.id
     WHERE (f.id = v_uid OR f.linked_user_id = v_uid)
       AND f.faction_type = 'politician'
       AND f.abandoned_at IS NULL
       AND pae.resolve_tick < v_tick
     LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false);
    END IF;

    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false);
    END IF;
    IF v_race.resolve_tick >= v_tick THEN
        RETURN jsonb_build_object(
            'success', true, 'resolved', false,
            'race_tier', v_race.race_tier,
            'resolve_tick', v_race.resolve_tick,
            'current_tick', v_tick
        );
    END IF;

    IF v_race.polling_you_pct > v_race.polling_opp_pct THEN
        v_won := true;
    ELSIF v_race.polling_you_pct < v_race.polling_opp_pct THEN
        v_won := false;
    ELSE
        v_won := random() < 0.5;
    END IF;
    v_stake := CASE WHEN v_won THEN v_race.stake_win ELSE v_race.stake_lose END;
    v_event := CASE WHEN v_won THEN 'won_election' ELSE 'lost_election' END;
    v_opp_full := v_race.opp_first || ' ' || v_race.opp_last;
    v_cap_before := COALESCE(v_pol.politician_influence, 0);
    UPDATE factions
       SET politician_influence = GREATEST(0, v_cap_before + v_stake)
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_cap;
    v_actual_delta := v_new_cap - v_cap_before;

    IF v_won AND v_race.party_id IS NOT NULL THEN
        IF v_race.race_tier IN ('parliament', 'senior_mp') THEN
            UPDATE factions
               SET seats = COALESCE(seats, 0) + 1
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING seats, faction_name INTO v_party_seats, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',       'seats',
                    'delta',      1,
                    'new_value',  v_party_seats,
                    'party_name', v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'community' THEN
            -- Legacy reward shape — popularity bump only.
            UPDATE factions
               SET popularity_pct = LEAST(popularity_cap_pct, COALESCE(popularity_pct, 0) + 1)
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_pct, faction_name INTO v_party_pop, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',       'popularity',
                    'delta',      1,
                    'new_value',  v_party_pop,
                    'party_name', v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'city_council' THEN
            -- 20270635: City Council reward bundle — popularity +1,
            -- ceiling +1, funds +100K. The triple-update returns the
            -- three new values in one round trip and packs them into
            -- v_party_reward as a single block so the client can
            -- surface the full payout in one toast/banner.
            UPDATE factions
               SET popularity_cap_pct = COALESCE(popularity_cap_pct, 0) + 1,
                   popularity_pct     = LEAST(
                       COALESCE(popularity_cap_pct, 0) + 1,
                       COALESCE(popularity_pct, 0) + 1
                   ),
                   party_funds        = COALESCE(party_funds, 0) + 100000
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_pct, popularity_cap_pct, party_funds, faction_name
                 INTO v_party_pop, v_party_pop_cap, v_party_funds, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',           'city_council',
                    'popularity_delta',     1,
                    'popularity_new',       v_party_pop,
                    'popularity_cap_delta', 1,
                    'popularity_cap_new',   v_party_pop_cap,
                    'funds_delta',          100000,
                    'funds_new',            v_party_funds,
                    'party_name',           v_party_name
                );
            END IF;
        END IF;
    END IF;

    IF NOT v_won AND v_race.party_id IS NOT NULL THEN
        UPDATE factions
           SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 1)
         WHERE id = v_race.party_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
        RETURNING popularity_pct, faction_name INTO v_party_pop, v_party_name;
        IF FOUND THEN
            v_party_penalty := jsonb_build_object(
                'kind',       'popularity',
                'delta',      -1,
                'new_value',  v_party_pop,
                'party_name', v_party_name
            );
        END IF;
    END IF;

    IF v_won THEN
        IF v_race.race_tier IN ('parliament', 'senior_mp') THEN
            UPDATE factions
               SET politician_capital = COALESCE(politician_capital, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_capital INTO v_new_cha;
            v_stat_reward := jsonb_build_object('kind', 'influence', 'delta', 1, 'new_value', v_new_cha);
        ELSIF v_race.race_tier = 'community' THEN
            UPDATE factions
               SET politician_skill = COALESCE(politician_skill, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_skill INTO v_new_cred;
            v_stat_reward := jsonb_build_object('kind', 'skill', 'delta', 1, 'new_value', v_new_cred);
        ELSIF v_race.race_tier = 'city_council' THEN
            -- 20270635: City Council win bumps Reputation (numeric
            -- since 20270631), not Skill. Different lane than the
            -- community-organizer hit.
            UPDATE factions
               SET politician_reputation = COALESCE(politician_reputation, 0) + 1
             WHERE id = v_pol.id
            RETURNING politician_reputation INTO v_new_rep;
            v_stat_reward := jsonb_build_object('kind', 'reputation', 'delta', 1, 'new_value', v_new_rep);
        END IF;
        v_office := CASE v_race.race_tier
                        WHEN 'community'    THEN 'community_organizer'
                        WHEN 'parliament'   THEN 'member_of_parliament'
                        WHEN 'city_council' THEN 'city_council_member'
                        WHEN 'senior_mp'    THEN 'senior_mp'
                    END;
        IF v_office IS NOT NULL THEN
            UPDATE factions
               SET politician_office             = v_office,
                   politician_office_won_at_tick = v_tick
             WHERE id = v_pol.id;
        END IF;
        -- 20270635: community win stamps the former-CO flag so the
        -- City Council [Run for Election] gate keeps eligibility
        -- after the 12-tick term elapses.
        IF v_race.race_tier = 'community' THEN
            UPDATE factions
               SET politician_former_community_organizer = TRUE
             WHERE id = v_pol.id;
        END IF;
    END IF;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, v_event, v_race.district,
        jsonb_build_object(
            'race_tier',              v_race.race_tier,
            'district',               v_race.district,
            'opponent',               v_opp_full,
            'opp_party_name',         v_race.opp_party_name,
            'polling_you',            v_race.polling_you_pct,
            'polling_opp',            v_race.polling_opp_pct,
            'politician_influence_delta', v_actual_delta,
            'party_reward',           v_party_reward,
            'party_penalty',          v_party_penalty,
            'stat_reward',            v_stat_reward,
            'office_gained',          v_office
        )
    );
    DELETE FROM politician_active_election WHERE politician_id = v_pol.id;
    RETURN jsonb_build_object(
        'success',                true,
        'resolved',               true,
        'won',                    v_won,
        'race_tier',              v_race.race_tier,
        'district',               v_race.district,
        'opponent',               v_opp_full,
        'opp_party_name',         v_race.opp_party_name,
        'polling_you',            v_race.polling_you_pct,
        'polling_opp',            v_race.polling_opp_pct,
        'politician_influence_delta', v_actual_delta,
        'politician_influence',      v_new_cap,
        'party_reward',           v_party_reward,
        'party_penalty',          v_party_penalty,
        'stat_reward',            v_stat_reward,
        'office_gained',          v_office
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resolve_due_elections() TO authenticated;

-- From 20270591_campaign_actions_member_candidate_split.sql — public.politician_run_political_ads
CREATE OR REPLACE FUNCTION public.politician_run_political_ads(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    AD_COST    CONSTANT int := 1;
    FLAT_BONUS CONSTANT int := 6;
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_roll      int;
    v_total     int;
    v_race      politician_active_election%ROWTYPE;
    v_und_take  int;
    v_opp_take  int;
    v_new_cap   int;
    v_next      int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    IF COALESCE(v_pol.politician_capital, 0) < AD_COST THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capital',
            'required', AD_COST,
            'have',     COALESCE(v_pol.politician_capital, 0));
    END IF;

    v_roll  := 1 + floor(random() * 10)::int;
    v_total := v_roll + FLAT_BONUS;
    v_next  := v_tick + 1;

    UPDATE factions
       SET politician_capital    = GREATEST(0, COALESCE(politician_capital, 0) - AD_COST),
           next_member_action_tick = v_next
     WHERE id = v_pol.id
    RETURNING politician_capital INTO v_new_cap;

    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NOT NULL THEN
        v_und_take := LEAST(v_total, v_race.polling_undecided_pct);
        v_opp_take := v_total - v_und_take;
        UPDATE politician_active_election
           SET polling_you_pct       = LEAST(100, polling_you_pct + v_total),
               polling_undecided_pct = polling_undecided_pct - v_und_take,
               polling_opp_pct       = GREATEST(0, polling_opp_pct - v_opp_take)
         WHERE politician_id = v_pol.id;
    END IF;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'run_political_ads',
        'roll',                    v_roll,
        'polling_delta',           v_total,
        'cost',                    AD_COST,
        'politician_capital',    v_new_cap,
        'next_member_action_tick', v_next,
        'has_active_race',         v_race.politician_id IS NOT NULL
    );
END;
$$;

-- ── 5. politician_campaign_rally — candidate Rally ─────────────────
-- +1d6 polling. No cost. Shared 1-per-tick gate.
-- Named *_campaign_rally to disambiguate from the existing
-- politician_mp_hold_rally (the MP-in-office Hold a Rally, unrelated).

-- From 20270583_consolidate_faction_stats.sql — public.politician_seek_state_prosecutor_appointment
CREATE OR REPLACE FUNCTION public.politician_seek_state_prosecutor_appointment(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_tick         int;
    v_incumbent    factions%ROWTYPE;
    v_moi_id       uuid;
    v_existing     state_advocate_appointment_requests%ROWTYPE;
    v_tenure       int;
    v_request_id   uuid;
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

    PERFORM pg_advisory_xact_lock(555, hashtext(v_pol.nation_id::text));

    IF v_pol.bar_admitted_nation_id IS NULL
       OR v_pol.bar_admitted_nation_id IS DISTINCT FROM v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;
    IF v_pol.politician_experienced_advocate_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_experienced_advocate');
    END IF;
    IF COALESCE(v_pol.politician_reputation, 0) < 35 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'reputation_too_low',
            'reputation', COALESCE(v_pol.politician_reputation, 0), 'required', 35);
    END IF;
    IF COALESCE(v_pol.politician_influence, 0) < 25 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'politician_influence_too_low',
            'politician_influence', COALESCE(v_pol.politician_influence, 0), 'required', 25);
    END IF;
    IF v_pol.politician_state_prosecutor_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_appointed');
    END IF;

    SELECT * INTO v_existing
      FROM public.state_advocate_appointment_requests
     WHERE applicant_faction_id = v_pol.id
       AND status = 'pending'
     LIMIT 1;
    IF v_existing.id IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'pending', true,
            'already_pending', true, 'request_id', v_existing.id);
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT * INTO v_incumbent
      FROM public.factions
     WHERE nation_id = v_pol.nation_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND politician_state_prosecutor_at_tick IS NOT NULL
     LIMIT 1;

    SELECT party_id INTO v_moi_id
      FROM public.ministries
     WHERE nation_id = v_pol.nation_id
       AND ministry_key = 'interior'
       AND is_active = true
       AND party_id IS NOT NULL
     ORDER BY created_at DESC
     LIMIT 1;

    IF v_incumbent.id IS NULL AND v_moi_id IS NULL THEN
        PERFORM public._complete_state_advocate_appointment(
            v_pol.id, NULL, NULL, v_tick);
        RETURN jsonb_build_object('success', true,
            'appointed', true, 'displaced', false, 'at_tick', v_tick);
    END IF;

    IF v_moi_id IS NOT NULL THEN
        INSERT INTO public.state_advocate_appointment_requests (
            nation_id, applicant_faction_id, reviewer_faction_id,
            incumbent_faction_id, status,
            applicant_influence, applicant_reputation, applicant_skill,
            created_at_tick
        ) VALUES (
            v_pol.nation_id, v_pol.id, v_moi_id,
            v_incumbent.id, 'pending',
            COALESCE(v_pol.politician_capital,    1),
            COALESCE(v_pol.politician_reputation,  0),
            COALESCE(v_pol.politician_skill, 1),
            v_tick
        ) RETURNING id INTO v_request_id;
        RETURN jsonb_build_object('success', true, 'pending', true,
            'request_id', v_request_id);
    END IF;

    v_tenure := v_tick - COALESCE(v_incumbent.politician_state_prosecutor_at_tick, 0);
    IF v_tenure <= 36 THEN
        RETURN jsonb_build_object('success', false,
            'reason', 'incumbent_protected',
            'tenure_ticks', v_tenure,
            'ticks_remaining', 36 - v_tenure + 1);
    END IF;
    PERFORM public._complete_state_advocate_appointment(
        v_pol.id, v_incumbent.id, NULL, v_tick);
    RETURN jsonb_build_object('success', true,
        'appointed', true, 'displaced', true, 'at_tick', v_tick);
END $$;

-- ── read_statute_books — +Skill action ──

-- From 20270507_sit_the_exam_active_politician.sql — public.politician_sit_the_exam
CREATE OR REPLACE FUNCTION public.politician_sit_the_exam(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_roll          int;
    v_ministry_roll int;
    v_ministry_slug text;
    v_ministry_name text;
    v_cap_delta     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    -- No current career on any ladder.
    IF v_pol.bar_admitted_nation_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_in_career');
    END IF;
    IF v_pol.politician_party_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'has_party');
    END IF;
    IF v_pol.politician_office IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'in_office');
    END IF;
    IF v_pol.politician_ministry IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_civil_servant');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF v_pol.civil_service_exam_cooldown_until_tick IS NOT NULL
       AND v_pol.civil_service_exam_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.civil_service_exam_cooldown_until_tick);
    END IF;

    v_roll          := 1 + floor(random() * 6)::int;
    v_ministry_roll := 1 + floor(random() * 4)::int;
    v_ministry_slug := CASE v_ministry_roll
        WHEN 1 THEN 'defense'
        WHEN 2 THEN 'foreign_affairs'
        WHEN 3 THEN 'economic_development'
        WHEN 4 THEN 'interior'
    END;
    v_ministry_name := CASE v_ministry_roll
        WHEN 1 THEN 'Defense'
        WHEN 2 THEN 'Foreign Affairs & Trade'
        WHEN 3 THEN 'Economic Development'
        WHEN 4 THEN 'Interior'
    END;

    IF v_roll = 1 THEN
        v_cap_delta := -2;
        UPDATE factions
           SET politician_influence = GREATEST(0, COALESCE(politician_influence, 0) + v_cap_delta),
               civil_service_exam_cooldown_until_tick = v_tick + 12
         WHERE id = v_pol.id;

        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
        VALUES (v_pol.id, v_tick, 'civil_service_exam_failed', v_ministry_name);

        RETURN jsonb_build_object(
            'success',             true,
            'outcome',             'fail',
            'roll',                v_roll,
            'ministry_slug',       v_ministry_slug,
            'ministry_name',       v_ministry_name,
            'capital_delta',       v_cap_delta,
            'cooldown_until_tick', v_tick + 12
        );
    ELSE
        v_cap_delta := 3;
        UPDATE factions
           SET politician_influence   = COALESCE(politician_influence, 0) + v_cap_delta,
               politician_ministry = v_ministry_slug
         WHERE id = v_pol.id;

        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
        VALUES (v_pol.id, v_tick, 'civil_service_exam_passed', v_ministry_name);

        RETURN jsonb_build_object(
            'success',       true,
            'outcome',       'pass',
            'roll',          v_roll,
            'ministry_slug', v_ministry_slug,
            'ministry_name', v_ministry_name,
            'capital_delta', v_cap_delta
        );
    END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.politician_sit_the_exam(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_sit_the_exam(uuid) TO authenticated;

COMMENT ON FUNCTION public.politician_sit_the_exam(uuid) IS
    'Politician civil-service entry. Takes p_faction_id (the active politician — 20270505 pattern). Gates: bar_admitted_nation_id IS NULL (no judicial career), politician_party_id IS NULL, politician_office IS NULL, politician_ministry IS NULL, no active 12-tick cooldown. 1d6 roll: 1=fail (-2 PC, 12-tick cooldown), 2-6=pass (+3 PC, 1d4 ministry assignment).';

-- From 20270531_take_the_bench.sql — public.politician_take_the_bench
CREATE OR REPLACE FUNCTION public.politician_take_the_bench(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_full_name text;
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

    IF v_pol.politician_experienced_advocate_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_experienced_advocate');
    END IF;

    IF COALESCE(v_pol.politician_influence, 0) < 35 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'politician_influence_too_low',
            'politician_influence', COALESCE(v_pol.politician_influence, 0),
            'required',          35);
    END IF;

    IF v_pol.politician_magistrate_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_on_bench');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE public.factions
       SET politician_magistrate_at_tick = COALESCE(v_tick, 0)
     WHERE id = v_pol.id;

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' || COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'A politician');
    END IF;

    INSERT INTO public.event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        'Magistrate Sworn In',
        v_full_name
            || ' has donned a robe and joined the Ministry of Justice as a magistrate'
            || ' to preside over cases of the nation.',
        'politician', 'politician_magistrate_take_bench',
        COALESCE(v_tick, 0)
    );

    RETURN jsonb_build_object(
        'success',   true,
        'at_tick',   COALESCE(v_tick, 0)
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_take_the_bench(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_take_the_bench(uuid) TO authenticated;

-- From 20270463_rename_influence_to_political_capital.sql — public.process_annual_january
CREATE OR REPLACE FUNCTION public.process_annual_january(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_month         int := (p_tick % 12);
    v_year          int := 2000 + (p_tick / 12);
    v_last_year     int;
    v_ages_bumped   int := 0;
    v_caps_bumped   int := 0;
    v_pops_decayed  int := 0;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('ran', false, 'reason', 'null_tick');
    END IF;
    IF v_month <> 0 THEN
        RETURN jsonb_build_object('ran', false, 'reason', 'not_january', 'tick', p_tick);
    END IF;

    SELECT last_annual_processed_year INTO v_last_year
      FROM shard WHERE name = 'Alpha Shard' FOR UPDATE;
    IF v_last_year IS NOT NULL AND v_last_year >= v_year THEN
        RETURN jsonb_build_object('ran', false, 'reason', 'already_processed',
            'year', v_year, 'last_processed', v_last_year);
    END IF;

    UPDATE factions
       SET leader_age = COALESCE(leader_age, 0) + 1
     WHERE faction_type IN ('entrepreneur', 'politician')
       AND abandoned_at IS NULL;
    GET DIAGNOSTICS v_ages_bumped = ROW_COUNT;

    UPDATE factions
       SET politician_influence = COALESCE(politician_influence, 0) + 0.1,
           volunteers        = GREATEST(0, COALESCE(volunteers, 0) - 1)
     WHERE faction_type = 'politician'
       AND abandoned_at IS NULL;
    GET DIAGNOSTICS v_caps_bumped = ROW_COUNT;

    UPDATE factions
       SET popularity_pct = LEAST(popularity_cap_pct, GREATEST(0, COALESCE(popularity_pct, 0) - 2))
     WHERE faction_type = 'movement_party'
       AND abandoned_at IS NULL;
    GET DIAGNOSTICS v_pops_decayed = ROW_COUNT;

    UPDATE shard SET last_annual_processed_year = v_year WHERE name = 'Alpha Shard';

    RETURN jsonb_build_object(
        'ran',                     true,
        'tick',                    p_tick,
        'year',                    v_year,
        'ages_bumped',             v_ages_bumped,
        'politician_influence_bumped', v_caps_bumped,
        'parties_decayed',         v_pops_decayed
    );
END;
$$;

-- From 20270511_court_case_represent_refuse.sql — public.refuse_drawn_case
CREATE OR REPLACE FUNCTION public.refuse_drawn_case(p_faction_id uuid, p_case_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_pol         factions%ROWTYPE;
    v_case_status text;
    v_pc          numeric;
    v_inserted    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_case_id IS NULL THEN
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

    SELECT status INTO v_case_status FROM public.court_case_drafts WHERE id = p_case_id;
    IF v_case_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_found');
    END IF;
    IF v_case_status <> 'approved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_approved');
    END IF;

    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, p_case_id, 'refused')
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
    END IF;

    UPDATE public.factions
       SET politician_influence = GREATEST(0, COALESCE(politician_influence, 0) - 2)
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_pc;

    RETURN jsonb_build_object(
        'success',                 true,
        'decision',                'refused',
        'case_id',                 p_case_id,
        'politician_influence_delta', -2,
        'new_politician_influence',   v_pc
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.refuse_drawn_case(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.refuse_drawn_case(uuid, uuid) TO authenticated;

-- From 20270576_advocate_active_case_count_helper.sql — public.start_appeal
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

    v_active_count := public._advocate_active_case_count(v_pol.id);
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
    --   Regular appeal, both seats  → in_progress.
    --   Regular appeal, one open    → pre_trial.
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

    IF v_is_sc THEN
        -- Filing bonus: +1 Rep, +2 PC for getting in front of the
        -- Supreme Court. Applied once at filing, independent of verdict.
        UPDATE public.factions
           SET politician_reputation = COALESCE(politician_reputation, 0) + 1,
               politician_influence     = COALESCE(politician_influence, 0) + 2
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

-- From 20270499_committee_hearings.sql — public.submit_hearing_testimony
CREATE OR REPLACE FUNCTION public.submit_hearing_testimony(
    p_hearing_id uuid, p_persona_id uuid, p_text text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_hearing committee_hearings%ROWTYPE;
    v_pers    committee_hearing_personas%ROWTYPE;
    v_tick    int;
    v_text    text;
    v_id      uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    -- Resolve the caller's faction. Any faction type allowed; pick
    -- their earliest active one to avoid ambiguity for users with
    -- multiple factions linked.
    SELECT * INTO v_fac FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
    END IF;

    SELECT * INTO v_hearing FROM committee_hearings WHERE id = p_hearing_id;
    IF v_hearing.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_not_found');
    END IF;
    IF v_hearing.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_closed');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_tick > v_hearing.closes_at_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_window_passed');
    END IF;

    v_text := btrim(COALESCE(p_text, ''));
    IF length(v_text) < 1 OR length(v_text) > 400 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_text');
    END IF;

    -- Atomic persona claim. UPDATE … WHERE claimed_by IS NULL returns
    -- 0 rows if someone else claimed it between the page load and the
    -- click. RETURNING populates v_pers only on the winning path.
    UPDATE committee_hearing_personas
       SET claimed_by_faction_id = v_fac.id,
           claimed_at            = now()
     WHERE id = p_persona_id
       AND hearing_id = v_hearing.id
       AND claimed_by_faction_id IS NULL
    RETURNING * INTO v_pers;
    IF v_pers.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'persona_claimed');
    END IF;

    -- UNIQUE (hearing_id, submitter_faction_id) catches a second
    -- testimony from the same faction. On conflict, roll back the
    -- persona claim (so they can try a different persona — actually
    -- no, one-per-faction means even if they pick a different
    -- persona, they're blocked. So leave the claim; they're done).
    BEGIN
        INSERT INTO committee_hearing_testimonies (
            hearing_id, persona_id, submitter_faction_id, text, created_at_tick
        ) VALUES (
            v_hearing.id, v_pers.id, v_fac.id, v_text, v_tick
        ) RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
        -- Release the persona — caller already testified, so the
        -- claim is moot. Means another player could pick that
        -- persona afterwards, but better than orphaning it.
        UPDATE committee_hearing_personas
           SET claimed_by_faction_id = NULL, claimed_at = NULL
         WHERE id = v_pers.id;
        RETURN jsonb_build_object('success', false, 'reason', 'already_testified');
    END;

    RETURN jsonb_build_object(
        'success',       true,
        'testimony_id',  v_id,
        'persona_name',  v_pers.name,
        'persona_title', v_pers.title
    );
END $$;

GRANT EXECUTE ON FUNCTION public.submit_hearing_testimony(uuid, uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
