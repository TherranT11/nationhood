-- ════════════════════════════════════════════════════════════════════
-- 20270795 — Fix committee motions: archetype columns are jsonb
--
-- 20270793 (the renumbered committee motion system) finally executed
-- on prod — and immediately surfaced a latent bug the code carried
-- from birth, masked while the migration sat shadowed:
-- committee_proposals.support_archetypes / oppose_archetypes are
-- jsonb arrays (20270686), but the motion functions tested membership
-- with COALESCE(col, ARRAY[]::text[]) — "COALESCE types jsonb and
-- text[] cannot be matched" on the first [VOTE].
--
-- _committee_resolve_floor and committee_open_motion re-emitted
-- byte-faithful to 20270793 except the four membership tests, which
-- now read the jsonb arrays through jsonb_array_elements_text — the
-- same idiom 20270686's own validators use.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public._committee_resolve_floor(
    p_proposal_id uuid,
    p_tick        int
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_prop      committee_proposals%ROWTYPE;
    v_party     RECORD;
    v_yes_seats int := 0;
    v_no_seats  int := 0;
    v_outcome   text;
BEGIN
    SELECT * INTO v_prop FROM committee_proposals WHERE id = p_proposal_id;
    IF v_prop.id IS NULL THEN
        RETURN NULL;
    END IF;

    FOR v_party IN
        SELECT f.archetype, COALESCE(f.seats, 0) AS seats
          FROM factions f
         WHERE f.faction_type = 'movement_party'
           AND f.nation_id    = v_prop.nation_id
           AND f.abandoned_at IS NULL
    LOOP
        IF v_party.archetype IS NULL OR v_party.seats = 0 THEN
            CONTINUE;
        END IF;
        IF v_party.archetype = ANY (SELECT jsonb_array_elements_text(COALESCE(v_prop.support_archetypes, '[]'::jsonb))) THEN
            v_yes_seats := v_yes_seats + v_party.seats;
        ELSIF v_party.archetype = ANY (SELECT jsonb_array_elements_text(COALESCE(v_prop.oppose_archetypes, '[]'::jsonb))) THEN
            v_no_seats := v_no_seats + v_party.seats;
        END IF;
    END LOOP;

    v_outcome := CASE WHEN v_yes_seats > v_no_seats THEN 'enacted' ELSE 'failed' END;

    UPDATE committee_proposals
       SET status                 = v_outcome,
           floor_yes_seats        = v_yes_seats,
           floor_no_seats         = v_no_seats,
           floor_resolved_at_tick = p_tick
     WHERE id = p_proposal_id;

    RETURN v_outcome;
END $$;

CREATE OR REPLACE FUNCTION public.committee_open_motion(
    p_faction_id   uuid,
    p_committee_id uuid,
    p_motion       text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_comm    committees%ROWTYPE;
    v_member  committee_members%ROWTYPE;
    v_prop    committee_proposals%ROWTYPE;
    v_motion  text := lower(btrim(COALESCE(p_motion, '')));
    v_tick    int;
    v_motion_id uuid;
    v_seat    committee_members%ROWTYPE;
    v_arch    text;
    v_stance  int;
    v_advance boolean;
    v_vote    text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_committee_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF v_motion NOT IN ('hearing', 'vote', 'amend', 'table') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_motion');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_comm FROM committees WHERE id = p_committee_id FOR UPDATE;
    IF v_comm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'committee_not_found');
    END IF;

    SELECT * INTO v_member FROM committee_members
     WHERE committee_id = v_comm.id AND politician_faction_id = v_pol.id;
    IF v_member.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    IF v_comm.active_proposal_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_active_agenda');
    END IF;

    IF EXISTS (SELECT 1 FROM committee_motions
                WHERE committee_id = v_comm.id AND status = 'open') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'motion_already_open');
    END IF;

    IF EXISTS (SELECT 1 FROM committee_hearings
                WHERE committee_id = v_comm.id AND status = 'open') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_in_progress');
    END IF;

    SELECT * INTO v_prop FROM committee_proposals WHERE id = v_comm.active_proposal_id FOR UPDATE;
    IF v_prop.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_not_found');
    END IF;
    -- The active bill is idle (status 'queued') between motions. Any
    -- other status (in_hearing, on_floor, ...) means it isn't ready.
    IF v_prop.status <> 'queued' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_busy', 'status', v_prop.status);
    END IF;

    -- Once-per-bill guards for hearing / amend.
    IF v_motion = 'hearing' AND EXISTS (
        SELECT 1 FROM committee_motions
         WHERE proposal_id = v_prop.id AND motion = 'hearing' AND status = 'passed'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_already_held');
    END IF;
    IF v_motion = 'amend' AND EXISTS (
        SELECT 1 FROM committee_motions
         WHERE proposal_id = v_prop.id AND motion = 'amend' AND status = 'passed'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'amend_already_held');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    BEGIN
        INSERT INTO committee_motions (
            committee_id, proposal_id, motion, status,
            opened_by_faction_id, opened_at_tick, closes_at_tick
        ) VALUES (
            v_comm.id, v_prop.id, v_motion, 'open',
            v_pol.id, v_tick, v_tick + 3
        ) RETURNING id INTO v_motion_id;
    EXCEPTION WHEN unique_violation THEN
        -- Lost the race for the single open-motion slot.
        RETURN jsonb_build_object('success', false, 'reason', 'motion_already_open');
    END;

    -- The mover backs their own motion.
    INSERT INTO committee_motion_votes (motion_id, member_id, voter_faction_id, vote, is_npc, voted_at_tick)
    VALUES (v_motion_id, v_member.id, v_pol.id, 'yes', false, v_tick);

    -- NPC seats auto-cast by archetype alignment with the bill.
    -- Advancing motions (hearing/vote/amend): supporters yes, opponents
    -- no. Tabling: supporters no, opponents yes. Neutral splits 50/50.
    v_advance := (v_motion <> 'table');
    FOR v_seat IN
        SELECT * FROM committee_members
         WHERE committee_id = v_comm.id
           AND politician_faction_id IS NULL
           AND party_id IS NOT NULL   -- party-less seats abstain (no row)
    LOOP
        SELECT archetype INTO v_arch FROM factions WHERE id = v_seat.party_id;

        v_stance := 0;
        IF v_arch IS NOT NULL THEN
            IF v_arch = ANY (SELECT jsonb_array_elements_text(COALESCE(v_prop.support_archetypes, '[]'::jsonb))) THEN
                v_stance := 1;
            ELSIF v_arch = ANY (SELECT jsonb_array_elements_text(COALESCE(v_prop.oppose_archetypes, '[]'::jsonb))) THEN
                v_stance := -1;
            END IF;
        END IF;

        IF v_stance = 0 THEN
            v_vote := CASE WHEN random() < 0.5 THEN 'yes' ELSE 'no' END;
        ELSIF (v_stance > 0) = v_advance THEN
            v_vote := 'yes';
        ELSE
            v_vote := 'no';
        END IF;

        INSERT INTO committee_motion_votes (motion_id, member_id, voter_faction_id, vote, is_npc, voted_at_tick)
        VALUES (v_motion_id, v_seat.id, NULL, v_vote, true, v_tick)
        ON CONFLICT (motion_id, member_id) DO NOTHING;
    END LOOP;

    RETURN jsonb_build_object(
        'success',        true,
        'motion_id',      v_motion_id,
        'motion',         v_motion,
        'closes_at_tick', v_tick + 3
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
