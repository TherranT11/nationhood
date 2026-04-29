-- =========================================================================
-- Phase 3 of the parliamentary two-table refactor — drop the
-- active_coalitions writes from leave_coalition + disband_party RPCs.
--
-- After Phase 2, government_formations is the canonical source of truth.
-- Every JS write to active_coalitions has been removed, plus the
-- reconcile-mirror block in fetchActiveCoalition. The two SQL RPCs that
-- still wrote to active_coalitions are updated here.
--
-- finalize_government_formation already only touches
-- government_formations after the 20260421 rewrite — left untouched.
--
-- After this migration runs, active_coalitions is fully dead state.
-- Phase 4 drops the table.
-- =========================================================================

-- ── leave_coalition ──────────────────────────────────────────────────
-- Re-CREATE to read + write government_formations only. Logic preserved
-- verbatim except for the active_coalitions touches.

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
    v_formation          government_formations%ROWTYPE;
    v_pm_faction_id      UUID;
    v_pm_name            TEXT;
    v_total_seats        INT := 0;
    v_majority           INT;
    v_became_minority    BOOLEAN := false;
    v_ministries_cleared INT := 0;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT * INTO v_faction FROM factions
    WHERE id = p_faction_id AND faction_type = 'party' AND abandoned_at IS NULL
    FOR UPDATE;
    IF v_faction.id IS NULL THEN RAISE EXCEPTION 'Party not found'; END IF;

    IF v_faction.id <> v_user_id
       AND COALESCE(v_faction.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user_id THEN
        RAISE EXCEPTION 'You do not own this party';
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_faction.nation_id;
    IF v_nation.id IS NULL THEN RAISE EXCEPTION 'Nation not found'; END IF;
    IF NOT (v_nation.government_type ILIKE '%parliamentary%'
         OR v_nation.government_type ILIKE '%semi-presidential%'
         OR v_nation.government_type ILIKE '%semi_presidential%') THEN
        RAISE EXCEPTION 'Leave Coalition is only available in parliamentary systems';
    END IF;

    SELECT COALESCE(current_tick, 0) INTO v_current_tick FROM shard WHERE name = 'Alpha Shard';

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

    -- Find the active formation (canonical: government_formations).
    SELECT * INTO v_formation FROM government_formations
    WHERE nation_id = v_faction.nation_id
      AND status IN ('formed', 'caretaker')
      AND p_faction_id = ANY(party_ids)
    ORDER BY formed_at DESC NULLS LAST
    LIMIT 1;
    IF v_formation.id IS NULL THEN
        RAISE EXCEPTION 'You are not in an active coalition';
    END IF;

    SELECT faction_id INTO v_pm_faction_id
    FROM head_of_government
    WHERE nation_id = v_faction.nation_id AND active = true
    LIMIT 1;
    IF v_pm_faction_id = p_faction_id THEN
        RAISE EXCEPTION 'Prime Minister''s party cannot leave — Resign as PM first';
    END IF;

    UPDATE government_formations
       SET party_ids = array_remove(party_ids, p_faction_id)
     WHERE id = v_formation.id;

    UPDATE ministries
       SET party_id = NULL
     WHERE nation_id = v_faction.nation_id AND party_id = p_faction_id;
    GET DIAGNOSTICS v_ministries_cleared = ROW_COUNT;

    SELECT COALESCE(SUM(f.seats), 0) INTO v_total_seats
    FROM factions f
    WHERE f.id IN (
        SELECT UNNEST(party_ids) FROM government_formations WHERE id = v_formation.id
    );
    v_majority := CEIL(COALESCE(v_nation.total_seats, 100)::NUMERIC / 2.0);
    IF v_total_seats < v_majority THEN
        v_became_minority := true;
        UPDATE government_formations
           SET formation_type = 'minority_coalition'
         WHERE id = v_formation.id;
    END IF;

    UPDATE factions SET momentum = GREATEST(1, COALESCE(momentum, 0) - 3) WHERE id = p_faction_id;
    IF v_pm_faction_id IS NOT NULL THEN
        UPDATE factions SET momentum = GREATEST(1, COALESCE(momentum, 0) - 5) WHERE id = v_pm_faction_id;
        SELECT faction_name INTO v_pm_name FROM factions WHERE id = v_pm_faction_id;
    END IF;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_faction.nation_id, p_faction_id,
        v_faction.faction_name || ' Leaves Coalition',
        v_faction.faction_name || ' has walked out of the ' ||
            COALESCE(v_pm_name, 'governing') || ' coalition.' ||
            CASE WHEN v_became_minority THEN ' The government is now a minority.' ELSE '' END,
        'government', 'coalition_leave',
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
        'success', true,
        'leaver_name', v_faction.faction_name,
        'pm_name', v_pm_name,
        'new_seats', v_total_seats,
        'became_minority', v_became_minority,
        'ministries_vacated', v_ministries_cleared
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION leave_coalition(UUID) TO authenticated;

-- ── disband_party ────────────────────────────────────────────────────
-- Drop the active_coalitions UPDATE block. The government_formations
-- strip stays. Function body is otherwise unchanged from the 20260422
-- version.

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
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT * INTO v_party FROM factions
    WHERE id = p_faction_id AND faction_type = 'party' AND abandoned_at IS NULL
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Party not found or already dissolved'; END IF;

    IF v_party.id <> v_user_id
       AND COALESCE(v_party.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user_id THEN
        RAISE EXCEPTION 'You do not own this party';
    END IF;

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

    SELECT COALESCE(current_tick, 0) INTO v_current_tick FROM shard WHERE name = 'Alpha Shard';
    IF v_current_tick IS NULL THEN v_current_tick := 0; END IF;

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

    v_seats_vacated := COALESCE(v_party.seats, 0);
    v_funds_lost    := COALESCE(v_party.party_funds, 0);
    v_momentum_lost := COALESCE(v_party.momentum, 0);

    -- Strip the faction from formation party_ids arrays so those rows
    -- don't reference a dead ID. (Arrays don't auto-cascade like FK
    -- columns do.) active_coalitions strip removed in Phase 3 of the
    -- parliamentary two-table refactor — that table is dead state.
    UPDATE government_formations
       SET party_ids = array_remove(party_ids, p_faction_id)
     WHERE p_faction_id = ANY(party_ids)
       AND status IN ('active', 'proposed', 'formed', 'caretaker');

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_party.nation_id, p_faction_id,
        v_party.faction_name || ' — Disbanded',
        'The ' || v_party.faction_name || ' has disbanded. Its ' ||
            v_seats_vacated || ' seat' || CASE WHEN v_seats_vacated = 1 THEN '' ELSE 's' END ||
            ' sit vacant until the next election.',
        'government', 'party_disbanded',
        jsonb_build_object(
            'party_name', v_party.faction_name,
            'user_id', v_user_id,
            'seats_vacated', v_seats_vacated,
            'funds_lost', v_funds_lost,
            'momentum_lost', v_momentum_lost
        ),
        v_current_tick
    );

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

-- ── verify ───────────────────────────────────────────────────────────
SELECT
    proname AS rpc,
    1 AS present
FROM pg_proc
WHERE proname IN ('leave_coalition', 'disband_party')
ORDER BY proname;
