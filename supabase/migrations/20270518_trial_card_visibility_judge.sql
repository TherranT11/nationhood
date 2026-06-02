-- ════════════════════════════════════════════════════════════════════
-- 20270518 — Trial Pressing Issues card: visibility + judge + log
--
-- Player report: an advocate who represents a case (creating the
-- pre-trial) sees nothing in Pressing Issues until the opposite side
-- joins, AND the Political Career feed gets no entry for the
-- commitment. Two gaps:
--   1. The trial row exists in 'pre_trial' status with their side
--      filled and the other NULL, but list_active_trials_for_advocate
--      filters to status = 'in_progress'.
--   2. represent_drawn_case + represent_pretrial both log to
--      politician_court_case_attempts but don't drop a
--      'took_case' row into politician_career_events.
--
-- This migration ships:
--   • judge_name column on court_case_trials. Stamped when the trial
--     flips to 'in_progress' in represent_pretrial; pulled from the
--     nation's last_name_pool with a serif "Hon. X-Y" composition.
--   • list_active_trials_for_advocate broadened to include pre_trial
--     rows the advocate is on. Returns enough extra fields for the
--     richer Pressing Issues card design — judge_name, status,
--     pre_trial_expires_at_tick (so the UI can show "WAITING FOR
--     OPPOSING COUNSEL · ticks remaining" on a pre-trial-self card).
--   • represent_drawn_case + represent_pretrial re-authored to drop
--     a 'took_case' career event. target_name = "Plaintiff v.
--     Defendant" caption; metadata.side carries 'plaintiff' |
--     'defendant'. politician-home.html renders this via the
--     CAREER_EVENT_TEMPLATES.took_case sentence.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. judge_name column ────────────────────────────────────────────
ALTER TABLE public.court_case_trials
    ADD COLUMN IF NOT EXISTS judge_name text;

COMMENT ON COLUMN public.court_case_trials.judge_name IS
    'Presiding judge display name (e.g. "Ríos-Camargo"). Stamped when the trial flips to in_progress; NULL while pre_trial. Pulled from the trial nation''s last_name_pool with a doubled-up hyphenated form so the modal can prefix "Hon." in display.';

-- ── 2. represent_pretrial — stamp judge_name on match ──────────────
-- Same matchmaking + idempotency + beat-dealing as 20270515; the only
-- new behaviour is selecting a judge name from the nation's
-- last_name_pool when the trial flips to in_progress.
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
    v_nation    nations%ROWTYPE;
    v_tick      int;
    v_open_side text;
    v_decision  text;
    v_inserted  int;
    v_last_pool text[];
    v_last_len  int;
    v_judge     text;
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

    -- Pick a judge from the trial nation's last_name_pool. Doubled-up
    -- hyphenated form (LastA-LastB) so the display can prefix "Hon."
    -- and read like a real bench name. Fallback to a single name if
    -- the pool has fewer than 2 entries.
    SELECT * INTO v_nation FROM public.nations WHERE id = v_trial.nation_id;
    v_last_pool := COALESCE(v_nation.last_name_pool, ARRAY[]::text[]);
    v_last_len  := COALESCE(array_length(v_last_pool, 1), 0);
    IF v_last_len >= 2 THEN
        v_judge := v_last_pool[1 + floor(random() * v_last_len)::int]
                || '-' ||
                   v_last_pool[1 + floor(random() * v_last_len)::int];
    ELSIF v_last_len = 1 THEN
        v_judge := v_last_pool[1];
    ELSE
        v_judge := 'the Bench';
    END IF;

    IF v_open_side = 'plaintiff' THEN
        UPDATE public.court_case_trials
           SET plaintiff_advocate_id = v_pol.id,
               status                = 'in_progress',
               matched_at_tick       = v_tick,
               current_round         = 1,
               current_turn          = 'plaintiff',
               judge_name            = v_judge
         WHERE id = p_trial_id;
    ELSE
        UPDATE public.court_case_trials
           SET defendant_advocate_id = v_pol.id,
               status                = 'in_progress',
               matched_at_tick       = v_tick,
               current_round         = 1,
               current_turn          = 'plaintiff',
               judge_name            = v_judge
         WHERE id = p_trial_id;
    END IF;

    INSERT INTO public.court_case_trial_hands (trial_id, side, beat_index)
    SELECT
        p_trial_id,
        CASE WHEN rn <= 5 THEN 'plaintiff' ELSE 'defendant' END,
        i
      FROM (
        SELECT i, row_number() OVER (ORDER BY random()) AS rn
          FROM generate_series(0, 9) AS i
      ) shuffled;

    -- Political Career log entry. The caption "Plaintiff v. Defendant"
    -- is the target_name (the same shape the modal eyebrow uses);
    -- the side rides in metadata for the template's "representing the
    -- plaintiff" / "defendant" tail.
    INSERT INTO public.politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, 'took_case',
        v_trial.plaintiff_name || ' v. ' || v_trial.defendant_name,
        jsonb_build_object('side', v_open_side)
    );

    RETURN jsonb_build_object(
        'success',         true,
        'decision',        v_decision,
        'side',            v_open_side,
        'trial_id',        p_trial_id,
        'case_id',         v_trial.case_draft_id,
        'trial_status',    'in_progress',
        'matched_at_tick', v_tick,
        'current_round',   1,
        'current_turn',    'plaintiff',
        'judge_name',      v_judge
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.represent_pretrial(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.represent_pretrial(uuid, uuid) TO authenticated;

-- ── 4. represent_drawn_case — drop the same career-event row ───────
-- Same body as 20270514's version, plus a politician_career_events
-- INSERT after the trial row is created. target_name uses the
-- canonical plaintiff/defendant snapshot the lawyer just committed,
-- so it matches the Pressing Issues card and the modal eyebrow.
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
    v_case_status   text;
    v_decision      text;
    v_inserted      int;
    v_tick          int;
    v_trial_id      uuid;
    v_p_name_clean  text;
    v_d_name_clean  text;
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

    SELECT status INTO v_case_status FROM public.court_case_drafts WHERE id = p_case_id;
    IF v_case_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_found');
    END IF;
    IF v_case_status <> 'approved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_approved');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    v_decision := CASE WHEN p_side = 'plaintiff'
                         THEN 'representing_plaintiff'
                       ELSE 'representing_defendant' END;

    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, p_case_id, v_decision)
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
    END IF;

    BEGIN
        INSERT INTO public.court_case_trials (
            case_draft_id, nation_id,
            plaintiff_advocate_id, defendant_advocate_id,
            plaintiff_name, defendant_name,
            status,
            pre_trial_started_at_tick, pre_trial_expires_at_tick
        ) VALUES (
            p_case_id, v_pol.bar_admitted_nation_id,
            CASE WHEN p_side = 'plaintiff' THEN v_pol.id ELSE NULL END,
            CASE WHEN p_side = 'defendant' THEN v_pol.id ELSE NULL END,
            v_p_name_clean, v_d_name_clean,
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

-- ── 3. list_active_trials_for_advocate (broadened) ─────────────────
-- Returns both pre_trial trials the advocate is committed to AND
-- their in_progress trials. The card variant is chosen client-side
-- off status. judge_name is exposed so the in_progress card can show
-- "Hon. X-Y presiding"; pre_trial rows have judge_name = NULL.
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
        'trial_id',                  t.id,
        'case_id',                   t.case_draft_id,
        'case_type',                 d.case_type,
        'litigation_type',           d.litigation_type,
        'plaintiff_name',            t.plaintiff_name,
        'defendant_name',            t.defendant_name,
        'side',                      CASE WHEN t.plaintiff_advocate_id = v_pol.id
                                            THEN 'plaintiff' ELSE 'defendant' END,
        'status',                    t.status,
        'your_turn',                 (t.current_turn = CASE WHEN t.plaintiff_advocate_id = v_pol.id
                                                              THEN 'plaintiff' ELSE 'defendant' END),
        'current_round',             t.current_round,
        'judge_name',                t.judge_name,
        'pre_trial_expires_at_tick', t.pre_trial_expires_at_tick
    ) ORDER BY t.matched_at_tick ASC NULLS LAST, t.created_at ASC), '[]'::jsonb)
      INTO v_trials
      FROM public.court_case_trials t
      JOIN public.court_case_drafts d ON d.id = t.case_draft_id
     WHERE t.status IN ('pre_trial', 'in_progress')
       AND (t.plaintiff_advocate_id = v_pol.id OR t.defendant_advocate_id = v_pol.id);

    RETURN jsonb_build_object('success', true, 'trials', v_trials);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_active_trials_for_advocate(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_active_trials_for_advocate(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
