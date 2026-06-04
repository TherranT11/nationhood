-- ════════════════════════════════════════════════════════════════════
-- 20270583 — Consolidate faction stats to Reputation / Influence / Skill / Capital
--
-- The four-stat model (Standing+Credibility+Reputation+political_capital
-- on the politician side; Ambition+Cunning+Reputation+Vision+party_funds
-- on the entrepreneur side) is consolidated to a single shared trio of
-- Reputation / Influence / Skill, with cash already serving as Capital.
-- This brings both factions onto a common stat vocabulary, drops the
-- redundant fifth-stat carve-out (Vision), and removes the cognitive
-- load of two parallel stat systems with overlapping intent.
--
-- Column renames on factions:
--   politician_standing    → politician_influence
--   politician_credibility → politician_skill
--   ent_ambition           → ent_influence
--   ent_cunning            → ent_skill
-- Column dropped:
--   ent_vision             (no SQL writers — JS archetype data is the
--                           only producer; that file is updated in the
--                           same commit to remove the stat field)
-- Snapshot columns renamed in lockstep on
-- state_advocate_appointment_requests (20270555/57):
--   applicant_standing     → applicant_influence
--   applicant_credibility  → applicant_skill
--
-- Postgres does NOT rewrite PL/pgSQL function bodies on
-- ALTER TABLE RENAME COLUMN, so every function whose latest CREATE OR
-- REPLACE still references one of the renamed columns is re-emitted
-- below with the new names substituted. The list (18 functions) was
-- derived by walking migration history per function name and keeping
-- only the globally-latest definition.
--
-- JSONB return contracts updated in lockstep:
--   {'standing', N}    → {'influence', N}
--   {'credibility', N} → {'skill', N}
--   {'kind','credibility'} → {'kind','skill'}
-- Frontend JS readers (entrepreneur-topbar, politician-topbar,
-- corp-board-pressing-issues, trial-counsel-pressing-issues,
-- entrepreneur-archetype, entrepreneur-corp, politician-home,
-- politician-career) are updated in the same commit.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema changes ───────────────────────────────────────────────
ALTER TABLE public.factions RENAME COLUMN politician_standing    TO politician_influence;
ALTER TABLE public.factions RENAME COLUMN politician_credibility TO politician_skill;
ALTER TABLE public.factions RENAME COLUMN ent_ambition           TO ent_influence;
ALTER TABLE public.factions RENAME COLUMN ent_cunning            TO ent_skill;
ALTER TABLE public.factions DROP   COLUMN ent_vision;

-- Snapshot columns on state_advocate_appointment_requests (20270555/57)
-- mirror the politician stat names. Rename in lockstep so the snapshot
-- column names match what they snapshot.
ALTER TABLE public.state_advocate_appointment_requests
    RENAME COLUMN applicant_standing    TO applicant_influence;
ALTER TABLE public.state_advocate_appointment_requests
    RENAME COLUMN applicant_credibility TO applicant_skill;

-- ── _apply_verdict — verdict standing/influence adjustment ──
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
           SET politician_influence = COALESCE(politician_influence, 0) + 1
         WHERE id = v_trial.plaintiff_advocate_id;
    ELSIF v_winner = 'defendant' AND v_trial.defendant_advocate_id IS NOT NULL THEN
        UPDATE public.factions
           SET politician_influence = COALESCE(politician_influence, 0) + 1
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
        'winner_influence_delta',    1,
        'appeal_flipped',           CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN v_appeal_flipped END,
        'appellant_rep_delta',      CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN v_appellant_rep_delta END,
        'appellant_pc_delta',       CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN v_appellant_pc_delta END
    );
END $$;

-- ── _complete_state_advocate_appointment — restore on recovery ──
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
           politician_influence      = COALESCE(politician_influence,      1) + 3,
           political_capital        = COALESCE(political_capital,        0) + 7
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
     ORDER BY COALESCE(f.politician_influence, 0) DESC, random()
     LIMIT 1;
$$;

-- ── _mp_action_check — MP action roll context ──
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
        'charisma',          COALESCE(v_pol.politician_influence, 0),
        'reputation',        COALESCE(v_pol.politician_reputation, 0),
        'political_capital', COALESCE(v_pol.political_capital, 0),
        'party_id',          v_party.id,
        'party_name',        v_party.faction_name,
        'party_funds',       COALESCE(v_party.party_funds, 0),
        'current_tick',      v_tick
    );
END;
$$;

