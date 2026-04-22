-- Atomic Disband Party RPC.
--
-- Mirror of declare_corp_bankruptcy, adapted for political parties.
-- A party leader can voluntarily dissolve their party. Consequences:
--   * Party is deleted from factions (cascades to bloc_invitations,
--     group_chat_members, faction_platforms, faction_ideology,
--     faction_electoral_standing, bills (sponsor), bill_support,
--     faction_agitators, faction_deputies, and any other
--     ON DELETE CASCADE child tables).
--   * Seats held by the party are NOT redistributed — they sit vacant
--     in the nation until the next parliamentary election repopulates
--     the chamber.
--   * Party funds and momentum vanish with the row.
--   * All nation-chat memberships are dropped via the CASCADE on
--     group_chat_members.faction_id.
--
-- Head-of-Government guard: the PM, elected President, and Monarch
-- cannot disband their party directly. They must step down through
-- the normal flow (resign_as_pm / election loss / impeachment /
-- abdication) first, then disband. This prevents the coalition
-- from silently pointing at a nonexistent PM row.
--
-- Cooldown: 24 ticks per user (matches corp bankruptcy). Prevents
-- rapid-fire disband-and-refound cycles that would game the economy.

CREATE OR REPLACE FUNCTION disband_party(p_faction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user_id        UUID;
    v_party          factions%ROWTYPE;
    v_current_tick   INTEGER;
    v_cooldown_ticks CONSTANT INTEGER := 24;
    v_last_db_tick   INTEGER;
    v_ticks_left     INTEGER;
    v_seats_vacated  INTEGER;
    v_funds_lost     NUMERIC;
    v_momentum_lost  NUMERIC;
BEGIN
    -- Caller identity
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Lock + validate target party
    SELECT * INTO v_party FROM factions
    WHERE id = p_faction_id
      AND faction_type = 'party'
      AND abandoned_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Party not found or already dissolved';
    END IF;

    -- Ownership gate. Party owner is either factions.id = user.id
    -- (legacy one-user-one-faction model) or factions.linked_user_id
    -- = user.id (multi-faction-per-user model).
    IF v_party.id <> v_user_id
       AND COALESCE(v_party.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user_id THEN
        RAISE EXCEPTION 'You do not own this party';
    END IF;

    -- Head-of-Government guard: PM, elected President, or Monarch
    -- cannot disband directly.
    IF EXISTS (
        SELECT 1 FROM head_of_government hog
        WHERE hog.nation_id = v_party.nation_id
          AND hog.faction_id = p_faction_id
          AND hog.active = true
    ) THEN
        RAISE EXCEPTION 'You are the Prime Minister — resign before disbanding.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM administrations a
        WHERE a.nation_id = v_party.nation_id
          AND a.ended_at_tick IS NULL
          AND a.president_party_id = p_faction_id
    ) THEN
        RAISE EXCEPTION 'You are the sitting President — step down before disbanding.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM nations n
        WHERE n.id = v_party.nation_id
          AND n.monarch_faction_id = p_faction_id
    ) THEN
        RAISE EXCEPTION 'The reigning monarch cannot disband the royal house.';
    END IF;

    -- Current tick
    SELECT COALESCE(current_tick, 0) INTO v_current_tick
    FROM shard WHERE name = 'Alpha Shard';
    IF v_current_tick IS NULL THEN v_current_tick := 0; END IF;

    -- Cooldown check (24 ticks per user — any prior disband by this
    -- user in the window blocks a new one).
    SELECT MAX(fired_at_tick) INTO v_last_db_tick
    FROM event_log
    WHERE trigger_key = 'party_disbanded'
      AND (effects_applied->>'user_id')::uuid = v_user_id
      AND fired_at_tick > v_current_tick - v_cooldown_ticks;

    IF v_last_db_tick IS NOT NULL THEN
        v_ticks_left := (v_last_db_tick + v_cooldown_ticks) - v_current_tick;
        RAISE EXCEPTION 'Disband on cooldown — % tick% remaining',
            v_ticks_left,
            CASE WHEN v_ticks_left = 1 THEN '' ELSE 's' END;
    END IF;

    -- Snapshot values for logging / return (populated before the DELETE)
    v_seats_vacated := COALESCE(v_party.seats, 0);
    v_funds_lost    := COALESCE(v_party.party_funds, 0);
    v_momentum_lost := COALESCE(v_party.momentum, 0);

    -- Strip the faction from any coalition / formation party_ids arrays
    -- so those rows don't reference a dead ID. (Arrays don't auto-cascade
    -- like FK columns do.)
    UPDATE active_coalitions
       SET party_ids = array_remove(party_ids, p_faction_id)
     WHERE p_faction_id = ANY(party_ids)
       AND dissolved_at IS NULL;

    UPDATE government_formations
       SET party_ids = array_remove(party_ids, p_faction_id)
     WHERE p_faction_id = ANY(party_ids)
       AND status IN ('active', 'proposed', 'formed', 'caretaker');

    -- Log the disband BEFORE deleting the faction (event_log.faction_id
    -- has no FK, so either order works; logging first keeps the entry
    -- readable if the delete ever grows a new constraint.)
    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        effects_applied, fired_at_tick
    ) VALUES (
        v_party.nation_id,
        p_faction_id,
        v_party.faction_name || ' — Disbanded',
        'The ' || v_party.faction_name || ' has disbanded. Its ' ||
            v_seats_vacated || ' seat' || CASE WHEN v_seats_vacated = 1 THEN '' ELSE 's' END ||
            ' sit vacant until the next election.',
        'government',
        'party_disbanded',
        jsonb_build_object(
            'party_name', v_party.faction_name,
            'user_id', v_user_id,
            'seats_vacated', v_seats_vacated,
            'funds_lost', v_funds_lost,
            'momentum_lost', v_momentum_lost
        ),
        v_current_tick
    );

    -- Finally, delete the faction. All party-facing FKs cascade:
    -- bloc_invitations (sender/receiver), blocs (if leader),
    -- group_chat_members, faction_platforms, faction_ideology,
    -- faction_electoral_standing, faction_deputies, faction_agitators,
    -- bill_support, and any other ON DELETE CASCADE child tables.
    DELETE FROM factions WHERE id = p_faction_id;

    RETURN jsonb_build_object(
        'success',        true,
        'party_name',     v_party.faction_name,
        'seats_vacated',  v_seats_vacated,
        'funds_lost',     v_funds_lost,
        'momentum_lost',  v_momentum_lost
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION disband_party(UUID) TO authenticated;

-- Verify
SELECT 'disband_party RPC' AS object, COUNT(*) AS present
FROM pg_proc WHERE proname = 'disband_party';
