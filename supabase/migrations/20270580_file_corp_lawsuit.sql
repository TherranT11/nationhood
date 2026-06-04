-- ════════════════════════════════════════════════════════════════════
-- 20270580 — file_corp_lawsuit + dependencies
--
-- The FILE A LAWSUIT card on the corp page (entrepreneur-corp.html)
-- routes through this RPC. End-to-end:
--
--   1. Plaintiff CEO clicks FILE A LAWSUIT.
--   2. Modal asks for defendant corp, claim text, optional evidence.
--   3. Client uploads each evidence file to the lawsuit-evidence
--      Storage bucket (20270579) and collects {url, name, size, type}
--      per file.
--   4. Client calls file_corp_lawsuit with the corp ids, claim, and
--      evidence array.
--
-- Server-side the RPC:
--
--   • Owner-gates plaintiff_corp_id (re-checked, never trust client).
--   • Confirms the plaintiff has at least one ACCEPTED counsel in
--     corp_advocate_offers — that's the "MUST have Counsel" gate.
--   • Confirms defendant is a different corp owned by a different
--     user (the same_user counsel guard already prevents self-suing
--     via shared advocates, but the surface should never even try).
--   • Reads $2,000,000 out of plaintiff treasury (rejects on
--     insufficient_funds). The fee is non-refundable.
--   • Synthesizes a court_case_drafts row that the trial FK points
--     at. case_type='commercial' fits a corp-vs-corp suit; beats are
--     built from evidence (one plaintiff-supporting beat per file,
--     strength=1). The draft is status='approved' so existing
--     "active-trial-on-this-draft" filters keep it out of the random
--     draw pool from the moment a trial exists for it.
--   • Picks each side's seated advocate via
--     _corp_highest_standing_counsel — highest politician_standing
--     among accepted retainers, random tie-break.
--   • Inserts the court_case_trials row carrying plaintiff_corp_id,
--     defendant_corp_id, claim_text, filed_by_player=true.
--   • Routes status:
--       both seats filled → 'in_progress' + _begin_trial_arguments
--       only plaintiff    → 'pre_trial', surfaces via the existing
--                           list_pretrial_cases_for_advocate broadcast
--                           in plaintiff corp's HQ nation (per user
--                           spec — defendant's bar finds the case).
--   • Assigns a magistrate via _assign_magistrate_to_trial.
--   • Posts the opening message.
--
-- Helpers introduced here:
--   • _corp_highest_standing_counsel(p_corp_id) → uuid
--     SoT for "who's representing this corp right now?" — used by
--     file_corp_lawsuit and any future code that needs to route to a
--     corp's counsel. Don't inline the corp_advocate_offers ORDER BY
--     elsewhere.
--   • list_lawsuit_defendants(p_corp_id) → jsonb
--     The dropdown's data source. Returns every other entrepreneur
--     corp grouped by industry. Excludes own corp + corps owned by
--     the same user (no self-suing through a sibling).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Helper: highest-Standing accepted counsel for a corp ────────────
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

COMMENT ON FUNCTION public._corp_highest_standing_counsel(uuid) IS
    'Single source of truth for "which retained advocate represents this corp in a new case?" — highest politician_influence (formerly politician_standing pre-20270583) among accepted corp_advocate_offers, random tie-break, skips abandoned + non-bar-admitted (advocates who lost the bar). Returns NULL when the corp has no usable counsel.';

REVOKE EXECUTE ON FUNCTION public._corp_highest_standing_counsel(uuid) FROM PUBLIC;

