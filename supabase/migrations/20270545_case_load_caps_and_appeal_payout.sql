-- ════════════════════════════════════════════════════════════════════
-- 20270545 — Case-load caps + Appeal payout v2
--
-- Three coupled changes:
--
--   1. Try a Case cooldown 3 → 1 tick. The user-facing rule is "max
--      use of 1 per tick" so the cooldown stamp shrinks to v_tick + 1.
--
--   2. Active case-load cap on draw_court_case + start_appeal:
--        Advocate                       → 3 active trials
--        Experienced Advocate           → 4 active trials
--        State Advocate (parallel sidestep, formerly State Prosecutor)
--                                       → 4 active trials
--        Magistrate                     → can't try / can't appeal at all
--      Active = trials where the politician is plaintiff_advocate_id
--      OR defendant_advocate_id AND status IN ('pre_trial',
--      'settlement_conference', 'in_progress'). Judge-side trials don't
--      count (Magistrate is already blocked from these RPCs and judge
--      seating is separate work). When at cap, RPCs reject with
--      'case_cap_reached'; client greys the button with active/cap
--      readout.
--
--   3. Appeal payout v2 (replaces 20270543's +5 Rep / -1 Rep):
--        Flipped (appellant wins) → appellant +3 Rep, +5 Political Capital
--        Stood   (appellant loses)→ appellant -5 Rep, -3 Political Capital
--      Both floored at 0. Applied on top of the standard verdict math.
--      Payload renamed: appellant_rep_delta + appellant_pc_delta.
--
-- Functions re-issued:
--   • draw_court_case (cooldown change + Magistrate gate + cap)
--   • start_appeal    (Magistrate gate already present; adds cap)
--   • _apply_verdict  (appeal payout v2)
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. draw_court_case — 1-tick cooldown + cap + Magistrate gate ───
CREATE OR REPLACE FUNCTION public.draw_court_case(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                uuid := auth.uid();
    v_pol                factions%ROWTYPE;
    v_nation             nations%ROWTYPE;
    v_case               court_case_drafts%ROWTYPE;
    v_first_pool         text[];
    v_last_pool          text[];
    v_first_len          int;
    v_last_len           int;
    v_plaintiff          text;
    v_defendant          text;
    v_corp_name          text;
    v_plaintiff_corp_id  uuid;
    v_skipped            uuid[] := ARRAY[]::uuid[];
    v_max_tries          int := 20;
    v_tries              int := 0;
    v_industry           text;
    v_p_sum              int;
    v_d_sum              int;
    v_p_count            int;
    v_d_count            int;
    v_tick               int;
    v_active_count       int;
    v_cap                int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
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
    -- Magistrates preside, not try cases. Same gate as start_appeal.
    IF v_pol.politician_magistrate_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'magistrate_cannot_try');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.try_case_cooldown_until_tick IS NOT NULL
       AND v_pol.try_case_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.try_case_cooldown_until_tick);
    END IF;

    -- Active case-load cap (20270545). Counts trials where the
    -- politician is seated as plaintiff or defendant advocate AND
    -- the trial is still live. Judge-side trials don't count.
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

    SELECT * INTO v_nation FROM public.nations WHERE id = v_pol.nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    v_first_pool := COALESCE(v_nation.first_name_pool, ARRAY[]::text[]);
    v_last_pool  := COALESCE(v_nation.last_name_pool,  ARRAY[]::text[]);
    v_first_len  := COALESCE(array_length(v_first_pool, 1), 0);
    v_last_len   := COALESCE(array_length(v_last_pool,  1), 0);
    IF v_first_len = 0 OR v_last_len = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_name_pool');
    END IF;

    LOOP
        v_tries := v_tries + 1;
        EXIT WHEN v_tries > v_max_tries;

        SELECT * INTO v_case FROM public.court_case_drafts d
         WHERE d.status = 'approved'
           AND NOT (d.id = ANY(v_skipped))
           AND NOT EXISTS (
               SELECT 1 FROM public.politician_court_case_attempts a
                WHERE a.politician_id = v_pol.id
                  AND a.case_id       = d.id
           )
           AND NOT EXISTS (
               SELECT 1 FROM public.court_case_trials t
                WHERE t.case_draft_id = d.id
                  AND t.status IN ('pre_trial', 'in_progress')
           )
           AND NOT EXISTS (
               SELECT 1 FROM public.court_case_nation_cooldowns nc
                WHERE nc.case_draft_id      = d.id
                  AND nc.nation_id          = v_nation.id
                  AND nc.cooldown_until_tick > v_tick
           )
         ORDER BY random() LIMIT 1;
        IF v_case.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_cases_available');
        END IF;

        v_plaintiff         := NULL;
        v_defendant         := NULL;
        v_plaintiff_corp_id := NULL;

        IF v_case.plaintiff_party_type = 'state' THEN
            v_plaintiff := v_nation.name;
        ELSIF v_case.plaintiff_party_type = 'person' THEN
            v_plaintiff := v_first_pool[1 + floor(random() * v_first_len)::int]
                        || ' '
                        || v_last_pool[1 + floor(random() * v_last_len)::int];
        ELSE
            v_industry := CASE WHEN v_case.plaintiff_corp_type = 'aviation'
                                 THEN 'aviation_manufacturing'
                               ELSE v_case.plaintiff_corp_type END;
            SELECT c.id, c.name INTO v_plaintiff_corp_id, v_corp_name
              FROM public.entrepreneur_corps c
              JOIN public.factions owner ON owner.id = c.owner_faction_id
             WHERE c.industry = v_industry
               AND EXISTS (
                   SELECT 1 FROM public.corp_buildings b
                    WHERE b.owner_corp_id = c.id
                      AND b.nation_id     = v_nation.id
                      AND b.status        = 'completed'
               )
               AND (owner.party_cooldown_until_tick IS NULL
                    OR owner.party_cooldown_until_tick <= v_tick)
             ORDER BY random() LIMIT 1;
            IF v_corp_name IS NULL THEN
                v_skipped := array_append(v_skipped, v_case.id);
                CONTINUE;
            END IF;
            v_plaintiff := v_corp_name;
        END IF;

        IF v_case.defendant_party_type = 'state' THEN
            v_defendant := v_nation.name;
        ELSIF v_case.defendant_party_type = 'person' THEN
            v_defendant := v_first_pool[1 + floor(random() * v_first_len)::int]
                        || ' '
                        || v_last_pool[1 + floor(random() * v_last_len)::int];
        ELSE
            v_industry := CASE WHEN v_case.defendant_corp_type = 'aviation'
                                 THEN 'aviation_manufacturing'
                               ELSE v_case.defendant_corp_type END;
            SELECT c.name INTO v_corp_name
              FROM public.entrepreneur_corps c
              JOIN public.factions owner ON owner.id = c.owner_faction_id
             WHERE c.industry = v_industry
               AND c.id IS DISTINCT FROM v_plaintiff_corp_id
               AND EXISTS (
                   SELECT 1 FROM public.corp_buildings b
                    WHERE b.owner_corp_id = c.id
                      AND b.nation_id     = v_nation.id
                      AND b.status        = 'completed'
               )
               AND (owner.party_cooldown_until_tick IS NULL
                    OR owner.party_cooldown_until_tick <= v_tick)
             ORDER BY random() LIMIT 1;
            IF v_corp_name IS NULL THEN
                v_skipped := array_append(v_skipped, v_case.id);
                CONTINUE;
            END IF;
            v_defendant := v_corp_name;
        END IF;

        SELECT
            COALESCE(sum(CASE WHEN b.support = 'plaintiff' THEN b.strength END), 0),
            COALESCE(sum(CASE WHEN b.support = 'defendant' THEN b.strength END), 0),
            COALESCE(count(*) FILTER (WHERE b.support = 'plaintiff'), 0),
            COALESCE(count(*) FILTER (WHERE b.support = 'defendant'), 0)
          INTO v_p_sum, v_d_sum, v_p_count, v_d_count
          FROM (
            SELECT
                elem ->> 'support' AS support,
                COALESCE((elem ->> 'strength')::int, 0) AS strength
              FROM jsonb_array_elements(v_case.beats) elem
          ) b;

        -- 1-tick cooldown (was 3 in 20270520). Matches the user-facing
        -- "max use of 1 per tick" rule.
        UPDATE public.factions
           SET try_case_cooldown_until_tick = v_tick + 1
         WHERE id = v_pol.id;

        RETURN jsonb_build_object(
            'success',                true,
            'case_id',                v_case.id,
            'case_type',              v_case.case_type,
            'litigation_type',        v_case.litigation_type,
            'overview',               v_case.overview,
            'plaintiff_name',         v_plaintiff,
            'plaintiff_party_type',   v_case.plaintiff_party_type,
            'plaintiff_corp_type',    v_case.plaintiff_corp_type,
            'plaintiff_strength_sum', v_p_sum,
            'plaintiff_beat_count',   v_p_count,
            'plaintiff_rep_on_win',   round(v_d_sum::numeric / 10.0, 1),
            'defendant_name',         v_defendant,
            'defendant_party_type',   v_case.defendant_party_type,
            'defendant_corp_type',    v_case.defendant_corp_type,
            'defendant_strength_sum', v_d_sum,
            'defendant_beat_count',   v_d_count,
            'defendant_rep_on_win',   round(v_p_sum::numeric / 10.0, 1),
            'cooldown_until_tick',    v_tick + 1
        );
    END LOOP;

    RETURN jsonb_build_object('success', false, 'reason', 'no_viable_case');
