-- Presidential endorsement validations (action/RPC guardrails)
-- Rules:
-- 1) Source + target must both be same-nation parties.
-- 2) A party cannot endorse itself.
-- 3) If target party is dissolved/banned/ineligible before election lock-in,
--    snapshot is skipped for that party.
-- 4) If no presidential election exists yet, preference remains pending.
-- 5) Non-presidential nations should not be actionable (handled in UI and here).

CREATE OR REPLACE FUNCTION submit_presidential_endorsement(
    p_actor_faction_id UUID,
    p_target_faction_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_actor          RECORD;
    v_target         RECORD;
    v_current_tick   INT := 0;
    v_next_pres      RECORD;
    v_pending_result JSONB;
BEGIN
    IF p_actor_faction_id IS NULL OR p_target_faction_id IS NULL THEN
        RAISE EXCEPTION 'Both actor and target faction IDs are required';
    END IF;

    SELECT id, nation_id, faction_type, faction_name
    INTO v_actor
    FROM factions
    WHERE id = p_actor_faction_id;

    IF v_actor.id IS NULL THEN
        RAISE EXCEPTION 'Actor faction not found';
    END IF;

    SELECT id, nation_id, faction_type, faction_name, seats, is_banned
    INTO v_target
    FROM factions
    WHERE id = p_target_faction_id;

    IF v_target.id IS NULL THEN
        RAISE EXCEPTION 'Target faction not found';
    END IF;

    -- (1) Same nation and both must be parties.
    IF v_actor.nation_id IS DISTINCT FROM v_target.nation_id THEN
        RAISE EXCEPTION 'Endorsement requires same nation';
    END IF;

    IF v_actor.faction_type <> 'party' OR v_target.faction_type <> 'party' THEN
        RAISE EXCEPTION 'Endorsement is only available to party factions';
    END IF;

    -- (2) Cannot endorse self.
    IF p_actor_faction_id = p_target_faction_id THEN
        RAISE EXCEPTION 'A party cannot endorse itself';
    END IF;

    SELECT COALESCE(s.current_tick, 0)
    INTO v_current_tick
    FROM shard s
    WHERE s.name = 'Alpha Shard'
    LIMIT 1;

    -- Reject non-presidential government types for safety.
    IF NOT EXISTS (
        SELECT 1
        FROM nations n
        WHERE n.id = v_actor.nation_id
          AND LOWER(COALESCE(n.government_type, '')) IN ('presidential', 'presidential republic', 'executive presidency')
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'status', 'disabled_non_presidential',
            'message', 'This nation does not use presidential elections.'
        );
    END IF;

    -- Nearest scheduled presidential election is the lock-in anchor.
    SELECT e.id, e.election_tick
    INTO v_next_pres
    FROM elections e
    WHERE e.nation_id = v_actor.nation_id
      AND e.status = 'scheduled'
      AND e.election_type = 'presidential'
      AND e.election_tick >= v_current_tick
    ORDER BY e.election_tick ASC
    LIMIT 1;

    -- (4) If none exists yet, keep preference pending indefinitely.
    IF v_next_pres.id IS NULL THEN
        v_pending_result := jsonb_build_object(
            'status', 'pending_no_election',
            'target_faction_id', p_target_faction_id,
            'target_party_name', v_target.faction_name,
            'message', 'No presidential election exists yet. Preference remains pending.'
        );

        INSERT INTO campaign_actions (party_id, nation_id, action_type, tick_performed, result)
        VALUES (p_actor_faction_id, v_actor.nation_id, 'presidential_endorsement', v_current_tick, v_pending_result);

        RETURN jsonb_build_object('success', true) || v_pending_result;
    END IF;

    -- (3) If target is already banned/ineligible before lock-in, skip snapshot.
    -- Ineligibility baseline here: banned OR no seats.
    IF COALESCE(v_target.is_banned, false) OR COALESCE(v_target.seats, 0) <= 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'status', 'skipped_snapshot_ineligible',
            'target_faction_id', p_target_faction_id,
            'target_party_name', v_target.faction_name,
            'election_id', v_next_pres.id,
            'election_tick', v_next_pres.election_tick,
            'message', 'Target party is banned/dissolved/ineligible before lock-in; snapshot skipped.'
        );
    END IF;

    INSERT INTO campaign_actions (party_id, nation_id, action_type, tick_performed, result)
    VALUES (
        p_actor_faction_id,
        v_actor.nation_id,
        'presidential_endorsement',
        v_current_tick,
        jsonb_build_object(
            'status', 'scheduled_for_lockin',
            'target_faction_id', p_target_faction_id,
            'target_party_name', v_target.faction_name,
            'election_id', v_next_pres.id,
            'election_tick', v_next_pres.election_tick
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'status', 'scheduled_for_lockin',
        'target_faction_id', p_target_faction_id,
        'target_party_name', v_target.faction_name,
        'election_id', v_next_pres.id,
        'election_tick', v_next_pres.election_tick
    );
END;
$$;

GRANT EXECUTE ON FUNCTION submit_presidential_endorsement(UUID, UUID) TO authenticated;
