-- ════════════════════════════════════════════════════════════════════
-- 20270526 — Witness gender field + auto-drawn names
--
-- Composer change: each witness no longer carries a free-text name
-- field. Instead, the composer captures a Gender (male / female) and
-- the witness's display name is drawn from the nation's first /
-- last name pools at trial-creation time and persisted on the trial.
-- Same pools the existing plaintiff / defendant person-name draws
-- use (20270521 draw_court_case branch). The pools are un-gendered,
-- so gender is currently cosmetic — kept for future avatar / pronoun
-- use.
--
-- This migration ships:
--
--   1. court_case_trials.witness_names jsonb DEFAULT '[]'. Array of
--      full-name strings, indexed parallel to case_drafts.witnesses[].
--      witness_names[k] = display name for witness k. Drawn at trial
--      creation, stable thereafter.
--
--   2. represent_drawn_case re-authored to draw witness_names from
--      the nation's name pools on the trial INSERT. Same body as
--      20270520 otherwise. If the nation has no name pool, the
--      array stays empty and the call_witness_qa fallback ('Witness')
--      kicks in.
--
--   3. call_witness_qa re-authored to read the display name from
--      v_trial.witness_names[p_witness_idx] (replacing the
--      v_witness ->> 'name' lookup that no longer exists in the new
--      composer shape).
--
--   4. get_trial_state re-authored so each witness in the witnesses[]
--      output carries:
--        • name        — drawn name from the trial (was the composer
--                        field, now auto-drawn).
--        • gender      — composer field, surfaced for display.
--        • description — composer field, unchanged.
--        • direct/cross Q&A arrays — unchanged.
--      case_beats + asked_witness_qa + in_evidence_beats (from
--      20270525) preserved as-is.
--
--   5. Updated COMMENT on court_case_drafts.witnesses describes the
--      new shape (gender, not name).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. court_case_trials.witness_names ─────────────────────────────
ALTER TABLE public.court_case_trials
    ADD COLUMN IF NOT EXISTS witness_names jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.court_case_trials.witness_names IS
    'Array of full-name strings drawn from the nation''s first / last name pools at trial creation. Indexed parallel to court_case_drafts.witnesses[]. Empty array when the nation has no name pool — call_witness_qa falls back to the literal "Witness" in that case.';

-- ── 2. court_case_drafts.witnesses comment refresh ─────────────────
COMMENT ON COLUMN public.court_case_drafts.witnesses IS
    'Optional witnesses (max 3 per case). Each entry: {gender:"male"|"female", description, direct:[{question,answer,supports,strength,requires_beat}], cross:[...]}. Composer captures gender only; the display name is drawn from the nation''s name pool at trial creation (see court_case_trials.witness_names). requires_beat is the INDEX into beats[] of a beat that must be PLAYED (by either side, nullified or not) before the question can be asked.';

