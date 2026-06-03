-- ════════════════════════════════════════════════════════════════════
-- 20270581 — file_corp_lawsuit follow-up: drop filed_by_player,
--            stop duplicating round-init values
--
-- Two cleanup items from the post-ship audit of 20270579/580:
--
--   1. court_case_trials.filed_by_player was added in 20270579 with
--      no consumer. Pure hypothetical-design — "lets the verdict path
--      branch later" — and the philosophy reminder rules that out
--      until a real consumer needs it. Dropping the column. The
--      plaintiff_corp_id IS NOT NULL test already distinguishes
--      player-filed from draft-drawn for any downstream code that
--      genuinely needs to branch.
--
--   2. file_corp_lawsuit was setting current_round=1 + current_turn=
--      'plaintiff' inline on the INSERT, and then _begin_trial_arguments
--      was re-setting both to the same values. The "trial starts on
--      round 1, plaintiff goes first" rule lives in the helper —
--      duplicating it in the INSERT created two places that have to
--      agree. Re-emitting file_corp_lawsuit with NULL for those two
--      columns at INSERT time; the helper writes them when status
--      flips to in_progress (which it already does in
--      _begin_trial_arguments).
--
-- DROP COLUMN runs first so the re-emit of file_corp_lawsuit is
-- compiled against the final schema and would fail loudly if it
-- still referenced filed_by_player.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.court_case_trials
    DROP COLUMN IF EXISTS filed_by_player;

