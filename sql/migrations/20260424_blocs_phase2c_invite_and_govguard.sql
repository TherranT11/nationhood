-- ============================================================
-- BLOCS — Phase 2c: invite_to_bloc + in-government invite guard
--
-- Two server-side changes:
--
-- 1. New RPC invite_to_bloc(bloc_id, invitee_faction_id) lets the bloc
--    leader send invitations after initial creation. Leader-only (per
--    Q7); same eligibility checks as create_bloc invitees plus the new
--    in-government guard.
--
-- 2. create_bloc rewrite extends invitee eligibility with the same
--    in-government check so neither RPC can invite a current PM,
--    coalition member, or president's party (per Q6).
--
-- "In government" = appears in the active administrations row's
-- pm_party_id, president_party_id, or coalition_parties JSON array.
-- Same SSoT path getGoverningStatus uses on the client.
--
-- Safe to re-run: CREATE OR REPLACE for both functions.
-- ============================================================

-- ==================== Helper: _faction_in_active_government ====================
-- One internal check used by both RPCs so the "what counts as in government"
-- definition lives in exactly one place. Returns TRUE if the faction is the
-- PM, the president's party, or a member of the coalition_parties array
-- on the active administrations row for the faction's nation.

CREATE OR REPLACE FUNCTION _faction_in_active_government(
    p_faction_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_nation_id UUID;
BEGIN
    SELECT nation_id INTO v_nation_id FROM factions WHERE id = p_faction_id;
    IF v_nation_id IS NULL THEN RETURN FALSE; END IF;

    RETURN EXISTS (
        SELECT 1
          FROM administrations a
         WHERE a.nation_id = v_nation_id
           AND a.ended_at_tick IS NULL
           AND (
                  a.pm_party_id        = p_faction_id
               OR a.president_party_id = p_faction_id
               OR EXISTS (
                      SELECT 1
                        FROM jsonb_array_elements(COALESCE(a.coalition_parties, '[]'::jsonb)) elem
                       WHERE (elem ->> 'party_id')::UUID = p_faction_id
                          OR (elem ->> 'id')::UUID       = p_faction_id
                          OR elem #>> '{}'              = p_faction_id::TEXT
                  )
           )
    );
END;
$fn$;

REVOKE EXECUTE ON FUNCTION _faction_in_active_government(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION _faction_in_active_government(UUID) TO authenticated, service_role;

-- ==================== RPC: create_bloc (replaced — adds gov-guard) ====================
-- Identical to Phase 2d's version EXCEPT each invitee eligibility loop
-- iteration now also rejects parties currently in government. The leader's
-- HoG lock above already prevents the leader themselves from being a
-- governing party.

CREATE OR REPLACE FUNCTION create_bloc(
    p_leader_faction_id UUID,
    p_name TEXT,
    p_invitee_faction_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user_id UUID;
    v_leader factions%ROWTYPE;
    v_tick INT;
    v_bloc_id UUID;
    v_invitee UUID;
    v_invitee_faction factions%ROWTYPE;
    v_invited INT := 0;
    v_skipped INT := 0;
    v_clean_name TEXT;
    v_leader_name TEXT;
    v_invitee_names TEXT;
    v_event_desc TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT * INTO v_leader FROM factions WHERE id = p_leader_faction_id;
    IF v_leader.id IS NULL THEN RAISE EXCEPTION 'Leader faction not found'; END IF;
    IF p_leader_faction_id <> v_user_id THEN RAISE EXCEPTION 'Faction ownership required'; END IF;
    IF v_leader.faction_type IS DISTINCT FROM 'party' THEN RAISE EXCEPTION 'Only parties can form blocs'; END IF;
    IF v_leader.bloc_id IS NOT NULL THEN RAISE EXCEPTION 'Already in a bloc'; END IF;

    IF EXISTS (
        SELECT 1 FROM head_of_government hog
        WHERE hog.nation_id = v_leader.nation_id
          AND hog.faction_id = p_leader_faction_id
          AND hog.active = true
    ) THEN
        RAISE EXCEPTION 'Head of Government cannot form blocs — you already lead the coalition';
    END IF;
    IF EXISTS (
        SELECT 1 FROM administrations a
        WHERE a.nation_id = v_leader.nation_id
          AND a.ended_at_tick IS NULL
          AND a.president_party_id = p_leader_faction_id
    ) THEN
        RAISE EXCEPTION 'Head of Government cannot form blocs — you already lead the coalition';
    END IF;
    IF EXISTS (
        SELECT 1 FROM nations n
        WHERE n.id = v_leader.nation_id
          AND n.monarch_faction_id = p_leader_faction_id
    ) THEN
        RAISE EXCEPTION 'Head of Government cannot form blocs — you already lead the coalition';
    END IF;

    v_clean_name := TRIM(COALESCE(p_name, ''));
    IF v_clean_name = '' THEN RAISE EXCEPTION 'Bloc name required'; END IF;
    IF LENGTH(v_clean_name) > 40 THEN RAISE EXCEPTION 'Bloc name too long (max 40 characters)'; END IF;
    IF COALESCE(v_leader.party_funds, 0) < 100000 THEN RAISE EXCEPTION 'Insufficient party funds ($100,000 required)'; END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';

    INSERT INTO blocs (nation_id, name, leader_faction_id, founded_at_tick)
    VALUES (v_leader.nation_id, v_clean_name, p_leader_faction_id, v_tick)
    RETURNING id INTO v_bloc_id;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - 100000,
           bloc_id     = v_bloc_id
     WHERE id = p_leader_faction_id;

    IF p_invitee_faction_ids IS NOT NULL THEN
        FOREACH v_invitee IN ARRAY p_invitee_faction_ids LOOP
            IF v_invitee = p_leader_faction_id THEN
                v_skipped := v_skipped + 1; CONTINUE;
            END IF;

            SELECT * INTO v_invitee_faction FROM factions WHERE id = v_invitee;
            IF v_invitee_faction.id IS NULL
               OR v_invitee_faction.nation_id IS DISTINCT FROM v_leader.nation_id
               OR v_invitee_faction.faction_type IS DISTINCT FROM 'party'
               OR v_invitee_faction.bloc_id IS NOT NULL
               OR _faction_in_active_government(v_invitee) THEN
                v_skipped := v_skipped + 1; CONTINUE;
            END IF;

            INSERT INTO bloc_invitations
                (bloc_id, invited_faction_id, invited_by_faction_id,
                 status, created_at_tick)
            VALUES
                (v_bloc_id, v_invitee, p_leader_faction_id, 'pending', v_tick)
            ON CONFLICT DO NOTHING;

            v_invited := v_invited + 1;
        END LOOP;
    END IF;

    PERFORM adjust_momentum(p_leader_faction_id, 2, 'Bloc founded: ' || v_clean_name, v_tick);

    v_leader_name := COALESCE(v_leader.faction_name, 'A party');
    SELECT string_agg(f.faction_name, ', ' ORDER BY f.faction_name)
      INTO v_invitee_names
      FROM bloc_invitations bi
      JOIN factions f ON f.id = bi.invited_faction_id
     WHERE bi.bloc_id = v_bloc_id
       AND bi.status = 'pending';

    IF v_invitee_names IS NOT NULL AND v_invitee_names <> '' THEN
        v_event_desc := v_leader_name || ' has created the ' || v_clean_name
                     || ' bloc with ' || v_invitee_names || '.';
    ELSE
        v_event_desc := v_leader_name || ' has created the ' || v_clean_name || ' bloc.';
    END IF;

    BEGIN
        INSERT INTO event_log (
            nation_id, faction_id, event_name, trigger_key, category,
            description_chosen, effects_applied, fired_at_tick
        ) VALUES (
            v_leader.nation_id, p_leader_faction_id, 'Bloc Formed', 'bloc_formed',
            'political', v_event_desc,
            jsonb_build_object(
                'bloc_id', v_bloc_id,
                'bloc_name', v_clean_name,
                'leader_faction_id', p_leader_faction_id,
                'invited_count', v_invited,
                'skipped_count', v_skipped
            ),
            v_tick
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Bloc creation event_log insert failed for bloc % (%): %',
            v_bloc_id, v_clean_name, SQLERRM;
    END;

    RETURN jsonb_build_object(
        'success', true,
        'bloc_id', v_bloc_id,
        'name', v_clean_name,
        'invited_count', v_invited,
        'skipped_count', v_skipped
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION create_bloc(UUID, TEXT, UUID[]) TO authenticated;

-- ==================== RPC: invite_to_bloc (NEW) ====================
-- Per Q7, leader-only. Invitee must be a party in the same nation,
-- not already in a bloc, and not currently in government.

CREATE OR REPLACE FUNCTION invite_to_bloc(
    p_bloc_id UUID,
    p_invitee_faction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user_id UUID;
    v_bloc blocs%ROWTYPE;
    v_invitee factions%ROWTYPE;
    v_tick INT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT * INTO v_bloc FROM blocs WHERE id = p_bloc_id;
    IF v_bloc.id IS NULL THEN RAISE EXCEPTION 'Bloc not found'; END IF;
    IF v_bloc.dissolved_at_tick IS NOT NULL THEN RAISE EXCEPTION 'Bloc has been dissolved'; END IF;
    IF v_bloc.leader_faction_id <> v_user_id THEN
        RAISE EXCEPTION 'Only the bloc leader can send invitations';
    END IF;

    IF p_invitee_faction_id = v_bloc.leader_faction_id THEN
        RAISE EXCEPTION 'Cannot invite the bloc leader';
    END IF;

    SELECT * INTO v_invitee FROM factions WHERE id = p_invitee_faction_id;
    IF v_invitee.id IS NULL THEN RAISE EXCEPTION 'Invitee not found'; END IF;
    IF v_invitee.nation_id IS DISTINCT FROM v_bloc.nation_id THEN
        RAISE EXCEPTION 'Invitee must be in the same nation';
    END IF;
    IF v_invitee.faction_type IS DISTINCT FROM 'party' THEN
        RAISE EXCEPTION 'Only parties can join blocs';
    END IF;
    IF v_invitee.bloc_id IS NOT NULL THEN
        RAISE EXCEPTION 'Invitee is already in a bloc';
    END IF;
    IF _faction_in_active_government(p_invitee_faction_id) THEN
        RAISE EXCEPTION 'Invitee is currently in government';
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';

    INSERT INTO bloc_invitations
        (bloc_id, invited_faction_id, invited_by_faction_id,
         status, created_at_tick)
    VALUES
        (p_bloc_id, p_invitee_faction_id, v_bloc.leader_faction_id,
         'pending', v_tick)
    ON CONFLICT (bloc_id, invited_faction_id) WHERE status = 'pending'
        DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'bloc_id', p_bloc_id,
        'invited_faction_id', p_invitee_faction_id
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION invite_to_bloc(UUID, UUID) TO authenticated;

-- ==================== VERIFY ====================
SELECT '_faction_in_active_government' AS object, COUNT(*) AS present
  FROM pg_proc WHERE proname = '_faction_in_active_government'
UNION ALL
SELECT 'create_bloc',     COUNT(*) FROM pg_proc WHERE proname = 'create_bloc'
UNION ALL
SELECT 'invite_to_bloc',  COUNT(*) FROM pg_proc WHERE proname = 'invite_to_bloc';
