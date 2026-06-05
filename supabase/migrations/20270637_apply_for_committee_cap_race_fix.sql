-- ════════════════════════════════════════════════════════════════════
-- 20270637 — Audit fix on 20270636: lock the politician row to close
-- the cap-check race
--
-- 20270636 added `members + active pending votes < 3` as the
-- apply_for_committee gate, but the SELECT-then-INSERT shape is
-- racy under READ COMMITTED:
--
--   Tab A: COUNT(members)=0, COUNT(pending)=2, sum=2 → passes
--   Tab B: COUNT(members)=0, COUNT(pending)=2, sum=2 → passes
--          (A's INSERT hasn't committed yet, so B doesn't see it)
--   Both INSERT → politician ends up at 4 active pending votes.
--
-- The cav_one_active_per_applicant_committee partial unique index
-- (20270456) only blocks two votes for the SAME committee, so a
-- player double-clicking Apply on two different committee cards
-- can still slip past the cap.
--
-- Fix: SELECT FOR UPDATE on the politician's factions row. Concurrent
-- callers operating on the same politician serialize on the row
-- lock; the second call's COUNT() then sees the first call's
-- committed INSERT and rejects correctly. Other politicians acting
-- in parallel are unaffected — the lock is row-scoped.
--
-- Also refreshes the function COMMENT — the 20270455 string still
-- read "2-committee cap" and the validator list omitted the
-- pending-votes side of the budget.
--
-- Apply after 20270636.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    v_pending_count   int;
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

    -- 20270637: FOR UPDATE serializes concurrent applies on the same
    -- politician so the cap check below can't be raced.
    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
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

    SELECT COUNT(*) INTO v_pending_count
      FROM committee_admission_votes
     WHERE applicant_faction_id = v_pol.id
       AND status = 'active';

    IF v_member_count + v_pending_count >= 3 THEN
        RETURN jsonb_build_object(
            'success',      false,
            'reason',       'committee_cap',
            'cap',          3,
            'have_members', v_member_count,
            'have_pending', v_pending_count
        );
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

COMMENT ON FUNCTION public.apply_for_committee(uuid) IS
    'MP applies to join a committee. Validates MP-only, same-nation, not-already-member, 3-committee cap (held memberships + active pending admission votes — 20270636), no-pending-vote on this committee, open-member-seat. Locks the politician row FOR UPDATE (20270637) so the cap check can''t be raced by concurrent applies. Spawns committee_admission_votes row with party-line snapshot (applicant party YES, others NO) and resolve_at_tick = now + 3. Resolution by resolve_due_admission_votes when next viewer loads the page.';

NOTIFY pgrst, 'reload schema';

COMMIT;
