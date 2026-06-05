-- ════════════════════════════════════════════════════════════════════
-- 20270636 — apply_for_committee: cap of THREE, counting pending votes
--
-- User flagged a politician with three active admission votes
-- queued (Finance & Budget, Defence & Foreign Affairs, Judiciary &
-- Constitutional Affairs) and asked that the apply gate prevent
-- a fourth. The prior gate (20270456) capped at TWO seated
-- memberships and ignored pending votes entirely, so the third,
-- fourth, … application kept going through as long as you
-- targeted different committees.
--
-- New rule: held memberships + active pending applications must
-- be < 3. The cap value moves from 2 → 3 (user spec — "max a
-- politician can be on") and the count now includes still-active
-- admission votes so an MP can't queue more than they could
-- actually win.
--
-- Reason code stays 'committee_cap' for client compatibility; the
-- payload swaps to include have_members / have_pending so the UI
-- can spell out which side of the budget tripped the gate.
--
-- Apply after 20270635.
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

    -- 20270636: cap counts held memberships + active admission
    -- votes. A politician can sit on at most three committees, so
    -- queuing a fourth application — even if the first three
    -- haven't resolved yet — is rejected.
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

NOTIFY pgrst, 'reload schema';

COMMIT;
