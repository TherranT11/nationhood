-- ════════════════════════════════════════════════════════════════════
-- 20270632 — Civil Servant: File a Memo + per-tick action lock
--
-- Wires the Civil Servant role card's second action (FILE A MEMO) and
-- enforces the "PICK ONE EACH TICK" rule across both FILE PAPERWORK
-- and FILE A MEMO so the two career actions are mutually exclusive
-- within a single tick.
--
-- FILE A MEMO is a flat busy-work action: +1 Capital (politician_
-- influence — the display "CAPITAL" pill on the role card reads from
-- this column post-rename), -1 Influence (political_capital — the
-- display "INFLUENCE" pill reads from this column). Floors political_
-- capital at 0 so the action doesn't go negative on a politician with
-- nothing spent.
--
-- The per-tick lock uses a new factions column next_civil_service_
-- action_tick rather than reusing next_member_action_tick — keeps
-- the civil-service cooldown isolated from the election-flow gate
-- the older column drives (politician_register_for_office,
-- politician_give_speech, etc.), so a civil servant can still stand
-- for office without their paperwork action burning a tick of
-- election eligibility.
--
-- submit_paperwork_routing (20270630) is re-issued here with the
-- same cooldown check / set, so filing paperwork burns the same
-- per-tick lock that filing a memo does. The per-DISPATCH 12-tick
-- cooldown stays — it's a separate, parallel gate.
--
-- Apply after 20270631.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ─────────────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS next_civil_service_action_tick int;

COMMENT ON COLUMN public.factions.next_civil_service_action_tick IS
    'Per-tick action gate for Civil Servant actions (FILE A MEMO, FILE PAPERWORK, future AUDIT-side submissions). Set to current_tick + 1 by each action RPC; politician-home gates the role card''s buttons when this is > current_tick. Isolated from next_member_action_tick which drives election-flow gating.';

REVOKE UPDATE (next_civil_service_action_tick) ON public.factions FROM PUBLIC, anon, authenticated;

-- ── 2. politician_file_a_memo ─────────────────────────────────────
-- "Spend the month doing busy work" — +1 politician_influence (the
-- CAPITAL stat on the role card), -1 political_capital (the INFLUENCE
-- stat on the role card). Floor at 0 on the deduction. Sets the per-
-- tick cooldown.
CREATE OR REPLACE FUNCTION public.politician_file_a_memo()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_new_cap       int;
    v_new_inf       numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND politician_ministry IS NOT NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Per-tick cooldown — shared across FILE PAPERWORK + FILE A MEMO.
    IF v_pol.next_civil_service_action_tick IS NOT NULL
       AND v_pol.next_civil_service_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_civil_service_action_tick);
    END IF;

    -- +1 Capital (politician_influence), -1 Influence (political_
    -- capital, floored at 0). Single UPDATE for atomicity.
    UPDATE factions
       SET politician_influence            = COALESCE(politician_influence,   0) + 1,
           political_capital               = GREATEST(0, COALESCE(political_capital, 0) - 1),
           next_civil_service_action_tick  = v_tick + 1
     WHERE id = v_pol.id
    RETURNING political_capital, politician_influence
        INTO v_new_cap, v_new_inf;

    RETURN jsonb_build_object(
        'success',           true,
        'action',            'file_a_memo',
        'capital_delta',     1,
        'influence_delta',  -1,
        'new_capital',       v_new_inf,   -- "CAPITAL" pill reads politician_influence
        'new_influence',     v_new_cap,   -- "INFLUENCE" pill reads political_capital
        'next_action_tick',  v_tick + 1
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_file_a_memo() TO authenticated;

-- ── 3. submit_paperwork_routing — share the per-tick lock ─────────
-- Body byte-identical to 20270630 except (a) the cooldown check
-- before any work and (b) the cooldown stamp on the post-grade
-- UPDATE. The per-dispatch 12-tick cooldown stays unchanged.
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
    v_new_rep          numeric;
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

    -- Per-tick action lock — shared with FILE A MEMO via
    -- next_civil_service_action_tick (20270632).
    IF v_fac.next_civil_service_action_tick IS NOT NULL
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
    -- gate from the per-tick action lock above.
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

    -- Apply stat deltas + stamp the per-tick cooldown in the same
    -- UPDATE so the lock lands atomically with the grade.
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
        'next_action_tick', v_tick + 1
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_paperwork_routing(uuid, text, text, boolean) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