END $$;

-- ── 2. start_appeal — cap check + (still) Magistrate gate ──────────
-- Same body as 20270544 with the active-case cap added BEFORE the
-- original-trial lock so the caller fails fast.
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

    -- Same case-load cap as draw_court_case (20270545). Filing an
    -- appeal is "trying a case" on the docket as far as workload
    -- accounting goes.
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

-- ── 3. _apply_verdict — appeal payout v2 (Rep + PC) ────────────────
-- Same body as 20270543 except the appeal-bonus block applies the
-- new payout: flipped → +3 Rep, +5 PC; stood → -5 Rep, -3 PC. Both
-- floored at 0. The return payload renames appellant_rep_delta and
-- adds appellant_pc_delta.
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
    v_appellant_rep_delta int := 0;
    v_appellant_pc_delta  int := 0;
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

    -- Appeal payout v2 (20270545, replaces 20270543's +5/-1):
    --   flipped → appellant +3 Rep, +5 PC
    --   stood   → appellant -5 Rep, -3 PC
    -- Both floored at 0. Applied on top of standard verdict math.
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
            IF v_appeal_flipped THEN
                v_appellant_rep_delta := 3;
                v_appellant_pc_delta  := 5;
                UPDATE public.factions
                   SET politician_reputation = COALESCE(politician_reputation, 0) + 3,
                       political_capital     = COALESCE(political_capital, 0) + 5
                 WHERE id = v_appellant_id;
            ELSE
                v_appellant_rep_delta := -5;
                v_appellant_pc_delta  := -3;
                UPDATE public.factions
                   SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) - 5),
                       political_capital     = GREATEST(0, COALESCE(political_capital, 0) - 3)
                 WHERE id = v_appellant_id;
            END IF;
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
        'appellant_rep_delta',      CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN v_appellant_rep_delta END,
        'appellant_pc_delta',       CASE WHEN v_trial.appeal_of_trial_id IS NOT NULL THEN v_appellant_pc_delta END
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