-- ── 3. represent_drawn_case — draw witness_names on insert ─────────
-- Same body as 20270520 except for the additional witness_names
-- column on the INSERT and the v_nation load that feeds it.
CREATE OR REPLACE FUNCTION public.represent_drawn_case(
    p_faction_id      uuid,
    p_case_id         uuid,
    p_side            text,
    p_plaintiff_name  text,
    p_defendant_name  text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_nation        nations%ROWTYPE;
    v_case          court_case_drafts%ROWTYPE;
    v_decision      text;
    v_inserted      int;
    v_tick          int;
    v_trial_id      uuid;
    v_p_name_clean  text;
    v_d_name_clean  text;
    v_p_owner_id    uuid;
    v_d_owner_id    uuid;
    v_first_pool    text[];
    v_last_pool     text[];
    v_first_len     int;
    v_last_len      int;
    v_witness_names jsonb := '[]'::jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_case_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;
    IF p_side NOT IN ('plaintiff', 'defendant') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_side');
    END IF;
    v_p_name_clean := btrim(COALESCE(p_plaintiff_name, ''));
    v_d_name_clean := btrim(COALESCE(p_defendant_name, ''));
    IF v_p_name_clean = '' OR v_d_name_clean = '' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_party_name');
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

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = p_case_id;
    IF v_case.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_found');
    END IF;
    IF v_case.status <> 'approved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_approved');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- Nation pools for witness-name draw. Empty pools → empty
    -- witness_names array (call_witness_qa will fall back to 'Witness').
    SELECT * INTO v_nation FROM public.nations WHERE id = v_pol.bar_admitted_nation_id;
    v_first_pool := COALESCE(v_nation.first_name_pool, ARRAY[]::text[]);
    v_last_pool  := COALESCE(v_nation.last_name_pool,  ARRAY[]::text[]);
    v_first_len  := COALESCE(array_length(v_first_pool, 1), 0);
    v_last_len   := COALESCE(array_length(v_last_pool,  1), 0);
    IF v_first_len > 0 AND v_last_len > 0 THEN
        SELECT COALESCE(jsonb_agg(
            to_jsonb(
                v_first_pool[1 + floor(random() * v_first_len)::int]
                || ' '
                || v_last_pool[1 + floor(random() * v_last_len)::int]
            ) ORDER BY ord
        ), '[]'::jsonb)
          INTO v_witness_names
          FROM jsonb_array_elements(COALESCE(v_case.witnesses, '[]'::jsonb))
              WITH ORDINALITY arr_w(w, ord);
    END IF;

    v_decision := CASE WHEN p_side = 'plaintiff'
                         THEN 'representing_plaintiff'
                       ELSE 'representing_defendant' END;

    BEGIN
        INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
        VALUES (v_pol.id, p_case_id, v_decision)
        ON CONFLICT (politician_id, case_id) DO NOTHING;
        GET DIAGNOSTICS v_inserted = ROW_COUNT;
        IF v_inserted = 0 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
        END IF;

        INSERT INTO public.court_case_trials (
            case_draft_id, nation_id,
            plaintiff_advocate_id, defendant_advocate_id,
            plaintiff_name, defendant_name,
            witness_names,
            status,
            pre_trial_started_at_tick, pre_trial_expires_at_tick
        ) VALUES (
            p_case_id, v_pol.bar_admitted_nation_id,
            CASE WHEN p_side = 'plaintiff' THEN v_pol.id ELSE NULL END,
            CASE WHEN p_side = 'defendant' THEN v_pol.id ELSE NULL END,
            v_p_name_clean, v_d_name_clean,
            v_witness_names,
            'pre_trial',
            v_tick, v_tick + 3
        ) RETURNING id INTO v_trial_id;
    EXCEPTION
        WHEN unique_violation THEN
            RETURN jsonb_build_object('success', false, 'reason', 'case_in_trial');
    END;

    INSERT INTO public.politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, 'took_case',
        v_p_name_clean || ' v. ' || v_d_name_clean,
        jsonb_build_object('side', p_side)
    );

    INSERT INTO public.court_case_nation_cooldowns
        (case_draft_id, nation_id, cooldown_until_tick)
    VALUES (p_case_id, v_pol.bar_admitted_nation_id, v_tick + 12)
    ON CONFLICT (case_draft_id, nation_id) DO UPDATE
       SET cooldown_until_tick = EXCLUDED.cooldown_until_tick;

    IF v_case.plaintiff_party_type = 'corporation' THEN
        v_p_owner_id := public._corp_owner_for_party(v_p_name_clean, v_pol.bar_admitted_nation_id);
        IF v_p_owner_id IS NOT NULL THEN
            UPDATE public.factions
               SET party_cooldown_until_tick = v_tick + 60
             WHERE id = v_p_owner_id;
        END IF;
    END IF;
    IF v_case.defendant_party_type = 'corporation' THEN
        v_d_owner_id := public._corp_owner_for_party(v_d_name_clean, v_pol.bar_admitted_nation_id);
        IF v_d_owner_id IS NOT NULL THEN
            UPDATE public.factions
               SET party_cooldown_until_tick = v_tick + 60
             WHERE id = v_d_owner_id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success',  true,
        'decision', v_decision,
        'side',     p_side,
        'case_id',  p_case_id,
        'trial_id', v_trial_id,
        'pre_trial_expires_at_tick', v_tick + 3
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.represent_drawn_case(uuid, uuid, text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.represent_drawn_case(uuid, uuid, text, text, text) TO authenticated;

-- ── 4. call_witness_qa — use drawn name from trial.witness_names ───
-- Same body as 20270525's call_witness_qa except the witness display
-- name is now sourced from v_trial.witness_names[p_witness_idx]
-- instead of v_witness ->> 'name' (no longer exists in composer shape).
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
    -- Display name: drawn at trial creation, persisted on the trial.
    -- Empty pool / missing draw → 'Witness' fallback.
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

-- ── 5. get_trial_state — surface drawn name + gender on witnesses ──
-- Same body as 20270525's get_trial_state except each witness now
-- carries both gender (composer field) and name (drawn at trial
-- creation, looked up from v_trial.witness_names by index).
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

    -- Witnesses: drawn name (from trial) + gender (from case draft) +
    -- description + Q&A texts. Strength + supports hidden per Q&A.
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
