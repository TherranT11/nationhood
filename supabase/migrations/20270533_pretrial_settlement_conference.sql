-- ════════════════════════════════════════════════════════════════════
-- 20270533 — Pre-Trial Settlement Conference
--
-- New state between pre_trial and in_progress. When the second
-- advocate joins (represent_pretrial), the trial no longer flips
-- straight into argument — it enters 'settlement_conference' and
-- waits for both counsels to either Offer or Reject. When both
-- have decided:
--
--   • Both OFFER → settle. Dice roll keyed off the case type:
--       commercial → 1d20 million
--       civil      → 1d10 million
--       criminal   → 1d6 + 3 years off the recommended sentence
--     Settlement outcome rolled server-side, narrative-only —
--     written to the chat + event_log, no balance sheet movement
--     (per design decision). Both advocates earn +2 Reputation
--     (matches the existing _apply_settle_accept reward).
--
--   • Anything else (offer/reject, reject/reject) → proceed to
--     trial. Hands are dealt at this point (was previously dealt
--     in represent_pretrial), status flips to 'in_progress',
--     round 1 / plaintiff opens. No rep penalty for the rejecter
--     (symmetric per design decision).
--
-- Replaces the mid-trial settle flow (20270517 offer_settle /
-- respond_settle). Those RPCs stay in the schema for in-flight
-- compatibility — the politician-home UI removes the controls,
-- so they're unreachable from the client. A future migration can
-- DROP them once nothing references them.
--
-- Ships:
--   • court_case_trials.status CHECK widened with 'settlement_conference'.
--   • plaintiff_settlement_decision / defendant_settlement_decision
--     text columns (NULL = undecided, 'offer'|'reject' once made).
--   • court_case_trial_messages.kind CHECK widened with
--     'settlement_offer' / 'settlement_outcome' for the conference
--     transcript.
--   • _begin_trial_arguments helper — deals 5/5 beats + flips to
--     in_progress. Hand-dealing moved out of represent_pretrial.
--   • represent_pretrial v3 — flips to settlement_conference + posts
--     the Judge's opening prompt as a system message.
--   • respond_settlement_conference RPC — record decision, route to
--     settle or to trial when both sides have decided.
--   • get_trial_state v4 — allow settlement_conference status through,
--     expose both decisions + the case type so the picker UI can
--     render correctly.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Widen status CHECK ──────────────────────────────────────────
ALTER TABLE public.court_case_trials
    DROP CONSTRAINT IF EXISTS court_case_trials_status_check;
ALTER TABLE public.court_case_trials
    ADD CONSTRAINT court_case_trials_status_check
    CHECK (status IN ('pre_trial', 'settlement_conference',
                      'in_progress', 'resolved', 'settled', 'expired'));

-- ── 2. Per-side settlement-conference decision columns ─────────────
ALTER TABLE public.court_case_trials
    ADD COLUMN IF NOT EXISTS plaintiff_settlement_decision text
        CHECK (plaintiff_settlement_decision IS NULL
               OR plaintiff_settlement_decision IN ('offer', 'reject')),
    ADD COLUMN IF NOT EXISTS defendant_settlement_decision text
        CHECK (defendant_settlement_decision IS NULL
               OR defendant_settlement_decision IN ('offer', 'reject'));

COMMENT ON COLUMN public.court_case_trials.plaintiff_settlement_decision IS
    'Plaintiff counsel''s pre-trial conference decision. NULL until they pick. Once both sides are set, respond_settlement_conference routes: both-offer → settle, else → in_progress.';
COMMENT ON COLUMN public.court_case_trials.defendant_settlement_decision IS
    'Mirror of plaintiff_settlement_decision for defendant counsel.';

-- ── 3. Widen kind CHECK on trial messages ──────────────────────────
ALTER TABLE public.court_case_trial_messages
    DROP CONSTRAINT IF EXISTS court_case_trial_messages_kind_check;
ALTER TABLE public.court_case_trial_messages
    ADD CONSTRAINT court_case_trial_messages_kind_check
    CHECK (kind IN ('argument', 'objection', 'settle_offer', 'settle_response',
                    'judge_note', 'verdict', 'judge_ruling',
                    'witness_q', 'witness_a',
                    'settlement_offer', 'settlement_outcome'));

