-- ════════════════════════════════════════════════════════════════════
-- 20270613 — Expose played-beat description on trial chat messages
--
-- get_trial_state's `messages` array surfaces beat_name + beat_type
-- for messages that played a beat, but not the beat's description
-- (the body text — e.g. "Three men—two fathers, one just 23 and
-- 11 days on the job—died…"). User reported that opposing counsel
-- sees only "FACT · The Three Workers" in the chat and can't read
-- what the played evidence actually says. The description text is
-- already returned for the calling side's own hand (line 134 of
-- 20270590), so this is a read-permission gap, not a new field.
--
-- Once a beat is played it's public to both sides — exposing the
-- description on the played message is informationally equivalent
-- to letting opposing counsel re-read what was just argued. Nothing
-- secret leaks (strength stays judge-only, unplayed hand stays
-- per-side).
--
-- Re-issues get_trial_state with one extra key in the message
-- jsonb. Body is otherwise byte-identical to 20270590. Same
-- response shape for every other field; ticks_until_forfeit /
-- case_beats / hand / witnesses / asked_witness_qa /
-- in_evidence_beats / pending_objection_message_id all unchanged.
--
-- Apply after 20270612.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.get_trial_state(p_faction_id uuid, p_trial_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_trial     court_case_trials%ROWTYPE;
    v_case      court_case_drafts%ROWTYPE;
    v_role      text;
    v_side      text;
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

    -- 20270613: surface beat_description for played beats so opposing
    -- counsel can read the evidence body, not just its title. Strength
    -- still gated on v_reveal (judge-only); description is public
    -- once played.
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id',                  m.id,
        'side',                m.side,
        'round',               m.round,
        'turn_seq',            m.turn_seq,
        'text',                m.text,
        'kind',                m.kind,
        'beat_played_index',   m.beat_played_index,
        'beat_name',           CASE WHEN m.beat_played_index IS NOT NULL
                                    THEN v_case.beats -> m.beat_played_index ->> 'name' END,
        'beat_type',           CASE WHEN m.beat_played_index IS NOT NULL
                                    THEN v_case.beats -> m.beat_played_index ->> 'type' END,
        'beat_description',    CASE WHEN m.beat_played_index IS NOT NULL
                                    THEN v_case.beats -> m.beat_played_index ->> 'description' END,
        'beat_strength',       CASE WHEN m.beat_played_index IS NOT NULL AND v_reveal
                                    THEN (v_case.beats -> m.beat_played_index ->> 'strength')::int END,
        'objected_beat_index', m.objected_beat_index,
        'settle_decision',     m.settle_decision,
        'created_at',          m.created_at
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
        'ticks_until_forfeit',
             CASE WHEN v_trial.current_turn_started_at_tick IS NOT NULL
                   AND v_trial.status = 'in_progress'
                   AND v_trial.pending_objection_message_id IS NULL
                   AND COALESCE(v_trial.awaiting_verdict, false) = false
                  THEN GREATEST(0,
                       v_trial.current_turn_started_at_tick + 4
                       - (SELECT current_tick FROM public.shard WHERE name = 'Alpha Shard'))
                  ELSE NULL END,
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

REVOKE EXECUTE ON FUNCTION public.get_trial_state(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_trial_state(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
