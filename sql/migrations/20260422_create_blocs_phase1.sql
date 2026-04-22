-- ============================================================
-- BLOCS — Phase 1: Formation & Membership Plumbing
--
-- Introduces pre-coalition alliances between parties. One party
-- (the "leader") creates a bloc, names it, pays $100k, and invites
-- other parties. Invitees accept or decline. Members can leave at
-- any time; the leader leaving dissolves the whole bloc.
--
-- Phase 1 has NO gameplay effects yet:
--   * No shared momentum buff (Phase 2)
--   * No vote-cohesion tracking (Phase 3)
--   * No coalition-invite binding (Phase 3)
--
-- Safe to re-run: all CREATE TABLE / ALTER / CREATE POLICY / CREATE
-- FUNCTION are idempotent.
-- ============================================================

-- ==================== TABLES ====================

CREATE TABLE IF NOT EXISTS blocs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id           UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    leader_faction_id   UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    founded_at_tick     INT NOT NULL,
    dissolved_at_tick   INT,
    dissolution_reason  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocs_nation_active
    ON blocs(nation_id)
    WHERE dissolved_at_tick IS NULL;

CREATE INDEX IF NOT EXISTS idx_blocs_leader
    ON blocs(leader_faction_id);

CREATE TABLE IF NOT EXISTS bloc_invitations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bloc_id                 UUID NOT NULL REFERENCES blocs(id) ON DELETE CASCADE,
    invited_faction_id      UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    invited_by_faction_id   UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    status                  TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','accepted','declined','rescinded','expired')),
    created_at_tick         INT NOT NULL,
    responded_at_tick       INT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One pending invitation per (bloc, invitee) — prevents dupes.
CREATE UNIQUE INDEX IF NOT EXISTS uq_bloc_invitations_pending
    ON bloc_invitations(bloc_id, invited_faction_id)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_bloc_invitations_pending_invitee
    ON bloc_invitations(invited_faction_id)
    WHERE status = 'pending';

-- Factions.bloc_id: fast "what bloc am I in?" lookup. ON DELETE SET NULL
-- so deleting a bloc row doesn't cascade-delete the faction.
ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS bloc_id UUID REFERENCES blocs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_factions_bloc
    ON factions(bloc_id)
    WHERE bloc_id IS NOT NULL;

-- ==================== RLS ====================
-- Reads are public (other players / news UI can see blocs).
-- Writes go exclusively through SECURITY DEFINER RPCs below.

ALTER TABLE blocs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloc_invitations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'blocs' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all"
            ON blocs FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'bloc_invitations' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all"
            ON bloc_invitations FOR SELECT USING (true);
    END IF;
END $$;

