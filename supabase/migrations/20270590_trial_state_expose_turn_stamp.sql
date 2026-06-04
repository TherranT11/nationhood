-- ════════════════════════════════════════════════════════════════════
-- 20270590 — Expose ticks_until_forfeit to trial UI clients
--
-- Surfaces a server-computed "ticks until the current turn auto-flips"
-- on the two reader RPCs the politician-home trial UI consumes. The
-- count is computed against shard.current_tick at call time, so the
-- modal's 4-second poll refreshes the number naturally without the
-- client tracking ticks or re-reading the shard.
--
--   • get_trial_state v7      (modal)  — re-emits the v6 body from
--                                        20270536 with one extra field.
--   • list_active_trials_for_advocate v4
--                             (ti-card pressing-issues feed) — re-emits
--                                        the v3 body from 20270561.
--
-- Returns NULL when the trial isn't on the clock: status <> 'in_progress',
-- a pending objection is awaiting ruling, the round-4 verdict is pending,
-- or the stamp was never set (pre-Phase-2 / settlement-conference rows).
-- The client just hides the line in those cases.
--
-- ONE SOURCE OF TRUTH: the timeout is computed in exactly one place —
-- here in SQL — so the UI never needs to know the 4-tick window or do
-- the date math.
--
-- Apply after 20270589.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. get_trial_state v7 — add ticks_until_forfeit ───────────────
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

-- ── 2. list_active_trials_for_advocate v4 — same per row ─────────
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
        'current_round',       t.current_round,
        'ticks_until_forfeit',
             CASE WHEN t.current_turn_started_at_tick IS NOT NULL
                   AND t.status = 'in_progress'
                   AND t.pending_objection_message_id IS NULL
                   AND COALESCE(t.awaiting_verdict, false) = false
                  THEN GREATEST(0,
                       t.current_turn_started_at_tick + 4
                       - (SELECT current_tick FROM public.shard WHERE name = 'Alpha Shard'))
                  ELSE NULL END,
        'own_settlement_decision', CASE WHEN t.plaintiff_advocate_id = v_pol.id THEN t.plaintiff_settlement_decision
                                          WHEN t.defendant_advocate_id = v_pol.id THEN t.defendant_settlement_decision END,
        'pending_objection', t.pending_objection_message_id IS NOT NULL,
        'awaiting_verdict',  t.awaiting_verdict,
        'is_supreme_court',  (
            t.appeal_of_trial_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.court_case_trials parent
                 WHERE parent.id = t.appeal_of_trial_id
                   AND parent.appeal_of_trial_id IS NOT NULL
            )
        )
    ) ORDER BY t.matched_at_tick ASC NULLS LAST), '[]'::jsonb)
      INTO v_trials
      FROM public.court_case_trials t
      JOIN public.court_case_drafts d ON d.id = t.case_draft_id
     WHERE t.status IN ('in_progress', 'settlement_conference', 'awaiting_hearing')
       AND (t.plaintiff_advocate_id = v_pol.id
            OR t.defendant_advocate_id = v_pol.id
            OR t.judge_faction_id      = v_pol.id);

    RETURN jsonb_build_object('success', true, 'trials', v_trials);
END $$;


REVOKE EXECUTE ON FUNCTION public.get_trial_state(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_trial_state(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.list_active_trials_for_advocate(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_active_trials_for_advocate(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
