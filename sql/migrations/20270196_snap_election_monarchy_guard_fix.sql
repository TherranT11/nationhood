-- ══════════════════════════════════════════════════════════════
-- FIX: call_snap_election monarchy guard was defeated by a string
-- mismatch. The guard checked LOWER(government_type) IN
-- ('presidential', 'absolute_monarchy') — but monarchies are stored
-- as 'Absolute Monarchy', which lowercases to 'absolute monarchy'
-- (a SPACE, not an underscore), so the IN-list never matched and a
-- monarch's party could schedule a snap election.
--
-- (The election still could never FIRE — processElections cancels any
-- scheduled election in a monarchy as of the elections.js fix — but the
-- RPC wrongly succeeded, fired a "Snap Election Called" event, and
-- burned the cooldown.)
--
-- Fix: match presidential exactly (so semi-presidential stays allowed)
-- and ANY monarchy spelling via LIKE '%monarch%', mirroring the JS
-- isAbsoluteMonarchy normalizer. Body otherwise identical to 20260626.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION call_snap_election(
    p_nation_id         UUID,
    p_caller_faction_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user      UUID := auth.uid();
    v_caller    factions%ROWTYPE;
    v_nation    nations%ROWTYPE;
    v_tick      INT;
    v_cooldown  INT := 3;
    v_lapse     INT;
    v_new_id    UUID;
    v_pm_party  UUID;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_caller FROM factions WHERE id = p_caller_faction_id;
    IF v_caller.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Calling party not found');
    END IF;
    IF v_caller.id <> v_user AND v_caller.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this party');
    END IF;
    IF v_caller.faction_type <> 'party' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only parties can call snap elections');
    END IF;
    IF v_caller.nation_id IS DISTINCT FROM p_nation_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Party is not in this nation');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Nation not found');
    END IF;
    -- Robust government-type gate: exact 'presidential' (semi-presidential
    -- still allowed) + ANY monarchy spelling. Was IN (...,'absolute_monarchy')
    -- which silently missed the stored 'Absolute Monarchy'.
    IF LOWER(COALESCE(v_nation.government_type, '')) = 'presidential'
       OR LOWER(COALESCE(v_nation.government_type, '')) LIKE '%monarch%' THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Snap elections do not apply to this government type');
    END IF;

    -- PM-only-when-seated gate. Open administration = ended_at_tick
    -- IS NULL. If the open admin has a pm_party_id, only that party
    -- may call. Vacant seat (no open admin or pm_party_id NULL) keeps
    -- the any-party deadlock-breaker behavior.
    SELECT pm_party_id INTO v_pm_party
      FROM administrations
     WHERE nation_id = p_nation_id
       AND ended_at_tick IS NULL
     ORDER BY started_at_tick DESC
     LIMIT 1;
    IF v_pm_party IS NOT NULL AND v_pm_party <> p_caller_faction_id THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Only the Prime Minister''s party can call snap elections while a PM is seated');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_lapse := v_tick - COALESCE(v_caller.last_snap_call_tick, 0);
    IF v_lapse < v_cooldown THEN
        RETURN jsonb_build_object('success', false,
            'error', format('On cooldown — %s tick(s) remaining', v_cooldown - v_lapse));
    END IF;

    DELETE FROM elections
     WHERE nation_id = p_nation_id
       AND status = 'scheduled'
       AND election_type = 'parliamentary';

    INSERT INTO elections (nation_id, election_tick, election_type, status)
    VALUES (p_nation_id, v_tick + 1, 'parliamentary', 'scheduled')
    RETURNING id INTO v_new_id;

    UPDATE factions
       SET last_snap_call_tick = v_tick
     WHERE id = p_caller_faction_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, trigger_key, fired_at_tick,
        category, description_chosen, effects_applied
    ) VALUES (
        p_nation_id, p_caller_faction_id, 'Snap Election Called',
        'snap_election_called', v_tick, 'POLITICAL',
        format('%s has called a snap election. Voting opens next tick.',
               COALESCE(v_caller.faction_name, 'A party')),
        jsonb_build_object(
            'caller_party_id', p_caller_faction_id,
            'election_tick',   v_tick + 1
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'election_id',   v_new_id,
        'election_tick', v_tick + 1
    );
END;
$$;

ALTER FUNCTION public.call_snap_election(UUID, UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.call_snap_election(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.call_snap_election(UUID, UUID) TO service_role;

NOTIFY pgrst, 'reload schema';