-- ── accept_drawn_case — Influence award on draw acceptance ──
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
       SET politician_influence = COALESCE(politician_influence, 0) + 0.2
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_standing;

    RETURN jsonb_build_object(
        'success',           true,
        'decision',          'accepted',
        'case_id',           p_case_id,
        'influence_delta',    0.2,
        'new_influence',      v_standing
    );
END $$;

-- ── begin_construction — building start, increments Influence ──
CREATE OR REPLACE FUNCTION public.begin_construction(
    p_corp_id        uuid,
    p_nation_id      uuid,
    p_name           text,
    p_tier           text,
    p_building_type  text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_corp         entrepreneur_corps%ROWTYPE;
    v_fac          factions%ROWTYPE;
    v_prof         record;
    v_eff_tier     text;
    v_cost         bigint;
    v_duration     int;
    v_ambition     smallint;
    v_tick         int;
    v_nation_name  text;
    v_id           uuid;
    v_has_rhq      boolean;
    v_cy_count     int;
    v_load         int;
    v_corp_cash    numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_name IS NULL OR length(btrim(p_name)) < 2 OR length(btrim(p_name)) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_building_type NOT IN ('regional_hq','construction_yard','port','banking_office',
                               'real_estate_office','engine_assembly_plant','light_assembly_plant') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_building_type');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_construction_corp');
    END IF;

    SELECT name INTO v_nation_name FROM nations WHERE id = p_nation_id;
    IF v_nation_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    SELECT * INTO v_prof FROM corp_building_cost_profile(p_building_type, p_tier, p_nation_id);
    v_eff_tier := v_prof.eff_tier;
    v_cost     := v_prof.cost;
    v_duration := v_prof.duration;
    v_ambition := v_prof.ambition;
    IF v_cost IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier');
    END IF;
    IF p_building_type = 'regional_hq' AND v_eff_tier NOT IN ('small','medium','large') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rhq_tier');
    END IF;

    IF p_building_type <> 'regional_hq' THEN
        IF p_nation_id <> v_corp.hq_nation_id THEN
            SELECT EXISTS (
                SELECT 1 FROM corp_buildings
                 WHERE owner_corp_id = p_corp_id
                   AND nation_id = p_nation_id
                   AND building_type = 'regional_hq'
                   AND status = 'completed'
            ) INTO v_has_rhq;
            IF NOT v_has_rhq THEN
                RETURN jsonb_build_object('success', false, 'reason', 'no_rhq_in_nation');
            END IF;
        END IF;
    END IF;

    -- Capacity gate (CY × 2) for commercial builds; shared pool with
    -- commissioned contracts via corp_commercial_build_load.
    IF p_building_type IN ('port','banking_office','real_estate_office',
                           'engine_assembly_plant','light_assembly_plant') THEN
        SELECT COUNT(*) INTO v_cy_count FROM corp_buildings
         WHERE owner_corp_id = p_corp_id
           AND nation_id = p_nation_id
           AND building_type = 'construction_yard'
           AND status = 'completed';
        v_load := corp_commercial_build_load(p_corp_id, p_nation_id);
        IF v_load >= v_cy_count * 2 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'capacity_exceeded',
                'cy_count', v_cy_count, 'max', v_cy_count * 2, 'in_progress', v_load);
        END IF;
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    v_corp_cash := COALESCE(v_corp.treasury_cash, 0);
    IF v_corp_cash < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_corp_cash::bigint, 'need', v_cost, 'payer', 'corp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_cost, updated_at = now()
     WHERE id = p_corp_id;
    UPDATE factions
       SET ent_influence = COALESCE(ent_influence, 0) + v_ambition
     WHERE id = v_fac.id;

    INSERT INTO corp_buildings
        (builder_corp_id, owner_corp_id, nation_id, name, tier, building_type,
         cost_paid, ambition_granted, status, started_at_tick, completes_at_tick)
    VALUES
        (p_corp_id, p_corp_id, p_nation_id, btrim(p_name), v_eff_tier, p_building_type,
         v_cost, v_ambition, 'in_progress', v_tick, v_tick + v_duration)
    RETURNING id INTO v_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        p_nation_id, v_fac.id, 'Construction Begins',
        format('%s breaks ground on %s (%s) in %s.',
               v_corp.name, btrim(p_name),
               CASE p_building_type
                   WHEN 'regional_hq'           THEN 'Regional HQ'
                   WHEN 'construction_yard'      THEN 'Construction Yard'
                   WHEN 'port'                   THEN 'Port'
                   WHEN 'banking_office'         THEN 'Banking Office'
                   WHEN 'real_estate_office'     THEN 'Real Estate Office'
                   WHEN 'engine_assembly_plant'  THEN 'Engine Assembly Plant'
                   WHEN 'light_assembly_plant'   THEN 'Light Assembly Plant'
               END, v_nation_name),
        'corporate', 'begin_construction',
        jsonb_build_object(
            'building_id', v_id, 'corp_id', p_corp_id, 'corp_name', v_corp.name,
            'tier', v_eff_tier, 'building_type', p_building_type, 'cost', v_cost,
            'duration', v_duration, 'completes_at_tick', v_tick + v_duration,
            'influence_bump', v_ambition, 'cost_multiplier', ROUND(v_prof.mult, 3),
            'cost_of_living', v_prof.col, 'infrastructure', v_prof.inf, 'payer', 'corp_treasury'
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success', true, 'building_id', v_id, 'tier', v_eff_tier,
        'building_type', p_building_type, 'cost', v_cost, 'duration', v_duration,
        'influence_bump', v_ambition, 'started_at_tick', v_tick,
        'completes_at_tick', v_tick + v_duration,
        'corp_cash_after', (v_corp_cash - v_cost)::bigint, 'cost_multiplier', ROUND(v_prof.mult, 3)
    );
