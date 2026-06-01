-- ════════════════════════════════════════════════════════════════════
-- Audit fix on 20270453 — ensure_committee race condition
--
-- The 20270453 implementation has a textbook check-then-insert race:
-- two concurrent first-visits both pass the existence SELECT, both
-- proceed to INSERT, and the second one hits the
-- UNIQUE (nation_id, committee_key) constraint and aborts. The
-- losing caller's RPC throws unique_violation; the client surface
-- shows "Could not load committee" even though the committee was
-- just created successfully by the other caller.
--
-- This migration adds ON CONFLICT DO NOTHING to the committee
-- INSERT. If we win the race, RETURNING fills v_comm_id and we seed
-- the members. If we lose the race (RETURNING is null), we re-read
-- the freshly-inserted committee and return success+created=false
-- without re-seeding. Either path produces a correct, race-safe
-- ensure_committee.
--
-- Single-RPC rewrite — table shape unchanged. Other 20270453
-- functions and tables untouched.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.ensure_committee(p_nation_id uuid, p_committee_key text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_existing      committees%ROWTYPE;
    v_comm_id       uuid;
    v_tick          int;
    v_nation        nations%ROWTYPE;
    v_party_ids     uuid[];
    v_party_seats   int[];
    v_n_parties     int;
    v_gov_seats     int;
    v_gov_quota     int;
    v_slot_party    uuid;
    v_slot_role     text;
    v_first         text;
    v_last          text;
    v_npool_len     int;
    v_lpool_len     int;
    v_other_idx     int;
    v_seeded        int := 0;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_nation_id IS NULL OR p_committee_key IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_committee_key NOT IN ('defense_foreign_affairs') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'unknown_committee_key');
    END IF;

    SELECT * INTO v_existing FROM committees
     WHERE nation_id = p_nation_id AND committee_key = p_committee_key;
    IF v_existing.id IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'committee_id', v_existing.id, 'created', false);
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Race-safe create. ON CONFLICT yields a null RETURNING on the
    -- losing path; we then re-read the row that the other caller
    -- just committed and return without re-seeding members.
    INSERT INTO committees (nation_id, committee_key, seeded_at_tick)
    VALUES (p_nation_id, p_committee_key, v_tick)
    ON CONFLICT (nation_id, committee_key) DO NOTHING
    RETURNING id INTO v_comm_id;

    IF v_comm_id IS NULL THEN
        SELECT id INTO v_comm_id FROM committees
         WHERE nation_id = p_nation_id AND committee_key = p_committee_key;
        RETURN jsonb_build_object('success', true, 'committee_id', v_comm_id, 'created', false);
    END IF;

    SELECT array_agg(id ORDER BY COALESCE(seats, 0) DESC, created_at ASC),
           array_agg(COALESCE(seats, 0) ORDER BY COALESCE(seats, 0) DESC, created_at ASC)
      INTO v_party_ids, v_party_seats
      FROM factions
     WHERE nation_id = p_nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL;

    v_n_parties := COALESCE(array_length(v_party_ids, 1), 0);

    IF v_n_parties = 0 THEN
        RETURN jsonb_build_object('success', true, 'committee_id', v_comm_id,
            'created', true, 'members_seeded', 0, 'reason', 'no_parties');
    END IF;

    v_gov_seats := v_party_seats[1];
    v_gov_quota := LEAST(3, GREATEST(0, v_gov_seats));

    v_npool_len := COALESCE(array_length(v_nation.first_name_pool, 1), 0);
    v_lpool_len := COALESCE(array_length(v_nation.last_name_pool, 1), 0);

    v_other_idx := 2;

    FOR i IN 1..5 LOOP
        IF i <= v_gov_quota THEN
            v_slot_party := v_party_ids[1];
            v_slot_role  := CASE i
                                WHEN 1 THEN 'chair'
                                WHEN 2 THEN 'vice_chair'
                                ELSE 'member'
                            END;
        ELSIF v_n_parties >= 2 THEN
            v_slot_party := v_party_ids[2 + ((v_other_idx - 2) % (v_n_parties - 1))];
            IF i = v_gov_quota + 1 THEN
                v_slot_role := 'ranking_minority';
            ELSE
                v_slot_role := 'member';
            END IF;
            v_other_idx := v_other_idx + 1;
        ELSE
            v_slot_party := v_party_ids[1];
            v_slot_role  := 'member';
        END IF;

        IF v_npool_len > 0 THEN
            v_first := v_nation.first_name_pool[1 + floor(random() * v_npool_len)::int];
        ELSE
            v_first := 'Member';
        END IF;
        IF v_lpool_len > 0 THEN
            v_last := v_nation.last_name_pool[1 + floor(random() * v_lpool_len)::int];
        ELSE
            v_last := i::text;
        END IF;

        INSERT INTO committee_members (
            committee_id, slot_idx, role, party_id,
            npc_first_name, npc_last_name, seated_at_tick
        ) VALUES (
            v_comm_id, i, v_slot_role, v_slot_party,
            v_first, v_last, v_tick
        );
        v_seeded := v_seeded + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'committee_id', v_comm_id,
        'created', true,
        'members_seeded', v_seeded
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_committee(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
