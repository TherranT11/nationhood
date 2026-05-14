-- Fix: every bloc RPC rejects modern-flow factions with
-- "Faction ownership required"
--
-- User reported all three bloc actions failing with the same error:
--   Create bloc      → "Could not create bloc: Faction ownership required"
--   Accept invite    → "Could not accept invitation: Faction ownership required"
--   Decline invite   → "Could not decline invitation: Faction ownership required"
--
-- Root cause: every bloc RPC's auth check is the legacy-only
-- single-faction-per-user pattern:
--
--     IF p_X_faction_id <> v_user_id THEN
--         RAISE EXCEPTION 'Faction ownership required';
--     END IF;
--
-- That accepts a faction only if faction.id == auth.uid(). The modern
-- flow stores the player's auth-user-id in factions.linked_user_id
-- and gives the faction its own UUID. Every faction created via the
-- new flow fails the check.
--
-- Same bug class as the Petition for Reform fix (20261221) — there
-- we patched petition_for_reform / respond_to_petition to accept
-- "id = caller OR linked_user_id = caller". This is the bloc
-- equivalent across all five live RPCs:
--
--   create_bloc         (live: 20260424_blocs_phase2d_events)
--   invite_to_bloc      (live: 20260424_blocs_phase2c_invite_and_govguard)
--   accept_bloc_invite  (live: 20260424_blocs_phase2a_momentum)
--   decline_bloc_invite (live: 20260422_create_blocs_phase1)
--   leave_bloc          (live: 20260424_blocs_phase2a_momentum)
--
-- Pattern: introduce a small SECURITY DEFINER helper, then every
-- RPC's auth check is one line of caller-side code:
--
--   IF NOT _caller_owns_faction(p_X_faction_id) THEN
--       RAISE EXCEPTION 'Faction ownership required';
--   END IF;
--
-- For invite_to_bloc (where the check is "is the caller the bloc
-- leader?") the same helper applies, just on v_bloc.leader_faction_id.
--
-- Single source of truth — if ownership semantics change, one place
-- to update.

BEGIN;

-- ── Shared helper ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._caller_owns_faction(p_faction_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM factions
        WHERE id = p_faction_id
          AND (id = auth.uid() OR linked_user_id = auth.uid())
    );
$$;

GRANT EXECUTE ON FUNCTION public._caller_owns_faction(UUID)
    TO authenticated, service_role;


-- ══════════════════════ create_bloc ══════════════════════
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
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_leader FROM factions WHERE id = p_leader_faction_id;
    IF v_leader.id IS NULL THEN
        RAISE EXCEPTION 'Leader faction not found';
    END IF;
    IF NOT _caller_owns_faction(p_leader_faction_id) THEN
        RAISE EXCEPTION 'Faction ownership required';
    END IF;
    IF v_leader.faction_type IS DISTINCT FROM 'party' THEN
        RAISE EXCEPTION 'Only parties can form blocs';
    END IF;
    IF v_leader.bloc_id IS NOT NULL THEN
        RAISE EXCEPTION 'Already in a bloc';
    END IF;

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
    IF v_clean_name = '' THEN
        RAISE EXCEPTION 'Bloc name required';
    END IF;
    IF LENGTH(v_clean_name) > 40 THEN
        RAISE EXCEPTION 'Bloc name too long (max 40 characters)';
    END IF;

    IF COALESCE(v_leader.party_funds, 0) < 100000 THEN
        RAISE EXCEPTION 'Insufficient party funds ($100,000 required)';
    END IF;

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
               OR v_invitee_faction.bloc_id IS NOT NULL THEN
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


-- ══════════════════════ invite_to_bloc ══════════════════════
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
    IF NOT _caller_owns_faction(v_bloc.leader_faction_id) THEN
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


-- ══════════════════════ accept_bloc_invite ══════════════════════
CREATE OR REPLACE FUNCTION accept_bloc_invite(
    p_invitation_id UUID,
    p_accepting_faction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user_id UUID;
    v_invite bloc_invitations%ROWTYPE;
    v_faction factions%ROWTYPE;
    v_bloc blocs%ROWTYPE;
    v_tick INT;
    v_member_id UUID;
    v_label TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    IF NOT _caller_owns_faction(p_accepting_faction_id) THEN
        RAISE EXCEPTION 'Faction ownership required';
    END IF;

    SELECT * INTO v_invite FROM bloc_invitations WHERE id = p_invitation_id;
    IF v_invite.id IS NULL THEN RAISE EXCEPTION 'Invitation not found'; END IF;
    IF v_invite.invited_faction_id <> p_accepting_faction_id THEN
        RAISE EXCEPTION 'Invitation not addressed to this faction';
    END IF;
    IF v_invite.status <> 'pending' THEN
        RAISE EXCEPTION 'Invitation already resolved (%)' , v_invite.status;
    END IF;

    SELECT * INTO v_faction FROM factions WHERE id = p_accepting_faction_id;
    IF v_faction.bloc_id IS NOT NULL THEN
        RAISE EXCEPTION 'Already in a bloc';
    END IF;

    SELECT * INTO v_bloc FROM blocs WHERE id = v_invite.bloc_id FOR UPDATE;
    IF v_bloc.id IS NULL OR v_bloc.dissolved_at_tick IS NOT NULL THEN
        RAISE EXCEPTION 'Bloc no longer exists';
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';

    UPDATE factions SET bloc_id = v_invite.bloc_id
     WHERE id = p_accepting_faction_id;

    UPDATE bloc_invitations
       SET status = 'accepted', responded_at_tick = v_tick
     WHERE id = p_invitation_id;

    UPDATE bloc_invitations
       SET status = 'rescinded', responded_at_tick = v_tick
     WHERE invited_faction_id = p_accepting_faction_id
       AND status = 'pending'
       AND id <> p_invitation_id;

    v_label := 'Bloc growth: ' || v_bloc.name;
    FOR v_member_id IN
        SELECT id FROM factions WHERE bloc_id = v_invite.bloc_id
    LOOP
        PERFORM adjust_momentum(v_member_id, 2, v_label, v_tick);
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'bloc_id', v_invite.bloc_id,
        'bloc_name', v_bloc.name
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION accept_bloc_invite(UUID, UUID) TO authenticated;


-- ══════════════════════ decline_bloc_invite ══════════════════════
CREATE OR REPLACE FUNCTION decline_bloc_invite(
    p_invitation_id UUID,
    p_declining_faction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user_id UUID;
    v_invite bloc_invitations%ROWTYPE;
    v_tick INT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    IF NOT _caller_owns_faction(p_declining_faction_id) THEN
        RAISE EXCEPTION 'Faction ownership required';
    END IF;

    SELECT * INTO v_invite FROM bloc_invitations WHERE id = p_invitation_id;
    IF v_invite.id IS NULL THEN RAISE EXCEPTION 'Invitation not found'; END IF;
    IF v_invite.invited_faction_id <> p_declining_faction_id THEN
        RAISE EXCEPTION 'Invitation not addressed to this faction';
    END IF;
    IF v_invite.status <> 'pending' THEN
        RAISE EXCEPTION 'Invitation already resolved (%)' , v_invite.status;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';

    UPDATE bloc_invitations
       SET status = 'declined', responded_at_tick = v_tick
     WHERE id = p_invitation_id;

    RETURN jsonb_build_object('success', true);
END;
$fn$;

GRANT EXECUTE ON FUNCTION decline_bloc_invite(UUID, UUID) TO authenticated;


-- ══════════════════════ leave_bloc ══════════════════════
CREATE OR REPLACE FUNCTION leave_bloc(
    p_faction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user_id UUID;
    v_faction factions%ROWTYPE;
    v_bloc blocs%ROWTYPE;
    v_tick INT;
    v_is_leader BOOLEAN;
    v_label TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    IF NOT _caller_owns_faction(p_faction_id) THEN
        RAISE EXCEPTION 'Faction ownership required';
    END IF;

    SELECT * INTO v_faction FROM factions WHERE id = p_faction_id;
    IF v_faction.id IS NULL THEN RAISE EXCEPTION 'Faction not found'; END IF;
    IF v_faction.bloc_id IS NULL THEN RAISE EXCEPTION 'Not in a bloc'; END IF;

    SELECT * INTO v_bloc FROM blocs WHERE id = v_faction.bloc_id FOR UPDATE;
    IF v_bloc.id IS NULL THEN RAISE EXCEPTION 'Bloc not found'; END IF;
    IF v_bloc.dissolved_at_tick IS NOT NULL THEN
        RAISE EXCEPTION 'Bloc already dissolved';
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';
    v_is_leader := (v_bloc.leader_faction_id = p_faction_id);
    v_label := 'Left bloc: ' || v_bloc.name;

    PERFORM adjust_momentum(p_faction_id, -7, v_label, v_tick);

    IF v_is_leader THEN
        UPDATE factions SET bloc_id = NULL WHERE bloc_id = v_bloc.id;
        UPDATE bloc_invitations
           SET status = 'rescinded', responded_at_tick = v_tick
         WHERE bloc_id = v_bloc.id AND status = 'pending';
        UPDATE blocs
           SET dissolved_at_tick = v_tick,
               dissolution_reason = 'leader_left'
         WHERE id = v_bloc.id;
        RETURN jsonb_build_object('success', true, 'dissolved', true);
    ELSE
        UPDATE factions SET bloc_id = NULL WHERE id = p_faction_id;
        RETURN jsonb_build_object('success', true, 'dissolved', false);
    END IF;
END;
$fn$;

GRANT EXECUTE ON FUNCTION leave_bloc(UUID) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