END;
$$;

-- ── list_available_advocates — sort by Influence/Skill ──
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
        'influence',     p.politician_influence,
        'skill',  p.politician_skill,
        'reputation',   p.politician_reputation,
        'offer_status', o.status
    ) ORDER BY p.politician_influence DESC NULLS LAST), '[]'::jsonb)
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
                'influence',     f.politician_influence,
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
CREATE OR REPLACE FUNCTION public.politician_civic_meeting(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid               uuid := auth.uid();
    v_pol               factions%ROWTYPE;
    v_tick              int;
    v_roll              int;
    v_total             numeric;
    v_bracket           text;
    v_volunteer_delta   int := 0;
    v_pop_delta         numeric := 0;
    v_cred_delta        numeric := 0;
    v_vol_cap           numeric;
    v_new_vol           numeric;
    v_new_cred          numeric;
    v_new_pop           numeric;
    v_cooldown          int;
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
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_skill, 0);
    v_vol_cap := COALESCE(v_pol.politician_skill, 0) * 3;

    IF v_roll = 1 THEN
        v_bracket := 'crit_fail';
        v_volunteer_delta := -1;
    ELSIF v_total < 5 THEN
        v_bracket := 'fail';
        v_cred_delta := -0.5;
    ELSIF v_roll = 6 THEN
        v_bracket := 'crit';
        v_volunteer_delta := 2;
        v_pop_delta := 0.5;
    ELSE
        v_bracket := 'hit';
        v_volunteer_delta := 1;
    END IF;

    -- Volunteers: clamp at [0, cap]. The cap is recomputed AFTER any
    -- credibility delta so a fail+gain sequence doesn't free-overflow.
    -- Apply credibility first.
    IF v_cred_delta <> 0 THEN
        UPDATE factions
           SET politician_skill = GREATEST(0, COALESCE(politician_skill, 0) + v_cred_delta)
         WHERE id = v_pol.id
        RETURNING politician_skill INTO v_new_cred;
        v_vol_cap := v_new_cred * 3;
    END IF;
    IF v_volunteer_delta <> 0 THEN
        UPDATE factions
           SET volunteers = GREATEST(0, LEAST(v_vol_cap, COALESCE(volunteers, 0) + v_volunteer_delta))
         WHERE id = v_pol.id
        RETURNING volunteers INTO v_new_vol;
    END IF;
    IF v_pop_delta <> 0 THEN
        UPDATE factions
           SET popularity_pct = LEAST(popularity_cap_pct, GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
         WHERE id = p_party_id
           AND faction_type = 'movement_party'
        RETURNING popularity_pct INTO v_new_pop;
    END IF;

    v_cooldown := v_tick + 1;
    UPDATE factions SET next_local_action_tick = v_cooldown WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',          true,
        'action',           'civic_meeting',
        'roll',             v_roll,
        'skill',      COALESCE(v_pol.politician_skill, 0),
        'total',            v_total,
        'bracket',          v_bracket,
        'volunteer_delta',  v_volunteer_delta,
        'skill_delta', v_cred_delta,
        'popularity_delta', v_pop_delta,
        'new_volunteers',   COALESCE(v_new_vol, COALESCE(v_pol.volunteers, 0)),
        'new_skill',  COALESCE(v_new_cred, COALESCE(v_pol.politician_skill, 0)),
        'new_popularity',   v_new_pop,
        'volunteer_cap',    v_vol_cap,
        'next_action_tick', v_cooldown
    );