-- ── list_lawsuit_defendants: dropdown source for the modal ──────────
CREATE OR REPLACE FUNCTION public.list_lawsuit_defendants(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_corp      entrepreneur_corps%ROWTYPE;
    v_my_owner  uuid;
    v_rows      jsonb;
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

    -- Owner gate: only the CEO sees the dropdown.
    IF NOT EXISTS (
        SELECT 1 FROM public.factions f
         WHERE f.id = v_corp.owner_faction_id
           AND (f.id = v_uid OR f.linked_user_id = v_uid)
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    v_my_owner := COALESCE(
        (SELECT COALESCE(linked_user_id, id) FROM public.factions
          WHERE id = v_corp.owner_faction_id),
        v_uid
    );

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id',           c.id,
        'name',         c.name,
        'industry',     c.industry,
        'treasury',     c.treasury_cash,
        'nation_name',  n.name
    ) ORDER BY c.industry, c.name), '[]'::jsonb)
      INTO v_rows
      FROM public.entrepreneur_corps c
      JOIN public.factions          o ON o.id = c.owner_faction_id
      LEFT JOIN public.nations      n ON n.id = c.hq_nation_id
     WHERE c.id <> v_corp.id
       AND COALESCE(o.linked_user_id, o.id) <> v_my_owner
       AND o.abandoned_at IS NULL;

    RETURN jsonb_build_object('success', true, 'corps', v_rows);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_lawsuit_defendants(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_lawsuit_defendants(uuid) TO authenticated;

-- ── file_corp_lawsuit: the main RPC ─────────────────────────────────
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
    v_p_sum              int;
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

    -- Lock the plaintiff corp + its owner so the treasury read and the
    -- accepted-counsel check can't race.
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

    -- "MUST have Counsel" gate.
    v_p_advocate := public._corp_highest_standing_counsel(v_plaintiff_corp.id);
    IF v_p_advocate IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_counsel');
    END IF;

    -- Treasury.
    IF COALESCE(v_plaintiff_corp.treasury_cash, 0) < v_filing_fee THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'required', v_filing_fee, 'available', COALESCE(v_plaintiff_corp.treasury_cash, 0));
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Beats from evidence: each uploaded file is one plaintiff beat
    -- (strength=1) carrying the storage URL + filename. The existing
    -- trial flow (_begin_trial_arguments) deals exactly 10 beats into
    -- 5+5 hands and references them by fixed index, so we cap at 10
    -- real evidence beats then pad with strength-0 placeholders to
    -- reach 10 total — the advocate's hand still has full slots but
    -- placeholders contribute nothing to the verdict math.
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
    -- Pad to 10 with alternating-side placeholders. The split keeps
    -- the defendant's hand from being all-placeholder (some show on
    -- the plaintiff side too) but every placeholder is strength 0.
    WHILE jsonb_array_length(v_beats) < 10 LOOP
        v_beats := v_beats || jsonb_build_array(jsonb_build_object(
            'support',     CASE WHEN jsonb_array_length(v_beats) % 2 = 0 THEN 'defendant' ELSE 'plaintiff' END,
            'strength',    0,
            'type',        'placeholder',
            'description', 'No exhibit on file'
        ));
    END LOOP;
    v_p_sum := v_evidence_count;

    -- Defendant counsel (may be NULL → broadcast).
    v_d_advocate := public._corp_highest_standing_counsel(v_defendant_corp.id);

    -- Synthesized draft. case_type='commercial' lines up with the
    -- corp-vs-corp framing; litigation_type='lawsuit' lets the legal-
    -- cases display branch on player-filed without colliding with
    -- the random-draw drafts' more specific litigation_type strings.
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

    -- Status routing matches the user spec: both seats → in_progress;
    -- defendant unseated → pre_trial broadcast in plaintiff's HQ nation.
    IF v_d_advocate IS NOT NULL THEN
        v_status := 'in_progress';
    ELSE
        v_status := 'pre_trial';
    END IF;

    INSERT INTO public.court_case_trials (
        case_draft_id, nation_id,
        plaintiff_advocate_id, defendant_advocate_id,
        plaintiff_name, defendant_name,
        status,
        pre_trial_started_at_tick, pre_trial_expires_at_tick,
        matched_at_tick,
        current_round, current_turn,
        plaintiff_corp_id, defendant_corp_id,
        claim_text, filed_by_player
    ) VALUES (
        v_draft_id, v_plaintiff_corp.hq_nation_id,
        v_p_advocate, v_d_advocate,
        v_plaintiff_corp.name, v_defendant_corp.name,
        v_status,
        v_tick, v_tick + 3,
        CASE WHEN v_status = 'in_progress' THEN v_tick END,
        CASE WHEN v_status = 'in_progress' THEN 1   END,
        CASE WHEN v_status = 'in_progress' THEN 'plaintiff' END,
        v_plaintiff_corp.id, v_defendant_corp.id,
        v_claim, true
    ) RETURNING id INTO v_trial_id;

    -- Record the seated counsels' attempts so they don't get the
    -- broadcast invite to a case they already represent.
    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_p_advocate, v_draft_id, 'representing_plaintiff')
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    IF v_d_advocate IS NOT NULL THEN
        INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
        VALUES (v_d_advocate, v_draft_id, 'representing_defendant')
        ON CONFLICT (politician_id, case_id) DO NOTHING;
    END IF;

    -- Filing fee out of plaintiff treasury — non-refundable.
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
        'evidence_count',       v_evidence_count,
        'plaintiff_strength',   v_p_sum
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.file_corp_lawsuit(uuid, uuid, text, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.file_corp_lawsuit(uuid, uuid, text, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
