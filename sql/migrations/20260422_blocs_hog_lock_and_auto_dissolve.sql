-- ============================================================
-- BLOCS — Phase 1.1: Head-of-Government lock + auto-dissolve trigger
--
-- Two additions on top of 20260422_create_blocs_phase1.sql:
--
-- 1. `create_bloc` now rejects when the caller is the active Head of
--    Government (PM via head_of_government, elected President via the
--    open administration row, or Monarch via nations.monarch_faction_id).
--    Error message matches the client-side lock so the lockReason text
--    and the RAISE message read the same way.
--
-- 2. New trigger `trg_auto_dissolve_bloc_on_pm` on head_of_government
--    auto-dissolves any bloc whose member party becomes an active PM.
--    Covers every PM-appointment code path — finalize_government_formation,
--    installHOG, resignPM successor flow, emergency minority — without
--    each of them having to call a dissolve helper.
--
-- Safe to re-run: CREATE OR REPLACE + DROP TRIGGER IF EXISTS.
-- ============================================================

-- ==================== RPC: create_bloc (replaced) ====================

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

    -- Head-of-Government lock. PM, elected President, and Monarch all count:
    -- they're the coalition's center already and a bloc would be redundant.
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

    SELECT * INTO v_leader_ideology
    FROM faction_ideology WHERE faction_id = p_leader_faction_id;

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

-- ==================== TRIGGER: auto-dissolve on PM appointment ====================
-- Fires on any INSERT or UPDATE of head_of_government where active flips to true
-- (or the faction_id changes while already active). If the newly-active PM's
-- party has an active bloc, dissolve the whole bloc with reason 'promoted_to_pm'.
--
-- All four existing PM-appointment code paths (finalize_government_formation,
-- installHOG, resignPM successor install, emergency minority) write to
-- head_of_government, so the trigger catches every path without each one
-- having to call a helper.

CREATE OR REPLACE FUNCTION auto_dissolve_bloc_on_pm_appointment()
RETURNS TRIGGER AS $trg$
DECLARE
    v_bloc_id UUID;
    v_tick INT;
BEGIN
    -- Guard: only care about active appointments with a faction
    IF NEW.active IS NOT TRUE OR NEW.faction_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- On UPDATE, skip if neither active nor faction_id actually changed to a
    -- state requiring dissolve — avoids re-firing on unrelated column tweaks
    -- (like appointed_tick bumps).
    IF TG_OP = 'UPDATE'
       AND OLD.active IS TRUE
       AND OLD.faction_id = NEW.faction_id THEN
        RETURN NEW;
    END IF;

    -- Look up the PM's party bloc
    SELECT bloc_id INTO v_bloc_id FROM factions WHERE id = NEW.faction_id;
    IF v_bloc_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Only dissolve if the bloc is still active (safety net against stale FKs)
    IF NOT EXISTS (
        SELECT 1 FROM blocs
        WHERE id = v_bloc_id AND dissolved_at_tick IS NULL
    ) THEN
        RETURN NEW;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';

    -- Clear all members, rescind pending invites, mark the bloc dissolved
    UPDATE factions SET bloc_id = NULL WHERE bloc_id = v_bloc_id;
    UPDATE bloc_invitations
       SET status = 'rescinded', responded_at_tick = v_tick
     WHERE bloc_id = v_bloc_id AND status = 'pending';
    UPDATE blocs
       SET dissolved_at_tick = v_tick,
           dissolution_reason = 'promoted_to_pm'
     WHERE id = v_bloc_id;

    RETURN NEW;
END;
$trg$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_auto_dissolve_bloc_on_pm ON head_of_government;
CREATE TRIGGER trg_auto_dissolve_bloc_on_pm
    AFTER INSERT OR UPDATE ON head_of_government
    FOR EACH ROW
    EXECUTE FUNCTION auto_dissolve_bloc_on_pm_appointment();

-- ==================== VERIFY ====================
-- Confirm RPC + trigger exist
SELECT 'create_bloc RPC' AS object,
       COUNT(*) AS present
FROM pg_proc WHERE proname = 'create_bloc'
UNION ALL
SELECT 'auto_dissolve_bloc_on_pm_appointment fn',
       COUNT(*)
FROM pg_proc WHERE proname = 'auto_dissolve_bloc_on_pm_appointment'
UNION ALL
SELECT 'trg_auto_dissolve_bloc_on_pm trigger',
       COUNT(*)
FROM pg_trigger WHERE tgname = 'trg_auto_dissolve_bloc_on_pm';