END;
$$;

-- ── politician_fundraising_call — local action, Skill check ──
CREATE OR REPLACE FUNCTION public.politician_fundraising_call(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid               uuid := auth.uid();
    v_pol               factions%ROWTYPE;
    v_tick              int;
    v_roll              int;
    v_total             numeric;
    v_bracket           text;
    v_money_raised      bigint := 0;
    v_volunteers_mult   numeric;
    v_new_funds         bigint;
    v_new_cred          numeric;
    v_cooldown          int;
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
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;

    v_roll  := 1 + floor(random() * 10)::int;
    v_total := v_roll + COALESCE(v_pol.politician_skill, 0);
    v_volunteers_mult := 1 + COALESCE(v_pol.volunteers, 0) * 0.1;

    IF v_roll = 1 THEN
        v_bracket := 'crit_fail';
        UPDATE factions
           SET politician_skill = GREATEST(0, COALESCE(politician_skill, 0) - 1)
         WHERE id = v_pol.id
        RETURNING politician_skill INTO v_new_cred;
    ELSIF v_total < 5 THEN
        v_bracket := 'fail';
    ELSIF v_roll = 10 THEN
        v_bracket := 'crit';
        v_money_raised := (round(v_roll * 1000 * v_volunteers_mult * 2))::bigint;
        UPDATE factions
           SET politician_skill = COALESCE(politician_skill, 0) + 1
         WHERE id = v_pol.id
        RETURNING politician_skill INTO v_new_cred;
    ELSE
        v_bracket := 'hit';
        v_money_raised := (round(v_roll * 1000 * v_volunteers_mult))::bigint;
    END IF;

    IF v_money_raised > 0 THEN
        UPDATE factions
           SET party_funds = COALESCE(party_funds, 0) + v_money_raised
         WHERE id = p_party_id
           AND faction_type = 'movement_party'
        RETURNING party_funds INTO v_new_funds;
    END IF;

    v_cooldown := v_tick + 1;
    UPDATE factions SET next_local_action_tick = v_cooldown WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',              true,
        'action',               'fundraising_call',
        'roll',                 v_roll,
        'skill',          COALESCE(v_pol.politician_skill, 0),
        'total',                v_total,
        'bracket',              v_bracket,
        'volunteers',           COALESCE(v_pol.volunteers, 0),
        'volunteers_multiplier', v_volunteers_mult,
        'money_raised',         v_money_raised,
        'party_funds_after',    v_new_funds,
        'new_skill',      v_new_cred,
        'next_action_tick',     v_cooldown
    );
END;
$$;

-- ── politician_get_election_offer — snapshot stats for race odds ──
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
    v_parl_your := COALESCE(v_pol.politician_influence, 1);
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

