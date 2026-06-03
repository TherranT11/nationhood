-- ════════════════════════════════════════════════════════════════════
-- 20270546 — Same-user counsel guard
--
-- Bug report: a player with multiple politician factions on the same
-- account took the OPPOSING side of one of their own already-active
-- trials. Both sides of "Edwin Pacheco v. GOLI Constructions" ended
-- up controlled by the same user, which is a conflict of interest
-- and an obvious exploit surface.
--
-- The owner of a faction is determined by:
--     COALESCE(linked_user_id, id)
-- — primary factions have id = user_id and linked_user_id NULL;
-- secondary factions on the same account carry linked_user_id =
-- primary's user_id. So two factions belong to the same human iff
-- their COALESCE(linked_user_id, id) values match.
--
-- Two RPCs gain the same-user gate:
--
--   1. represent_pretrial — when joining the open side of an
--      existing trial, the politician filling in must NOT be on the
--      same account as the already-seated counsel on the other side.
--      Rejects with reason 'same_user_already_seated'. Same body as
--      20270543 v5 otherwise.
--
--   2. start_appeal — the auto-fill State Advocate lookup currently
--      excludes the appellant by faction id (sa.id <> v_pol.id). It
--      now also excludes any State Advocate owned by the SAME user
--      account. Same body as 20270545 otherwise.
--
-- Out of scope this round (related but not user-reported):
--   • _assign_magistrate_to_trial does not exclude judges owned by
--     the same user as either advocate. Lets a user be both counsel
--     and judge on their own trial. Flagged for follow-up.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. represent_pretrial — block same-user opposing counsel ───────
CREATE OR REPLACE FUNCTION public.represent_pretrial(
    p_faction_id uuid,
    p_trial_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_pol             factions%ROWTYPE;
    v_trial           court_case_trials%ROWTYPE;
    v_tick            int;
    v_open_side       text;
    v_decision        text;
    v_inserted        int;
    v_judge_id        uuid;
    v_is_appeal       boolean;
    v_opp_advocate_id uuid;
    v_opp_owner       uuid;
    v_my_owner        uuid;
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
        v_open_side       := 'plaintiff';
        v_opp_advocate_id := v_trial.defendant_advocate_id;
    ELSIF v_trial.defendant_advocate_id IS NULL THEN
        v_open_side       := 'defendant';
        v_opp_advocate_id := v_trial.plaintiff_advocate_id;
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'both_sides_filled');
    END IF;

    -- Same-user guard (20270546). Owner = COALESCE(linked_user_id, id).
    -- A faction is on the same account as another if their owner ids
    -- match. Block when the opposing seat is already filled by a
    -- faction this user controls.
    IF v_opp_advocate_id IS NOT NULL THEN
        SELECT COALESCE(linked_user_id, id) INTO v_opp_owner
          FROM public.factions WHERE id = v_opp_advocate_id;
        v_my_owner := COALESCE(v_pol.linked_user_id, v_pol.id);
        IF v_opp_owner IS NOT NULL AND v_opp_owner = v_my_owner THEN
            RETURN jsonb_build_object('success', false, 'reason', 'same_user_already_seated');
        END IF;
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

-- ── 2. start_appeal — exclude same-user from State Advocate pool ───
-- Same body as 20270545 except the State Advocate auto-fill SELECT
-- adds a same-user exclusion alongside the existing sa.id <> v_pol.id
-- check. The other guards (cap, magistrate, FOR UPDATE on the
-- original trial) all stay intact.
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
    v_appellee_party     text;
    v_state_advocate_id  uuid;
    v_trial_id           uuid;
    v_p_advocate         uuid;
    v_d_advocate         uuid;
    v_status             text;
    v_judge_id           uuid;
    v_active_count       int;
    v_cap                int;
    v_my_owner           uuid;
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

    SELECT COUNT(*) INTO v_active_count
      FROM public.court_case_trials t
     WHERE (t.plaintiff_advocate_id = v_pol.id
            OR t.defendant_advocate_id = v_pol.id)
       AND t.status IN ('pre_trial', 'settlement_conference', 'in_progress');
    v_cap := CASE
        WHEN v_pol.politician_experienced_advocate_at_tick IS NOT NULL THEN 4
        WHEN v_pol.politician_state_prosecutor_at_tick    IS NOT NULL THEN 4
        ELSE 3
    END;
    IF v_active_count >= v_cap THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_cap_reached',
            'active', v_active_count, 'cap', v_cap);
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT * INTO v_orig FROM public.court_case_trials
     WHERE id = p_original_trial_id FOR UPDATE;
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

    v_my_owner := COALESCE(v_pol.linked_user_id, v_pol.id);

    IF v_appellee_party = 'state' THEN
        -- Exclude both the appellant faction AND any State Advocate
        -- owned by the same user account (20270546).
        SELECT sa.id INTO v_state_advocate_id
          FROM public.factions sa
          LEFT JOIN public.court_case_trials t
            ON (t.plaintiff_advocate_id = sa.id OR t.defendant_advocate_id = sa.id)
           AND t.status IN ('in_progress', 'settlement_conference', 'pre_trial')
         WHERE sa.politician_state_prosecutor_at_tick IS NOT NULL
           AND sa.bar_admitted_nation_id = v_pol.bar_admitted_nation_id
           AND sa.abandoned_at IS NULL
           AND sa.id <> v_pol.id
           AND COALESCE(sa.linked_user_id, sa.id) <> v_my_owner
         GROUP BY sa.id
         ORDER BY COUNT(t.id) ASC, random() ASC
         LIMIT 1;
    END IF;

    IF v_appellant_side = 'plaintiff' THEN
        v_p_advocate := v_pol.id;
        v_d_advocate := v_state_advocate_id;
    ELSE
        v_p_advocate := v_state_advocate_id;
        v_d_advocate := v_pol.id;
    END IF;

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

    v_judge_id := public._assign_magistrate_to_trial(v_trial_id);

    IF v_status = 'in_progress' THEN
        PERFORM public._begin_trial_arguments(v_trial_id);
    END IF;

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

NOTIFY pgrst, 'reload schema';

COMMIT;
