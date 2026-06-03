-- ════════════════════════════════════════════════════════════════════
-- 20270560 — Supreme Court appeal filing (Phase 1: filing + parking)
--
-- Adds the [Appeal to Supreme Court] action available to Experienced
-- Advocates and State Advocates. Filing an SC appeal creates a new
-- court_case_trials row chained off the lower-court appeal trial via
-- appeal_of_trial_id — so the chain becomes:
--
--   original trial → appeal trial → SC trial
--
-- The chain depth is the only signal we need: a trial whose
-- appeal_of_trial_id parent ALSO has appeal_of_trial_id set is an SC
-- trial. No new column.
--
-- Phase 1 scope (this migration):
--
--   • list_appealable_cases now returns regular appealable verdicts
--     PLUS appealable appeal-verdicts (for callers holding the
--     Experienced Advocate or State Advocate rung). Each card carries
--     'appeal_kind' = 'verdict' | 'appeal' so the client can render
--     the right button label. SC appeals are sourced from resolved
--     appeal trials whose own verdict landed in the last 12 ticks and
--     have no SC appeal already in flight. The case-load cap, nation
--     and magistrate gates stay identical between the two sources.
--
--   • start_appeal detects whether the target trial is an original
--     (appeal_of_trial_id IS NULL → regular appeal) or an appeal
--     (appeal_of_trial_id IS NOT NULL → SC appeal). The SC branch
--     adds a rung gate (Experienced Advocate OR State Advocate). On
--     filing, the SC trial stays at status='pre_trial' regardless of
--     attorney auto-fill, judge_faction_id stays NULL, and
--     _begin_trial_arguments is NOT called. The trial parks awaiting
--     Phase 2's Supreme Court Justice bench mechanic. The system
--     court-convened message reflects this.
--
--   • represent_pretrial — when the opposing attorney joins an SC
--     trial via the normal pickup, seat them but DON'T assign a
--     magistrate and DON'T flip to in_progress. The SC trial stays
--     parked until Phase 2 wires up SC justice assignment.
--
-- Out of scope (Phase 2):
--
--   • SC Justice rung (politician_supreme_court_justice_at_tick) +
--     assignment + auto-flip to in_progress once both attorneys AND
--     a judge are seated.
--   • _apply_verdict escalated SC payout: flipped +5 Rep / +8 PC,
--     stood −8 Rep / −5 PC. Skipped here because SC trials can't
--     reach verdict in Phase 1 (no judge → never advances).
--
-- Behavioural invariants preserved:
--   • Existing regular-appeal flow is byte-identical except for the
--     `appeal_kind` payload field added to list_appealable_cases.
--   • SC appeals are terminal — they cannot themselves be appealed.
--     The list query's parent.appeal_of_trial_id IS NULL filter
--     excludes them from the SC-appealable pool.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. list_appealable_cases — verdicts + appeals, tagged ──────────
-- Two-source UNION ALL:
--   (a) Regular appealable verdicts — original trials (no
--       appeal_of_trial_id) with verdict in the last 12 ticks and no
--       appeal in flight. Available to any non-magistrate advocate.
--   (b) SC-appealable appeals — appeal trials (appeal_of_trial_id IS
--       NOT NULL, parent has appeal_of_trial_id IS NULL so we don't
--       chain a third level) with verdict in the last 12 ticks and no
--       SC appeal in flight. Only included when caller holds
--       Experienced Advocate or State Advocate.
-- 'appeal_kind' tags each row so the client can render the right
-- button (Start Appeal vs Appeal to Supreme Court).
CREATE OR REPLACE FUNCTION public.list_appealable_cases(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_tick    int;
    v_can_sc  boolean;
    v_cases   jsonb;
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
        RETURN jsonb_build_object('success', true, 'cases', '[]'::jsonb);
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    v_can_sc := v_pol.politician_experienced_advocate_at_tick IS NOT NULL
             OR v_pol.politician_state_prosecutor_at_tick    IS NOT NULL;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(c) ORDER BY c.verdict_at_tick DESC), '[]'::jsonb)
      INTO v_cases
      FROM (
        -- (a) Regular appealable verdicts.
        SELECT
            'verdict'::text   AS appeal_kind,
            t.id              AS original_trial_id,
            t.plaintiff_name,
            t.defendant_name,
            d.case_type,
            d.litigation_type,
            t.verdict_winner  AS winner,
            12 - (v_tick - t.verdict_at_tick) AS ticks_remaining,
            t.verdict_at_tick
          FROM public.court_case_trials t
          JOIN public.court_case_drafts d ON d.id = t.case_draft_id
         WHERE t.nation_id           = v_pol.bar_admitted_nation_id
           AND t.status              = 'resolved'
           AND t.appeal_of_trial_id IS NULL
           AND t.verdict_at_tick    IS NOT NULL
           AND (v_tick - t.verdict_at_tick) <= 12
           AND NOT EXISTS (
               SELECT 1 FROM public.court_case_trials a
                WHERE a.appeal_of_trial_id = t.id
                  AND a.status IN ('pre_trial', 'settlement_conference', 'in_progress')
           )

        UNION ALL

        -- (b) SC-appealable appeals. Only when caller can file SC.
        SELECT
            'appeal'::text     AS appeal_kind,
            t.id               AS original_trial_id,
            t.plaintiff_name,
            t.defendant_name,
            d.case_type,
            d.litigation_type,
            t.verdict_winner   AS winner,
            12 - (v_tick - t.verdict_at_tick) AS ticks_remaining,
            t.verdict_at_tick
          FROM public.court_case_trials t
          JOIN public.court_case_drafts d ON d.id = t.case_draft_id
          JOIN public.court_case_trials parent ON parent.id = t.appeal_of_trial_id
         WHERE v_can_sc
           AND t.nation_id           = v_pol.bar_admitted_nation_id
           AND t.status              = 'resolved'
           AND t.appeal_of_trial_id IS NOT NULL
           AND parent.appeal_of_trial_id IS NULL  -- parent is original (no chaining beyond SC)
           AND t.verdict_at_tick    IS NOT NULL
           AND (v_tick - t.verdict_at_tick) <= 12
           AND NOT EXISTS (
               SELECT 1 FROM public.court_case_trials sc
                WHERE sc.appeal_of_trial_id = t.id
                  AND sc.status IN ('pre_trial', 'settlement_conference', 'in_progress')
           )
      ) c;

    RETURN jsonb_build_object('success', true, 'cases', v_cases);
