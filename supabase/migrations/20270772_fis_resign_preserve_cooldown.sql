-- ════════════════════════════════════════════════════════════════════
-- 20270772 — FIS resign must NOT clear the per-tick action cooldown
--
-- Audit finding on 20270771: politician_fis_resign nulled
-- next_fis_action_tick on the way out. That opens an in-tick stat
-- pump:
--
--   join academy   (+1 skill, +1 influence)
--   Run Field Ops  (+0.5 skill, cooldown set)
--   resign         (−1 skill, −1 influence, cooldown CLEARED)
--   rejoin         (+1 skill, +1 influence)
--   Run Field Ops  (+0.5 skill — cooldown was wiped)
--   … repeat
--
-- Each loop nets +0.5 skill with zero tick cost. The 20270771
-- claw-back neutralised the join bonus but the cooldown wipe let
-- the action gate reset for free.
--
-- Fix: preserve next_fis_action_tick across resign — exactly how
-- politician_foreign_service_resign preserves
-- foreign_service_last_attempt_tick. A rejoining agent inherits
-- whatever cooldown they were carrying.
--
-- Body byte-faithful to 20270771's politician_fis_resign otherwise.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    --
    -- 20270772: next_fis_action_tick is intentionally PRESERVED —
    -- clearing it (20270771) let resign→rejoin wipe the per-tick
    -- action cooldown and pump Run Field Ops repeatedly in one tick.
    UPDATE factions
       SET politician_fis_joined_at_tick = NULL,
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

NOTIFY pgrst, 'reload schema';

COMMIT;
