-- ════════════════════════════════════════════════════════════════════
-- 20270807 — Construction bids: price, mayor award, auto-award, build
--
-- The award-and-build phase of the public bid flow (20270804).
--
--   Bids name a PRICE. submit_public_bid regrows with p_price (old
--   2-arg dropped) and snapshots two things at submit time so the
--   mayor's table can't be gamed after the fact:
--     quality      = the corp's Engineering Quality pillar
--     build_ticks  = building-type baseline − Structural Speed
--                    (min 1). Baselines: single_story_home 4,
--                    double_story 6, multitenant_living 9 ticks.
--
--   corp_construction_projects: the awarded build. City budget pays
--   the price into escrow at award; the corp's treasury receives it
--   at completion (completes_at_tick = award tick + build_ticks).
--   No city stat bump on completion — the ordinance's own stat
--   effects already landed when it passed. The Engineering Quality
--   "+0.1 Appeal" perk waits on cities.appeal being numeric (it's an
--   int today) — documented gap, not silently rounded.
--
--   _award_construction_bid (internal): the single award path both
--   doors use. Locks request + bid, checks the city budget covers
--   the price (escrow deduct), bid → won, sibling pending bids →
--   lost, request → awarded, project row created.
--
--   accept_construction_bid(p_bid_id): the mayor's [ACCEPT]. Caller
--   must be the requesting city's sitting mayor (same name+party
--   city match as 20270737's mayor actions) or an admin.
--
--   auto_award_construction_bids(p_tick): per-tick sweep — open
--   city requests 3+ ticks old with pending bids award to the LOWEST
--   price the city can afford (an unaffordable lowball is skipped in
--   favor of the next-lowest; if nothing is affordable the request
--   stays open and retries next tick). service_role only.
--
--   complete_construction_projects(p_tick): per-tick sweep — due
--   projects flip to completed and the escrowed price lands in the
--   corp treasury (stamped through the revenue accumulator so the
--   Finances box and corporate tax see construction income).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.construction_project_bids
    ADD COLUMN IF NOT EXISTS price       bigint NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS quality     int    NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS build_ticks int    NOT NULL DEFAULT 4;

-- The bid board remembers which ordinance spawned a request — the
-- mayor's "View Construction Bid on {X} Ordinance" card reads it.
ALTER TABLE public.construction_project_requests
    ADD COLUMN IF NOT EXISTS source_ordinance_name text;

