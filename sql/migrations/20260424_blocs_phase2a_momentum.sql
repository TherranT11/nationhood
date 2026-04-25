-- ============================================================
-- BLOCS — Phase 2a: Momentum bonuses on join, penalty on leave
--
-- Layers gameplay effects onto the Phase 1 RPCs without changing their
-- shape or callers. All momentum adjustments route through adjust_momentum
-- so clamping (0-100) and momentum_log append happen in one place.
--
-- Rules (confirmed by design):
--   * create_bloc: +2 momentum to the leader (they "joined" a 1-party bloc).
--   * accept_bloc_invite: +2 to every current member (including the new
--     acceptor) once the acceptor's bloc_id is set.
--   * leave_bloc: -7 momentum to the leaver. Applies whether the leaver is
--     a regular member OR the leader (leader-leave still dissolves the bloc
--     AND the leader pays the penalty). Other remaining members on a
--     leader-leave dissolution do NOT pay — only voluntary leaves are
--     penalized; "fate" dissolutions (vote split, PM promotion) are free.
--
-- Safe to re-run: all CREATE OR REPLACE.
-- ============================================================

-- ==================== RPC: create_bloc (replaced) ====================
-- Only change vs 20260422_blocs_hog_lock_and_auto_dissolve.sql is the
-- +2 momentum adjustment for the leader right before the RETURN. The
-- HoG lock, eligibility checks, and invitation loop are unchanged.

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
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_leader FROM factions WHERE id = p_leader_faction_id;
    IF v_leader.id IS NULL THEN
        RAISE EXCEPTION 'Leader faction not found';
    END IF;
    IF p_leader_faction_id <> v_user_id THEN
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

    -- Phase 2a: leader's +2 momentum for founding the bloc. Bloc has 1
    -- member at this point (just the leader), so the per-arrival rule
    -- "everyone in the bloc gets +2" resolves to a single +2 for the leader.
    PERFORM adjust_momentum(p_leader_faction_id, 2, 'Bloc founded: ' || v_clean_name, v_tick);

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

-- ==================== RPC: accept_bloc_invite (replaced) ====================
-- On acceptance, every current bloc member (including the fresh acceptor)
-- gets +2 momentum. The acceptor's bloc_id is set first so the subsequent
-- member loop picks them up automatically.

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
    IF p_accepting_faction_id <> v_user_id THEN
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

    -- Lock the bloc row so concurrent accepts serialize — two accepts on
    -- the same bloc at the same tick would otherwise race on the member
    -- count for the momentum bonus.
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

    -- Phase 2a: grant +2 to every current bloc member (the acceptor now
    -- included since we just set their bloc_id). adjust_momentum clamps
    -- and logs atomically per faction.
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

-- ==================== RPC: leave_bloc (replaced) ====================
-- -7 momentum to the leaver (regular member OR leader). Leader-leave still
-- dissolves the whole bloc; remaining members aren't penalized — only the
-- voluntary leaver pays. Fate-dissolutions (vote split, PM promotion)
-- happen elsewhere and don't route through leave_bloc.

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
    IF p_faction_id <> v_user_id THEN
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

    -- Phase 2a: -7 momentum to the leaver. Apply BEFORE the bloc_id nulls
    -- out so the label / log entry is coherent.
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

-- ==================== VERIFY ====================
SELECT 'create_bloc' AS rpc, COUNT(*) AS present FROM pg_proc WHERE proname = 'create_bloc'
UNION ALL
SELECT 'accept_bloc_invite', COUNT(*) FROM pg_proc WHERE proname = 'accept_bloc_invite'
UNION ALL
SELECT 'leave_bloc', COUNT(*) FROM pg_proc WHERE proname = 'leave_bloc';
