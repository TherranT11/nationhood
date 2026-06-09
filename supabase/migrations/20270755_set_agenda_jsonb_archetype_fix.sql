-- ════════════════════════════════════════════════════════════════════
-- 20270755 — Fix committee_set_agenda NPC vote jsonb type mismatch
--
-- 20270752 emitted committee_set_agenda with NPC auto-cast logic
-- that did
--
--     v_arch = ANY(COALESCE(v_prop.support_archetypes, ARRAY[]::text[]))
--
-- but committee_proposals.support_archetypes / .oppose_archetypes
-- are `jsonb` columns (20270686), not `text[]`. Live runtime error:
--
--     Could not set the agenda: COALESCE types jsonb and text[] cannot be matched
--
-- Replacing with the jsonb element-membership operator `?`, which
-- on a jsonb array returns true when the right-hand text exists as
-- a top-level element. Same semantic intent, correct type.
--
-- The rest of the function body is byte-faithful to 20270752 —
-- this is a CREATE OR REPLACE that swaps in the corrected NPC
-- vote loop, leaving the auth/cooldown/active-proposal/insert
-- shape untouched.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.committee_set_agenda(
    p_faction_id   uuid,
    p_committee_id uuid,
    p_proposal_id  uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_comm      committees%ROWTYPE;
    v_prop      committee_proposals%ROWTYPE;
    v_member    committee_members%ROWTYPE;
    v_tick      int;
    v_seat      committee_members%ROWTYPE;
    v_arch      text;
    v_vote      text;
    v_support   jsonb;
    v_oppose    jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_committee_id IS NULL OR p_proposal_id IS NULL THEN
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

    SELECT * INTO v_comm FROM committees WHERE id = p_committee_id FOR UPDATE;
    IF v_comm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'committee_not_found');
    END IF;

    SELECT * INTO v_member FROM committee_members
     WHERE committee_id = v_comm.id
       AND politician_faction_id = v_pol.id;
    IF v_member.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_member.last_set_agenda_tick IS NOT NULL
       AND v_member.last_set_agenda_tick >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_used_this_tick',
            'next_tick', v_member.last_set_agenda_tick + 1);
    END IF;

    IF v_comm.active_proposal_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'agenda_already_active',
            'active_proposal_id', v_comm.active_proposal_id);
    END IF;

    SELECT * INTO v_prop FROM committee_proposals WHERE id = p_proposal_id;
    IF v_prop.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_not_found');
    END IF;
    IF v_prop.committee_id <> v_comm.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_committee');
    END IF;
    IF v_prop.status <> 'queued' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_queued',
            'have', v_prop.status);
    END IF;

    IF EXISTS (SELECT 1 FROM committee_hearings
                WHERE committee_id = v_comm.id AND status = 'open') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_in_progress');
    END IF;

    UPDATE committees
       SET active_proposal_id        = v_prop.id,
           active_agenda_set_at_tick = v_tick
     WHERE id = v_comm.id;

    UPDATE committee_members
       SET last_set_agenda_tick = v_tick
     WHERE id = v_member.id;

    -- 20270755 fix: archetype lists are jsonb, not text[]. Cache them
    -- once with a defensive empty-array COALESCE so the `?` element-
    -- membership check below short-circuits cleanly when the proposer
    -- left either list NULL.
    v_support := COALESCE(v_prop.support_archetypes, '[]'::jsonb);
    v_oppose  := COALESCE(v_prop.oppose_archetypes,  '[]'::jsonb);

    -- Auto-cast NPC member votes. Pull each NPC seat's archetype
    -- from their party_id → factions.archetype (parties are the
    -- archetype carriers on this surface, mirroring how the report
    -- vote tally uses party archetype too).
    FOR v_seat IN
        SELECT m.* FROM committee_members m
         WHERE m.committee_id = v_comm.id
           AND m.politician_faction_id IS NULL
    LOOP
        v_arch := NULL;
        IF v_seat.party_id IS NOT NULL THEN
            SELECT archetype INTO v_arch FROM factions WHERE id = v_seat.party_id;
        END IF;

        IF v_arch IS NOT NULL AND v_support ? v_arch THEN
            v_vote := 'vote';
        ELSIF v_arch IS NOT NULL AND v_oppose ? v_arch THEN
            v_vote := 'hear';
        ELSE
            v_vote := CASE WHEN random() < 0.5 THEN 'hear' ELSE 'vote' END;
        END IF;

        INSERT INTO committee_agenda_votes (
            committee_id, proposal_id, member_id, voter_faction_id,
            vote, is_npc, voted_at_tick
        ) VALUES (
            v_comm.id, v_prop.id, v_seat.id, NULL,
            v_vote, true, v_tick
        )
        ON CONFLICT (committee_id, proposal_id, member_id) DO NOTHING;
    END LOOP;

    -- NPCs alone can already hit a 3-vote majority (4 NPCs + 1 player
    -- committee: 3-1 or 4-0 NPC splits already resolve the vote).
    -- Tally now so the carry-out fires before the player even sees
    -- the agenda. _committee_tally_and_carry is a no-op when no
    -- action has 3 yet, so it's safe to call unconditionally.
    PERFORM public._committee_tally_and_carry(v_comm.id, v_prop.id, v_tick);

    RETURN jsonb_build_object(
        'success', true,
        'proposal_id', v_prop.id,
        'set_at_tick', v_tick
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.committee_set_agenda(uuid, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_set_agenda(uuid, uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
