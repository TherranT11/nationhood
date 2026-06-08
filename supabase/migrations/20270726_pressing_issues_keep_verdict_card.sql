-- ════════════════════════════════════════════════════════════════════
-- 20270726 — Pressing Issues keeps recently-resolved trials with the
--              verdict line in the same card container
--
-- User flagged that after a verdict lands, the trial card disappears
-- from Pressing Issues and the only remaining feedback is the modal
-- error "This trial is no longer in session." when the player clicks
-- a stale resume button. They want the card to persist briefly with
-- the verdict announced inline: "In the matter of {plaintiff} v.
-- {defendant}, the verdict finds in the favor of {winner}."
--
-- This migration extends list_active_trials_for_advocate to ALSO
-- return resolved trials whose verdict_at_tick is within the last 12
-- ticks (12 in-game months — same window as the appeal-filing path
-- from 20270543 / 20270560, so a player has the same time to see
-- the verdict as they do to appeal it). The client surfaces those
-- rows in a new "resolved" card variant via the existing renderer.
--
-- New fields added to every returned row (NULL on still-active
-- trials):
--   verdict_winner   — 'plaintiff' | 'defendant' | 'settled' | 'tie'
--   verdict_at_tick  — int, orderable timestamp on the verdict
--
-- Body otherwise byte-faithful to 20270590 — same per-row shape,
-- same WHERE-clause counsel/judge filter, same matched_at_tick
-- order. The status IN clause is the only line that changes.
--
-- Out of scope:
--   • Dismiss-from-this-session UX. The card auto-fades after the
--     12-tick window; no per-faction dismissal table needed.
--   • Verdict text on the trial-modal "no longer in session" path.
--     Stale clicks still hit that modal; the resolved card in the
--     panel is the canonical surface for the verdict.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.list_active_trials_for_advocate(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_tick   int;
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

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'trial_id',        t.id,
        'case_id',         t.case_draft_id,
        'case_type',       d.case_type,
        'litigation_type', d.litigation_type,
        'plaintiff_name',  t.plaintiff_name,
        'defendant_name',  t.defendant_name,
        'status',          t.status,
        'role',            CASE WHEN t.plaintiff_advocate_id = v_pol.id THEN 'plaintiff'
                                WHEN t.defendant_advocate_id = v_pol.id THEN 'defendant'
                                WHEN t.judge_faction_id      = v_pol.id THEN 'judge' END,
        'side',            CASE WHEN t.plaintiff_advocate_id = v_pol.id THEN 'plaintiff'
                                WHEN t.defendant_advocate_id = v_pol.id THEN 'defendant' END,
        'your_turn',       (t.current_turn = CASE WHEN t.plaintiff_advocate_id = v_pol.id THEN 'plaintiff'
                                                    WHEN t.defendant_advocate_id = v_pol.id THEN 'defendant' END),
        'current_round',       t.current_round,
        'ticks_until_forfeit',
             CASE WHEN t.current_turn_started_at_tick IS NOT NULL
                   AND t.status = 'in_progress'
                   AND t.pending_objection_message_id IS NULL
                   AND COALESCE(t.awaiting_verdict, false) = false
                  THEN GREATEST(0,
                       t.current_turn_started_at_tick + 4
                       - v_tick)
                  ELSE NULL END,
        'own_settlement_decision', CASE WHEN t.plaintiff_advocate_id = v_pol.id THEN t.plaintiff_settlement_decision
                                          WHEN t.defendant_advocate_id = v_pol.id THEN t.defendant_settlement_decision END,
        'pending_objection', t.pending_objection_message_id IS NOT NULL,
        'awaiting_verdict',  t.awaiting_verdict,
        'is_supreme_court',  (
            t.appeal_of_trial_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.court_case_trials parent
                 WHERE parent.id = t.appeal_of_trial_id
                   AND parent.appeal_of_trial_id IS NOT NULL
            )
        ),
        -- 20270726: verdict fields. NULL for still-active rows; set
        -- on resolved rows so the client can render the verdict line.
        'verdict_winner',  t.verdict_winner,
        'verdict_at_tick', t.verdict_at_tick
    ) ORDER BY t.matched_at_tick ASC NULLS LAST), '[]'::jsonb)
      INTO v_trials
      FROM public.court_case_trials t
      JOIN public.court_case_drafts d ON d.id = t.case_draft_id
     WHERE (t.plaintiff_advocate_id = v_pol.id
            OR t.defendant_advocate_id = v_pol.id
            OR t.judge_faction_id      = v_pol.id)
       AND (
            -- In-flight statuses (same as 20270590).
            t.status IN ('in_progress', 'settlement_conference', 'awaiting_hearing')
            -- 20270726: resolved trials still inside the 12-tick window.
            -- Same window the appeal-filing path uses (20270543/560),
            -- so the resolved card sits in the panel for the same
            -- duration a player has to act on the verdict.
            OR (t.status = 'resolved'
                AND t.verdict_at_tick IS NOT NULL
                AND v_tick - t.verdict_at_tick <= 12)
       );

    RETURN jsonb_build_object('success', true, 'trials', v_trials);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_active_trials_for_advocate(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_active_trials_for_advocate(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
