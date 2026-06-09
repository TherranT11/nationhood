-- ════════════════════════════════════════════════════════════════════
-- 20270745 — City Council Member action redesign
--
-- Per user spec, the CCM action trio changes from
--   View City / Mobilize Volunteers / Build the Base / Lobby Minister
-- to:
--   • Propose Ordinance — same modal Mayor + CCP use, generalised
--     to accept CCM too. No Volunteer cost (CCP keeps -1 Volunteer,
--     Mayor keeps no cost).
--   • Hold City Meeting — +0.1 popularity_pct per Volunteer (capped
--     by popularity_cap_pct), +0.5 Influence on the politician.
--   • Fundraiser — roll 1d6: +$1K × roll to party_funds, +1
--     Volunteer if roll 5-6.
--
-- All three share next_member_action_tick — the same column Mayor
-- + CCP use. This consolidates the "Tier 3+ local-office action
-- lock" so a politician with multiple offices (admin test states
-- like Mateo) doesn't get free double-actions. The CCM tier
-- switches its cooldown column from next_local_action_tick to
-- next_member_action_tick in the client variant (next_local
-- _action_tick stays on the Community Organizer tier).
--
-- ORPHANED RPCs (filed, NOT dropped):
--   politician_mobilize_volunteers — CCM tier, old action
--   politician_build_the_base      — CCM tier, old action (CCP
--                                     has its own ccp_build_the_base)
--   politician_lobby_minister      — CCM tier, old action
--   politician_civic_meeting       — CO tier, separate redesign
--     (not in scope here)
--
-- These are no longer wired from the client but stay in the DB so
-- a future client / test code path could still call them. Dropping
-- them would be invasive and reversible only by a re-emit; per
-- REDUCE we flag the orphans, don't pre-emptively delete.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. propose_city_ordinance — extend to accept CCM
-- ════════════════════════════════════════════════════════════════════
-- Office gate widens to (mayor, city_council_president, city_
-- council_member). City-ownership check branches:
--   Mayor → name+party stamp on cities row.
--   CCP   → council[0].holder_faction_id matches.
--   CCM   → ANY council member seat (member_1/2/3) holder matches.
-- Volunteer cost stays CCP-only (-1). Mayor + CCM pay no cost.
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
    IF v_pol.politician_office NOT IN
       ('mayor', 'city_council_president', 'city_council_member') THEN
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

    IF v_city.nation_id IS DISTINCT FROM v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_nation');
    END IF;
    IF v_pol.politician_office = 'mayor' THEN
        IF v_city.mayor_first_name IS DISTINCT FROM v_pol.leader_first_name
           OR v_city.mayor_last_name  IS DISTINCT FROM v_pol.leader_last_name
           OR v_city.mayor_party_id IS DISTINCT FROM v_pol.politician_party_id THEN
            RETURN jsonb_build_object('success', false, 'reason', 'not_this_citys_mayor');
        END IF;
    ELSIF v_pol.politician_office = 'city_council_president' THEN
        IF (v_city.council->0->>'holder_faction_id') IS DISTINCT FROM v_pol.id::text THEN
            RETURN jsonb_build_object('success', false, 'reason', 'not_this_citys_ccp');
        END IF;
        IF COALESCE(v_pol.volunteers, 0) < 1 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_volunteers');
        END IF;
    ELSE  -- city_council_member
        IF NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(v_city.council) seat
             WHERE seat->>'holder_faction_id' = v_pol.id::text
               AND seat->>'seat' LIKE 'member_%'
        ) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'not_this_citys_ccm');
        END IF;
        -- No Volunteer cost on the CCM path per user spec.
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

    -- Burn the per-tick lock. CCP also pays -1 Volunteer; Mayor +
    -- CCM pay no Volunteer cost.
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
-- 2. ccm_hold_city_meeting — +0.1 pop/Volunteer + +0.5 Influence
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.ccm_hold_city_meeting(
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
    v_new_inf      numeric;
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
    IF v_pol.politician_office <> 'city_council_member' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ccm');
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
    v_pop_delta := 0.1 * v_volunteers;  -- zero if no Volunteers

    UPDATE factions
       SET politician_influence    = COALESCE(politician_influence, 0) + 0.5,
           next_member_action_tick = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_inf;

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
        'action',           'ccm_hold_city_meeting',
        'volunteers',       v_volunteers,
        'popularity_delta', v_pop_delta,
        'influence_delta',  0.5,
        'new_popularity',   v_new_pop,
        'new_influence',    v_new_inf,
        'next_action_tick', v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.ccm_hold_city_meeting(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.ccm_hold_city_meeting(uuid, uuid) TO authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 3. ccm_fundraiser — 1d6 → $1K × roll + 1 Volunteer on 5-6
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.ccm_fundraiser(
    p_faction_id uuid,
    p_party_id   uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_tick         int;
    v_roll         int;
    v_money        bigint;
    v_vol_delta    int;
    v_new_funds    numeric;
    v_new_vol      int;
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
    IF v_pol.politician_office <> 'city_council_member' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ccm');
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

    v_roll      := 1 + floor(random() * 6)::int;
    v_money     := v_roll * 1000;
    v_vol_delta := CASE WHEN v_roll >= 5 THEN 1 ELSE 0 END;

    UPDATE factions
       SET volunteers              = COALESCE(volunteers, 0) + v_vol_delta,
           next_member_action_tick = v_tick + 1
     WHERE id = v_pol.id
    RETURNING volunteers INTO v_new_vol;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) + v_money
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
    RETURNING party_funds INTO v_new_funds;

    RETURN jsonb_build_object(
        'success',          true,
        'action',           'ccm_fundraiser',
        'roll',             v_roll,
        'money_raised',     v_money,
        'volunteer_delta',  v_vol_delta,
        'new_volunteers',   v_new_vol,
        'party_funds_after',v_new_funds,
        'next_action_tick', v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.ccm_fundraiser(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.ccm_fundraiser(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
