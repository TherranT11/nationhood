-- ════════════════════════════════════════════════════════════════════
-- 20270549 — Legal Cases in-game year + won/lost_case career events
--
-- Two coupled fixes:
--
--   1. list_resolved_cases_for_nation was computing year_started from
--      shard.current_date adjusted by tick delta. shard.current_date
--      doesn't carry the in-game date — the in-game date is purely
--      derived from the tick number, anchored at tick 0 = January 2000
--      (see js/utils.js tickToDate / tickToYear, the source of truth
--      for the topbar "GAME DATE" line). The displayed year was coming
--      out as 2026 (the real-world year) instead of the in-game year
--      it should reflect.
--
--      Fix: year_started = 2000 + FLOOR(case_started_tick / 12). Same
--      formula and same anchor as the client helper, so the Legal
--      Cases panel and the topbar can't disagree about what year it
--      is. v_date is no longer needed and gets dropped from the
--      DECLARE block.
--
--   2. Career events on verdict. Per user spec, when a trial reaches
--      a verdict, both attorneys get a politician_career_events row:
--        Winner: event_type='won_case', target_name=case caption,
--                metadata.nation_name + metadata.trial_id
--        Loser:  event_type='lost_case', target_name=case caption,
--                metadata.trial_id
--      Rendered by the politician-home CAREER_EVENT_TEMPLATES map:
--        won_case  → "{politician} wins {case caption} in the nation
--                     of {nation}."
--        lost_case → "{politician} suffers a setback with a loss in
--                     the case of {case caption}."
--      Settlements (respond_settlement_conference) DON'T fire these —
--      there's no winner/loser on a settle.
--
-- Function body of _apply_verdict otherwise byte-identical to
-- 20270545. Only the year-fix on the list RPC and the career-event
-- inserts in _apply_verdict are new.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. list_resolved_cases_for_nation — tick-derived in-game year ──
CREATE OR REPLACE FUNCTION public.list_resolved_cases_for_nation(p_nation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_cases  jsonb;
BEGIN
    IF p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'plaintiff_name',     t.plaintiff_name,
            'defendant_name',     t.defendant_name,
            'case_type',          d.case_type,
            'litigation_type',    d.litigation_type,
            'overview',           d.overview,
            'plaintiff_attorney', NULLIF(btrim(COALESCE(pa.leader_first_name, '') || ' ' || COALESCE(pa.leader_last_name, '')), ''),
            'defendant_attorney', NULLIF(btrim(COALESCE(da.leader_first_name, '') || ' ' || COALESCE(da.leader_last_name, '')), ''),
            'winner',             t.verdict_winner,
            -- In-game year anchored at tick 0 = January 2000 (matches
            -- js/utils.js tickToYear so the panel and the topbar GAME
            -- DATE never disagree). Falls back via COALESCE chain when
            -- pre_trial_started_at_tick is null on legacy rows.
            'year_started',       2000 + FLOOR(
                COALESCE(t.pre_trial_started_at_tick, t.matched_at_tick, 0)
                / 12.0)::int
        ) ORDER BY t.verdict_at_tick DESC
    ), '[]'::jsonb) INTO v_cases
    FROM public.court_case_trials t
    JOIN public.court_case_drafts d ON d.id = t.case_draft_id
    LEFT JOIN public.factions pa ON pa.id = t.plaintiff_advocate_id
    LEFT JOIN public.factions da ON da.id = t.defendant_advocate_id
    WHERE t.nation_id = p_nation_id
      AND t.status    = 'resolved'
    LIMIT 50;

    RETURN jsonb_build_object('success', true, 'cases', v_cases);
END $$;

-- ── 2. _apply_verdict — won_case + lost_case career events ─────────
-- Same body as 20270545 plus, after the standard rep/standing/event
-- writes, two politician_career_events INSERTs: one per attorney
-- side that has a faction set. target_name is the case caption
-- ("plaintiff vs defendant"); metadata carries nation_name (for the
-- won_case template) + trial_id (for future deep-linking).
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

    IF v_trial.appeal_of_trial_id IS NOT NULL THEN
        SELECT verdict_winner INTO v_original_winner
          FROM public.court_case_trials WHERE id = v_trial.appeal_of_trial_id;
        IF v_original_winner = 'plaintiff' THEN
            v_appellant_id := v_trial.defendant_advocate_id;
        ELSIF v_original_winner = 'defendant' THEN
            v_appellant_id := v_trial.plaintiff_advocate_id;
        END IF;
        v_appeal_flipped := v_winner IS DISTINCT FROM v_original_winner;
        IF v_appellant_id IS NOT NULL THEN
            IF v_appeal_flipped THEN
                v_appellant_rep_delta := 3;
                v_appellant_pc_delta  := 5;
                UPDATE public.factions
                   SET politician_reputation = COALESCE(politician_reputation, 0) + 3,
                       political_capital     = COALESCE(political_capital, 0) + 5
                 WHERE id = v_appellant_id;
            ELSE
                v_appellant_rep_delta := -5;
                v_appellant_pc_delta  := -3;
                UPDATE public.factions
                   SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) - 5),
                       political_capital     = GREATEST(0, COALESCE(political_capital, 0) - 3)
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

    -- Verdict chat line.
    IF v_is_criminal THEN
        v_verdict_text := 'Jury verdict: ' ||
            'plaintiff ' || v_p_sum ||
            ' (chaos ' || (CASE WHEN v_p_chaos >= 0 THEN '+' ELSE '' END) || v_p_chaos || ' = ' || v_p_total || ') ' ||
            'vs defendant ' || v_d_sum ||
            ' (chaos ' || (CASE WHEN v_d_chaos >= 0 THEN '+' ELSE '' END) || v_d_chaos || ' = ' || v_d_total || '). ' ||
            'Judgment for the ' || v_winner || '.';
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

    -- Entity name + winning-attorney lookups for the event_log dispatch
    -- AND the career events below.
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

    IF v_trial.appeal_of_trial_id IS NOT NULL THEN
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
        CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN 'Appellate Verdict'
             WHEN v_is_criminal                          THEN 'Jury Verdict'
             ELSE                                              'Verdict Rendered' END,
        v_event_text,
        'politician',
        CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN 'trial_appellate_verdict'
             WHEN v_is_criminal                          THEN 'trial_jury_verdict'
             ELSE                                              'trial_verdict_rendered' END,
        p_tick
    );

    -- Career events (20270549). Both attorneys (where set) get a row:
    -- won_case for whichever side prevailed, lost_case for the other.
    -- Rendered by CAREER_EVENT_TEMPLATES on politician-home; target
    -- carries the case caption, metadata carries nation_name (used by
    -- the won_case template) + trial_id.
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

    RETURN jsonb_build_object(
        'success',                  true,
        'winner',                   v_winner,
        'mode',                     CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN 'appeal'
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

NOTIFY pgrst, 'reload schema';

COMMIT;
