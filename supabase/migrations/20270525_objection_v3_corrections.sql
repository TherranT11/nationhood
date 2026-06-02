-- ════════════════════════════════════════════════════════════════════
-- 20270525 — Objection v3 corrections + case_beats exposure
--
-- Course-correct on top of 20270524. The chosen Section VI mechanic
-- keeps the 20270517 reactive-nullify layer; 20270524's send_objection
-- v2 dropped it. This migration:
--
--   1. send_objection v3. Layers the dice roll from v2 on top of the
--      20270517 reactive nullify:
--        • Target = opponent's most recently played, non-nullified
--          beat (same as 20270517). If no target exists, error
--          before any resources are spent.
--        • Roll 1d10:
--            1-5 sustained  → target beat nullified (0 verdict) +
--                              opponent -3 strength delta.
--            6-10 overruled → target beat STAYS in evidence (not
--                              nullified) + objector -3 strength
--                              delta.
--        • Ammo beat (opp-supporting beat from your hand) is
--          consumed (objected_at_round) either way.
--        • Action slot consumed either way.
--        • The played-then-nullified target satisfies witness
--          requires_beat gating below: a played beat is "in
--          evidence" regardless of nullified status.
--
--   2. call_witness_qa requires_beat gate narrowed. v2 accepted
--      either played OR objected; v3 requires PLAYED only. Ammo
--      beats (consumed via objection but never played) do NOT
--      satisfy the gate. Under this design, witness questions
--      requiring an opp-side beat depend on the opponent playing
--      that beat. If they never do, the question stays locked —
--      that's the explicit cost of the reactive-only OBJECTION
--      mechanic.
--
--   3. case_beats[] surfaced on get_trial_state. The witness-Q
--      picker needs to render `Requires: § X · <beat name>` for any
--      of the 10 beats — not just the lawyer's hand. Exposes
--      beat_index + name + type only (no strength, no support, no
--      description). Lawyer can see opp's beats by name + type
--      (consistent with the Q2 visibility choice from the design
--      review).
--
--   4. in_evidence_beats narrowed (mirrors the gate change in
--      call_witness_qa). PLAYED only.
--
--   5. Updates the comment on _apply_verdict so the nullified-beat
--      carve-out is described as actively used by the
--      sustained-objection path (v2's comment claimed it was a
--      legacy-only guard).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. send_objection v3 — restore reactive nullify, keep dice ─────
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
    v_clean_text   text;
    v_roll         int;
    v_sustained    boolean;
    v_judge_text   text;
    v_target_idx   int;
    v_next_seq     int;
    v_new_count    int;
    v_flipped      boolean := false;
    v_verdict      jsonb := NULL;
    v_tick         int;
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
    IF v_trial.current_turn <> v_side THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_turn');
    END IF;
    IF v_trial.messages_sent_this_turn >= 4 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'turn_message_cap');
    END IF;

    v_used := CASE WHEN v_side = 'plaintiff' THEN v_trial.plaintiff_objections_used
                                              ELSE v_trial.defendant_objections_used END;
    IF v_used >= 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'objection_cap_reached');
    END IF;

    -- Ammo: opp-supporting beat in caller's hand, unspent.
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

    -- Target: opp's most recently played, non-nullified beat.
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

    -- Consume ammo beat from hand.
    UPDATE public.court_case_trial_hands
       SET objected_at_round = v_trial.current_round
     WHERE trial_id = p_trial_id AND side = v_side AND beat_index = p_beat_index;

    -- Objection counter.
    IF v_side = 'plaintiff' THEN
        UPDATE public.court_case_trials
           SET plaintiff_objections_used = plaintiff_objections_used + 1
         WHERE id = p_trial_id;
    ELSE
        UPDATE public.court_case_trials
           SET defendant_objections_used = defendant_objections_used + 1
         WHERE id = p_trial_id;
    END IF;

    -- 1d10. 1-5 sustained: nullify target + opp -3. 6-10 overruled:
    -- target stays + objector -3. Either way ammo is gone.
    v_roll      := 1 + floor(random() * 10)::int;
    v_sustained := v_roll <= 5;

    IF v_sustained THEN
        v_judge_text := 'Objection sustained.';
        UPDATE public.court_case_trial_hands
           SET nullified = true
         WHERE trial_id = p_trial_id AND side = v_opp_side AND beat_index = v_target_idx;
        IF v_opp_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET plaintiff_objection_strength_delta =
                   plaintiff_objection_strength_delta - 3
             WHERE id = p_trial_id;
        ELSE
            UPDATE public.court_case_trials
               SET defendant_objection_strength_delta =
                   defendant_objection_strength_delta - 3
             WHERE id = p_trial_id;
        END IF;
    ELSE
        v_judge_text := 'Objection overruled.';
        IF v_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET plaintiff_objection_strength_delta =
                   plaintiff_objection_strength_delta - 3
             WHERE id = p_trial_id;
        ELSE
            UPDATE public.court_case_trials
               SET defendant_objection_strength_delta =
                   defendant_objection_strength_delta - 3
             WHERE id = p_trial_id;
        END IF;
    END IF;

    v_clean_text := btrim(COALESCE(p_text, ''));
    IF length(v_clean_text) = 0 THEN
        v_clean_text := 'Objection, your Honor.';
    END IF;
    IF length(v_clean_text) > 240 THEN
        v_clean_text := substring(v_clean_text from 1 for 240);
    END IF;

    -- Counsel's objection (consumes action slot) + judge ruling (free).
    v_next_seq := v_trial.messages_sent_this_turn + 1;
    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind,
        beat_played_index, objected_beat_index
    ) VALUES (
        p_trial_id, v_side, v_trial.current_round, v_next_seq,
        v_clean_text, 'objection',
        p_beat_index, v_target_idx
    );

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, 'system', v_trial.current_round, 0,
        v_judge_text, 'judge_ruling'
    );

    -- Turn-flip / verdict-trigger. Duplication across send_objection,
    -- call_witness_qa, send_trial_message remains a known issue —
    -- refactor deferred for risk reduction (flagged in 20270524 audit).
    v_new_count := v_next_seq;
    IF v_new_count >= 4 THEN
        IF v_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET current_turn = 'defendant',
                   messages_sent_this_turn = 0
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
                UPDATE public.court_case_trials
                   SET messages_sent_this_turn = 0
                 WHERE id = p_trial_id;
                SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
                v_verdict := public._apply_verdict(p_trial_id, COALESCE(v_tick, 0));
                v_flipped := true;
            END IF;
        END IF;
    ELSE
        UPDATE public.court_case_trials
           SET messages_sent_this_turn = v_new_count
         WHERE id = p_trial_id;
    END IF;

    RETURN jsonb_build_object(
        'success',              true,
        'side',                 v_side,
        'consumed_beat_index',  p_beat_index,
        'target_beat_index',    v_target_idx,
        'nullified_beat_index', CASE WHEN v_sustained THEN v_target_idx END,
        'roll',                 v_roll,
        'sustained',            v_sustained,
        'ruling_text',          v_judge_text,
        'objections_used',      v_used + 1,
        'objections_remaining', 3 - (v_used + 1),
        'flipped',              v_flipped,
        'verdict',              v_verdict
    );
