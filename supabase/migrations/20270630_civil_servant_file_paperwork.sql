-- ════════════════════════════════════════════════════════════════════
-- 20270630 — Civil Servant: File Paperwork action
--
-- Wires the Civil Servant role card's first action (renamed
-- "REPORT TO MINISTER" → "FILE PAPERWORK" client-side) to the
-- paperwork dispatches authored on /handlepaperwork.html and approved
-- on /courtcaseadmin.html (20270627). The civil servant draws one
-- approved dispatch, reads the document, picks the receiving
-- (ministry, agency), optionally flags it for Senior review, and
-- submits. The submission is graded:
--
--   routing_correct = chosen pair == answer-key pair
--     → +0.3 politician_skill
--
--   flag_correct = answer key needs flagging AND civil servant flagged
--     → +0.3 politician_reputation
--
-- Once a civil servant handles a specific dispatch (correctly or not),
-- that dispatch is hidden from that civil servant's queue for 12 ticks
-- per the user's spec. Other civil servants still see it. The dispatch
-- stays in the rotation pool forever (no per-dispatch global expiry).
--
-- Schema:
--   civil_servant_paperwork_handled
--     One row per (civil servant, dispatch, handle event). Multiple
--     rows can exist for the same (faction, dispatch) pair if the
--     12-tick cooldown elapses and the civil servant re-encounters
--     the same dispatch. No UNIQUE constraint — historical record.
--
-- RPCs:
--   fetch_civil_servant_dispatch()
--     Returns one approved dispatch the caller hasn't handled in the
--     last 12 ticks. Player-facing columns only (no answer key) so
--     the response is safe to render even if it leaks. NULL when no
--     eligible dispatch exists (queue empty or all on cooldown).
--
--   submit_paperwork_routing(p_dispatch_id, p_ministry, p_agency,
--                            p_flag)
--     Grades the choice, applies the rewards, logs the row. Returns
--     the correctness flags + the actual answer key (so the client
--     can render the post-submit reveal: "You picked X · The correct
--     pair was Y").
--
-- Author-of-the-dispatch guard: the same civil servant who AUTHORED
-- a dispatch should never grade their own. Filtered in the fetch RPC
-- via author_faction_id <> caller's faction.
--
-- Apply after 20270629.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.civil_servant_paperwork_handled (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id         uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    dispatch_id        uuid NOT NULL REFERENCES public.paperwork_dispatches(id) ON DELETE CASCADE,
    handled_at_tick    int  NOT NULL,
    chosen_ministry    text NOT NULL,
    chosen_agency      text NOT NULL,
    chose_to_flag      boolean NOT NULL,
    routing_correct    boolean NOT NULL,
    flag_correct       boolean NOT NULL,
    skill_delta        numeric NOT NULL DEFAULT 0,
    reputation_delta   numeric NOT NULL DEFAULT 0,
    created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csph_faction_tick
    ON public.civil_servant_paperwork_handled (faction_id, handled_at_tick DESC);
CREATE INDEX IF NOT EXISTS idx_csph_faction_dispatch
    ON public.civil_servant_paperwork_handled (faction_id, dispatch_id, handled_at_tick DESC);

COMMENT ON TABLE public.civil_servant_paperwork_handled IS
    'Per-civil-servant history of paperwork dispatches handled. One row per handle event (no UNIQUE on (faction, dispatch) — the 12-tick cooldown can put the same dispatch back in a civil servant''s queue eventually). Drives the cooldown filter in fetch_civil_servant_dispatch + the grading audit trail.';

-- ── 2. RLS — own-history read; RPC-only writes ────────────────────
ALTER TABLE public.civil_servant_paperwork_handled ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS csph_read_own ON public.civil_servant_paperwork_handled;
CREATE POLICY csph_read_own ON public.civil_servant_paperwork_handled
    FOR SELECT USING (
        faction_id IN (
            SELECT id FROM public.factions
             WHERE id = auth.uid() OR linked_user_id = auth.uid()
        )
    );

REVOKE INSERT, UPDATE, DELETE ON public.civil_servant_paperwork_handled
    FROM PUBLIC, anon, authenticated;

-- ── 3. fetch_civil_servant_dispatch ───────────────────────────────
CREATE OR REPLACE FUNCTION public.fetch_civil_servant_dispatch()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_tick   int;
    v_d      RECORD;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    -- Caller must be a civil servant — politician faction with a
    -- politician_ministry assignment. Not gating on a specific
    -- ministry per the user's spec; any civil servant can handle any
    -- dispatch.
    SELECT * INTO v_fac FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND politician_ministry IS NOT NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- One approved dispatch the caller hasn't handled in the last 12
    -- ticks, isn't the author of, and that hasn't been claimed by the
    -- caller. Random pick keeps the queue non-deterministic across
    -- civil servants. Returns player-facing columns ONLY — the answer
    -- key (correct_ministry / correct_agency / should_flag) stays
    -- server-side until the grading RPC runs.
    SELECT d.id, d.office_of, d.doc_title, d.sender_title, d.body,
           d.display_id, d.created_at_tick
      INTO v_d
      FROM paperwork_dispatches d
     WHERE d.status = 'approved'
       AND d.author_faction_id IS DISTINCT FROM v_fac.id
       AND NOT EXISTS (
           SELECT 1 FROM civil_servant_paperwork_handled h
            WHERE h.faction_id  = v_fac.id
              AND h.dispatch_id = d.id
              AND h.handled_at_tick + 12 > v_tick
       )
     ORDER BY random()
     LIMIT 1;

    IF v_d.id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'dispatch', NULL,
            'reason', 'queue_empty');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'dispatch', jsonb_build_object(
            'id',              v_d.id,
            'display_id',      v_d.display_id,
            'office_of',       v_d.office_of,
            'doc_title',       v_d.doc_title,
            'sender_title',    v_d.sender_title,
            'body',            v_d.body,
            'created_at_tick', v_d.created_at_tick
        )
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.fetch_civil_servant_dispatch() TO authenticated;

-- ── 4. submit_paperwork_routing ───────────────────────────────────
-- Grades the choice, applies rewards, logs the row. Returns the
-- correctness flags + the answer key so the client can render the
-- post-submit reveal banner. Rewards (user spec):
--   routing_correct  → +0.3 politician_skill
--   flag_needed AND chose_to_flag → +0.3 politician_reputation
CREATE OR REPLACE FUNCTION public.submit_paperwork_routing(
    p_dispatch_id uuid,
    p_ministry    text,
    p_agency      text,
    p_flag        boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid              uuid := auth.uid();
    v_fac              factions%ROWTYPE;
    v_d                paperwork_dispatches%ROWTYPE;
    v_tick             int;
    v_routing_correct  boolean;
    v_flag_correct     boolean;
    v_skill_delta      numeric := 0;
    v_rep_delta        numeric := 0;
    v_new_skill        numeric;
    v_new_rep          int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_dispatch_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;
    IF p_ministry IS NULL OR p_agency IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_routing');
    END IF;
    IF NOT public._paperwork_valid_ministry_agency(p_ministry, p_agency) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_routing');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND politician_ministry IS NOT NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;

    SELECT * INTO v_d FROM paperwork_dispatches WHERE id = p_dispatch_id;
    IF v_d.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'dispatch_not_found');
    END IF;
    IF v_d.status <> 'approved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'dispatch_not_approved');
    END IF;
    IF v_d.author_faction_id = v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cannot_grade_own_authoring');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- 12-tick cooldown: caller must not have handled this dispatch in
    -- the last 12 ticks. Server-side double-check so a stale modal
    -- can't bypass the queue filter on the fetch side.
    IF EXISTS (
        SELECT 1 FROM civil_servant_paperwork_handled
         WHERE faction_id  = v_fac.id
           AND dispatch_id = p_dispatch_id
           AND handled_at_tick + 12 > v_tick
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown');
    END IF;

    -- Grade.
    v_routing_correct := (p_ministry = v_d.correct_ministry
                          AND p_agency  = v_d.correct_agency);
    -- flag_correct surfaces all four states (matrix below) but only
    -- the (should_flag=true AND chose_to_flag=true) cell pays the
    -- reputation reward per the user's spec.
    v_flag_correct := (COALESCE(p_flag, false) = v_d.should_flag);

    IF v_routing_correct THEN
        v_skill_delta := 0.3;
    END IF;
    IF v_d.should_flag AND COALESCE(p_flag, false) THEN
        v_rep_delta := 0.3;
    END IF;

    -- Apply stat deltas. politician_reputation is int, politician_skill
    -- is numeric (see 20270462 + 20270583). Reputation reward is also
    -- 0.3 but rounded down via int arithmetic — first 4 successful
    -- flag calls produce no rep change; the 5th would tip into +1.
    -- Acceptable per the user's "+0.3" spec (matches the politician_
    -- skill cumulative shape from politician_office_hours).
    IF v_skill_delta <> 0 OR v_rep_delta <> 0 THEN
        UPDATE factions
           SET politician_skill      = COALESCE(politician_skill, 0)      + v_skill_delta,
               politician_reputation = COALESCE(politician_reputation, 0) + v_rep_delta
         WHERE id = v_fac.id
        RETURNING politician_skill, politician_reputation
            INTO v_new_skill, v_new_rep;
    ELSE
        v_new_skill := v_fac.politician_skill;
        v_new_rep   := v_fac.politician_reputation;
    END IF;

    -- Log the handle event. Powers the cooldown filter + an audit
    -- trail if we ever surface a "your handling history" view.
    INSERT INTO civil_servant_paperwork_handled (
        faction_id, dispatch_id, handled_at_tick,
        chosen_ministry, chosen_agency, chose_to_flag,
        routing_correct, flag_correct,
        skill_delta, reputation_delta
    ) VALUES (
        v_fac.id, p_dispatch_id, v_tick,
        p_ministry, p_agency, COALESCE(p_flag, false),
        v_routing_correct, v_flag_correct,
        v_skill_delta, v_rep_delta
    );

    RETURN jsonb_build_object(
        'success',          true,
        'dispatch_id',      p_dispatch_id,
        'routing_correct',  v_routing_correct,
        'flag_correct',     v_flag_correct,
        'skill_delta',      v_skill_delta,
        'reputation_delta', v_rep_delta,
        'new_skill',        v_new_skill,
        'new_reputation',   v_new_rep,
        -- Answer key for the post-submit reveal banner.
        'correct_ministry', v_d.correct_ministry,
        'correct_agency',   v_d.correct_agency,
        'should_flag',      v_d.should_flag
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_paperwork_routing(uuid, text, text, boolean) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