END $$;

-- ── 2. start_appeal — detect SC, gate, park ───────────────────────
-- Same body as 20270546 with an SC branch added. SC detection: the
-- target trial has appeal_of_trial_id set (i.e., it's already an
-- appeal). When SC:
--   • Require Experienced Advocate OR State Advocate (gate).
--   • Status forced to 'pre_trial' (don't flip to in_progress even
--     if state auto-fills the appellee — we still need an SC judge).
--   • Skip _assign_magistrate_to_trial. judge_faction_id stays NULL.
--   • Skip _begin_trial_arguments.
--   • Different court-convened message reflecting the parked state.
-- Everything else (case-load cap, FOR UPDATE serialization, same-user
-- guards, attempts row, state auto-fill, party identity) is identical
-- to the regular branch.
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
    v_is_sc              boolean;
    v_can_sc             boolean;
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

    -- SC detection + rung gate. The trial being appealed is itself an
    -- appeal iff it has appeal_of_trial_id set. SC appeals require
    -- Experienced Advocate OR State Advocate.
    v_is_sc  := v_orig.appeal_of_trial_id IS NOT NULL;
    v_can_sc := v_pol.politician_experienced_advocate_at_tick IS NOT NULL
             OR v_pol.politician_state_prosecutor_at_tick    IS NOT NULL;
    IF v_is_sc AND NOT v_can_sc THEN
        RETURN jsonb_build_object('success', false, 'reason', 'sc_requires_experienced_or_state');
    END IF;
    -- SC appeals are terminal — don't allow chaining beyond one SC
    -- round. Guards against future cross-talk if someone manually
    -- inserts a third-level row.
    IF v_is_sc AND EXISTS (
         SELECT 1 FROM public.court_case_trials parent
          WHERE parent.id = v_orig.appeal_of_trial_id
            AND parent.appeal_of_trial_id IS NOT NULL
       ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'sc_is_terminal');
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

    -- SC trials park at pre_trial regardless of attorney auto-fill —
    -- they still need an SC judge before arguments can begin. Regular
    -- appeals flip to in_progress when both attorneys are seated up
    -- front (state auto-fill case).
    IF v_is_sc THEN
        v_status := 'pre_trial';
    ELSIF v_p_advocate IS NOT NULL AND v_d_advocate IS NOT NULL THEN
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

    -- Bench + arguments: regular appeals get a magistrate and may begin
    -- immediately. SC trials park (Phase 2 wires up SC justice bench).
    IF v_is_sc THEN
        v_judge_id := NULL;
    ELSE
        v_judge_id := public._assign_magistrate_to_trial(v_trial_id);
        IF v_status = 'in_progress' THEN
            PERFORM public._begin_trial_arguments(v_trial_id);
        END IF;
    END IF;

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        v_trial_id, 'system', 0, 0,
        CASE WHEN v_is_sc
             THEN 'A Supreme Court appeal has been filed. The matter awaits a bench assignment.'
             ELSE 'Appeal of the prior verdict is convened. Counsel for the appellant has filed; the court will hear arguments.'
        END,
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