END $$;

-- ── 2. call_witness_qa v2 — narrow requires_beat gate to PLAYED ────
-- v2 in 20270524 accepted any played-or-objected beat. v3 requires
-- the beat be PLAYED (nullified is fine; ammo isn't). Re-author with
-- the same body except for that one gate line.
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
    v_tick          int;
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
    v_witness_name := COALESCE(NULLIF(btrim(v_witness ->> 'name'), ''), 'Witness');
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

    -- requires_beat: PLAYED only (nullified counts — it was played).
    -- Ammo beats (objected_at_round set, played_at_round NULL) do
    -- NOT satisfy the gate.
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
               SET current_turn = 'defendant',
                   messages_sent_this_turn = 0
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
                UPDATE public.court_case_trials
                   SET messages_sent_this_turn = 0
                 WHERE id = p_trial_id;
                SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
                v_verdict := public._apply_verdict(p_trial_id, COALESCE(v_tick, 0));
                v_flipped := true;
            END IF;
        END IF;
    ELSE
        UPDATE public.court_case_trials
           SET messages_sent_this_turn = v_new_count
         WHERE id = p_trial_id;
    END IF;

    RETURN jsonb_build_object(
        'success',       true,
        'side',          v_side,
        'witness_index', p_witness_idx,
        'phase',         p_phase,
        'qa_index',      p_qa_idx,
        'supports',      v_supports,
        'flipped',       v_flipped,
        'verdict',       v_verdict
    );
END $$;

-- ── 3. get_trial_state v3 — add case_beats, narrow in_evidence ─────
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
    v_case_beats jsonb;
    v_messages  jsonb;
    v_witnesses jsonb;
    v_asked_qa  jsonb;
    v_evidence  jsonb;
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

    -- All 10 case beats — name + type only. The witness-Q picker
    -- uses this to label requires_beat references. Strength + support
    -- + description withheld for beats not in caller's hand.
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'beat_index', (ord - 1)::int,
        'name',       b ->> 'name',
        'type',       b ->> 'type'
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
                'name',          w ->> 'name',
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

    -- In-evidence: PLAYED only (nullified counts — it was still
    -- played). Ammo beats (objected_at_round set, never played) are
    -- consumed but NOT in evidence — the witness gate doesn't accept
    -- them. Mirrors the gate in call_witness_qa above.
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
        'case_beats',              v_case_beats,
        'messages',                v_messages,
        'witnesses',               v_witnesses,
        'asked_witness_qa',        v_asked_qa,
        'in_evidence_beats',       v_evidence
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
