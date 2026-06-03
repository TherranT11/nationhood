-- ════════════════════════════════════════════════════════════════════
-- 20270543 — Appeal mechanic
--
-- The filing attorney (Advocate / Experienced Advocate / State
-- Advocate) files an appeal on a resolved trial whose verdict
-- landed in the last 12 ticks. The appeal:
--
--   • Always seats the filer as counsel for the ORIGINAL LOSING
--     SIDE (the appellant in real-world appellate terms).
--   • Opens the other side to any bar-admitted attorney via the
--     normal represent_pretrial pickup, EXCEPT when the original
--     opposing party (the appellee party) is the state — in that
--     case a State Advocate (politician_state_prosecutor_at_tick
--     IS NOT NULL, same bar nation) is auto-assigned.
--   • Reuses the case_draft_id, plaintiff_name, defendant_name,
--     and witness_names of the original trial — same evidence
--     pool, same parties, fresh hand of beats.
--   • Skips the settlement conference. Both lawyers locked in →
--     straight to in_progress and arguments begin. Settlements
--     don't make sense on appeal.
--   • Gets a judge (Magistrate pool for now — Appellate Justice
--     rung is visual-only; treating the existing judiciary as the
--     appellate bench in v1) via _assign_magistrate_to_trial.
--
-- Verdict-time bonus / penalty (on top of standard verdict math):
--
--   • Flipped (new verdict opposite of original): +5 Reputation
--     to the appellant.
--   • Stood (new verdict same as original): -1 Reputation to the
--     appellant. Floored at 0.
--
-- Standard verdict math (winner +1 Standing, loser_total/10 rep
-- delta) applies to both sides as on a normal trial.
--
-- Ships:
--   • court_case_trials.appeal_of_trial_id (FK self-reference,
--     NULL on normal trials).
--   • list_appealable_cases(p_faction_id) — modal data source.
--   • start_appeal(p_faction_id, p_original_trial_id) — files the
--     appeal, seats appellant + (optionally) state advocate,
--     assigns judge.
--   • represent_pretrial v5 — when joining an appeal, skips SC
--     and flips directly to in_progress + deals hands.
--   • _apply_verdict — appellant bonus/penalty on appeal trials.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: appeal_of_trial_id ──────────────────────────────────
ALTER TABLE public.court_case_trials
    ADD COLUMN IF NOT EXISTS appeal_of_trial_id uuid
        REFERENCES public.court_case_trials(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trials_appeal_of
    ON public.court_case_trials (appeal_of_trial_id)
    WHERE appeal_of_trial_id IS NOT NULL;

COMMENT ON COLUMN public.court_case_trials.appeal_of_trial_id IS
    'When non-null, this trial is an appeal of the referenced original trial. start_appeal sets this; represent_pretrial / _apply_verdict branch on it (skip settlement conference, apply +5/-1 appellant rep delta on verdict).';

-- ── 2. list_appealable_cases ───────────────────────────────────────
-- Returns resolved trials in the caller's bar nation with verdict
-- within the last 12 ticks AND no appeal already in flight. Sorted
-- newest-verdict first. Payload includes everything the modal needs
-- to render the picker + fire start_appeal.
CREATE OR REPLACE FUNCTION public.list_appealable_cases(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_tick   int;
    v_cases  jsonb;
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
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;
    IF v_pol.politician_magistrate_at_tick IS NOT NULL THEN
        -- Magistrates preside, not appeal. Empty list rather than
        -- exposing the picker.
        RETURN jsonb_build_object('success', true, 'cases', '[]'::jsonb);
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'original_trial_id', t.id,
        'plaintiff_name',    t.plaintiff_name,
        'defendant_name',    t.defendant_name,
        'case_type',         d.case_type,
        'litigation_type',   d.litigation_type,
        'winner',            t.verdict_winner,
        'ticks_remaining',   12 - (v_tick - t.verdict_at_tick),
        'verdict_at_tick',   t.verdict_at_tick
    ) ORDER BY t.verdict_at_tick DESC), '[]'::jsonb) INTO v_cases
    FROM public.court_case_trials t
    JOIN public.court_case_drafts d ON d.id = t.case_draft_id
    WHERE t.nation_id    = v_pol.bar_admitted_nation_id
      AND t.status       = 'resolved'
      AND t.verdict_at_tick IS NOT NULL
      AND (v_tick - t.verdict_at_tick) <= 12
      AND NOT EXISTS (
          SELECT 1 FROM public.court_case_trials a
           WHERE a.appeal_of_trial_id = t.id
             AND a.status IN ('pre_trial', 'settlement_conference', 'in_progress')
      );

    RETURN jsonb_build_object('success', true, 'cases', v_cases);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_appealable_cases(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_appealable_cases(uuid) TO authenticated;

-- ── 3. start_appeal ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.start_appeal(
    p_faction_id        uuid,
    p_original_trial_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                uuid := auth.uid();
    v_pol                factions%ROWTYPE;
    v_orig               court_case_trials%ROWTYPE;
    v_case               court_case_drafts%ROWTYPE;
    v_tick               int;
    v_appellant_side     text;
    v_appellee_side      text;
    v_appellee_party     text;       -- 'person' | 'corporation' | 'state'
    v_state_advocate_id  uuid;
    v_trial_id           uuid;
    v_p_advocate         uuid;
    v_d_advocate         uuid;
    v_status             text;
    v_judge_id           uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_original_trial_id IS NULL THEN
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
    IF v_pol.politician_magistrate_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'magistrate_cannot_appeal');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT * INTO v_orig FROM public.court_case_trials WHERE id = p_original_trial_id;
    IF v_orig.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_orig.status <> 'resolved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'original_not_resolved');
    END IF;
    IF v_orig.nation_id <> v_pol.bar_admitted_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_mismatch');
    END IF;
    IF v_orig.verdict_at_tick IS NULL
       OR (v_tick - v_orig.verdict_at_tick) > 12 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'appeal_window_closed');
    END IF;
    IF v_orig.verdict_winner NOT IN ('plaintiff', 'defendant') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_verdict_to_appeal');
    END IF;
    IF EXISTS (SELECT 1 FROM public.court_case_trials
                WHERE appeal_of_trial_id = v_orig.id
                  AND status IN ('pre_trial','settlement_conference','in_progress')) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'appeal_in_flight');
    END IF;

    -- Appellant takes the original loser's side. Appellee party
    -- (the original winner's party type) drives the state auto-fill
    -- decision.
    IF v_orig.verdict_winner = 'plaintiff' THEN
        v_appellant_side := 'defendant';
        v_appellee_side  := 'plaintiff';
    ELSE
        v_appellant_side := 'plaintiff';
        v_appellee_side  := 'defendant';
    END IF;

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_orig.case_draft_id;
    v_appellee_party := CASE WHEN v_appellee_side = 'plaintiff'
                               THEN v_case.plaintiff_party_type
                               ELSE v_case.defendant_party_type END;

    -- State auto-fill: when the appellee party is the state, pick a
    -- bar-admitted State Advocate in this nation. Least-busy by
    -- active-trial count (matches _assign_magistrate_to_trial's
    -- tie-break style), random for ties.
    IF v_appellee_party = 'state' THEN
        SELECT sa.id INTO v_state_advocate_id
          FROM public.factions sa
          LEFT JOIN public.court_case_trials t
            ON (t.plaintiff_advocate_id = sa.id OR t.defendant_advocate_id = sa.id)
           AND t.status IN ('in_progress', 'settlement_conference', 'pre_trial')
         WHERE sa.politician_state_prosecutor_at_tick IS NOT NULL
           AND sa.bar_admitted_nation_id = v_pol.bar_admitted_nation_id
           AND sa.abandoned_at IS NULL
           AND sa.id <> v_pol.id
         GROUP BY sa.id
         ORDER BY COUNT(t.id) ASC, random() ASC
         LIMIT 1;
        -- If none available, trial waits in pre_trial like any other
        -- appeal — same UX as no-state case.
    END IF;

    IF v_appellant_side = 'plaintiff' THEN
        v_p_advocate := v_pol.id;
        v_d_advocate := v_state_advocate_id;
    ELSE
        v_p_advocate := v_state_advocate_id;
        v_d_advocate := v_pol.id;
    END IF;

    -- Status: in_progress if BOTH advocates set at creation (state
    -- auto-fill case), else pre_trial waiting for the opposing
    -- pickup. Appeals never go through settlement_conference.
    IF v_p_advocate IS NOT NULL AND v_d_advocate IS NOT NULL THEN
        v_status := 'in_progress';
    ELSE
        v_status := 'pre_trial';
    END IF;

    INSERT INTO public.court_case_trials (
        case_draft_id, nation_id,
        plaintiff_advocate_id, defendant_advocate_id,
        plaintiff_name, defendant_name,
        witness_names,
        status,
        pre_trial_started_at_tick, pre_trial_expires_at_tick,
        matched_at_tick,
        current_round, current_turn,
        appeal_of_trial_id
    ) VALUES (
        v_orig.case_draft_id, v_orig.nation_id,
        v_p_advocate, v_d_advocate,
        v_orig.plaintiff_name, v_orig.defendant_name,
        v_orig.witness_names,
        v_status,
        v_tick, v_tick + 3,
        CASE WHEN v_status = 'in_progress' THEN v_tick END,
        CASE WHEN v_status = 'in_progress' THEN 1   END,
        CASE WHEN v_status = 'in_progress' THEN 'plaintiff' END,
        v_orig.id
    ) RETURNING id INTO v_trial_id;

    -- Attempts row so the appellant can't re-take the same case
    -- via draw_court_case.
    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, v_orig.case_draft_id,
            CASE WHEN v_appellant_side = 'plaintiff'
                   THEN 'representing_plaintiff'
                   ELSE 'representing_defendant' END)
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    IF v_state_advocate_id IS NOT NULL THEN
        INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
        VALUES (v_state_advocate_id, v_orig.case_draft_id,
                CASE WHEN v_appellee_side = 'plaintiff'
                       THEN 'representing_plaintiff'
                       ELSE 'representing_defendant' END)
        ON CONFLICT (politician_id, case_id) DO NOTHING;
    END IF;

    -- Judge (Appellate Justice — uses Magistrate pool in v1; the
    -- Appellate Justice rung is visual-only today).
    v_judge_id := public._assign_magistrate_to_trial(v_trial_id);

    -- Deal hands now if the trial is already in_progress (state
    -- auto-fill case). Otherwise represent_pretrial deals them when
    -- the opposing advocate joins.
    IF v_status = 'in_progress' THEN
        PERFORM public._begin_trial_arguments(v_trial_id);
    END IF;

    -- Court-convened message reflects appeal framing.
    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        v_trial_id, 'system', 0, 0,
        'Appeal of the prior verdict is convened. Counsel for the appellant has filed; the court will hear arguments.',
        'judge_note'
    );

    RETURN jsonb_build_object(
        'success',           true,
        'appeal_trial_id',   v_trial_id,
        'appellant_side',    v_appellant_side,
        'status',            v_status,
        'state_advocate_id', v_state_advocate_id,
        'judge_faction_id',  v_judge_id
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.start_appeal(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.start_appeal(uuid, uuid) TO authenticated;

-- ── 4. represent_pretrial v5 — appeals skip settlement conference ──
-- Same body as 20270536's v4 except: when the trial being joined
-- has appeal_of_trial_id set, status flips straight to in_progress
-- via _begin_trial_arguments instead of to settlement_conference.
-- Judge assignment unchanged.
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
    v_judge_id  uuid;
    v_is_appeal boolean;
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
    v_is_appeal := v_trial.appeal_of_trial_id IS NOT NULL;

    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, v_trial.case_draft_id, v_decision)
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
    END IF;

    -- Appeal trials skip settlement_conference. Normal trials flip
    -- into it (existing 20270533 behaviour). Hand-deal + status
    -- in_progress happens via _begin_trial_arguments on the appeal
    -- branch.
    IF v_is_appeal THEN
        IF v_open_side = 'plaintiff' THEN
            UPDATE public.court_case_trials
               SET plaintiff_advocate_id = v_pol.id,
                   matched_at_tick       = v_tick
             WHERE id = p_trial_id;
        ELSE
            UPDATE public.court_case_trials
               SET defendant_advocate_id = v_pol.id,
                   matched_at_tick       = v_tick
             WHERE id = p_trial_id;
        END IF;
        v_judge_id := v_trial.judge_faction_id;
        IF v_judge_id IS NULL THEN
            v_judge_id := public._assign_magistrate_to_trial(p_trial_id);
        END IF;
        PERFORM public._begin_trial_arguments(p_trial_id);

        INSERT INTO public.court_case_trial_messages (
            trial_id, side, round, turn_seq, text, kind
        ) VALUES (
            p_trial_id, 'system', 1, 0,
            'Both counsels are seated. The Appellate Court will hear arguments. Plaintiff opens.',
            'judge_note'
        );

        RETURN jsonb_build_object(
            'success',         true,
            'decision',        v_decision,
            'side',            v_open_side,
            'trial_id',        p_trial_id,
            'case_id',         v_trial.case_draft_id,
            'trial_status',    'in_progress',
            'matched_at_tick', v_tick,
            'judge_assigned',  v_judge_id IS NOT NULL,
            'judge_faction_id', v_judge_id,
            'is_appeal',       true
        );
    END IF;

    -- Normal (non-appeal) flow — flip to settlement_conference and
    -- auto-assign a Magistrate (20270536 behaviour).
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

    v_judge_id := public._assign_magistrate_to_trial(p_trial_id);

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
        'matched_at_tick', v_tick,
        'judge_assigned',  v_judge_id IS NOT NULL,
        'judge_faction_id', v_judge_id,
        'is_appeal',       false
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.represent_pretrial(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.represent_pretrial(uuid, uuid) TO authenticated;

-- ── 5. _apply_verdict — appellant bonus/penalty on appeal trials ───
-- Same body as 20270538 with one block appended after the standard
-- rep + standing deltas: when the trial is an appeal, compare the
-- new verdict_winner to the original's. Flipped → +5 Rep to the
-- appellant; same → -1 Rep (floored at 0).
CREATE OR REPLACE FUNCTION public._apply_verdict(p_trial_id uuid, p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_trial            court_case_trials%ROWTYPE;
    v_case             court_case_drafts%ROWTYPE;
    v_p_sum            int := 0;
    v_d_sum            int := 0;
    v_p_wit            int := 0;
    v_d_wit            int := 0;
    v_p_obj            int := 0;
    v_d_obj            int := 0;
    v_p_chaos          int := 0;
    v_d_chaos          int := 0;
    v_is_criminal      boolean;
    v_p_total          int;
    v_d_total          int;
    v_winner           text;
    v_offerer          text;
    v_p_delta          numeric := 0;
    v_d_delta          numeric := 0;
    v_base             numeric;
    v_p_name           text;
    v_d_name           text;
    v_winner_name      text;
    v_winning_adv_id   uuid;
    v_winning_attorney text;
    v_event_text       text;
    v_verdict_text     text;
    v_original_winner  text;
    v_appellant_id     uuid;
    v_appeal_flipped   boolean := false;
    v_appeal_delta     int := 0;
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

    -- Appeal bonus / penalty (20270543). Appellant = advocate on the
    -- side OPPOSITE the original verdict_winner. Flipped → +5 Rep,
    -- stood → -1 Rep (floored at 0). On top of standard rep/standing.
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
            v_appeal_delta := CASE WHEN v_appeal_flipped THEN 5 ELSE -1 END;
            UPDATE public.factions
               SET politician_reputation = GREATEST(0,
                   COALESCE(politician_reputation, 0) + v_appeal_delta)
             WHERE id = v_appellant_id;
        END IF;
    END IF;

    UPDATE public.court_case_trials
       SET status           = 'resolved',
           verdict_winner   = v_winner,
           verdict_at_tick  = p_tick,
           awaiting_verdict = false
     WHERE id = p_trial_id;

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
        'appellant_rep_delta',      CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN v_appeal_delta END
    );
END $$;

REVOKE EXECUTE ON FUNCTION public._apply_verdict(uuid, int) FROM PUBLIC;

NOTIFY pgrst, 'reload schema';

COMMIT;
