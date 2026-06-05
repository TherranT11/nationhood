-- ════════════════════════════════════════════════════════════════════
-- 20270638 — File Paperwork: up to 3 dispatches per action
--
-- User spec: one [File Paperwork] click should let the civil servant
-- route up to THREE dispatches in sequence, not just one. The per-
-- tick "pick one each tick" gate still holds — File Paperwork and
-- File a Memo remain mutually exclusive within a tick — but the
-- paperwork action's payload widens from 1 → 3 dispatches.
--
-- Implementation lives entirely in submit_paperwork_routing. The
-- existing fetch_civil_servant_dispatch (20270630) already returns
-- ONE dispatch at a time; the client just calls it again after each
-- successful submit until the batch fills or the queue runs dry.
--
-- New gates:
--
--   1. Per-tick batch cap. COUNT submissions in
--      civil_servant_paperwork_handled where faction = me AND
--      handled_at_tick = current_tick. If that count is already 3,
--      reject with reason='batch_full' so the client can swap to
--      the "Done" button.
--
--   2. Cross-action lock relaxed. The shared next_civil_service_
--      action_tick gate (20270632) still blocks paperwork when File
--      a Memo set the lock — but only if the caller hasn't started
--      a paperwork batch THIS tick. Once batch_position >= 1 the
--      lock check is bypassed (the lock was set by THIS batch's
--      first submit), so submissions 2 and 3 don't trip it.
--
-- The same UPDATE that grades the submission still stamps
-- next_civil_service_action_tick = v_tick + 1, so writing it
-- redundantly on submissions 2/3 is a no-op idempotent. File a Memo
-- continues to read the lock with no carve-out, so once you've
-- started a paperwork batch you can't pivot to a memo this tick.
--
-- Response payload gains:
--
--   batch_position    int    — 1, 2, or 3 — the sequence number of
--                              the just-graded submission within
--                              this tick's batch.
--   batch_remaining   int    — 3 - batch_position — what the client
--                              shows as "X dispatches left in this
--                              action".
--   batch_done        bool   — true when batch_position = 3, the
--                              client uses this to flip the next
--                              button from "Next Dispatch" → "Done".
--
-- Apply after 20270637.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.submit_paperwork_routing(
    p_dispatch_id uuid,
    p_ministry    text,
    p_agency      text,
    p_flag        boolean
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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- 20270638: how many paperwork submissions has this civil servant
    -- already logged THIS tick? Drives both the 3-per-tick batch cap
    -- and the cross-action-lock carve-out below.
    SELECT COUNT(*) INTO v_handled_this_tick
      FROM civil_servant_paperwork_handled
     WHERE faction_id = v_fac.id
       AND handled_at_tick = v_tick;

    IF v_handled_this_tick >= 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'batch_full',
            'batch_position', 3, 'batch_remaining', 0, 'batch_done', true);
    END IF;

    -- Cross-action lock with File a Memo (20270632) still gates the
    -- FIRST submit of the batch. Once v_handled_this_tick > 0, the
    -- lock visible to us was set by this batch's earlier submission
    -- and we'd false-positive on it — so skip the check.
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

    -- Per-dispatch 12-tick cooldown (20270630). Separate parallel
    -- gate from the per-tick batch cap above.
    IF EXISTS (
        SELECT 1 FROM civil_servant_paperwork_handled
         WHERE faction_id  = v_fac.id
           AND dispatch_id = p_dispatch_id
           AND handled_at_tick + 12 > v_tick
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown');
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

    -- Apply stat deltas + stamp the per-tick cross-action lock. The
    -- stamp is a no-op idempotent on submissions 2/3 (same v_tick + 1
    -- value), so we don't branch.
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

NOTIFY pgrst, 'reload schema';

COMMIT;
