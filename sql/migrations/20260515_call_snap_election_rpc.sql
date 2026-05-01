-- ══════════════════════════════════════════════════════════════
-- Party Leader action: Call Snap Election
--
-- Any party leader (not just the PM) can call a snap election
-- subject to a 3-tick per-party cooldown. The election is scheduled
-- for current_tick + 1 — same-tick semantics impossible because the
-- election runner reads scheduled rows on tick advance, so the next
-- tick is the soonest the new election can fire.
--
-- Cancels any existing scheduled parliamentary election in the
-- nation (so calls don't pile up); presidential elections are
-- preserved so semi-presidential cycles aren't disrupted by a
-- parliamentary snap.
--
-- This is the deadlock-breaker for failed coalition formation now
-- that processGovernmentVacancy no longer auto-fires snaps. Any
-- party leader can reach for it; an inactive party blocking
-- formation no longer paralyzes the nation.
-- ══════════════════════════════════════════════════════════════

-- Per-faction cooldown timestamp.
ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS last_snap_call_tick INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN factions.last_snap_call_tick IS
  'Tick of the last successful call_snap_election by this party. Subject to a 3-tick cooldown (current_tick - last_snap_call_tick >= 3 to call again).';

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
BEGIN
    -- Auth.
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Caller must own the calling party.
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

    -- Nation must be parliamentary (not pure presidential, not absolute monarchy).
    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Nation not found');
    END IF;
    IF LOWER(COALESCE(v_nation.government_type, '')) IN ('presidential', 'absolute_monarchy') THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Snap elections do not apply to this government type');
    END IF;

    -- Cooldown.
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_lapse := v_tick - COALESCE(v_caller.last_snap_call_tick, 0);
    IF v_lapse < v_cooldown THEN
        RETURN jsonb_build_object('success', false,
            'error', format('On cooldown — %s tick(s) remaining', v_cooldown - v_lapse));
    END IF;

    -- Cancel existing scheduled parliamentary election (preserve presidential).
    DELETE FROM elections
     WHERE nation_id = p_nation_id
       AND status = 'scheduled'
       AND election_type = 'parliamentary';

    -- Schedule new snap for current_tick + 1.
    INSERT INTO elections (nation_id, election_tick, election_type, status)
    VALUES (p_nation_id, v_tick + 1, 'parliamentary', 'scheduled')
    RETURNING id INTO v_new_id;

    -- Stamp cooldown.
    UPDATE factions
       SET last_snap_call_tick = v_tick
     WHERE id = p_caller_faction_id;

    -- Event log naming the calling party.
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

COMMENT ON FUNCTION public.call_snap_election(UUID, UUID) IS
  'Party-leader action: schedule a snap parliamentary election for current_tick+1. 3-tick per-party cooldown. Cancels any existing scheduled parliamentary election in the nation; preserves presidential elections.';