-- ── politician_give_speech — Speech action, Influence roll ──
CREATE OR REPLACE FUNCTION public.politician_give_speech(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_cooldown  int;
    v_next      int;
    v_roll      int;
    v_total     int;
    v_bracket   text;
    v_pop_delta numeric := 0;
    v_rep_delta int     := 0;
    v_new_pop   numeric;
    v_new_rep   int;
    v_race      politician_active_election%ROWTYPE;
    v_poll_you  int := 0;       -- signed delta on polling_you
    v_und_take  int;
    v_opp_take  int;
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

    -- Universal 1-per-turn gate (regression-restored).
    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;
    -- Action-specific cooldown.
    IF v_pol.speech_cooldown_until_tick IS NOT NULL
       AND v_pol.speech_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.speech_cooldown_until_tick);
    END IF;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_influence, 0);

    IF v_roll = 1 THEN
        v_bracket   := 'crit_fail';
        v_rep_delta := -3;
        v_poll_you  := -2;     -- bad bracket → swing AGAINST you
    ELSIF v_roll = 6 THEN
        v_bracket   := 'crit';
        v_pop_delta := 0.4;
        v_poll_you  := 5;      -- crit → +5 polling
    ELSIF v_total >= 5 THEN
        v_bracket   := 'hit';
        v_pop_delta := 0.2;
        v_poll_you  := 2;      -- standard hit → +2 polling
    ELSE
        v_bracket   := 'fail';
        v_rep_delta := -2;
        v_poll_you  := -2;     -- fail → swing AGAINST you
    END IF;

    UPDATE factions
       SET popularity_pct = LEAST(100, GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
    RETURNING popularity_pct INTO v_new_pop;
    IF v_new_pop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;

    v_cooldown := v_tick + 3;
    v_next     := v_tick + 1;
    UPDATE factions
       SET politician_reputation       = GREATEST(0, COALESCE(politician_reputation, 0) + v_rep_delta),
           speech_cooldown_until_tick  = v_cooldown,
           next_member_action_tick     = v_next
     WHERE id = v_pol.id
    RETURNING politician_reputation INTO v_new_rep;

    -- Polling bump on active race (regression-restored from 20270399,
    -- generalised for positive AND negative deltas). Positive →
    -- pulls from undecided first then opp; negative → opp gets the
    -- absolute value, you lose it. No-op if no active race.
    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NOT NULL AND v_poll_you <> 0 THEN
        IF v_poll_you > 0 THEN
            v_und_take := LEAST(v_poll_you, v_race.polling_undecided_pct);
            v_opp_take := v_poll_you - v_und_take;
            UPDATE politician_active_election
               SET polling_you_pct       = LEAST(100, polling_you_pct + v_poll_you),
                   polling_undecided_pct = polling_undecided_pct - v_und_take,
                   polling_opp_pct       = GREATEST(0, polling_opp_pct - v_opp_take)
             WHERE politician_id = v_pol.id;
        ELSE
            -- Negative: opp gains exactly |v_poll_you|, you lose it.
            UPDATE politician_active_election
               SET polling_you_pct = GREATEST(0, polling_you_pct + v_poll_you),
                   polling_opp_pct = LEAST(100, polling_opp_pct + (-v_poll_you))
             WHERE politician_id = v_pol.id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success',              true,
        'roll',                 v_roll,
        'influence',             COALESCE(v_pol.politician_influence, 0),
        'total',                v_total,
        'bracket',              v_bracket,
        'popularity_delta',     v_pop_delta,
        'reputation_delta',     v_rep_delta,
        'polling_delta',        v_poll_you,
        'popularity_pct',       v_new_pop,
        'politician_reputation', v_new_rep,
        'cooldown_until_tick',  v_cooldown,
        'next_member_action_tick', v_next
    );
END;
$$;

-- ── politician_office_hours — local action, +Skill on success ──
CREATE OR REPLACE FUNCTION public.politician_office_hours(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid               uuid := auth.uid();
    v_pol               factions%ROWTYPE;
    v_party_funds       bigint;
    v_tick              int;
    v_cost              bigint := 5000;
    v_roll              int;
    v_total             int;
    v_bracket           text;
    v_rep_delta         int := 0;
    v_cred_delta        numeric := 0;
    v_pop_delta         numeric := 0;
    v_new_funds         bigint;
    v_new_rep           int;
    v_new_cred          numeric;
    v_new_pop           numeric;
    v_cooldown          int;
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
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;

    SELECT party_funds INTO v_party_funds
      FROM factions
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_party_funds IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;
    IF v_party_funds < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_party_funds',
            'have', v_party_funds, 'need', v_cost);
    END IF;

    UPDATE factions
       SET party_funds = party_funds - v_cost
     WHERE id = p_party_id
    RETURNING party_funds INTO v_new_funds;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_reputation, 0);

    IF v_roll = 1 THEN
        v_bracket := 'crit_fail';
        v_rep_delta := -1;
    ELSIF v_total < 5 THEN
        v_bracket := 'fail';
        v_pop_delta := -0.5;
    ELSIF v_roll = 6 THEN
        v_bracket := 'crit';
        v_rep_delta := 1;
    ELSE
        v_bracket := 'hit';
        v_cred_delta := 0.5;
    END IF;

    IF v_rep_delta <> 0 THEN
        UPDATE factions
           SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) + v_rep_delta)
         WHERE id = v_pol.id
        RETURNING politician_reputation INTO v_new_rep;
    END IF;
    IF v_cred_delta <> 0 THEN
        UPDATE factions
           SET politician_skill = COALESCE(politician_skill, 0) + v_cred_delta
         WHERE id = v_pol.id
        RETURNING politician_skill INTO v_new_cred;
    END IF;
    IF v_pop_delta <> 0 THEN
        UPDATE factions
           SET popularity_pct = LEAST(popularity_cap_pct, GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
         WHERE id = p_party_id
           AND faction_type = 'movement_party'
        RETURNING popularity_pct INTO v_new_pop;
    END IF;

    v_cooldown := v_tick + 1;
    UPDATE factions SET next_local_action_tick = v_cooldown WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',          true,
        'action',           'office_hours',
        'roll',             v_roll,
        'reputation',       COALESCE(v_pol.politician_reputation, 0),
        'total',            v_total,
        'bracket',          v_bracket,
        'cost',             v_cost,
        'reputation_delta', v_rep_delta,
        'skill_delta', v_cred_delta,
        'popularity_delta', v_pop_delta,
        'party_funds_after', v_new_funds,
        'new_reputation',   v_new_rep,
        'new_skill',  v_new_cred,
        'new_popularity',   v_new_pop,
        'next_action_tick', v_cooldown
    );
