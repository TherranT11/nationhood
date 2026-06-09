-- ════════════════════════════════════════════════════════════════════
-- 20270747 — Ordinance voting v2: Pressing Issues, 3-tick window,
-- proposer-centric rewards, Mayor drops Propose
--
-- User-locked redesign of the ordinance flow:
--   • Mayor LOSES the ability to propose ordinances entirely; CCP
--     and CCM keep it.
--   • Proposals now resolve in 3 ticks (was 1) so council members
--     have time to see the Pressing Issues card and vote.
--   • Reward rebalance on PASS:
--       proposer: +0.5 Skill   (was: +1 Skill to the Mayor)
--       parties whose archetype ∈ support_archetypes:
--                 +0.3 popularity  (was: +0.5)
--       Mayor's-party-extra +0.3 → dropped (Mayor isn't a proposer).
--   • New RPC list_open_proposals_for_council_seat — surfaces every
--     in-flight proposal where the caller holds an unvoted seat. The
--     politician-home Pressing Issues feed renders one card per row
--     with VOTE YES / VOTE NO buttons.
--
-- Tally rule unchanged (simple majority, CCP breaks ties).
-- list_ordinances_for_city, vote_on_city_ordinance, the proposals/
-- votes tables: all unchanged from 20270745/42.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. propose_city_ordinance — drop Mayor + 3-tick resolve window
-- ════════════════════════════════════════════════════════════════════
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
    -- Mayor drop: 20270747. Only CCP + CCM may propose going forward.
    IF v_pol.politician_office NOT IN
       ('city_council_president', 'city_council_member') THEN
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

    IF v_pol.politician_office = 'city_council_president' THEN
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

    -- 3-tick voting window (was +1). Council members need time to
    -- see the Pressing Issues card and vote.
    INSERT INTO city_ordinance_proposals (
        city_id, ordinance_id, kind, proposer_faction_id,
        status, proposed_at_tick, resolve_tick
    ) VALUES (
        p_city_id, p_ordinance_id, v_kind, v_pol.id,
        'voting', v_tick, v_tick + 3
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
        'resolve_tick',    v_tick + 3,
        'next_action_tick',v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.propose_city_ordinance(uuid, uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.propose_city_ordinance(uuid, uuid, uuid, text) TO authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 2. resolve_due_city_ordinance_proposals — proposer-centric rewards
-- ════════════════════════════════════════════════════════════════════
-- Same tally + apply structure as 20270742, with the reward leg
-- swapped:
--   • Mayor lookup + +1 Skill block REMOVED.
--   • Proposer +0.5 Skill on PASS (any kind).
--   • Supporting-archetype party popularity: 0.5 → 0.3 (ENACT only).
--   • Mayor's-party-extra +0.3 REMOVED.
CREATE OR REPLACE FUNCTION public.resolve_due_city_ordinance_proposals()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick        int;
    v_prop        RECORD;
    v_yes         int;
    v_no          int;
    v_pres_vote   text;
    v_passed      boolean;
    v_ord         ordinances%ROWTYPE;
    v_city        cities%ROWTYPE;
    v_eff         jsonb;
    v_key         text;
    v_delta       int;
    v_resolved    int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR v_prop IN
        SELECT * FROM city_ordinance_proposals
         WHERE status = 'voting'
           AND resolve_tick <= v_tick
         FOR UPDATE SKIP LOCKED
    LOOP
        SELECT COUNT(*) FILTER (WHERE vote = 'yes'),
               COUNT(*) FILTER (WHERE vote = 'no')
          INTO v_yes, v_no
          FROM city_ordinance_proposal_votes
         WHERE proposal_id = v_prop.id;

        IF v_yes > v_no THEN
            v_passed := true;
        ELSIF v_yes < v_no THEN
            v_passed := false;
        ELSE
            SELECT vote INTO v_pres_vote
              FROM city_ordinance_proposal_votes
             WHERE proposal_id = v_prop.id AND seat_idx = 0;
            v_passed := COALESCE(v_pres_vote = 'yes', false);
        END IF;

        IF NOT v_passed THEN
            UPDATE city_ordinance_proposals
               SET status = 'rejected'
             WHERE id = v_prop.id;
            v_resolved := v_resolved + 1;
            CONTINUE;
        END IF;

        SELECT * INTO v_ord  FROM ordinances WHERE id = v_prop.ordinance_id;
        SELECT * INTO v_city FROM cities     WHERE id = v_prop.city_id;
        IF v_ord.id IS NULL OR v_city.id IS NULL THEN
            UPDATE city_ordinance_proposals
               SET status = 'rejected'
             WHERE id = v_prop.id;
            v_resolved := v_resolved + 1;
            CONTINUE;
        END IF;

        IF v_prop.kind = 'enact' THEN
            FOR v_eff IN SELECT * FROM jsonb_array_elements(v_ord.stat_effects)
            LOOP
                v_key   := v_eff->>'key';
                v_delta := (v_eff->>'delta')::int;
                IF v_key IS NULL OR v_delta IS NULL THEN
                    CONTINUE;
                END IF;
                EXECUTE format(
                    'UPDATE cities SET %I = GREATEST(1, LEAST(10, COALESCE(%I, 5) + $1)) WHERE id = $2',
                    v_key, v_key
                ) USING v_delta, v_city.id;
            END LOOP;

            UPDATE cities
               SET budget = GREATEST(0, COALESCE(budget, 0) - v_ord.cost)
             WHERE id = v_city.id;

            INSERT INTO city_ordinances (
                city_id, ordinance_id, status,
                enacted_at_tick, enacted_via_proposal_id
            ) VALUES (
                v_city.id, v_ord.id, 'active',
                v_tick, v_prop.id
            );
        ELSE  -- rescind
            UPDATE city_ordinances
               SET status                    = 'rescinded',
                   rescinded_at_tick         = v_tick,
                   rescinded_via_proposal_id = v_prop.id
             WHERE city_id      = v_city.id
               AND ordinance_id = v_ord.id
               AND status       = 'active';
        END IF;

        -- Proposer reward: +0.5 Skill on PASS (any kind).
        IF v_prop.proposer_faction_id IS NOT NULL THEN
            UPDATE factions
               SET politician_skill = COALESCE(politician_skill, 0) + 0.5
             WHERE id = v_prop.proposer_faction_id;
        END IF;

        -- Party popularity: ENACT only. +0.3 to every party in this
        -- nation whose archetype is in support_archetypes (clamped
        -- by popularity_cap_pct, floored at 0).
        IF v_prop.kind = 'enact' THEN
            UPDATE factions
               SET popularity_pct = LEAST(
                       COALESCE(popularity_cap_pct, 100),
                       GREATEST(0, COALESCE(popularity_pct, 0) + 0.3)
                   )
             WHERE faction_type = 'movement_party'
               AND abandoned_at IS NULL
               AND nation_id    = v_city.nation_id
               AND archetype    = ANY(v_ord.support_archetypes);
        END IF;

        UPDATE city_ordinance_proposals SET status = 'passed'
         WHERE id = v_prop.id;
        v_resolved := v_resolved + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'resolved', v_resolved);
END $$;

REVOKE EXECUTE ON FUNCTION public.resolve_due_city_ordinance_proposals() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.resolve_due_city_ordinance_proposals() TO authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 3. list_open_proposals_for_council_seat — Pressing Issues feed
-- ════════════════════════════════════════════════════════════════════
-- Returns every in-flight ordinance proposal where the caller holds
-- an as-yet-unvoted council seat. politician-home renders one
-- Pressing Issues card per row with VOTE YES / VOTE NO buttons.
--
-- Each row carries:
--   • Proposal identity + kind + resolve_tick
--   • The caller's seat_idx in that proposal's city
--   • Ordinance name / description / cost / stat_effects (effects
--     rendered as the chip strip)
--   • City id + name
--   • Proposer name (for the "proposed in city of X by Y" line)
CREATE OR REPLACE FUNCTION public.list_open_proposals_for_council_seat(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_pol  factions%ROWTYPE;
    v_list jsonb;
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
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'proposal_id',      p.id,
        'kind',             p.kind,
        'proposed_at_tick', p.proposed_at_tick,
        'resolve_tick',     p.resolve_tick,
        'seat_idx',         seat_match.seat_idx,
        'city_id',          c.id,
        'city_name',        c.city_name,
        'ordinance', jsonb_build_object(
            'id',            o.id,
            'name',          o.name,
            'description',   o.description,
            'cost',          o.cost,
            'stat_effects',  o.stat_effects
        ),
        'proposer_first',   f.leader_first_name,
        'proposer_last',    f.leader_last_name
    ) ORDER BY p.proposed_at_tick), '[]'::jsonb)
      INTO v_list
      FROM city_ordinance_proposals p
      JOIN cities c     ON c.id = p.city_id
      JOIN ordinances o ON o.id = p.ordinance_id
      LEFT JOIN factions f ON f.id = p.proposer_faction_id
      CROSS JOIN LATERAL (
        SELECT (CASE seat->>'seat'
                  WHEN 'president' THEN 0
                  WHEN 'member_1'  THEN 1
                  WHEN 'member_2'  THEN 2
                  WHEN 'member_3'  THEN 3
                END) AS seat_idx
          FROM jsonb_array_elements(c.council) seat
         WHERE seat->>'holder_faction_id' = v_pol.id::text
         LIMIT 1
      ) seat_match
     WHERE p.status = 'voting'
       AND seat_match.seat_idx IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM city_ordinance_proposal_votes v
            WHERE v.proposal_id = p.id
              AND v.seat_idx    = seat_match.seat_idx
       );

    RETURN jsonb_build_object('success', true, 'proposals', v_list);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_open_proposals_for_council_seat(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_open_proposals_for_council_seat(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
