-- ════════════════════════════════════════════════════════════════════
-- Audit fix on 20270455 — apply_for_committee race condition
--
-- The 20270455 implementation has a check-then-insert race on the
-- "no pending vote for this applicant + committee" guard. Two
-- concurrent applies from the same browser session (double-click) or
-- from two tabs can both pass the EXISTS check before either commits,
-- then both INSERT, producing two simultaneous active votes for the
-- same (applicant, committee). The Voting panel renders both; the
-- resolver passes the first one and fails the second when the slot
-- is gone.
--
-- Fix in two parts:
--
-- 1. Partial unique index on (committee_id, applicant_faction_id)
--    WHERE status = 'active'. Postgres enforces the invariant
--    regardless of the application code.
--
-- 2. apply_for_committee wraps the INSERT in an EXCEPTION block
--    catching unique_violation. The losing caller returns the same
--    'vote_pending' reason the up-front EXISTS check would have, so
--    the client UI sees a consistent response in both the
--    no-contention and race-contention paths.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Partial unique index ─────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS cav_one_active_per_applicant_committee
    ON committee_admission_votes (committee_id, applicant_faction_id)
    WHERE status = 'active';

-- ── 2. apply_for_committee — catch the race ─────────────────────────
CREATE OR REPLACE FUNCTION public.apply_for_committee(p_committee_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_pol             factions%ROWTYPE;
    v_comm            committees%ROWTYPE;
    v_tick            int;
    v_member_count    int;
    v_open_member     int;
    v_yes             int := 0;
    v_no              int := 0;
    v_chamber         int := 0;
    v_vote_id         uuid;
    v_resolve_at      int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_committee_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    IF v_pol.politician_office IS DISTINCT FROM 'member_of_parliament' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mp');
    END IF;

    SELECT * INTO v_comm FROM committees WHERE id = p_committee_id;
    IF v_comm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'committee_not_found');
    END IF;

    IF v_comm.nation_id IS DISTINCT FROM v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_nation');
    END IF;

    IF EXISTS (
        SELECT 1 FROM committee_members
         WHERE committee_id = p_committee_id
           AND politician_faction_id = v_pol.id
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_member');
    END IF;

    SELECT COUNT(*) INTO v_member_count
      FROM committee_members
     WHERE politician_faction_id = v_pol.id;
    IF v_member_count >= 2 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'committee_cap', 'cap', 2);
    END IF;

    IF EXISTS (
        SELECT 1 FROM committee_admission_votes
         WHERE committee_id = p_committee_id
           AND applicant_faction_id = v_pol.id
           AND status = 'active'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'vote_pending');
    END IF;

    SELECT MAX(slot_idx) INTO v_open_member
      FROM committee_members
     WHERE committee_id = p_committee_id
       AND role = 'member'
       AND politician_faction_id IS NULL;
    IF v_open_member IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_open_seat');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT
        COALESCE(SUM(CASE WHEN id = v_pol.politician_party_id THEN COALESCE(seats, 0) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN id <> v_pol.politician_party_id THEN COALESCE(seats, 0) ELSE 0 END), 0),
        COALESCE(SUM(COALESCE(seats, 0)), 0)
      INTO v_yes, v_no, v_chamber
      FROM factions
     WHERE nation_id = v_pol.nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL;

    v_resolve_at := v_tick + 3;

    -- Race-safe insert. If a concurrent caller already inserted the
    -- pending vote (partial unique index hits), translate the
    -- exception into the same 'vote_pending' rejection the EXISTS
    -- check above produces.
    BEGIN
        INSERT INTO committee_admission_votes (
            committee_id, nation_id, applicant_faction_id, applicant_party_id,
            started_at_tick, resolve_at_tick, yes_seats, no_seats, chamber_size
        ) VALUES (
            p_committee_id, v_pol.nation_id, v_pol.id, v_pol.politician_party_id,
            v_tick, v_resolve_at, v_yes, v_no, v_chamber
        ) RETURNING id INTO v_vote_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'vote_pending');
    END;

    RETURN jsonb_build_object(
        'success',          true,
        'vote_id',          v_vote_id,
        'committee_id',     p_committee_id,
        'resolve_at_tick',  v_resolve_at,
        'yes_seats',        v_yes,
        'no_seats',         v_no,
        'chamber_size',     v_chamber
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_for_committee(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
