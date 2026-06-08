-- ════════════════════════════════════════════════════════════════════
-- 20270700 — Margin-based verdict discretion + judge bench speech +
--            judge presides over criminal trials too
--
-- Three judge features that turn the magistrate's button-click verdict
-- into a real role and let them talk on the record:
--
-- 1. Margin-based discretion (civil / commercial only). Beat math
--    computes the canonical winner as today; the judge sees their
--    totals and the margin. If the strength margin is clear (>= 30%),
--    the judge can only confirm — no discretion on landslide cases.
--    If the margin is narrow (< 30%), the judge gets a real choice:
--    Confirm (math winner) or Reverse (the other side). Reversal
--    costs the judge 3 Reputation and flags the trial as
--    is_appeal_eligible — laying the hook for a future appellate
--    tier without enforcing one yet.
--
-- 2. Bench speech (all case types, including criminal). The
--    magistrate can post a freeform message into the trial chat that
--    appears as JUDGE-side, kind='judge_speech'. Non-beat, no
--    strength impact — purely on-record commentary, like a judge
--    admonishing counsel or noting something for the record. The
--    kind enum already reserved this value (20270536:92).
--
-- 3. Judge presides over criminal trials too. Previously criminal
--    cases auto-fired the jury verdict at round-4 close regardless
--    of whether a judge was assigned (20270538:73). User direction:
--    the judge should still preside over criminal — sustain/overrule
--    objections, post bench speech — but the only verdict action
--    available is `[Jury reads verdict]` which fires the existing
--    jury auto-verdict logic inside _apply_verdict (no discretion).
--    Two re-emits make this work cleanly:
--      • _close_trial_at_round_four — defer to the judge for ALL
--        case types when one is assigned. Auto-fire only when there
--        is no judge (dice fallback for civil; jury for criminal
--        — _apply_verdict branches internally on case_type).
--      • judge_enter_verdict — remove the criminal rejection block.
--        For criminal trials it now fires _apply_verdict (which runs
--        the jury branch). The Confirm path for civil also goes
--        through this function unchanged.
--
-- Schema:
--   • court_case_trials.is_appeal_eligible boolean NOT NULL DEFAULT
--     false. Set true only when a judge reverses within margin; read
--     by the future appeal infrastructure (20270543 already added
--     appeal_of_trial_id back-reference but does not gate on this
--     flag yet — adding the field now so it's there when needed).
--
-- RPCs:
--   • judge_verdict_preview(faction_id, trial_id) — civil/commercial
--     only; rejects criminal with 'jury_decides_criminal'. Returns
--     the canonical p_total / d_total / margin_pct / math_winner and
--     a boolean is_close (margin_pct < 30). Read-only.
--   • judge_reverse_verdict(faction_id, trial_id) — civil/commercial
--     only; rejects criminal. Applies the reversed verdict manually
--     so we don't have to modify _apply_verdict's 300-line body.
--     Re-validates margin server-side before writing.
--   • post_judge_speech(faction_id, trial_id, text) — works for
--     every case type, including criminal. Inserts a side='judge',
--     kind='judge_speech' message. Length-checked 1..240 chars.
--
-- Known edge case (not fixed here): a non-criminal trial in
-- awaiting_verdict=true whose judge gets rotated to NULL by the
-- 5-tick inactivity sweep sits forever — _close_trial_at_round_four
-- only runs once. Pre-existing behaviour for civil trials before
-- 20270700; criminal now inherits the same hole when this migration
-- lands. Resolve in a follow-up by adding a "verdict on timeout"
-- branch to resolve_due_judge_timeouts.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Schema ─────────────────────────────────────────────────────────
ALTER TABLE public.court_case_trials
    ADD COLUMN IF NOT EXISTS is_appeal_eligible boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.court_case_trials.is_appeal_eligible IS
    'TRUE when a judge reversed the beat-math winner within the 30% margin window (20270700). Set only by judge_reverse_verdict; read by future appellate tier infrastructure.';

-- Lock the column from client writes; only SECURITY DEFINER functions
-- in this migration may set it. Mirror the pattern on judge_faction_id
-- and verdict_winner.
REVOKE UPDATE (is_appeal_eligible) ON public.court_case_trials
    FROM PUBLIC, anon, authenticated;


-- ── RPC 1 — judge_verdict_preview ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.judge_verdict_preview(
    p_faction_id uuid,
    p_trial_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_trial     RECORD;
    v_case_type text;
    v_beats     jsonb;
    v_p_total   numeric := 0;
    v_d_total   numeric := 0;
    v_winner    text;
    v_higher    numeric;
    v_lower     numeric;
    v_margin    numeric;  -- 0.0..1.0
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT t.*, d.case_type
      INTO v_trial
      FROM public.court_case_trials t
      JOIN public.court_case_drafts d ON d.id = t.case_draft_id
     WHERE t.id = p_trial_id;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;

    v_case_type := v_trial.case_type;

    IF v_case_type = 'criminal' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'jury_decides_criminal');
    END IF;

    IF v_trial.judge_faction_id IS NULL
       OR v_trial.judge_faction_id <> p_faction_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_judge');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.factions
         WHERE id = p_faction_id
           AND (id = v_uid OR linked_user_id = v_uid)
           AND faction_type = 'politician'
           AND abandoned_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    IF NOT v_trial.awaiting_verdict THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_awaiting_verdict');
    END IF;

    -- Pull the case beats JSONB so beat-strength extraction below
    -- matches the canonical pattern from _apply_verdict (20270583:159).
    -- Per-hand strength lives at v_beats -> beat_index ->> 'strength'.
    SELECT beats INTO v_beats
      FROM public.court_case_drafts
     WHERE id = v_trial.case_draft_id;

    -- Beat sums per side (played, non-nullified).
    SELECT COALESCE(SUM(CASE WHEN h.side = 'plaintiff'
                              THEN COALESCE((v_beats -> h.beat_index ->> 'strength')::int, 0)
                            ELSE 0 END), 0),
           COALESCE(SUM(CASE WHEN h.side = 'defendant'
                              THEN COALESCE((v_beats -> h.beat_index ->> 'strength')::int, 0)
                            ELSE 0 END), 0)
      INTO v_p_total, v_d_total
      FROM public.court_case_trial_hands h
     WHERE h.trial_id = p_trial_id
       AND h.played_at_round IS NOT NULL
       AND COALESCE(h.nullified, false) = false;

    -- Witness QA contributions.
    v_p_total := v_p_total + COALESCE((
        SELECT SUM(strength) FROM public.court_case_trial_witness_qa
         WHERE trial_id = p_trial_id AND supports = 'plaintiff'
    ), 0);
    v_d_total := v_d_total + COALESCE((
        SELECT SUM(strength) FROM public.court_case_trial_witness_qa
         WHERE trial_id = p_trial_id AND supports = 'defendant'
    ), 0);

    -- Objection-ruling deltas (already signed; can be negative).
    v_p_total := v_p_total + COALESCE(v_trial.plaintiff_objection_strength_delta, 0);
    v_d_total := v_d_total + COALESCE(v_trial.defendant_objection_strength_delta, 0);

    -- Winner by canonical math. Ties go to the defendant (existing
    -- convention in _apply_verdict — burden of proof on the
    -- plaintiff means a true tie loses for them).
    IF v_p_total > v_d_total THEN
        v_winner := 'plaintiff';
        v_higher := v_p_total;
        v_lower  := v_d_total;
    ELSE
        v_winner := 'defendant';
        v_higher := v_d_total;
        v_lower  := v_p_total;
    END IF;

    -- Margin = (higher - lower) / higher. Defensive against zero.
    IF v_higher <= 0 THEN
        v_margin := 1.0;  -- both at zero = arbitrary; no discretion
    ELSE
        v_margin := (v_higher - v_lower) / v_higher;
    END IF;

    RETURN jsonb_build_object(
        'success',     true,
        'plaintiff_total', v_p_total,
        'defendant_total', v_d_total,
        'math_winner',     v_winner,
        'margin_pct',      round(v_margin * 100, 1),
        'is_close',        v_margin < 0.30
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.judge_verdict_preview(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.judge_verdict_preview(uuid, uuid) TO authenticated;


-- ── RPC 2 — judge_reverse_verdict ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.judge_reverse_verdict(
    p_faction_id uuid,
    p_trial_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_trial        RECORD;
    v_case_type    text;
    v_beats        jsonb;
    v_tick         int;
    v_p_total      numeric := 0;
    v_d_total      numeric := 0;
    v_math_winner  text;
    v_reversed     text;
    v_higher       numeric;
    v_lower        numeric;
    v_margin       numeric;
    v_rep_award    numeric;
    v_winner_pol   uuid;
    v_winner_nm    text;
    v_judge_nm     text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    -- FOR UPDATE to serialise concurrent reversal/confirm attempts.
    SELECT t.*, d.case_type
      INTO v_trial
      FROM public.court_case_trials t
      JOIN public.court_case_drafts d ON d.id = t.case_draft_id
     WHERE t.id = p_trial_id
       FOR UPDATE OF t;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;

    v_case_type := v_trial.case_type;
    IF v_case_type = 'criminal' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'jury_decides_criminal');
    END IF;

    IF v_trial.judge_faction_id IS NULL
       OR v_trial.judge_faction_id <> p_faction_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_judge');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.factions
         WHERE id = p_faction_id
           AND (id = v_uid OR linked_user_id = v_uid)
           AND faction_type = 'politician'
           AND abandoned_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    IF NOT v_trial.awaiting_verdict THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_awaiting_verdict');
    END IF;

    IF v_trial.status = 'resolved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved');
    END IF;

    -- Recompute totals + margin server-side; the client preview is
    -- advisory only. Beat strength extracted from court_case_drafts.
    -- beats JSONB at beat_index (canonical pattern from 20270583).
    SELECT beats INTO v_beats
      FROM public.court_case_drafts
     WHERE id = v_trial.case_draft_id;

    SELECT COALESCE(SUM(CASE WHEN h.side = 'plaintiff'
                              THEN COALESCE((v_beats -> h.beat_index ->> 'strength')::int, 0)
                            ELSE 0 END), 0),
           COALESCE(SUM(CASE WHEN h.side = 'defendant'
                              THEN COALESCE((v_beats -> h.beat_index ->> 'strength')::int, 0)
                            ELSE 0 END), 0)
      INTO v_p_total, v_d_total
      FROM public.court_case_trial_hands h
     WHERE h.trial_id = p_trial_id
       AND h.played_at_round IS NOT NULL
       AND COALESCE(h.nullified, false) = false;

    v_p_total := v_p_total + COALESCE((
        SELECT SUM(strength) FROM public.court_case_trial_witness_qa
         WHERE trial_id = p_trial_id AND supports = 'plaintiff'
    ), 0);
    v_d_total := v_d_total + COALESCE((
        SELECT SUM(strength) FROM public.court_case_trial_witness_qa
         WHERE trial_id = p_trial_id AND supports = 'defendant'
    ), 0);

    v_p_total := v_p_total + COALESCE(v_trial.plaintiff_objection_strength_delta, 0);
    v_d_total := v_d_total + COALESCE(v_trial.defendant_objection_strength_delta, 0);

    IF v_p_total > v_d_total THEN
        v_math_winner := 'plaintiff'; v_reversed := 'defendant';
        v_higher := v_p_total; v_lower := v_d_total;
    ELSE
        v_math_winner := 'defendant'; v_reversed := 'plaintiff';
        v_higher := v_d_total; v_lower := v_p_total;
    END IF;

    IF v_higher <= 0 THEN
        v_margin := 1.0;
    ELSE
        v_margin := (v_higher - v_lower) / v_higher;
    END IF;

    -- Margin gate: reversal only allowed when the case is genuinely
    -- close. 0.30 is the same threshold returned by preview's
    -- is_close flag — keep the two in sync if tuning.
    IF v_margin >= 0.30 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'margin_too_wide',
            'margin_pct', round(v_margin * 100, 1));
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Reputation award to the reversed winner. Same formula as
    -- _apply_verdict: round(loser_total / 10, 1) where loser_total
    -- is the math winner's total (the side that lost on reversal).
    v_rep_award := GREATEST(0, round(v_higher / 10.0, 1));

    -- Identify the reversed winner's counsel faction.
    IF v_reversed = 'plaintiff' THEN
        v_winner_pol := v_trial.plaintiff_advocate_id;
    ELSE
        v_winner_pol := v_trial.defendant_advocate_id;
    END IF;

    -- Award reputation + influence to the reversed winner. INT cast
    -- matches _apply_verdict's pattern (politician_reputation is INT).
    IF v_winner_pol IS NOT NULL THEN
        UPDATE public.factions
           SET politician_reputation = GREATEST(0,
                   COALESCE(politician_reputation, 0) + ROUND(v_rep_award)::int),
               politician_influence  = COALESCE(politician_influence, 0) + 1
         WHERE id = v_winner_pol;
    END IF;

    -- Judge takes a 3-Rep hit for reversing against the math.
    UPDATE public.factions
       SET politician_reputation = GREATEST(0,
               COALESCE(politician_reputation, 0) - 3)
     WHERE id = v_trial.judge_faction_id;

    -- Resolve the trial with the reversed winner + appeal flag.
    UPDATE public.court_case_trials
       SET status              = 'resolved',
           verdict_winner      = v_reversed,
           verdict_at_tick     = v_tick,
           awaiting_verdict    = false,
           is_appeal_eligible  = true,
           judge_last_action_at_tick = v_tick
     WHERE id = p_trial_id;

    -- On-record verdict message in the trial chat.
    SELECT leader_first_name || ' ' || leader_last_name
      INTO v_winner_nm
      FROM public.factions
     WHERE id = v_winner_pol;
    SELECT leader_first_name || ' ' || leader_last_name
      INTO v_judge_nm
      FROM public.factions
     WHERE id = v_trial.judge_faction_id;

    INSERT INTO public.court_case_trial_messages
        (trial_id, side, round, turn_seq, text, kind)
    VALUES (
        p_trial_id, 'judge', COALESCE(v_trial.current_round, 4), 0,
        'Judgment is rendered for the ' || v_reversed ||
        '. The court has departed from the weight of the evidence; this verdict is eligible for appeal.',
        'verdict'
    );

    -- World-events dispatch.
    INSERT INTO public.event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_trial.nation_id, v_trial.judge_faction_id,
        'Judicial Reversal',
        'The Hon. ' || COALESCE(NULLIF(btrim(v_judge_nm), ''), 'Magistrate')
            || ' has rendered judgment for the ' || v_reversed
            || ', reversing the weight of the evidence on a close case.'
            || ' The verdict is eligible for appeal.',
        'politician', 'judge_verdict_reversed',
        v_tick
    );

    RETURN jsonb_build_object(
        'success',         true,
        'verdict_winner',  v_reversed,
        'math_winner',     v_math_winner,
        'margin_pct',      round(v_margin * 100, 1),
        'rep_award',       v_rep_award,
        'judge_rep_cost',  3
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.judge_reverse_verdict(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.judge_reverse_verdict(uuid, uuid) TO authenticated;


-- ── RPC 3 — post_judge_speech ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.post_judge_speech(
    p_faction_id uuid,
    p_trial_id   uuid,
    p_text       text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_trial  RECORD;
    v_tick   int;
    v_clean  text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    v_clean := btrim(COALESCE(p_text, ''));
    IF length(v_clean) < 1 OR length(v_clean) > 240 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_length');
    END IF;

    SELECT * INTO v_trial
      FROM public.court_case_trials
     WHERE id = p_trial_id;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;

    IF v_trial.judge_faction_id IS NULL
       OR v_trial.judge_faction_id <> p_faction_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_judge');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.factions
         WHERE id = p_faction_id
           AND (id = v_uid OR linked_user_id = v_uid)
           AND faction_type = 'politician'
           AND abandoned_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    IF v_trial.status NOT IN ('settlement_conference', 'in_progress') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_active');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    INSERT INTO public.court_case_trial_messages
        (trial_id, side, round, turn_seq, text, kind)
    VALUES (
        p_trial_id, 'judge', COALESCE(v_trial.current_round, 1), 0,
        v_clean, 'judge_speech'
    );

    UPDATE public.court_case_trials
       SET judge_last_action_at_tick = COALESCE(v_tick, 0)
     WHERE id = p_trial_id;

    RETURN jsonb_build_object('success', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.post_judge_speech(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.post_judge_speech(uuid, uuid, text) TO authenticated;


-- ── RPC 4 — _close_trial_at_round_four (re-emit) ───────────────────
-- Change vs. 20270538: previously fired _apply_verdict immediately
-- when case_type='criminal' OR judge_faction_id IS NULL. Now only
-- the "no judge" branch auto-fires; criminal-with-judge defers to
-- awaiting_verdict so the magistrate can preside on objections and
-- chat through round 4, then click [Jury reads verdict] to fire
-- _apply_verdict (whose internal branch handles the jury logic).
CREATE OR REPLACE FUNCTION public._close_trial_at_round_four(p_trial_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_trial   court_case_trials%ROWTYPE;
    v_tick    int;
    v_verdict jsonb := NULL;
BEGIN
    SELECT * INTO v_trial FROM public.court_case_trials WHERE id = p_trial_id;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('verdict', NULL, 'reason', 'trial_not_found');
    END IF;

    IF v_trial.judge_faction_id IS NULL THEN
        -- No judge present — auto-fire. _apply_verdict's internal
        -- branch handles criminal (jury) vs. other (beat math).
        UPDATE public.court_case_trials
           SET messages_sent_this_turn = 0
         WHERE id = p_trial_id;
        SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
        v_verdict := public._apply_verdict(p_trial_id, COALESCE(v_tick, 0));
    ELSE
        -- Judge present — defer regardless of case_type. Criminal
        -- magistrate clicks [Jury reads verdict] (judge_enter_verdict
        -- after the 20270700 re-emit); civil/commercial magistrate
        -- gets the Confirm / Reverse modal driven by
        -- judge_verdict_preview.
        UPDATE public.court_case_trials
           SET messages_sent_this_turn = 0,
               awaiting_verdict        = true
         WHERE id = p_trial_id;
    END IF;

    RETURN jsonb_build_object('verdict', v_verdict);
END $$;


-- ── RPC 5 — judge_enter_verdict (re-emit) ──────────────────────────
-- Change vs. 20270538: drop the 'jury_decides_criminal' rejection
-- block. _apply_verdict handles the jury branch internally; the
-- magistrate's click now fires it for criminal cases too. The civil
-- / commercial Confirm path is unchanged. The Reverse path on close
-- civil cases is judge_reverse_verdict — that's intentionally a
-- separate RPC since the override skips _apply_verdict.
CREATE OR REPLACE FUNCTION public.judge_enter_verdict(
    p_faction_id uuid,
    p_trial_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_trial   court_case_trials%ROWTYPE;
    v_tick    int;
    v_verdict jsonb;
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
    IF v_trial.judge_faction_id IS NULL OR v_trial.judge_faction_id <> v_pol.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_the_judge');
    END IF;
    IF NOT v_trial.awaiting_verdict THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_awaiting_verdict');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    v_verdict := public._apply_verdict(p_trial_id, COALESCE(v_tick, 0));

    UPDATE public.court_case_trials
       SET judge_last_action_at_tick = COALESCE(v_tick, judge_last_action_at_tick, 0)
     WHERE id = p_trial_id;

    RETURN jsonb_build_object('success', true, 'verdict', v_verdict);
END $$;


NOTIFY pgrst, 'reload schema';

COMMIT;