CREATE OR REPLACE FUNCTION public.file_corp_lawsuit(
    p_corp_id           uuid,
    p_defendant_corp_id uuid,
    p_claim_text        text,
    p_evidence          jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                uuid := auth.uid();
    v_plaintiff_corp     entrepreneur_corps%ROWTYPE;
    v_defendant_corp     entrepreneur_corps%ROWTYPE;
    v_owner              factions%ROWTYPE;
    v_my_owner           uuid;
    v_def_owner          uuid;
    v_tick               int;
    v_filing_fee         bigint := 2000000;
    v_p_advocate         uuid;
    v_d_advocate         uuid;
    v_draft_id           uuid;
    v_trial_id           uuid;
    v_judge_id           uuid;
    v_status             text;
    v_beats              jsonb;
    v_evidence_count     int;
    v_claim              text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_defendant_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;
    IF p_corp_id = p_defendant_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cannot_sue_self');
    END IF;

    v_claim := btrim(COALESCE(p_claim_text, ''));
    IF length(v_claim) < 12 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'claim_too_short');
    END IF;
    IF length(v_claim) > 600 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'claim_too_long');
    END IF;

    SELECT * INTO v_plaintiff_corp FROM public.entrepreneur_corps
     WHERE id = p_corp_id FOR UPDATE;
    IF v_plaintiff_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_plaintiff_corp.hq_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_no_nation');
    END IF;

    SELECT * INTO v_owner FROM public.factions
     WHERE id = v_plaintiff_corp.owner_faction_id;
    IF v_owner.id IS NULL OR (v_owner.id <> v_uid AND v_owner.linked_user_id <> v_uid) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    v_my_owner := COALESCE(v_owner.linked_user_id, v_owner.id);

    SELECT * INTO v_defendant_corp FROM public.entrepreneur_corps
     WHERE id = p_defendant_corp_id FOR UPDATE;
    IF v_defendant_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'defendant_not_found');
    END IF;

    SELECT COALESCE(linked_user_id, id) INTO v_def_owner
      FROM public.factions WHERE id = v_defendant_corp.owner_faction_id;
    IF v_def_owner = v_my_owner THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cannot_sue_own');
    END IF;

    v_p_advocate := public._corp_highest_standing_counsel(v_plaintiff_corp.id);
    IF v_p_advocate IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_counsel');
    END IF;

    IF COALESCE(v_plaintiff_corp.treasury_cash, 0) < v_filing_fee THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'required', v_filing_fee, 'available', COALESCE(v_plaintiff_corp.treasury_cash, 0));
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Beats from evidence (capped at 10) + strength-0 padding to 10
    -- total so _begin_trial_arguments' fixed-index hand deal lines up.
    v_evidence_count := LEAST(COALESCE(jsonb_array_length(p_evidence), 0), 10);
    IF v_evidence_count = 0 THEN
        v_beats := '[]'::jsonb;
    ELSE
        SELECT jsonb_agg(jsonb_build_object(
            'support',       'plaintiff',
            'strength',      1,
            'type',          'evidence',
            'description',   COALESCE(elem ->> 'name', 'Exhibit'),
            'evidence_url',  elem ->> 'url',
            'evidence_name', elem ->> 'name',
            'evidence_size', COALESCE((elem ->> 'size')::int, 0),
            'evidence_mime', elem ->> 'type'
        ))
          INTO v_beats
          FROM (
            SELECT t.elem
              FROM jsonb_array_elements(p_evidence) WITH ORDINALITY AS t(elem, ord)
             ORDER BY t.ord
             LIMIT 10
          ) capped(elem);
    END IF;
    WHILE jsonb_array_length(v_beats) < 10 LOOP
        v_beats := v_beats || jsonb_build_array(jsonb_build_object(
            'support',     CASE WHEN jsonb_array_length(v_beats) % 2 = 0 THEN 'defendant' ELSE 'plaintiff' END,
            'strength',    0,
            'type',        'placeholder',
            'description', 'No exhibit on file'
        ));
    END LOOP;

    v_d_advocate := public._corp_highest_standing_counsel(v_defendant_corp.id);

    INSERT INTO public.court_case_drafts (
        submitted_by_user_id, status, case_type, litigation_type,
        plaintiff_party_type, plaintiff_corp_type,
        defendant_party_type, defendant_corp_type,
        overview, beats,
        accepted_at, accepted_by_user_id, entrepreneur_credited
    ) VALUES (
        v_uid, 'approved', 'commercial', 'lawsuit',
        'corporation', v_plaintiff_corp.industry,
        'corporation', v_defendant_corp.industry,
        v_claim, v_beats,
        now(), v_uid, true
    ) RETURNING id INTO v_draft_id;

    IF v_d_advocate IS NOT NULL THEN
        v_status := 'in_progress';
    ELSE
        v_status := 'pre_trial';
    END IF;

    -- current_round + current_turn intentionally NULL — when status is
    -- in_progress, _begin_trial_arguments below writes them. Pre-trial
    -- cases have no round/turn until matched.
    INSERT INTO public.court_case_trials (
        case_draft_id, nation_id,
        plaintiff_advocate_id, defendant_advocate_id,
        plaintiff_name, defendant_name,
        status,
        pre_trial_started_at_tick, pre_trial_expires_at_tick,
        matched_at_tick,
        plaintiff_corp_id, defendant_corp_id,
        claim_text
    ) VALUES (
        v_draft_id, v_plaintiff_corp.hq_nation_id,
        v_p_advocate, v_d_advocate,
        v_plaintiff_corp.name, v_defendant_corp.name,
        v_status,
        v_tick, v_tick + 3,
        CASE WHEN v_status = 'in_progress' THEN v_tick END,
        v_plaintiff_corp.id, v_defendant_corp.id,
        v_claim
    ) RETURNING id INTO v_trial_id;

    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_p_advocate, v_draft_id, 'representing_plaintiff')
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    IF v_d_advocate IS NOT NULL THEN
        INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
        VALUES (v_d_advocate, v_draft_id, 'representing_defendant')
        ON CONFLICT (politician_id, case_id) DO NOTHING;
    END IF;

    UPDATE public.entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_filing_fee
     WHERE id = v_plaintiff_corp.id;

    v_judge_id := public._assign_magistrate_to_trial(v_trial_id);
    IF v_status = 'in_progress' THEN
        PERFORM public._begin_trial_arguments(v_trial_id);
    END IF;

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        v_trial_id, 'system', 0, 0,
        CASE WHEN v_status = 'in_progress'
             THEN 'Suit filed. Counsel for both parties have been retained; the court will hear arguments.'
             ELSE 'Suit filed. The defendant has no retained counsel — the case is broadcast to advocates of the bar.'
        END,
        'judge_note'
    );

    RETURN jsonb_build_object(
        'success',              true,
        'trial_id',             v_trial_id,
        'status',               v_status,
        'plaintiff_advocate',   v_p_advocate,
        'defendant_advocate',   v_d_advocate,
        'judge_faction_id',     v_judge_id,
        'filing_fee',           v_filing_fee,
        'evidence_count',       v_evidence_count
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
