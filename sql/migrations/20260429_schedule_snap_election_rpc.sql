-- ══════════════════════════════════════════════════════════════
-- SNAP ELECTION SCHEDULING RPC
-- ══════════════════════════════════════════════════════════════
-- Adds a SECURITY DEFINER function so the PM party can reschedule
-- the next parliamentary election when calling early elections /
-- when a no-confidence vote passes.
--
-- Background: 20260302_fix_rls_ownership.sql dropped the permissive
-- "Allow insert/update/delete for all" policies on `elections`.
-- The tick processor uses service_role and bypasses RLS, but the
-- client-side snap election action (js/game/elections.js
-- callEarlyElectionsAction) runs as the authenticated player. With
-- no INSERT/DELETE policy in place, the DELETE of the existing
-- scheduled election and INSERT of the new snap election silently
-- affect zero rows — the legislature is dissolved (caretaker) and
-- the event log fires, but the election date never moves.
--
-- This RPC performs the cancel-then-insert atomically as definer,
-- so the player path can reschedule without exposing arbitrary
-- write access to the `elections` table.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION schedule_snap_election(
    p_nation_id UUID,
    p_election_tick INT,
    p_preserve_presidential BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_pm_party_id UUID;
    v_caller UUID := auth.uid();
    v_role TEXT := current_setting('request.jwt.claim.role', TRUE);
    v_new_id UUID;
BEGIN
    -- Authorization: service_role bypasses (tick processor / admin),
    -- otherwise the caller must be the PM party of the active or
    -- caretaker government (snap action sets caretaker BEFORE this
    -- RPC, so accept both states).
    IF v_role IS DISTINCT FROM 'service_role' THEN
        IF v_caller IS NULL THEN
            RAISE EXCEPTION 'Authentication required to schedule snap election';
        END IF;

        SELECT (ministry_assignments->>'prime_minister')::UUID
          INTO v_pm_party_id
          FROM government_formations
         WHERE nation_id = p_nation_id
           AND status IN ('formed', 'caretaker')
         ORDER BY formed_at DESC NULLS LAST
         LIMIT 1;

        IF v_pm_party_id IS NULL OR v_pm_party_id <> v_caller THEN
            RAISE EXCEPTION 'Only the PM party can schedule a snap election';
        END IF;
    END IF;

    -- Cancel existing scheduled elections. Semi-presidential systems
    -- preserve presidential elections so the presidential cycle isn't
    -- disrupted by a parliamentary snap.
    IF p_preserve_presidential THEN
        DELETE FROM elections
         WHERE nation_id = p_nation_id
           AND status = 'scheduled'
           AND election_type = 'parliamentary';
    ELSE
        DELETE FROM elections
         WHERE nation_id = p_nation_id
           AND status = 'scheduled';
    END IF;

    INSERT INTO elections (nation_id, election_tick, election_type, status)
    VALUES (p_nation_id, p_election_tick, 'parliamentary', 'scheduled')
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$;

ALTER FUNCTION public.schedule_snap_election(UUID, INT, BOOLEAN) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.schedule_snap_election(UUID, INT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_snap_election(UUID, INT, BOOLEAN) TO service_role;