-- ── 3. represent_pretrial — SC short-circuit in appeal branch ──────
-- Same body as 20270546 with one inserted branch: in the v_is_appeal
-- path, after seating the joining attorney, detect SC (chain-depth
-- check) and skip both _assign_magistrate_to_trial and
-- _begin_trial_arguments. SC trials stay at status='pre_trial' until
-- Phase 2's SC justice mechanic flips them.
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
    v_is_sc           boolean;
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
    v_is_sc     := v_is_appeal AND EXISTS (
        SELECT 1 FROM public.court_case_trials parent
         WHERE parent.id = v_trial.appeal_of_trial_id
           AND parent.appeal_of_trial_id IS NOT NULL
    );

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

        -- SC trials: seat the attorney and stop. No magistrate, no
        -- hand deal, no in_progress flip. Phase 2's SC justice
        -- mechanic picks up from here.
        IF v_is_sc THEN
            INSERT INTO public.court_case_trial_messages (
                trial_id, side, round, turn_seq, text, kind
            ) VALUES (
                p_trial_id, 'system', 0, 0,
                'Both counsels are seated. The Supreme Court has not yet convened.',
                'judge_note'
            );
            RETURN jsonb_build_object(
                'success',          true,
                'decision',         v_decision,
                'side',             v_open_side,
                'trial_id',         p_trial_id,
                'case_id',          v_trial.case_draft_id,
                'trial_status',     'pre_trial',
                'matched_at_tick',  v_tick,
                'judge_assigned',   false,
                'judge_faction_id', NULL,
                'is_appeal',        true
            );
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
            'success',          true,
            'decision',         v_decision,
            'side',             v_open_side,
            'trial_id',         p_trial_id,
            'case_id',          v_trial.case_draft_id,
            'trial_status',     'in_progress',
            'matched_at_tick',  v_tick,
            'judge_assigned',   v_judge_id IS NOT NULL,
            'judge_faction_id', v_judge_id,
            'is_appeal',        true
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
        'success',          true,
        'decision',         v_decision,
        'side',             v_open_side,
        'trial_id',         p_trial_id,
        'case_id',          v_trial.case_draft_id,
        'trial_status',     'settlement_conference',
        'matched_at_tick',  v_tick,
        'judge_assigned',   v_judge_id IS NOT NULL,
        'judge_faction_id', v_judge_id,
        'is_appeal',        false
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