END;
$$;

-- ── politician_register_for_office — Influence/Skill stake snapshot ──
CREATE OR REPLACE FUNCTION public.politician_register_for_office(p_target_office text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_tick         int;
    v_shard_id     uuid;
    v_first_pool   text[];
    v_last_pool    text[];
    v_opp_first    text;
    v_opp_last     text;
    v_opp_stat     int;
    v_your_stat    int;
    v_race_tier    text;
    v_resolve      int;
    v_next_elect   int;
    v_won_at       int;
    v_player_share numeric;
    v_poll_you     int;
    v_poll_opp     int;
    v_poll_und     int;
    v_next_action  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_target_office NOT IN ('city_council_member', 'senior_mp') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_target_office');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_party');
    END IF;
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    SELECT current_tick, id INTO v_tick, v_shard_id FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF EXISTS (SELECT 1 FROM politician_active_election WHERE politician_id = v_pol.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'race_in_progress');
    END IF;

    IF p_target_office = 'city_council_member' THEN
        IF v_pol.politician_office <> 'community_organizer' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                'have', v_pol.politician_office, 'expected', 'community_organizer');
        END IF;
        v_won_at := COALESCE(v_pol.politician_office_won_at_tick, v_tick);
        IF v_tick < v_won_at + 9 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                'opens_at_tick', v_won_at + 9, 'current_tick', v_tick);
        END IF;
        v_race_tier := 'city_council';
        v_your_stat := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat  := 1 + floor(random() * 6)::int;
        v_resolve   := v_tick + 1;
    ELSE
        IF v_pol.politician_office <> 'member_of_parliament' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                'have', v_pol.politician_office, 'expected', 'member_of_parliament');
        END IF;
        SELECT next_election_tick INTO v_next_elect FROM nations WHERE id = v_pol.nation_id;
        IF v_next_elect IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_general_election');
        END IF;
        IF v_tick < v_next_elect - 3 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                'opens_at_tick', v_next_elect - 3, 'current_tick', v_tick);
        END IF;
        IF v_tick > v_next_elect THEN
            RETURN jsonb_build_object('success', false, 'reason', 'window_closed',
                'last_open_tick', v_next_elect);
        END IF;
        v_race_tier := 'senior_mp';
        v_your_stat := COALESCE(v_pol.politician_influence, 1);
        v_opp_stat  := 1 + floor(random() * 6)::int;
        v_resolve   := v_next_elect;
    END IF;

    SELECT first_name_pool, last_name_pool INTO v_first_pool, v_last_pool
      FROM nations WHERE id = v_pol.nation_id;
    v_opp_first := COALESCE(pick_random_pool_name(v_first_pool), 'Opponent');
    v_opp_last  := COALESCE(pick_random_pool_name(v_last_pool),  'Smith');

    v_player_share := v_your_stat::numeric / GREATEST(1, v_your_stat + v_opp_stat);
    v_poll_you     := ROUND(v_player_share * 85)::int;
    v_poll_opp     := 85 - v_poll_you;
    v_poll_und     := 15;

    INSERT INTO politician_active_election (
        politician_id, shard_id, race_tier, district,
        opp_first, opp_last, opp_blurb, opp_party_name,
        your_stat, opp_stat, win_odds_pct, stake_win, stake_lose,
        resolve_tick,
        polling_you_pct, polling_opp_pct, polling_undecided_pct,
        party_id
    ) VALUES (
        v_pol.id, v_shard_id, v_race_tier,
        CASE v_race_tier
            WHEN 'city_council' THEN 'City Council seat'
            WHEN 'senior_mp'    THEN 'Senior MP slot'
        END,
        v_opp_first, v_opp_last, NULL, NULL,
        v_your_stat, v_opp_stat,
        GREATEST(1, LEAST(99, v_poll_you)),
        CASE v_race_tier WHEN 'city_council' THEN 2 ELSE 4 END,
        CASE v_race_tier WHEN 'city_council' THEN 0 ELSE -3 END,
        v_resolve,
        v_poll_you, v_poll_opp, v_poll_und,
        v_pol.politician_party_id
    );

    v_next_action := v_tick + 1;
    UPDATE factions SET next_member_action_tick = v_next_action WHERE id = v_pol.id;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, 'stood_for_election',
        CASE v_race_tier WHEN 'city_council' THEN 'City Council seat' ELSE 'Senior MP slot' END,
        jsonb_build_object(
            'race_tier',      v_race_tier,
            'opponent',       v_opp_first || ' ' || v_opp_last,
            'opp_party_name', NULL,
            'win_odds_pct',   v_poll_you,
            'opp_stat',       v_opp_stat,
            'your_stat',      v_your_stat
        )
    );

    RETURN jsonb_build_object(
        'success',                true,
        'race_tier',              v_race_tier,
        'target_office',          p_target_office,
        'opponent',               v_opp_first || ' ' || v_opp_last,
        'opp_stat',               v_opp_stat,
        'your_stat',              v_your_stat,
        'resolve_tick',           v_resolve,
        'polling_you_pct',        v_poll_you,
        'polling_opp_pct',        v_poll_opp,
        'polling_undecided_pct',  v_poll_und,
        'next_member_action_tick', v_next_action
    );
