-- Atomic Leave Coalition RPC.
--
-- A governing party (NOT the PM's party) can voluntarily walk out of
-- the active coalition. Effects:
--   * Party stripped from active_coalitions.party_ids and
--     government_formations.party_ids (drops them to opposition state).
--   * Any ministries the party holds are vacated (party_id = NULL).
--   * -3 momentum to the leaver, -5 momentum to the PM's party.
--   * If the departure drops the coalition below a majority, the
--     coalition's formation_type flips to 'minority_coalition' and the
--     related formation row follows.
--
-- Guards:
--   * Parliamentary / semi-presidential systems only (same gate as
--     call_early_elections and resign_as_pm).
--   * Must currently be in an active coalition.
--   * PM's party cannot use this action — they must Resign as PM
--     first, which is a separate flow with its own stability cost.
--   * 12-tick per-faction cooldown to prevent leave/rejoin whiplash.

CREATE OR REPLACE FUNCTION leave_coalition(p_faction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user_id            UUID;
    v_faction            factions%ROWTYPE;
    v_nation             nations%ROWTYPE;
    v_current_tick       INTEGER;
    v_cooldown_ticks     CONSTANT INTEGER := 12;
    v_last_tick          INTEGER;
    v_ticks_left         INTEGER;
    v_coalition          active_coalitions%ROWTYPE;
    v_pm_faction_id      UUID;
    v_pm_name            TEXT;
    v_total_seats        INT := 0;
    v_majority           INT;
    v_became_minority    BOOLEAN := false;
    v_ministries_cleared INT := 0;
BEGIN
    -- Auth
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Lock + validate target party
    SELECT * INTO v_faction FROM factions
    WHERE id = p_faction_id
      AND faction_type = 'party'
      AND abandoned_at IS NULL
    FOR UPDATE;
    IF v_faction.id IS NULL THEN
        RAISE EXCEPTION 'Party not found';
    END IF;

    -- Ownership gate
    IF v_faction.id <> v_user_id
       AND COALESCE(v_faction.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user_id THEN
        RAISE EXCEPTION 'You do not own this party';
    END IF;

    -- Load nation + parliamentary gate
    SELECT * INTO v_nation FROM nations WHERE id = v_faction.nation_id;
    IF v_nation.id IS NULL THEN
        RAISE EXCEPTION 'Nation not found';
    END IF;
    IF NOT (v_nation.government_type ILIKE '%parliamentary%'
         OR v_nation.government_type ILIKE '%semi-presidential%'
         OR v_nation.government_type ILIKE '%semi_presidential%') THEN
        RAISE EXCEPTION 'Leave Coalition is only available in parliamentary systems';
    END IF;

    -- Current tick
    SELECT COALESCE(current_tick, 0) INTO v_current_tick
    FROM shard WHERE name = 'Alpha Shard';

    -- Cooldown check (12 ticks per faction)
    SELECT MAX(fired_at_tick) INTO v_last_tick
    FROM event_log
    WHERE trigger_key = 'coalition_leave'
      AND (effects_applied->>'leaver_faction_id')::uuid = p_faction_id
      AND fired_at_tick > v_current_tick - v_cooldown_ticks;
    IF v_last_tick IS NOT NULL THEN
        v_ticks_left := (v_last_tick + v_cooldown_ticks) - v_current_tick;
        RAISE EXCEPTION 'Leave Coalition on cooldown — % tick% remaining',
            v_ticks_left,
            CASE WHEN v_ticks_left = 1 THEN '' ELSE 's' END;
    END IF;

    -- Find the active coalition the faction belongs to
    SELECT * INTO v_coalition FROM active_coalitions
    WHERE nation_id = v_faction.nation_id
      AND dissolved_at IS NULL
      AND p_faction_id = ANY(party_ids)
    ORDER BY formed_at DESC NULLS LAST
    LIMIT 1;
    IF v_coalition.id IS NULL THEN
        RAISE EXCEPTION 'You are not in an active coalition';
    END IF;

    -- PM party lock (must use Resign as PM instead)
    SELECT faction_id INTO v_pm_faction_id
    FROM head_of_government
    WHERE nation_id = v_faction.nation_id AND active = true
    LIMIT 1;
    IF v_pm_faction_id = p_faction_id THEN
        RAISE EXCEPTION 'Prime Minister''s party cannot leave — Resign as PM first';
    END IF;

    -- Strip the faction from both array columns
    UPDATE active_coalitions
       SET party_ids = array_remove(party_ids, p_faction_id)
     WHERE id = v_coalition.id;

    UPDATE government_formations
       SET party_ids = array_remove(party_ids, p_faction_id)
     WHERE nation_id = v_faction.nation_id
       AND p_faction_id = ANY(party_ids)
       AND status IN ('active', 'proposed', 'formed', 'caretaker');

    -- Vacate any ministries held by the leaver
    UPDATE ministries
       SET party_id = NULL
     WHERE nation_id = v_faction.nation_id
       AND party_id = p_faction_id;
    GET DIAGNOSTICS v_ministries_cleared = ROW_COUNT;

    -- Recompute coalition seats post-departure; flip to minority if below majority
    SELECT COALESCE(SUM(f.seats), 0) INTO v_total_seats
    FROM factions f
    WHERE f.id IN (
        SELECT UNNEST(party_ids) FROM active_coalitions WHERE id = v_coalition.id
    );
    v_majority := CEIL(COALESCE(v_nation.total_seats, 100)::NUMERIC / 2.0);
    IF v_total_seats < v_majority THEN
        v_became_minority := true;
        UPDATE active_coalitions
           SET formation_type = 'minority_coalition'
         WHERE id = v_coalition.id;
        UPDATE government_formations
           SET formation_type = 'minority_coalition'
         WHERE nation_id = v_faction.nation_id
           AND status IN ('formed', 'caretaker');
    END IF;

    -- Apply momentum penalties (floor at 1, matches base decay floor)
    UPDATE factions
       SET momentum = GREATEST(1, COALESCE(momentum, 0) - 3)
     WHERE id = p_faction_id;

    IF v_pm_faction_id IS NOT NULL THEN
        UPDATE factions
           SET momentum = GREATEST(1, COALESCE(momentum, 0) - 5)
         WHERE id = v_pm_faction_id;
        SELECT faction_name INTO v_pm_name FROM factions WHERE id = v_pm_faction_id;
    END IF;

    -- Event log entry (news feed + cooldown source of truth)
    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        effects_applied, fired_at_tick
    ) VALUES (
        v_faction.nation_id,
        p_faction_id,
        v_faction.faction_name || ' Leaves Coalition',
        v_faction.faction_name || ' has walked out of the ' ||
            COALESCE(v_pm_name, 'governing') || ' coalition.' ||
            CASE WHEN v_became_minority
                 THEN ' The government is now a minority.'
                 ELSE ''
            END,
        'government',
        'coalition_leave',
        jsonb_build_object(
            'leaver_faction_id', p_faction_id,
            'leaver_name', v_faction.faction_name,
            'pm_faction_id', v_pm_faction_id,
            'pm_name', v_pm_name,
            'leaver_momentum_delta', -3,
            'pm_momentum_delta', -5,
            'coalition_new_seats', v_total_seats,
            'became_minority', v_became_minority,
            'ministries_vacated', v_ministries_cleared
        ),
        v_current_tick
    );

    RETURN jsonb_build_object(
        'success',            true,
        'leaver_name',        v_faction.faction_name,
        'pm_name',            v_pm_name,
        'new_seats',          v_total_seats,
        'became_minority',    v_became_minority,
        'ministries_vacated', v_ministries_cleared
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION leave_coalition(UUID) TO authenticated;

-- Verify
SELECT 'leave_coalition RPC' AS object, COUNT(*) AS present
FROM pg_proc WHERE proname = 'leave_coalition';
