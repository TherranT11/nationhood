-- ════════════════════════════════════════════════════════════════════
-- 20270528 — Trial verdict + settle event_log dispatch
--
-- World-events feed entries for trial resolution. Matches the pattern
-- established in 20270500 (propose_law) — every resolution emits one
-- row into event_log so it surfaces in the Politics tab on the
-- politician-home World Events panel.
--
-- Two paths, two templates:
--
--   Verdict (points-based or settle-declined):
--     "The case of {plaintiff_name} vs {defendant_name} has finished,
--      with the court ruling in favor of {winner_name}.
--      {winning_attorney_name} scores a major win in court."
--
--   Settle accepted (both parties agree):
--     "The case of {plaintiff_name} vs {defendant_name} has been
--      settled out of court."
--
-- Both functions re-issued with the dispatch tacked on. _apply_verdict
-- body is otherwise byte-identical to 20270527; _apply_settle_accept
-- body is otherwise byte-identical to 20270517 with the addition of a
-- v_trial load so the entity names are available.
--
-- category = 'politician' (matches propose_law). trigger_key values
-- 'trial_verdict_rendered' / 'trial_settled' are new — POLITICS_
-- CATEGORIES filter on politician-home already accepts the whole
-- 'politician' category, so the entries surface without a frontend
-- change. faction_id on verdict = winning advocate (the actor);
-- faction_id on settle = NULL (no single actor — mutual decision).
--
-- Defensive fallbacks: missing leader name → faction_name → 'Counsel'.
-- Missing entity name → 'Plaintiff' / 'Defendant'. Missing winning
-- advocate row (orphan trial) → drops the "scores a major win"
-- sentence rather than emitting "scores a major win" with no name.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. _apply_verdict — add event_log dispatch ─────────────────────
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
BEGIN
    SELECT * INTO v_trial FROM public.court_case_trials WHERE id = p_trial_id FOR UPDATE;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'in_progress' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved');
    END IF;

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;

    -- Beats: played, non-nullified. The nullified carve-out strips
    -- any beat that a sustained objection nullified (20270525
    -- restored that path on top of 20270524's dice roll).
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

    -- Tie → defendant (status quo).
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
        -- Floor at 0: over-objected loser can land negative; winner
        -- doesn't lose Rep on a verdict they won.
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

    UPDATE public.court_case_trials
       SET status          = 'resolved',
           verdict_winner  = v_winner,
           verdict_at_tick = p_tick
     WHERE id = p_trial_id;

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        p_trial_id, 'system', v_trial.current_round, 0,
        'Verdict: judgment for the ' || v_winner ||
            '. (plaintiff ' || v_p_total ||
            ' vs defendant ' || v_d_total || ')',
        'verdict'
    );

    -- World-events dispatch. Entity-name fallbacks defend against
    -- nulls; winning-attorney sentence is dropped entirely if we
    -- can't resolve a name (rather than printing "Counsel scores a
    -- major win" with no actual name).
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

    v_event_text :=
        'The case of ' || v_p_name || ' vs ' || v_d_name
        || ' has finished, with the court ruling in favor of ' || v_winner_name || '.';
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
        'Verdict Rendered',
        v_event_text,
        'politician', 'trial_verdict_rendered',
        p_tick
    );

    RETURN jsonb_build_object(
        'success',                  true,
        'winner',                   v_winner,
        'plaintiff_strength',       v_p_total,
        'defendant_strength',       v_d_total,
        'plaintiff_beat_sum',       v_p_sum,
        'defendant_beat_sum',       v_d_sum,
        'plaintiff_witness_sum',    v_p_wit,
        'defendant_witness_sum',    v_d_wit,
        'plaintiff_objection_delta', v_p_obj,
        'defendant_objection_delta', v_d_obj,
        'plaintiff_rep_delta',      v_p_delta,
        'defendant_rep_delta',      v_d_delta
    );
END $$;

-- ── 2. _apply_settle_accept — add event_log dispatch ───────────────
-- Loads v_trial (was previously a blind UPDATE) so the entity names
-- are available for the event text. Rep bump + state flip unchanged.
CREATE OR REPLACE FUNCTION public._apply_settle_accept(
    p_trial_id     uuid,
    p_plaintiff_id uuid,
    p_defendant_id uuid,
    p_tick         int
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_trial   court_case_trials%ROWTYPE;
    v_p_name  text;
    v_d_name  text;
BEGIN
    SELECT * INTO v_trial FROM public.court_case_trials WHERE id = p_trial_id;

    UPDATE public.court_case_trials
       SET status          = 'settled',
           settle_resolved = 'accepted',
           verdict_winner  = 'settled',
           verdict_at_tick = p_tick
     WHERE id = p_trial_id;
    UPDATE public.factions
       SET politician_reputation = COALESCE(politician_reputation, 0) + 2
     WHERE id IN (p_plaintiff_id, p_defendant_id);

    IF v_trial.id IS NOT NULL THEN
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
            p_tick
        );
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
