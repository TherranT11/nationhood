-- ════════════════════════════════════════════════════════════════════
-- 20270735 — Per-player dismissal of resolved verdict cards
--
-- Per user spec, the Verdict Rendered card in Pressing Issues (the
-- one 20270726 keeps around for 12 ticks after resolution) needs a
-- Close button so the player can clear it manually. Right now the
-- only way for the card to leave the panel is the 12-tick auto-
-- expiry; for a player who just wants the verdict acknowledged and
-- the slot back, that's too long.
--
-- Schema:
--   politician_dismissed_resolved_trials — one row per
--   (faction_id, trial_id). Created when a player presses Close;
--   list_active_trials_for_advocate filters out rows that exist for
--   the caller. PK is (faction_id, trial_id) so re-pressing Close is
--   a no-op (ON CONFLICT DO NOTHING).
--
-- RPC: dismiss_resolved_trial(p_faction_id, p_trial_id)
--   • Validates the caller is a participant (advocate/judge) on
--     the trial (same set the list RPC pulls). Stops random players
--     from dismissing cards they were never going to see anyway.
--   • Validates the trial is in 'resolved' state — dismissing an
--     in-progress trial would just hide an active obligation.
--   • Insert with ON CONFLICT DO NOTHING so a stale double-click
--     after the page state updates doesn't surface a unique
--     violation.
--
-- list_active_trials_for_advocate re-emit:
--   • Adds a NOT EXISTS subquery against the dismissal table for
--     resolved trials. In-flight trials (in_progress, settlement
--     _conference, awaiting_hearing) ignore the dismissal table —
--     a player can't dismiss a trial they're still meant to act
--     on. Body otherwise byte-faithful to 20270726.
--
-- Cleanup: politician_dismissed_resolved_trials rows are FK-
-- cascaded on faction deletion (politician retires) and trial
-- deletion (rare admin cleanup). They otherwise persist forever,
-- which is fine — the row count is bounded by participants × trials
-- and never grows fast.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Dismissal table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.politician_dismissed_resolved_trials (
    faction_id        uuid NOT NULL REFERENCES public.factions(id)           ON DELETE CASCADE,
    trial_id          uuid NOT NULL REFERENCES public.court_case_trials(id)  ON DELETE CASCADE,
    dismissed_at_tick int  NOT NULL,
    created_at        timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (faction_id, trial_id)
);

CREATE INDEX IF NOT EXISTS politician_dismissed_resolved_trials_trial_idx
    ON public.politician_dismissed_resolved_trials (trial_id);

COMMENT ON TABLE public.politician_dismissed_resolved_trials IS
    'Per-player dismissal log for Pressing Issues verdict cards (20270735). One row per (faction, trial) when a player presses Close on a resolved trial; filtered out by list_active_trials_for_advocate. Forward-only — rows persist until the participant or trial is deleted.';

ALTER TABLE public.politician_dismissed_resolved_trials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dismissed_resolved_trials_select_own
    ON public.politician_dismissed_resolved_trials;
CREATE POLICY dismissed_resolved_trials_select_own
    ON public.politician_dismissed_resolved_trials FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.factions f
             WHERE f.id = faction_id
               AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS dismissed_resolved_trials_service_all
    ON public.politician_dismissed_resolved_trials;
CREATE POLICY dismissed_resolved_trials_service_all
    ON public.politician_dismissed_resolved_trials FOR ALL TO service_role
    USING (true) WITH CHECK (true);


-- ── 2. dismiss_resolved_trial RPC ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.dismiss_resolved_trial(
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
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_trial_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_trial FROM public.court_case_trials WHERE id = p_trial_id;
    IF v_trial.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_trial.status <> 'resolved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_resolved');
    END IF;
    IF v_pol.id NOT IN (
        COALESCE(v_trial.plaintiff_advocate_id, '00000000-0000-0000-0000-000000000000'::uuid),
        COALESCE(v_trial.defendant_advocate_id, '00000000-0000-0000-0000-000000000000'::uuid),
        COALESCE(v_trial.judge_faction_id,      '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_a_participant');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO public.politician_dismissed_resolved_trials
        (faction_id, trial_id, dismissed_at_tick)
    VALUES (v_pol.id, p_trial_id, v_tick)
    ON CONFLICT (faction_id, trial_id) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'trial_id', p_trial_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.dismiss_resolved_trial(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.dismiss_resolved_trial(uuid, uuid) TO authenticated;


-- ── 3. list_active_trials_for_advocate — filter out dismissed ───────
-- Adds the dismissal-table NOT EXISTS clause to the resolved branch
-- of the existing WHERE. In-flight statuses ignore the table — a
-- player can't hide a trial they're still meant to act on. Body
-- otherwise byte-faithful to 20270726.
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
            t.status IN ('in_progress', 'settlement_conference', 'awaiting_hearing')
            OR (t.status = 'resolved'
                AND t.verdict_at_tick IS NOT NULL
                AND v_tick - t.verdict_at_tick <= 12
                -- 20270735: filter resolved trials the caller has
                -- manually dismissed via the Close button.
                AND NOT EXISTS (
                    SELECT 1 FROM public.politician_dismissed_resolved_trials drt
                     WHERE drt.faction_id = v_pol.id
                       AND drt.trial_id   = t.id
                ))
       );

    RETURN jsonb_build_object('success', true, 'trials', v_trials);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_active_trials_for_advocate(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_active_trials_for_advocate(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
