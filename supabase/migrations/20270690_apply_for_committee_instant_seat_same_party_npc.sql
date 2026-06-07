-- ════════════════════════════════════════════════════════════════════
-- 20270690 — apply_for_committee: instant-seat when a same-party NPC
--            holds a non-leadership slot
--
-- User design change. The 3-tick admission vote is overkill when the
-- applicant's own party already holds an NPC seat on the committee.
-- New rule: if any committee_members row exists with
--   politician_faction_id IS NULL  (NPC slot)
--   party_id = applicant's politician_party_id
--   role IN ('member', 'ranking_minority')   (not chair / vc)
-- then flip THAT seat to the applicant immediately. Role and slot
-- stay; only politician_faction_id + name fields change.
--
-- Chair and vice_chair seats are excluded — leadership positions
-- shouldn't be hot-swappable via an apply click.
--
-- Lowest slot_idx wins when multiple eligible NPC seats exist (stable
-- pick, no chair-jockeying surprises). FOR UPDATE SKIP LOCKED on the
-- candidate row so concurrent applicants from the same party grab
-- DIFFERENT seats instead of contending.
--
-- Fallback: when no eligible same-party NPC seat exists (player's
-- party has zero non-leadership NPC slots on this committee), behavior
-- falls through to the existing admission-vote path from 20270658
-- verbatim — same gates, same reasons.
--
-- Body re-emits 20270658's apply_for_committee in full, with the new
-- fast-path block inserted between the no-pending-vote check and the
-- legacy SELECT MAX(slot_idx) open-seat check. All other behavior
-- (auth, MP gate, 3-committee cap, vote-pending guard, party-line
-- snapshot for the fallback vote) is preserved.
--
-- Return shape: gains an `instant_seated` boolean. True on fast-path,
-- false on fallback vote start. Clients should branch on this — the
-- existing alert "Admission vote opened…" only makes sense for the
-- vote path.
--
-- Apply after 20270689.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    v_seat_id         uuid;
    v_seat_slot       int;
    v_seat_role       text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_committee_id IS NULL OR p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- ── 20270690 fast path: instant-seat into a same-party NPC slot ──
    -- Find the lowest-slot NPC member/ranking_minority seat whose
    -- party_id matches the applicant's party. SKIP LOCKED so concurrent
    -- same-party applicants grab different rows instead of contending
    -- on the same one. NULL applicant party falls through (NULL = NULL
    -- is NULL, the WHERE eliminates the row) to the admission-vote
    -- path below.
    IF v_pol.politician_party_id IS NOT NULL THEN
        SELECT id, slot_idx, role
          INTO v_seat_id, v_seat_slot, v_seat_role
          FROM committee_members
         WHERE committee_id          = p_committee_id
           AND politician_faction_id IS NULL
           AND party_id              = v_pol.politician_party_id
           AND role                  IN ('member', 'ranking_minority')
         ORDER BY slot_idx ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED;

        IF v_seat_id IS NOT NULL THEN
            UPDATE committee_members
               SET politician_faction_id = v_pol.id,
                   npc_first_name        = NULL,
                   npc_last_name         = NULL,
                   seated_at_tick        = v_tick
             WHERE id = v_seat_id;

            RETURN jsonb_build_object(
                'success',         true,
                'instant_seated',  true,
                'committee_id',    p_committee_id,
                'slot_idx',        v_seat_slot,
                'role',            v_seat_role,
                'seated_at_tick',  v_tick
            );
        END IF;
    END IF;

    -- ── Fallback: original admission-vote path (20270658 verbatim) ──
    SELECT MAX(slot_idx) INTO v_open_member
      FROM committee_members
     WHERE committee_id = p_committee_id
       AND role = 'member'
       AND politician_faction_id IS NULL;
    IF v_open_member IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_open_seat');
    END IF;

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
        'instant_seated',   false,
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
    'MP applies to join a committee. 20270690 added a fast path: when the applicant''s party holds an NPC seat with role IN (member, ranking_minority), that seat is flipped to the applicant immediately, no admission vote. Chair / vice_chair seats are excluded. Falls back to the 20270658 admission-vote path when no eligible same-party NPC seat exists. Response includes instant_seated boolean.';

NOTIFY pgrst, 'reload schema';

COMMIT;
