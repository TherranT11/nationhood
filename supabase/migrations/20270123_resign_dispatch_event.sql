-- ════════════════════════════════════════════════════════════════
-- resign_military_faction — add a Politics·Nation dispatch.
--
-- CREATE OR REPLACE of the 20270122 function, adding an event_log
-- row announcing the resignation. Fired INSIDE the RPC (not client-
-- side like the join event) because resign HAS an authoritative
-- mutation point here: the event is committed atomically with the
-- abandon + approval hit, with no client-redirect race. The existing
-- "already resigned" guard returns before any mutation, so a double-
-- fire produces neither a double approval dock nor a duplicate event.
--
-- Body matches the join-event convention: faction_name already encodes
-- "{branch} of {nation}" (e.g. "Army of Danwei"), so "Chief of the "
-- || faction_name reads "Chief of the Army of Danwei". category
-- 'government' buckets to Politics; nation_id scopes it to the nation.
-- Everything else is identical to 20270122.
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.resign_military_faction(
    p_faction_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user UUID := auth.uid();
    v_fac  factions%ROWTYPE;
    v_tick INT;
BEGIN
    SELECT * INTO v_fac FROM factions WHERE id = p_faction_id;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Faction not found');
    END IF;
    IF v_fac.faction_type <> 'military' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not a military faction');
    END IF;
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    IF v_fac.id <> v_user AND v_fac.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not command this faction');
    END IF;
    IF v_fac.abandoned_at IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You have already resigned this commission');
    END IF;

    UPDATE factions SET abandoned_at = now() WHERE id = p_faction_id;

    UPDATE nations
       SET public_approval = GREATEST(0, LEAST(100, COALESCE(public_approval, 0) - 1))
     WHERE id = v_fac.nation_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_chosen,
        category, trigger_key, fired_at_tick
    ) VALUES (
        v_fac.nation_id,
        p_faction_id,
        format('General %s %s Steps Down', v_fac.leader_first_name, v_fac.leader_last_name),
        format('General %s %s has decided to step down as Chief of the %s.',
               v_fac.leader_first_name, v_fac.leader_last_name, v_fac.faction_name),
        'government',
        'military_command_resigned',
        COALESCE(v_tick, 0)
    );

    RETURN jsonb_build_object('success', true);
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.resign_military_faction(UUID) TO authenticated;
