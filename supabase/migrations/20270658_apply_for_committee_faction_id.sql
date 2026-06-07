-- ════════════════════════════════════════════════════════════════════
-- 20270658 — apply_for_committee: take p_faction_id (multi-politician fix)
--
-- User on a 3-politician account hit Apply for Committee (Defence &
-- Foreign Affairs) from Renata Sandoval (Rose, MP, Montequilla) and
-- was rejected with 'not_mp'. The career page renders "Member of
-- Parliament" off the live ctx.faction row, so the UI was right —
-- but apply_for_committee's body grades the OLDEST politician (the
-- one with the smallest created_at) via:
--
--   SELECT * INTO v_pol FROM factions
--    WHERE (id = v_uid OR linked_user_id = v_uid)
--      AND faction_type = 'politician'
--      AND abandoned_at IS NULL
--    ORDER BY created_at ASC LIMIT 1
--    FOR UPDATE;
--
-- On this account Renata isn't the oldest, so the SELECT returned a
-- sibling whose politician_office isn't 'member_of_parliament' and
-- the gate at line 71 of 20270637 rejected. Same bug class as
-- 20270643 (read_statute_books) and the original 20270558 fix on
-- politician_resolve_due_elections — the 20270643 header explicitly
-- flagged apply_for_committee as part of the broader sweep that
-- hadn't been done.
--
-- Fix mirrors 20270643 exactly:
--   1. DROP the old arg-less (committee_id-only) signature so any
--      stale caller fails loud (PostgrREST will fail the RPC lookup)
--      rather than silently grading the wrong politician.
--   2. New signature takes p_faction_id and looks up THAT specific
--      politician with the standard ownership guard
--      (id = auth.uid() OR linked_user_id = auth.uid()).
--   3. Drop one new reason code 'wrong_owner' for the case where
--      the supplied faction_id isn't owned by the caller.
--
-- Body otherwise byte-identical to 20270637 (the FOR UPDATE row
-- lock + cap check + vote spawn all preserved).
--
-- Client wrappers (js/committees.js applyForCommittee, plus
-- politician-nation.html and committee.html callers) are updated in
-- lockstep to forward the active politician's id.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- Signature change: drop the old arg-less version so stale callers
-- error loud rather than silently grading the wrong row.
DROP FUNCTION IF EXISTS public.apply_for_committee(uuid);

CREATE OR REPLACE FUNCTION public.apply_for_committee(
    p_committee_id uuid,
    p_faction_id   uuid
) RETURNS jsonb
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
    IF p_committee_id IS NULL OR p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- 20270658: select the SPECIFIC politician the UI is viewing,
    -- gated by ownership. Mirrors the 20270643 read_statute_books
    -- pattern — replaces the old ORDER BY created_at ASC LIMIT 1
    -- "oldest-first" selector that broke on multi-politician
    -- accounts. FOR UPDATE preserved (20270637) for the cap-check
    -- serialisation.
    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
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

GRANT EXECUTE ON FUNCTION public.apply_for_committee(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.apply_for_committee(uuid, uuid) IS
    'MP applies to join a committee. Validates ownership of the supplied p_faction_id (20270658 — replaces 20270637''s ORDER BY created_at ASC LIMIT 1 oldest-first selector that broke on multi-politician accounts), MP-only, same-nation, not-already-member, 3-committee cap, no-pending-vote on this committee, open-member-seat. Locks the politician row FOR UPDATE (20270637 carryover) so the cap check can''t be raced. Spawns committee_admission_votes row with party-line snapshot and resolve_at_tick = now + 3.';

NOTIFY pgrst, 'reload schema';

COMMIT;