-- ── 4. _begin_trial_arguments helper ───────────────────────────────
-- Deals 5/5 disjoint beats and flips the trial to in_progress with
-- round 1 / plaintiff's turn. Lifted out of represent_pretrial so
-- respond_settlement_conference can call it on the "proceed to trial"
-- path. Same shuffle logic that was previously inline in
-- represent_pretrial (20270515). Idempotent guard: skips the INSERT
-- if hands already exist for this trial (defensive — shouldn't be
-- called twice).
CREATE OR REPLACE FUNCTION public._begin_trial_arguments(p_trial_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    UPDATE public.court_case_trials
       SET status        = 'in_progress',
           current_round = 1,
           current_turn  = 'plaintiff'
     WHERE id = p_trial_id;

    INSERT INTO public.court_case_trial_hands (trial_id, side, beat_index)
    SELECT
        p_trial_id,
        CASE WHEN rn <= 5 THEN 'plaintiff' ELSE 'defendant' END,
        i
      FROM (
        SELECT i, row_number() OVER (ORDER BY random()) AS rn
          FROM generate_series(0, 9) AS i
      ) shuffled
     WHERE NOT EXISTS (
        SELECT 1 FROM public.court_case_trial_hands h WHERE h.trial_id = p_trial_id
     );
END $$;

-- ── 5. represent_pretrial v3 — route through settlement_conference ─
-- Same matchmaking + attempts gate as 20270515. Only behavioural
-- change when both sides are filled: flip to 'settlement_conference'
-- (not 'in_progress'), DON'T deal hands yet, and post the Judge's
-- opening prompt as a system message so the SC modal has something
-- to render.
CREATE OR REPLACE FUNCTION public.represent_pretrial(
    p_faction_id uuid,
    p_trial_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_trial     court_case_trials%ROWTYPE;
    v_tick      int;
    v_open_side text;
    v_decision  text;
    v_inserted  int;
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
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    SELECT * INTO v_trial FROM public.court_case_trials
     WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'pre_trial' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_pretrial');
    END IF;
    IF v_trial.nation_id <> v_pol.bar_admitted_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_mismatch');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_trial.pre_trial_expires_at_tick < v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'pre_trial_expired');
    END IF;

    IF v_trial.plaintiff_advocate_id IS NULL THEN
        v_open_side := 'plaintiff';
    ELSIF v_trial.defendant_advocate_id IS NULL THEN
        v_open_side := 'defendant';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'both_sides_filled');
    END IF;

    v_decision := CASE WHEN v_open_side = 'plaintiff'
                         THEN 'representing_plaintiff'
                       ELSE 'representing_defendant' END;

    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, v_trial.case_draft_id, v_decision)
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
    END IF;

    -- Fill the open slot and flip to settlement_conference. Hands are
    -- NOT dealt here any more — _begin_trial_arguments handles that
    -- when respond_settlement_conference routes past the SC.
    IF v_open_side = 'plaintiff' THEN
        UPDATE public.court_case_trials
           SET plaintiff_advocate_id = v_pol.id,
               status                = 'settlement_conference',
               matched_at_tick       = v_tick
         WHERE id = p_trial_id;
    ELSE
        UPDATE public.court_case_trials
           SET defendant_advocate_id = v_pol.id,
               status                = 'settlement_conference',
               matched_at_tick       = v_tick
         WHERE id = p_trial_id;
    END IF;

    -- Judge's opening prompt — kicks off the conference transcript.
    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, 'system', 0, 0,
        'The court is convened. Before motions and argument, are either of you willing to discuss settlement?',
        'judge_note'
    );

    RETURN jsonb_build_object(
        'success',         true,
        'decision',        v_decision,
        'side',            v_open_side,
        'trial_id',        p_trial_id,
        'case_id',         v_trial.case_draft_id,
        'trial_status',    'settlement_conference',
        'matched_at_tick', v_tick
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.represent_pretrial(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.represent_pretrial(uuid, uuid) TO authenticated;

-- ── 6. respond_settlement_conference ───────────────────────────────
-- Records caller's offer/reject decision. When both sides have
-- decided, branches:
--   both offer → roll dice, write settlement to chat + event_log,
--                +2 Rep both, trial → 'settled'.
--   else       → _begin_trial_arguments (deal hands + in_progress).
CREATE OR REPLACE FUNCTION public.respond_settlement_conference(
    p_faction_id uuid,
    p_trial_id   uuid,
    p_decision   text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid        uuid := auth.uid();
    v_pol        factions%ROWTYPE;
    v_trial      court_case_trials%ROWTYPE;
    v_case       court_case_drafts%ROWTYPE;
    v_side       text;
    v_tick       int;
    v_p_dec      text;
    v_d_dec      text;
    v_amount     int;
    v_outcome    text;
    v_p_name     text;
    v_d_name     text;
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

    -- Counsel's decision as a chat message so the transcript shows
    -- who offered / rejected. Side is the caller's side; kind is
    -- the new 'settlement_offer' kind so the client can style.
    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, v_side, 0, 0,
        CASE WHEN p_decision = 'offer'
             THEN 'Counsel offers to settle.'
             ELSE 'Counsel rejects settlement — we proceed to trial.' END,
        'settlement_offer'
    );

    -- Re-read both decisions after the UPDATE above committed.
    SELECT plaintiff_settlement_decision, defendant_settlement_decision
      INTO v_p_dec, v_d_dec
      FROM public.court_case_trials
     WHERE id = p_trial_id;

    -- Still waiting on the other side?
    IF v_p_dec IS NULL OR v_d_dec IS NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'side',    v_side,
            'decision', p_decision,
            'waiting_for_opponent', true
        );
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Both offered → settle. Roll case-typed dice, narrate, +2 Rep
    -- both, flip to settled, fire event_log.
    IF v_p_dec = 'offer' AND v_d_dec = 'offer' THEN
        SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;

        IF v_case.case_type = 'commercial' THEN
            v_amount  := 1 + floor(random() * 20)::int;
            v_outcome := 'The parties have settled the matter privately for $'
                         || v_amount || ' million. Court is adjourned.';
        ELSIF v_case.case_type = 'criminal' THEN
            v_amount  := 4 + floor(random() * 6)::int;   -- 1d6 + 3 → 4..9
            v_outcome := 'The defendant has entered a plea bargain — the recommended sentence is reduced by '
                         || v_amount || ' years. Court is adjourned.';
        ELSE   -- civil (default)
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

    -- Anything else → proceed to trial. Hands dealt, in_progress.
    PERFORM public._begin_trial_arguments(p_trial_id);

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, 'system', 1, 0,
        'No settlement reached. Court will now hear arguments. Plaintiff opens.',
        'judge_note'
    );

    RETURN jsonb_build_object(
        'success',          true,
        'settled',          false,
        'proceed_to_trial', true
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.respond_settlement_conference(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.respond_settlement_conference(uuid, uuid, text) TO authenticated;

-- ── 7. get_trial_state v4 — allow SC + expose decisions ────────────
-- Same body as 20270526 except: settlement_conference is now a valid
-- active status (was rejecting with 'trial_not_active'), and the
-- payload carries case_type + the two settlement_decision columns
-- so the client picker has what it needs.
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
    -- settlement_conference is an active status now; the modal needs
    -- to render even before arguments begin.
    IF v_trial.status NOT IN ('in_progress', 'settlement_conference') THEN
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
        -- Settlement conference fields (20270533). NULL until the
        -- relevant counsel has decided. The client uses these to
        -- gate the picker buttons (own side) and to render the
        -- opp's deciding/decided state.
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

-- ── 8. list_active_trials_for_advocate v2 — include SC + status ────
-- The trial-list RPC used to filter status = 'in_progress' only,
-- which would hide settlement_conference trials from the Pressing
-- Issues feed. Widened to both active statuses and surfaces the
-- status field so the client card render can branch.
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

    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'trials', '[]'::jsonb);
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'trial_id',        t.id,
        'case_id',         t.case_draft_id,
        'case_type',       d.case_type,
        'litigation_type', d.litigation_type,
        'plaintiff_name',  t.plaintiff_name,
        'defendant_name',  t.defendant_name,
        'status',          t.status,
        'side',            CASE WHEN t.plaintiff_advocate_id = v_pol.id
                                  THEN 'plaintiff' ELSE 'defendant' END,
        'your_turn',       (t.current_turn = CASE WHEN t.plaintiff_advocate_id = v_pol.id
                                                    THEN 'plaintiff' ELSE 'defendant' END),
        'current_round',   t.current_round,
        'own_settlement_decision', CASE WHEN t.plaintiff_advocate_id = v_pol.id
                                          THEN t.plaintiff_settlement_decision
                                          ELSE t.defendant_settlement_decision END
    ) ORDER BY t.matched_at_tick ASC NULLS LAST), '[]'::jsonb)
      INTO v_trials
      FROM public.court_case_trials t
      JOIN public.court_case_drafts d ON d.id = t.case_draft_id
     WHERE t.status IN ('in_progress', 'settlement_conference')
       AND (t.plaintiff_advocate_id = v_pol.id OR t.defendant_advocate_id = v_pol.id);

    RETURN jsonb_build_object('success', true, 'trials', v_trials);
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