CREATE TABLE IF NOT EXISTS public.corp_construction_projects (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id        uuid NOT NULL REFERENCES public.construction_project_requests(id) ON DELETE CASCADE,
    bid_id            uuid NOT NULL REFERENCES public.construction_project_bids(id) ON DELETE CASCADE,
    corp_id           uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    blueprint_id      uuid REFERENCES public.corp_blueprints(id) ON DELETE SET NULL,
    city_id           uuid REFERENCES public.cities(id) ON DELETE SET NULL,
    city              text NOT NULL,
    price             bigint NOT NULL,
    quality           int  NOT NULL DEFAULT 1,
    started_tick      int  NOT NULL,
    completes_at_tick int  NOT NULL,
    status            text NOT NULL DEFAULT 'building' CHECK (status IN ('building', 'completed')),
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS corp_construction_projects_due_idx
    ON public.corp_construction_projects (completes_at_tick) WHERE status = 'building';
CREATE INDEX IF NOT EXISTS corp_construction_projects_corp_idx
    ON public.corp_construction_projects (corp_id);

ALTER TABLE public.corp_construction_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.corp_construction_projects;
CREATE POLICY "Allow select for all" ON public.corp_construction_projects
    FOR SELECT USING (true);

-- ── submit_public_bid — regrown with p_price ──────────────────────
-- Body byte-faithful to 20270804 except the price validation and the
-- quality / build_ticks snapshots on the INSERT.
DROP FUNCTION IF EXISTS public.submit_public_bid(uuid, uuid);

CREATE OR REPLACE FUNCTION public.submit_public_bid(
    p_request_id   uuid,
    p_blueprint_id uuid,
    p_price        bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_bp      corp_blueprints%ROWTYPE;
    v_req     construction_project_requests%ROWTYPE;
    v_tick    int;
    v_id      uuid;
    v_ticks   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL OR p_blueprint_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_price IS NULL OR p_price < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_price');
    END IF;

    SELECT * INTO v_bp FROM corp_blueprints WHERE id = p_blueprint_id;
    IF v_bp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
    END IF;

    -- Lock the corp row: the per-tick allowance check below must
    -- serialize against a concurrent executive action.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_bp.corp_id FOR UPDATE;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT * INTO v_req FROM construction_project_requests WHERE id = p_request_id;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_req.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_open',
            'status', v_req.status);
    END IF;
    IF v_req.building_type <> v_bp.building_type THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_type_mismatch');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- Build time: type baseline − Structural Speed, floor 1 tick.
    v_ticks := GREATEST(1,
        CASE v_req.building_type
            WHEN 'single_story_home'  THEN 4
            WHEN 'double_story'       THEN 6
            WHEN 'multitenant_living' THEN 9
            ELSE 6
        END - GREATEST(1, COALESCE(v_corp.pillar_speed, 1)));

    BEGIN
        INSERT INTO construction_project_bids (
            request_id, corp_id, blueprint_id, submitted_at_tick,
            price, quality, build_ticks
        ) VALUES (
            p_request_id, v_corp.id, p_blueprint_id, v_tick,
            p_price, GREATEST(1, COALESCE(v_corp.pillar_quality, 1)), v_ticks
        ) RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_bid');
    END;

    UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = v_corp.id;

    RETURN jsonb_build_object('success', true, 'bid_id', v_id, 'build_ticks', v_ticks);
END $$;

REVOKE EXECUTE ON FUNCTION public.submit_public_bid(uuid, uuid, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.submit_public_bid(uuid, uuid, bigint) TO authenticated;

-- ── _award_construction_bid (internal) ────────────────────────────
CREATE OR REPLACE FUNCTION public._award_construction_bid(p_bid_id uuid, p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_bid  construction_project_bids%ROWTYPE;
    v_req  construction_project_requests%ROWTYPE;
    v_city cities%ROWTYPE;
    v_id   uuid;
BEGIN
    SELECT * INTO v_bid FROM construction_project_bids WHERE id = p_bid_id FOR UPDATE;
    IF v_bid.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_found');
    END IF;
    IF v_bid.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_pending');
    END IF;

    SELECT * INTO v_req FROM construction_project_requests
     WHERE id = v_bid.request_id FOR UPDATE;
    IF v_req.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_open');
    END IF;
    IF v_req.requester_city_id IS NULL THEN
        -- Corp-to-corp requests have no payer wired yet.
        RETURN jsonb_build_object('success', false, 'reason', 'no_payer');
    END IF;

    SELECT * INTO v_city FROM cities WHERE id = v_req.requester_city_id FOR UPDATE;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;
    IF COALESCE(v_city.budget, 0) < v_bid.price THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_city_budget',
            'budget', COALESCE(v_city.budget, 0), 'price', v_bid.price);
    END IF;

    -- Escrow: the city pays now, the corp collects at completion.
    UPDATE cities SET budget = COALESCE(budget, 0) - v_bid.price
     WHERE id = v_city.id;

    UPDATE construction_project_bids SET status = 'won' WHERE id = p_bid_id;
    UPDATE construction_project_bids SET status = 'lost'
     WHERE request_id = v_req.id AND status = 'pending';
    UPDATE construction_project_requests SET status = 'awarded'
     WHERE id = v_req.id;

    INSERT INTO corp_construction_projects (
        request_id, bid_id, corp_id, blueprint_id, city_id, city,
        price, quality, started_tick, completes_at_tick
    ) VALUES (
        v_req.id, p_bid_id, v_bid.corp_id, v_bid.blueprint_id,
        v_city.id, v_req.city, v_bid.price, v_bid.quality,
        p_tick, p_tick + GREATEST(1, v_bid.build_ticks)
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'project_id', v_id,
        'completes_at_tick', p_tick + GREATEST(1, v_bid.build_ticks));
END $$;

REVOKE EXECUTE ON FUNCTION public._award_construction_bid(uuid, int) FROM PUBLIC;

-- ── accept_construction_bid — the mayor's [ACCEPT] ────────────────
CREATE OR REPLACE FUNCTION public.accept_construction_bid(p_bid_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_bid  construction_project_bids%ROWTYPE;
    v_req  construction_project_requests%ROWTYPE;
    v_tick int;
    v_is_mayor boolean := false;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_bid_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_bid FROM construction_project_bids WHERE id = p_bid_id;
    IF v_bid.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_found');
    END IF;
    SELECT * INTO v_req FROM construction_project_requests WHERE id = v_bid.request_id;

    -- The requesting city's sitting mayor — same name+party match
    -- the mayor-action RPCs use (20270737) — or an admin.
    IF NOT is_admin() THEN
        SELECT EXISTS (
            SELECT 1
              FROM factions f
              JOIN cities c ON c.id = v_req.requester_city_id
             WHERE f.faction_type = 'politician'
               AND f.politician_office = 'mayor'
               AND f.abandoned_at IS NULL
               AND (f.id = v_uid OR f.linked_user_id = v_uid)
               AND c.nation_id = f.nation_id
               AND c.mayor_first_name = f.leader_first_name
               AND c.mayor_last_name  = f.leader_last_name
               AND c.mayor_party_id IS NOT DISTINCT FROM f.politician_party_id
        ) INTO v_is_mayor;
        IF NOT v_is_mayor THEN
            RETURN jsonb_build_object('success', false, 'reason', 'not_mayor');
        END IF;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    RETURN _award_construction_bid(p_bid_id, COALESCE(v_tick, 0));
END $$;

REVOKE EXECUTE ON FUNCTION public.accept_construction_bid(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.accept_construction_bid(uuid) TO authenticated;

-- ── auto_award_construction_bids — the 3-tick fallback ────────────
CREATE OR REPLACE FUNCTION public.auto_award_construction_bids(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_req     RECORD;
    v_bid     RECORD;
    v_res     jsonb;
    v_awarded int := 0;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    FOR v_req IN
        SELECT r.id FROM construction_project_requests r
         WHERE r.status = 'open'
           AND r.requester_city_id IS NOT NULL
           AND p_tick - r.created_at_tick >= 3
           AND EXISTS (SELECT 1 FROM construction_project_bids b
                        WHERE b.request_id = r.id AND b.status = 'pending')
         ORDER BY r.created_at_tick
    LOOP
        -- Lowest price the city can afford; an unaffordable lowball
        -- is skipped for the next-lowest.
        FOR v_bid IN
            SELECT b.id FROM construction_project_bids b
             WHERE b.request_id = v_req.id AND b.status = 'pending'
             ORDER BY b.price ASC, b.created_at ASC
        LOOP
            v_res := _award_construction_bid(v_bid.id, p_tick);
            IF (v_res->>'success')::boolean THEN
                v_awarded := v_awarded + 1;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'awarded', v_awarded);
END $$;

REVOKE EXECUTE ON FUNCTION public.auto_award_construction_bids(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.auto_award_construction_bids(int) TO service_role;

-- ── complete_construction_projects — pay the builder ──────────────
CREATE OR REPLACE FUNCTION public.complete_construction_projects(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_proj      RECORD;
    v_completed int := 0;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    FOR v_proj IN
        SELECT * FROM corp_construction_projects
         WHERE status = 'building' AND completes_at_tick <= p_tick
         FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE corp_construction_projects SET status = 'completed'
         WHERE id = v_proj.id;
        -- The escrowed price lands; stamped through the revenue
        -- accumulator so the Finances cards and corporate tax both
        -- see construction income.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_proj.price
         WHERE id = v_proj.corp_id;
        PERFORM stamp_entrepreneur_corp_revenue(v_proj.corp_id, p_tick, v_proj.price);
        v_completed := v_completed + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'completed', v_completed);
END $$;

REVOKE EXECUTE ON FUNCTION public.complete_construction_projects(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.complete_construction_projects(int) TO service_role;

-- ── resolve_due_city_ordinance_proposals — stamp the source name ──
-- Body byte-faithful to 20270805 except the construction-request
-- INSERT now records source_ordinance_name.
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

            -- Construction Request ordinances (20270805): passage is
            -- the demand signal — the project posts to the public
            -- bid board as "City of {city}".
            IF COALESCE(v_ord.construction_request, false)
               AND v_ord.construction_building_type IS NOT NULL THEN
                INSERT INTO construction_project_requests (
                    entity, requester_city_id, city, nation_id,
                    building_type, created_at_tick, source_ordinance_name
                ) VALUES (
                    'City of ' || v_city.city_name, v_city.id, v_city.city_name,
                    v_city.nation_id, v_ord.construction_building_type, v_tick,
                    v_ord.name
                );
            END IF;
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

NOTIFY pgrst, 'reload schema';

COMMIT;
