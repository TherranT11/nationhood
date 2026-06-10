-- ════════════════════════════════════════════════════════════════════
-- 20270771 — Close Investigation + FS / FIS resign RPCs
--
-- Three user-spec'd additions:
--
-- 1. politician_fis_close_investigation — the agent closes an active
--    case empty-handed. status → 'closed', closed_at_tick stamped,
--    −1 politician_reputation (floored at 0; "you didn't find
--    anything"). The case drops off Pressing Issues (the list RPC
--    filters status='active') and the case-file page renders it
--    CLOSED.
--
-- 2. politician_fis_resign — leave the Federal Investigations
--    Service. Clears politician_fis_joined_at_tick +
--    next_fis_action_tick and dismisses (status='dismissed') any
--    active investigations — a non-agent can't carry open cases.
--    Takes back the academy onboarding grant (−1 skill, −1
--    influence, both floored at 0): without the claw-back,
--    resign → rejoin would farm +1/+1 per loop since
--    politician_fis_join_academy re-grants on every join.
--    Dismissal carries NO extra reputation hit — the −1 rep is
--    only for explicitly closing a case empty-handed.
--
-- 3. politician_foreign_service_resign — leave the Foreign Service
--    posting. Clears politician_foreign_service_nation_id +
--    politician_foreign_service_at_tick. No stat claw-back needed:
--    re-entry requires re-passing the 5-question exam (and the
--    1-tick cooldown), which is its own barrier.
--
-- All three follow the politician-domain conventions: p_faction_id
-- ownership guard, FOR UPDATE row lock, career-event log, structured
-- reason envelopes, REVOKE PUBLIC + GRANT authenticated.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. politician_fis_close_investigation ────────────────────────
CREATE OR REPLACE FUNCTION public.politician_fis_close_investigation(
    p_faction_id      uuid,
    p_investigation_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_pol   factions%ROWTYPE;
    v_inv   fis_investigations%ROWTYPE;
    v_tick  int;
    v_new_rep numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_investigation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_inv FROM fis_investigations
     WHERE id = p_investigation_id
     FOR UPDATE;
    IF v_inv.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'investigation_not_found');
    END IF;
    IF v_inv.agent_faction_id <> v_pol.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_case');
    END IF;
    IF v_inv.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_closed',
            'status', v_inv.status);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE fis_investigations
       SET status = 'closed', closed_at_tick = v_tick
     WHERE id = v_inv.id;

    -- −1 Reputation — empty-handed close.
    UPDATE factions
       SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) - 1)
     WHERE id = v_pol.id
    RETURNING politician_reputation INTO v_new_rep;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick, 'fis_investigation_closed', v_inv.target_corp_name,
        jsonb_build_object(
            'investigation_id', v_inv.id,
            'category',         v_inv.category,
            'rep_delta',        -1,
            'outcome',          'no_findings'
        )
    );

    RETURN jsonb_build_object(
        'success',        true,
        'investigation_id', v_inv.id,
        'closed_at_tick', v_tick,
        'rep_delta',      -1,
        'new_reputation', v_new_rep
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_fis_close_investigation(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_fis_close_investigation(uuid, uuid) TO authenticated;

-- ── 2. politician_fis_resign ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_fis_resign(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_dismissed int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_fis_joined_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_agent');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Dismiss any open cases — a non-agent can't carry them. No
    -- reputation hit here; the −1 is reserved for an explicit
    -- empty-handed close.
    UPDATE fis_investigations
       SET status = 'dismissed', closed_at_tick = v_tick
     WHERE agent_faction_id = v_pol.id
       AND status = 'active';
    GET DIAGNOSTICS v_dismissed = ROW_COUNT;

    -- Claw back the academy onboarding grant (+1 skill / +1
    -- influence from politician_fis_join_academy) so resign→rejoin
    -- can't farm stats. Floored at 0.
    UPDATE factions
       SET politician_fis_joined_at_tick = NULL,
           next_fis_action_tick          = NULL,
           politician_skill              = GREATEST(0, COALESCE(politician_skill, 0) - 1),
           politician_influence          = GREATEST(0, COALESCE(politician_influence, 0) - 1)
     WHERE id = v_pol.id;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick, 'fis_resigned', '',
        jsonb_build_object(
            'cases_dismissed',  v_dismissed,
            'skill_delta',      -1,
            'influence_delta',  -1
        )
    );

    RETURN jsonb_build_object(
        'success',          true,
        'cases_dismissed',  v_dismissed,
        'skill_delta',      -1,
        'influence_delta',  -1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_fis_resign(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_fis_resign(uuid) TO authenticated;

-- ── 3. politician_foreign_service_resign ─────────────────────────
CREATE OR REPLACE FUNCTION public.politician_foreign_service_resign(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_pol         factions%ROWTYPE;
    v_tick        int;
    v_nation_name text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_foreign_service_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_service');
    END IF;

    SELECT name INTO v_nation_name FROM nations
     WHERE id = v_pol.politician_foreign_service_nation_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- No stat claw-back: re-entry requires re-passing the FS exam
    -- (plus its 1-tick retry cooldown), which is its own barrier.
    -- foreign_service_last_attempt_tick is intentionally preserved.
    UPDATE factions
       SET politician_foreign_service_nation_id = NULL,
           politician_foreign_service_at_tick   = NULL
     WHERE id = v_pol.id;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick, 'foreign_service_resigned', COALESCE(v_nation_name, ''),
        jsonb_build_object('posted_nation_name', v_nation_name)
    );

    RETURN jsonb_build_object('success', true, 'resigned_from', v_nation_name);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_foreign_service_resign(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_foreign_service_resign(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