-- ==================== RPC: create_bloc ====================
-- Creates a bloc seed with the caller as leader, pays the $100k cost,
-- and sends invitations to the listed parties (after eligibility and
-- ideological-distance checks).

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
    v_leader_ideology faction_ideology%ROWTYPE;
    v_invitee_ideology faction_ideology%ROWTYPE;
    v_distance NUMERIC;
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

    -- Create the bloc row
    INSERT INTO blocs (nation_id, name, leader_faction_id, founded_at_tick)
    VALUES (v_leader.nation_id, v_clean_name, p_leader_faction_id, v_tick)
    RETURNING id INTO v_bloc_id;

    -- Deduct cost + stamp leader's bloc_id
    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - 100000,
           bloc_id     = v_bloc_id
     WHERE id = p_leader_faction_id;

    -- Leader's ideology (may be NULL for brand-new parties — treat missing as
    -- "no distance gate" so onboarding isn't blocked by missing data)
    SELECT * INTO v_leader_ideology
    FROM faction_ideology WHERE faction_id = p_leader_faction_id;

    -- Send invitations (each eligibility failure is a silent skip — we don't
    -- want a single bad invitee to abort the whole action)
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

            -- Ideological-distance gate: average absolute difference across
            -- the 5 axes must be >= 20. Skip when either side has no ideology
            -- row (can't gate on missing data).
            SELECT * INTO v_invitee_ideology
            FROM faction_ideology WHERE faction_id = v_invitee;

            IF v_invitee_ideology.faction_id IS NOT NULL
               AND v_leader_ideology.faction_id IS NOT NULL THEN
                v_distance := (
                    ABS(COALESCE(v_leader_ideology.liberty_equality, 0) -
                        COALESCE(v_invitee_ideology.liberty_equality, 0)) +
                    ABS(COALESCE(v_leader_ideology.tradition_progress, 0) -
                        COALESCE(v_invitee_ideology.tradition_progress, 0)) +
                    ABS(COALESCE(v_leader_ideology.security_freedom, 0) -
                        COALESCE(v_invitee_ideology.security_freedom, 0)) +
                    ABS(COALESCE(v_leader_ideology.globalism_nationalism, 0) -
                        COALESCE(v_invitee_ideology.globalism_nationalism, 0)) +
                    ABS(COALESCE(v_leader_ideology.individualism_collectivism, 0) -
                        COALESCE(v_invitee_ideology.individualism_collectivism, 0))
                ) / 5.0;
                IF v_distance < 20 THEN
                    v_skipped := v_skipped + 1; CONTINUE;
                END IF;
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

-- ==================== RPC: accept_bloc_invite ====================

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

    SELECT * INTO v_bloc FROM blocs WHERE id = v_invite.bloc_id;
    IF v_bloc.id IS NULL OR v_bloc.dissolved_at_tick IS NOT NULL THEN
        RAISE EXCEPTION 'Bloc no longer exists';
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';

    UPDATE factions SET bloc_id = v_invite.bloc_id
     WHERE id = p_accepting_faction_id;

    UPDATE bloc_invitations
       SET status = 'accepted', responded_at_tick = v_tick
     WHERE id = p_invitation_id;

    -- Rescind any other pending invitations for this faction — a party can
    -- only be in one bloc, so sibling pending invites are dead letters.
    UPDATE bloc_invitations
       SET status = 'rescinded', responded_at_tick = v_tick
     WHERE invited_faction_id = p_accepting_faction_id
       AND status = 'pending'
       AND id <> p_invitation_id;

    RETURN jsonb_build_object(
        'success', true,
        'bloc_id', v_invite.bloc_id,
        'bloc_name', v_bloc.name
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION accept_bloc_invite(UUID, UUID) TO authenticated;

-- ==================== RPC: decline_bloc_invite ====================

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
    IF p_declining_faction_id <> v_user_id THEN
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

-- ==================== RPC: leave_bloc ====================
-- A non-leader member leaves; if the leader leaves, the whole bloc
-- dissolves and all members are cleared.

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
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    IF p_faction_id <> v_user_id THEN
        RAISE EXCEPTION 'Faction ownership required';
    END IF;

    SELECT * INTO v_faction FROM factions WHERE id = p_faction_id;
    IF v_faction.id IS NULL THEN RAISE EXCEPTION 'Faction not found'; END IF;
    IF v_faction.bloc_id IS NULL THEN RAISE EXCEPTION 'Not in a bloc'; END IF;

    SELECT * INTO v_bloc FROM blocs WHERE id = v_faction.bloc_id;
    IF v_bloc.id IS NULL THEN RAISE EXCEPTION 'Bloc not found'; END IF;
    IF v_bloc.dissolved_at_tick IS NOT NULL THEN
        RAISE EXCEPTION 'Bloc already dissolved';
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';
    v_is_leader := (v_bloc.leader_faction_id = p_faction_id);

    IF v_is_leader THEN
        -- Leader leaves -> whole bloc dissolves
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
        -- Non-leader leaves -> just remove them from the bloc
        UPDATE factions SET bloc_id = NULL WHERE id = p_faction_id;
        RETURN jsonb_build_object('success', true, 'dissolved', false);
    END IF;
END;
$fn$;

GRANT EXECUTE ON FUNCTION leave_bloc(UUID) TO authenticated;

-- ==================== VERIFY ====================
-- Confirm tables and RPCs exist
SELECT 'blocs' AS object, COUNT(*) AS rows FROM blocs
UNION ALL
SELECT 'bloc_invitations', COUNT(*) FROM bloc_invitations
UNION ALL
SELECT 'factions.bloc_id column',
       COUNT(*) FILTER (WHERE column_name = 'bloc_id')
FROM information_schema.columns
WHERE table_name = 'factions';
