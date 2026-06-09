-- ════════════════════════════════════════════════════════════════════
-- 20270744 — City Council President actions: Propose Ordinance,
--              City Hearing, Build the Base (CCP variant)
--
-- Per user spec, the CCP variant gets three repeatable actions on
-- the affiliation card (PICK ONE EACH TICK):
--
--   • Propose Ordinance — same modal Mayor uses, but the caller
--     check + cost differ. CCP pays -1 Volunteer per proposal;
--     Mayor still pays no Volunteer cost. propose_city_ordinance
--     is generalized to accept either office.
--   • City Hearing — +0.1 popularity_pct per Volunteer, +0.5
--     Reputation. Burns the per-tick lock.
--   • Build the Base (CCP variant) — 1d6:
--       1-2 → +1 Volunteer
--       3-4 → +1 Reputation
--       5-6 → +1 Volunteer AND +1 Reputation
--     Distinct from politician_build_the_base (CCM tier, different
--     mechanics) — kept as a separate RPC to avoid the temptation
--     of overloading.
--
-- All three share next_member_action_tick — same cooldown column
-- the Mayor variant uses. Mayor + CCP are different offices, so
-- their action sets never collide at the variant level; the
-- shared column just means a politician can't double-up if they
-- somehow held both offices (only happens in admin-injected test
-- states like Mateo's right now).
--
-- CCP city lookup mirrors the resolver stamp (20270722): the
-- council jsonb's seat 0 holds the President's seat info, and
-- holder_faction_id matches the caller. The Mayor lookup stays
-- name+party-based.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. propose_city_ordinance — generalize to accept Mayor OR CCP
-- ════════════════════════════════════════════════════════════════════
-- Body byte-faithful to 20270742 except:
--   • Office gate widens to (mayor, city_council_president).
--   • City-ownership check branches on office.
--   • CCP path checks volunteers >= 1 + deducts 1 Volunteer.
CREATE OR REPLACE FUNCTION public.propose_city_ordinance(
    p_faction_id   uuid,
    p_city_id      uuid,
    p_ordinance_id uuid,
    p_kind         text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_city      cities%ROWTYPE;
    v_ord       ordinances%ROWTYPE;
    v_tick      int;
    v_kind      text;
    v_already   boolean;
    v_open      boolean;
    v_id        uuid;
    v_seat      jsonb;
    v_seat_idx  int;
    v_arch      text;
    v_vote      text;
    v_is_pc     boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_city_id IS NULL OR p_ordinance_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    v_kind := COALESCE(p_kind, 'enact');
    IF v_kind NOT IN ('enact', 'rescind') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_kind');
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
    IF v_pol.politician_office NOT IN ('mayor', 'city_council_president') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_office');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    SELECT * INTO v_city FROM cities WHERE id = p_city_id;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;

    -- Caller must be THIS city's mayor (mayor path) or president
    -- (CCP path). The two stamps live in different places — mayor
    -- on the cities row's mayor_* columns, CCP on council[0]'s
    -- holder_faction_id. Either way, nation_id has to match.
    IF v_city.nation_id IS DISTINCT FROM v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_nation');
    END IF;
    IF v_pol.politician_office = 'mayor' THEN
        IF v_city.mayor_first_name IS DISTINCT FROM v_pol.leader_first_name
           OR v_city.mayor_last_name  IS DISTINCT FROM v_pol.leader_last_name
           OR v_city.mayor_party_id IS DISTINCT FROM v_pol.politician_party_id THEN
            RETURN jsonb_build_object('success', false, 'reason', 'not_this_citys_mayor');
        END IF;
    ELSE  -- city_council_president
        IF (v_city.council->0->>'holder_faction_id') IS DISTINCT FROM v_pol.id::text THEN
            RETURN jsonb_build_object('success', false, 'reason', 'not_this_citys_ccp');
        END IF;
        -- CCP cost: -1 Volunteer. Charged on success; rejected if
        -- volunteers < 1.
        IF COALESCE(v_pol.volunteers, 0) < 1 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_volunteers');
        END IF;
    END IF;

    SELECT * INTO v_ord FROM ordinances WHERE id = p_ordinance_id;
    IF v_ord.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'ordinance_not_found');
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM city_ordinances
         WHERE city_id      = p_city_id
           AND ordinance_id = p_ordinance_id
           AND status       = 'active'
    ) INTO v_already;
    SELECT EXISTS (
        SELECT 1 FROM city_ordinance_proposals
         WHERE city_id      = p_city_id
           AND ordinance_id = p_ordinance_id
           AND status       = 'voting'
    ) INTO v_open;

    IF v_open THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_in_flight');
    END IF;
    IF v_kind = 'enact' AND v_already THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_active');
    END IF;
    IF v_kind = 'rescind' AND NOT v_already THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_active');
    END IF;

    INSERT INTO city_ordinance_proposals (
        city_id, ordinance_id, kind, proposer_faction_id,
        status, proposed_at_tick, resolve_tick
    ) VALUES (
        p_city_id, p_ordinance_id, v_kind, v_pol.id,
        'voting', v_tick, v_tick + 1
    )
    RETURNING id INTO v_id;

    -- NPC seat votes computed immediately by archetype alignment.
    -- PC seats skip — they vote later via vote_on_city_ordinance.
    IF v_city.council IS NOT NULL THEN
        FOR v_seat IN SELECT * FROM jsonb_array_elements(v_city.council)
        LOOP
            v_seat_idx := CASE v_seat->>'seat'
                              WHEN 'president' THEN 0
                              WHEN 'member_1'  THEN 1
                              WHEN 'member_2'  THEN 2
                              WHEN 'member_3'  THEN 3
                              ELSE NULL
                          END;
            IF v_seat_idx IS NULL THEN
                CONTINUE;
            END IF;

            v_is_pc := (v_seat->>'holder_faction_id') IS NOT NULL;
            IF v_is_pc THEN
                CONTINUE;
            END IF;

            v_arch := v_seat->>'archetype';
            IF v_arch IS NULL THEN
                v_vote := CASE WHEN random() < 0.5 THEN 'yes' ELSE 'no' END;
            ELSIF v_arch = ANY(v_ord.support_archetypes) THEN
                v_vote := 'yes';
            ELSIF v_arch = ANY(v_ord.oppose_archetypes) THEN
                v_vote := 'no';
            ELSE
                v_vote := CASE WHEN random() < 0.5 THEN 'yes' ELSE 'no' END;
            END IF;

            INSERT INTO city_ordinance_proposal_votes (
                proposal_id, seat_idx, voter_faction_id,
                vote, is_npc, voted_at_tick
            ) VALUES (
                v_id, v_seat_idx, NULL,
                v_vote, true, v_tick
            );
        END LOOP;
    END IF;

    -- Burn the per-tick lock + CCP Volunteer cost (charged only on
    -- success — rejections leave volunteers intact).
    IF v_pol.politician_office = 'city_council_president' THEN
        UPDATE factions
           SET next_member_action_tick = v_tick + 1,
               volunteers              = GREATEST(0, COALESCE(volunteers, 0) - 1)
         WHERE id = v_pol.id;
    ELSE
        UPDATE factions
           SET next_member_action_tick = v_tick + 1
         WHERE id = v_pol.id;
    END IF;

    RETURN jsonb_build_object(
        'success',         true,
        'proposal_id',     v_id,
        'resolve_tick',    v_tick + 1,
        'next_action_tick',v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.propose_city_ordinance(uuid, uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.propose_city_ordinance(uuid, uuid, uuid, text) TO authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 2. ccp_city_hearing — +0.1 pop per Volunteer, +0.5 Reputation
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.ccp_city_hearing(
    p_faction_id uuid,
    p_party_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_tick         int;
    v_volunteers   int;
    v_pop_delta    numeric;
    v_new_pop      numeric;
    v_new_rep      numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
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
    IF v_pol.politician_office <> 'city_council_president' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ccp');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    v_volunteers := COALESCE(v_pol.volunteers, 0);
    -- +0.1 popularity_pct per Volunteer. Cap at popularity_cap_pct.
    -- Zero Volunteers → zero popularity delta; +0.5 Rep still lands.
    v_pop_delta := 0.1 * v_volunteers;

    -- Politician: +0.5 Reputation + burn the cooldown.
    UPDATE factions
       SET politician_reputation  = COALESCE(politician_reputation, 0) + 0.5,
           next_member_action_tick = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_reputation INTO v_new_rep;

    -- Party: popularity bump (zero if no Volunteers).
    IF v_pop_delta > 0 THEN
        UPDATE factions
           SET popularity_pct = LEAST(
                   COALESCE(popularity_cap_pct, 100),
                   GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta)
               )
         WHERE id = p_party_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
        RETURNING popularity_pct INTO v_new_pop;
    END IF;

    RETURN jsonb_build_object(
        'success',          true,
        'action',           'ccp_city_hearing',
        'volunteers',       v_volunteers,
        'popularity_delta', v_pop_delta,
        'reputation_delta', 0.5,
        'new_popularity',   v_new_pop,
        'new_reputation',   v_new_rep,
        'next_action_tick', v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.ccp_city_hearing(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.ccp_city_hearing(uuid, uuid) TO authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 3. ccp_build_the_base — 1d6 brackets (distinct from CCM's)
-- ════════════════════════════════════════════════════════════════════
-- Roll 1d6:
--   1-2 → +1 Volunteer
--   3-4 → +1 Reputation
--   5-6 → +1 Volunteer + +1 Reputation
-- Separate RPC from politician_build_the_base (CCM tier) so the
-- two don't drift on rebalance.
CREATE OR REPLACE FUNCTION public.ccp_build_the_base(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_roll          int;
    v_vol_delta     int := 0;
    v_rep_delta     numeric := 0;
    v_bracket       text;
    v_new_vol       int;
    v_new_rep       numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
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
    IF v_pol.politician_office <> 'city_council_president' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ccp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    v_roll := 1 + floor(random() * 6)::int;
    IF v_roll <= 2 THEN
        v_bracket   := 'volunteers';
        v_vol_delta := 1;
    ELSIF v_roll <= 4 THEN
        v_bracket   := 'reputation';
        v_rep_delta := 1;
    ELSE
        v_bracket   := 'both';
        v_vol_delta := 1;
        v_rep_delta := 1;
    END IF;

    UPDATE factions
       SET volunteers             = COALESCE(volunteers, 0)             + v_vol_delta,
           politician_reputation  = COALESCE(politician_reputation, 0)  + v_rep_delta,
           next_member_action_tick = v_tick + 1
     WHERE id = v_pol.id
    RETURNING volunteers, politician_reputation INTO v_new_vol, v_new_rep;

    RETURN jsonb_build_object(
        'success',          true,
        'action',           'ccp_build_the_base',
        'roll',             v_roll,
        'bracket',          v_bracket,
        'volunteer_delta',  v_vol_delta,
        'reputation_delta', v_rep_delta,
        'new_volunteers',   v_new_vol,
        'new_reputation',   v_new_rep,
        'next_action_tick', v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.ccp_build_the_base(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.ccp_build_the_base(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
