-- Fix: snap elections set caretaker mode but never schedule the election
--
-- Multiple players reported "Call Early Elections" flipped their
-- government to caretaker status but no election ever fired. The
-- caretaker state stuck; the regular cycle (e.g. 25 months out)
-- remained the only scheduled election.
--
-- Root cause: schedule_snap_election (migration 20260429) uses the
-- legacy single-faction auth check:
--
--     IF v_pm_party_id IS NULL OR v_pm_party_id <> v_caller THEN
--         RAISE EXCEPTION 'Only the PM party can schedule a snap election';
--     END IF;
--
-- This only accepts when the faction's id equals auth.uid(). The
-- modern flow stores the player's auth-user-id in
-- factions.linked_user_id and gives the faction its own UUID, so
-- v_pm_party_id <> v_caller is always true and the RPC throws.
--
-- The client-side callEarlyElectionsAction in elections.js performs
-- these steps in order, OUTSIDE a DB transaction:
--   1. UPDATE government_formations SET status='caretaker'  ← runs first, succeeds
--   2. rpc('schedule_snap_election', ...)                   ← throws
--   3. (bills frozen, event_log row, immediate-fire invoke) ← never run
-- The throw doesn't roll back step 1. Player sees: caretaker state
-- set, no election scheduled, half-completed flow.
--
-- Same bug class as the bloc-RPC fix (20261228), the
-- petition_for_reform fix (20261221), the impeachment Semi-
-- Presidential fix (5171495), and the agitator-in-monarchy fix.
-- Inline the corrected check rather than calling the
-- _caller_owns_faction helper from 20261228 so this migration has
-- no ordering dependency.

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
    -- otherwise the caller must own the PM party of the active or
    -- caretaker government. callEarlyElectionsAction in elections.js
    -- sets caretaker BEFORE this RPC runs, so accept either state.
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

        IF v_pm_party_id IS NULL THEN
            RAISE EXCEPTION 'Only the PM party can schedule a snap election';
        END IF;

        -- Support modern faction ownership via linked_user_id. The
        -- previous (id = v_caller) check only worked for legacy
        -- single-faction users.
        IF NOT EXISTS (
            SELECT 1 FROM factions
            WHERE id = v_pm_party_id
              AND (id = v_caller OR linked_user_id = v_caller)
        ) THEN
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

NOTIFY pgrst, 'reload schema';