END;
$$;

-- ── politician_resolve_due_elections — Skill bump on win ──
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
    v_party_name   text;
    v_party_reward jsonb;
    v_party_penalty jsonb;
    v_new_cha      int;
    v_new_cred     numeric;
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

    -- Find a politician owned by the caller who has a DUE election —
    -- replaces 20270501's oldest-first pick that broke multi-
    -- politician accounts. The JOIN guarantees v_race below loads;
    -- the inner WHERE matches the resolve gate that used to live
    -- below the v_race fetch.
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
    -- Defensive: same gate as before, in case the row was modified
    -- between the JOIN above and this fetch. No-op in the happy path.
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
    v_cap_before := COALESCE(v_pol.political_capital, 0);
    UPDATE factions
       SET political_capital = GREATEST(0, v_cap_before + v_stake)
     WHERE id = v_pol.id
    RETURNING political_capital INTO v_new_cap;
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
        ELSIF v_race.race_tier IN ('community', 'city_council') THEN
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
               SET politician_influence = COALESCE(politician_influence, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_influence INTO v_new_cha;
            v_stat_reward := jsonb_build_object('kind', 'influence', 'delta', 1, 'new_value', v_new_cha);
        ELSIF v_race.race_tier IN ('community', 'city_council') THEN
            UPDATE factions
               SET politician_skill = COALESCE(politician_skill, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_skill INTO v_new_cred;
            v_stat_reward := jsonb_build_object('kind', 'skill', 'delta', 1, 'new_value', v_new_cred);
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
            'political_capital_delta', v_actual_delta,
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
        'political_capital_delta', v_actual_delta,
        'political_capital',      v_new_cap,
        'party_reward',           v_party_reward,
        'party_penalty',          v_party_penalty,
        'stat_reward',            v_stat_reward,
        'office_gained',          v_office
    );
END;
$$;

-- ── politician_seek_state_prosecutor_appointment — Influence/Skill prereq ──
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
    IF COALESCE(v_pol.political_capital, 0) < 25 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'political_capital_too_low',
            'political_capital', COALESCE(v_pol.political_capital, 0), 'required', 25);
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
            COALESCE(v_pol.politician_influence,    1),
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
CREATE OR REPLACE FUNCTION public.read_statute_books()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_pol             factions%ROWTYPE;
    v_tick            int;
    v_active_count    int;
    v_new_cred        int;
    v_new_rep         int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;
    IF v_pol.politician_magistrate_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.try_case_cooldown_until_tick IS NOT NULL
       AND v_pol.try_case_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.try_case_cooldown_until_tick);
    END IF;

    v_active_count := public._advocate_active_case_count(v_pol.id);
    IF v_active_count > 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'active_cases',
            'active', v_active_count);
    END IF;

    UPDATE public.factions
       SET politician_skill       = GREATEST(0, COALESCE(politician_skill, 0) + 2),
           politician_reputation        = GREATEST(0, COALESCE(politician_reputation, 0)  - 1),
           try_case_cooldown_until_tick = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_skill, politician_reputation
         INTO v_new_cred, v_new_rep;

    -- Actual deltas after the GREATEST floor — Reputation at 0
    -- doesn't move, so the client message stays honest.
    RETURN jsonb_build_object(
        'success',              true,
        'action',               'read_statute_books',
        'skill_delta',    v_new_cred - COALESCE(v_pol.politician_skill, 0),
        'reputation_delta',     v_new_rep  - COALESCE(v_pol.politician_reputation,  0),
        'new_skill',      v_new_cred,
        'new_reputation',       v_new_rep,
        'cooldown_until_tick',  v_tick + 1
    );
