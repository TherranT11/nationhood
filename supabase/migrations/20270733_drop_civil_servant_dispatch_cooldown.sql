-- ════════════════════════════════════════════════════════════════════
-- 20270733 — Drop the 12-tick re-handle cooldown on civil-servant
--              paperwork dispatches
--
-- Per user spec, the "you've seen this dispatch, wait 12 ticks
-- before it can come up again" gate is gone. The empty-queue
-- modal copy was the prompt — players hit "All caught up, or
-- everything you've seen is still on its 12-tick cooldown" too
-- often, and the cooldown itself wasn't doing useful work.
--
-- Replacement semantic: each dispatch is handled at most ONCE per
-- civil servant. Two RPCs change in parallel:
--
--   1. fetch_civil_servant_dispatch — the NOT EXISTS filter that
--      previously read `handled_at_tick + 12 > v_tick` now reads
--      just (faction_id, dispatch_id). Once a civil servant files
--      a dispatch it never returns to their queue.
--   2. submit_paperwork_routing — the symmetric gate that used to
--      return reason='on_cooldown' now returns 'already_handled'.
--      Same predicate change. Renamed for semantic accuracy —
--      "cooldown" implies a wait; "already_handled" reads what
--      it now is.
--
-- This is the only sensible no-cooldown shape: otherwise the same
-- dispatch would pop right back up the next pull and the modal
-- would loop on a single doc; or the submit could double-credit
-- the same civil servant for the same dispatch.
--
-- Knock-on on civil_servant_paperwork_handled:
--   • The 20270630 schema deliberately had NO UNIQUE on
--     (faction_id, dispatch_id) because the 12-tick cooldown
--     allowed legitimate re-handle entries to accumulate. With
--     the cooldown gone, the table will only ever see one row per
--     (faction, dispatch) by construction (the filter blocks the
--     second handle). Schema unchanged — leaving the absence of
--     UNIQUE is harmless and forward-compatible if a future
--     mechanic re-introduces a re-handle path.
--
-- Bodies byte-faithful to 20270668's emits except the cooldown
-- predicate lines.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.fetch_civil_servant_dispatch(p_faction_id uuid)
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
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;
    IF v_fac.politician_ministry IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- One approved dispatch the caller hasn't EVER handled, isn't
    -- the author of, and that hasn't been claimed by the caller.
    -- Random pick keeps the queue non-deterministic across civil
    -- servants. 20270733: the 12-tick re-handle cooldown is gone —
    -- once a civil servant files a dispatch it never comes back in
    -- their queue. Player-facing columns ONLY; answer key
    -- (correct_ministry / correct_agency / should_flag) stays
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

REVOKE EXECUTE ON FUNCTION public.fetch_civil_servant_dispatch(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fetch_civil_servant_dispatch(uuid) TO authenticated;


-- ── submit_paperwork_routing — symmetric cooldown drop ───────────
CREATE OR REPLACE FUNCTION public.submit_paperwork_routing(
    p_dispatch_id uuid,
    p_ministry    text,
    p_agency      text,
    p_flag        boolean,
    p_faction_id  uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                uuid := auth.uid();
    v_fac                factions%ROWTYPE;
    v_d                  paperwork_dispatches%ROWTYPE;
    v_tick               int;
    v_handled_this_tick  int;
    v_routing_correct    boolean;
    v_flag_correct       boolean;
    v_skill_delta        numeric := 0;
    v_rep_delta          numeric := 0;
    v_new_skill          numeric;
    v_new_rep            numeric;
    v_batch_position     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
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
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;
    IF v_fac.politician_ministry IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- 20270638: 3-per-tick batch cap.
    SELECT COUNT(*) INTO v_handled_this_tick
      FROM civil_servant_paperwork_handled
     WHERE faction_id = v_fac.id
       AND handled_at_tick = v_tick;

    IF v_handled_this_tick >= 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'batch_full',
            'batch_position', 3, 'batch_remaining', 0, 'batch_done', true);
    END IF;

    IF v_handled_this_tick = 0
       AND v_fac.next_civil_service_action_tick IS NOT NULL
       AND v_fac.next_civil_service_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_fac.next_civil_service_action_tick);
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

    -- 20270733: once-only handling per civil servant. Was a 12-tick
    -- re-handle cooldown; now strictly "filed it already, can't file
    -- it again." reason renamed on_cooldown → already_handled for
    -- semantic accuracy (no wait, just done).
    IF EXISTS (
        SELECT 1 FROM civil_servant_paperwork_handled
         WHERE faction_id  = v_fac.id
           AND dispatch_id = p_dispatch_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_handled');
    END IF;

    v_routing_correct := (p_ministry = v_d.correct_ministry
                          AND p_agency  = v_d.correct_agency);
    v_flag_correct := (COALESCE(p_flag, false) = v_d.should_flag);

    IF v_routing_correct THEN
        v_skill_delta := 0.3;
    END IF;
    IF v_d.should_flag AND COALESCE(p_flag, false) THEN
        v_rep_delta := 0.3;
    END IF;

    UPDATE factions
       SET politician_skill              = COALESCE(politician_skill, 0)      + v_skill_delta,
           politician_reputation         = COALESCE(politician_reputation, 0) + v_rep_delta,
           next_civil_service_action_tick = v_tick + 1
     WHERE id = v_fac.id
    RETURNING politician_skill, politician_reputation
        INTO v_new_skill, v_new_rep;

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

    v_batch_position := v_handled_this_tick + 1;

    RETURN jsonb_build_object(
        'success',          true,
        'dispatch_id',      p_dispatch_id,
        'routing_correct',  v_routing_correct,
        'flag_correct',     v_flag_correct,
        'skill_delta',      v_skill_delta,
        'reputation_delta', v_rep_delta,
        'new_skill',        v_new_skill,
        'new_reputation',   v_new_rep,
        'correct_ministry', v_d.correct_ministry,
        'correct_agency',   v_d.correct_agency,
        'should_flag',      v_d.should_flag,
        'next_action_tick', v_tick + 1,
        'batch_position',   v_batch_position,
        'batch_remaining',  GREATEST(0, 3 - v_batch_position),
        'batch_done',       v_batch_position >= 3
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.submit_paperwork_routing(uuid, text, text, boolean, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.submit_paperwork_routing(uuid, text, text, boolean, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