END $$;


-- ── list_pending_state_advocate_requests_for_reviewer — snapshot renames ──
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



-- ── politician_found_party — fix stale `politician_influence` reference ──
-- Pre-existing latent bug: this function's only definition (20270379)
-- pre-dates the 20270463 rename of politician_influence → political_capital.
-- It has referenced a non-existent column since 20270463 (silently broken
-- for ~120 migrations). The 20270583 rename of politician_standing →
-- politician_influence would otherwise RESURRECT the column with WRONG
-- semantics (the new Influence stat instead of Political Capital).
-- Re-emit here with the correct column. Reason code updated:
-- 'insufficient_influence' → 'insufficient_capital'.
CREATE OR REPLACE FUNCTION public.politician_found_party(
    p_politician_id   uuid,
    p_name            text,
    p_abbreviation    text,
    p_description     text,
    p_archetype       text,
    p_party_color     text,
    p_party_logo      text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_name         text := btrim(COALESCE(p_name, ''));
    v_abbr         text := btrim(COALESCE(p_abbreviation, ''));
    v_desc         text := btrim(COALESCE(p_description, ''));
    v_arch         text := btrim(COALESCE(p_archetype, ''));
    v_color        text := btrim(COALESCE(p_party_color, ''));
    v_logo         text := btrim(COALESCE(p_party_logo, ''));
    v_tick         int;
    v_new_id       uuid := gen_random_uuid();
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_pol FROM factions WHERE id = p_politician_id FOR UPDATE;
    IF v_pol.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_not_found'); END IF;
    IF v_pol.faction_type <> 'politician' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_a_politician'); END IF;
    IF v_pol.id <> v_uid AND v_pol.linked_user_id IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_pol.abandoned_at IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_inactive'); END IF;
    IF v_pol.nation_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_nation'); END IF;

    -- Gate (not deducted): 100 Political Capital required.
    IF COALESCE(v_pol.political_capital, 0) < 100 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capital',
            'required', 100, 'have', COALESCE(v_pol.political_capital, 0));
    END IF;

    -- Must be independent. Founding while affiliated would silently flip the
    -- politician's politician_party_id without logging a 'left_party' event
    -- or charging the -5 leave cost — that would let founding double as a
    -- free escape hatch from any existing party. Force the player to leave
    -- explicitly (paying -5) before they can found.
    IF v_pol.politician_party_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_affiliated');
    END IF;

    -- One active movement per politician (shared across all movement types).
    IF EXISTS (
        SELECT 1 FROM factions
         WHERE founder_faction_id = p_politician_id
           AND abandoned_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_founded');
    END IF;

    -- Field validation (kept tight; matches admin_create_party's limits).
    IF length(v_name) < 2 OR length(v_name) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF length(v_abbr) < 1 OR length(v_abbr) > 8 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_abbreviation');
    END IF;
    IF EXISTS (
        SELECT 1 FROM factions
         WHERE nation_id = v_pol.nation_id AND faction_type = 'movement_party'
           AND LOWER(faction_name) = LOWER(v_name) AND abandoned_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_exists');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE id = v_pol.shard_id;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO factions (
        id, faction_type, faction_name, nation_id, nation, shard_id,
        abbreviation, seats, party_color, party_logo, party_description,
        archetype, founder_faction_id,
        leader_first_name, leader_last_name, leader_age,
        founded_tick, action_points, needs_rebuild, abandoned_at
    ) VALUES (
        v_new_id, 'movement_party', v_name, v_pol.nation_id, v_pol.nation, v_pol.shard_id,
        v_abbr, 0,
        NULLIF(v_color, ''),
        COALESCE(NULLIF(v_logo, ''), 'star'),
        NULLIF(v_desc, ''),
        NULLIF(v_arch, ''),
        p_politician_id,
        v_pol.leader_first_name, v_pol.leader_last_name, v_pol.leader_age,
        v_tick, 0, false, NULL
    );

    -- Auto-affiliate the founder with their new party. No +3 bonus and no
    -- 'joined_party' event — founding isn't joining, and the bonus rule
    -- (gated on prior joined_party events) stays available for a future
    -- actual JOIN should the politician ever leave + sign on elsewhere.
    UPDATE factions
       SET politician_party_id = v_new_id
     WHERE id = p_politician_id;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
    VALUES (p_politician_id, v_tick, 'founded_party', v_name);

    RETURN jsonb_build_object('success', true,
        'party_id',   v_new_id,
        'party_name', v_name);
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_found_party(uuid, text, text, text, text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
