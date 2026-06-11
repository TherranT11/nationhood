-- ════════════════════════════════════════════════════════════════════
-- 20270882 — Losing re-election evicts the sitting MP / Senior MP
--
-- User report: 'I lost my election as MP, so it should have removed
-- me from that office.' The resolver's incumbent-loss branch only
-- existed for Mayor (20270724) — a sitting MP or Senior MP whose
-- deferred re-election (20270770) failed kept politician_office and
-- the affiliation card. Two parts:
--
--   1. politician_resolve_due_elections re-emitted (20270770 body)
--      with a parliament-tier eviction: a lost re-election clears
--      politician_office / won_at_tick and decrements the party's
--      seat count (the win path increments it). Tier must match
--      the office held, so an MP losing a Senior-MP NOMINATION
--      race keeps their seat.
--
--   2. One-time repair for politicians already in the bad state:
--      anyone still holding member_of_parliament / senior_mp whose
--      newest matching-tier election career event AT OR AFTER their
--      office win is a LOSS gets evicted now, with the same seat
--      decrement.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_resolve_due_elections()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_tick         int;
    v_race         politician_active_election%ROWTYPE;
    v_won          boolean;
    v_stake        int;
    v_cap_before   numeric;
    v_new_cap      numeric;
    v_actual_delta numeric;
    v_event        text;
    v_opp_full     text;
    v_party_seats  int;
    v_party_pop    numeric;
    v_party_pop_cap numeric;
    v_party_funds  bigint;
    v_party_name   text;
    v_party_reward jsonb;
    v_party_penalty jsonb;
    v_new_cha      int;
    v_new_skill    numeric;
    v_stat_reward  jsonb;
    v_office       text;
    v_city_stamp   jsonb;
    v_city_row     cities%ROWTYPE;
    v_first_pool   text[];
    v_last_pool    text[];
    v_evict_first  text;
    v_evict_last   text;
    v_was_incumbent boolean;
    v_seat_idx     int;
    v_seat_kind    text;
    v_new_seat     jsonb;
    v_pol_party_abbr text;
    v_pol_party_name text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false, 'reason', 'no_shard');
    END IF;

    SELECT f.* INTO v_pol
      FROM factions f
      JOIN politician_active_election pae ON pae.politician_id = f.id
     WHERE (f.id = v_uid OR f.linked_user_id = v_uid)
       AND f.faction_type = 'politician'
       AND f.abandoned_at IS NULL
       AND pae.resolve_tick < v_tick
     LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false);
    END IF;

    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', false);
    END IF;
    IF v_race.resolve_tick >= v_tick THEN
        RETURN jsonb_build_object(
            'success', true, 'resolved', false,
            'race_tier', v_race.race_tier,
            'resolve_tick', v_race.resolve_tick,
            'current_tick', v_tick
        );
    END IF;

    IF v_race.polling_you_pct > v_race.polling_opp_pct THEN
        v_won := true;
    ELSIF v_race.polling_you_pct < v_race.polling_opp_pct THEN
        v_won := false;
    ELSE
        v_won := random() < 0.5;
    END IF;
    v_stake := CASE WHEN v_won THEN v_race.stake_win ELSE v_race.stake_lose END;
    v_event := CASE WHEN v_won THEN 'won_election' ELSE 'lost_election' END;
    v_opp_full := v_race.opp_first || ' ' || v_race.opp_last;
    v_cap_before := COALESCE(v_pol.politician_influence, 0);
    UPDATE factions
       SET politician_influence = GREATEST(0, v_cap_before + v_stake)
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_cap;
    v_actual_delta := v_new_cap - v_cap_before;

    -- Party rewards. Mayor / Mayor of Capital now also raise the
    -- party's approval ceiling per 20270724.
    IF v_won AND v_race.party_id IS NOT NULL THEN
        IF v_race.race_tier IN ('parliament', 'senior_mp') THEN
            UPDATE factions
               SET seats = COALESCE(seats, 0) + 1
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING seats, faction_name INTO v_party_seats, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',       'seats',
                    'delta',      1,
                    'new_value',  v_party_seats,
                    'party_name', v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'community' THEN
            UPDATE factions
               SET popularity_pct = LEAST(popularity_cap_pct, COALESCE(popularity_pct, 0) + 1)
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_pct, faction_name INTO v_party_pop, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',       'popularity',
                    'delta',      1,
                    'new_value',  v_party_pop,
                    'party_name', v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'city_council' THEN
            UPDATE factions
               SET popularity_cap_pct = COALESCE(popularity_cap_pct, 0) + 1,
                   popularity_pct     = LEAST(
                       COALESCE(popularity_cap_pct, 0) + 1,
                       COALESCE(popularity_pct, 0) + 1
                   ),
                   party_funds        = COALESCE(party_funds, 0) + 100000
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_pct, popularity_cap_pct, party_funds, faction_name
                 INTO v_party_pop, v_party_pop_cap, v_party_funds, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',           'city_council',
                    'popularity_delta',     1,
                    'popularity_new',       v_party_pop,
                    'popularity_cap_delta', 1,
                    'popularity_cap_new',   v_party_pop_cap,
                    'funds_delta',          100000,
                    'funds_new',            v_party_funds,
                    'party_name',           v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'city_council_president' THEN
            UPDATE factions
               SET party_funds = COALESCE(party_funds, 0) + 200000
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING party_funds, faction_name INTO v_party_funds, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',        'city_council_president',
                    'funds_delta', 200000,
                    'funds_new',   v_party_funds,
                    'party_name',  v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'mayor' THEN
            -- 20270724: +3 popularity_cap_pct on Mayor (non-capital).
            -- Pairs with the existing +2 popularity_pct + $200K funds.
            -- Inline expression appears twice in the SET so both reads
            -- pick up the OLD cap value (Postgres UPDATE semantics);
            -- the LEAST(new_cap, pop+2) clamp uses the BUMPED cap.
            UPDATE factions
               SET popularity_cap_pct = COALESCE(popularity_cap_pct, 0) + 3,
                   popularity_pct     = LEAST(
                       COALESCE(popularity_cap_pct, 0) + 3,
                       COALESCE(popularity_pct, 0) + 2
                   ),
                   party_funds        = COALESCE(party_funds, 0) + 200000
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_pct, popularity_cap_pct, party_funds, faction_name
                 INTO v_party_pop, v_party_pop_cap, v_party_funds, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',                 'mayor',
                    'popularity_delta',     2,
                    'popularity_new',       v_party_pop,
                    'popularity_cap_delta', 3,
                    'popularity_cap_new',   v_party_pop_cap,
                    'funds_delta',          200000,
                    'funds_new',            v_party_funds,
                    'party_name',           v_party_name
                );
            END IF;
        ELSIF v_race.race_tier = 'mayor_of_capital' THEN
            -- 20270724: +5 popularity_cap_pct on Mayor of Capital.
            -- Forward-only — capital mayor has no auto-term + no
            -- incumbent-loss branch + cities row isn't stamped, so
            -- there's nowhere to put a symmetric subtract today.
            -- Loss handling lands when the capital flow gets
            -- city-stamped (filed).
            UPDATE factions
               SET popularity_cap_pct = COALESCE(popularity_cap_pct, 0) + 5
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_cap_pct, faction_name
                 INTO v_party_pop_cap, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',                 'mayor_of_capital',
                    'popularity_cap_delta', 5,
                    'popularity_cap_new',   v_party_pop_cap,
                    'party_name',           v_party_name
                );
            END IF;
        END IF;
    END IF;

    IF NOT v_won AND v_race.party_id IS NOT NULL THEN
        UPDATE factions
           SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 1)
         WHERE id = v_race.party_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
        RETURNING popularity_pct, faction_name INTO v_party_pop, v_party_name;
        IF FOUND THEN
            v_party_penalty := jsonb_build_object(
                'kind',       'popularity',
                'delta',      -1,
                'new_value',  v_party_pop,
                'party_name', v_party_name
            );
        END IF;
    END IF;

    -- Player stat reward. 20270770: parliament / senior MP wins now
    -- grant +1 politician_skill (Experience) alongside the existing
    -- +1 politician_capital. Local-tier wins keep their +1 skill from
    -- 20270709.
    IF v_won THEN
        IF v_race.race_tier IN ('parliament', 'senior_mp') THEN
            UPDATE factions
               SET politician_capital = COALESCE(politician_capital, 1) + 1,
                   politician_skill   = COALESCE(politician_skill, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_capital, politician_skill INTO v_new_cha, v_new_skill;
            v_stat_reward := jsonb_build_object(
                'kind', 'influence_and_skill',
                'capital_delta', 1, 'capital_new', v_new_cha,
                'skill_delta',   1, 'skill_new',   v_new_skill
            );
        ELSIF v_race.race_tier IN (
            'community', 'city_council', 'city_council_president',
            'mayor', 'mayor_of_capital', 'regional_leader'
        ) THEN
            UPDATE factions
               SET politician_skill = COALESCE(politician_skill, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_skill INTO v_new_skill;
            v_stat_reward := jsonb_build_object('kind', 'skill', 'delta', 1, 'new_value', v_new_skill);
        END IF;
        v_office := CASE v_race.race_tier
                        WHEN 'community'              THEN 'community_organizer'
                        WHEN 'parliament'             THEN 'member_of_parliament'
                        WHEN 'city_council'           THEN 'city_council_member'
                        WHEN 'city_council_president' THEN 'city_council_president'
                        WHEN 'senior_mp'              THEN 'senior_mp'
                        WHEN 'mayor'                  THEN 'mayor'
                        WHEN 'mayor_of_capital'       THEN 'mayor_of_capital'
                        WHEN 'regional_leader'        THEN 'regional_leader'
                    END;
        IF v_office IS NOT NULL THEN
            UPDATE factions
               SET politician_office             = v_office,
                   politician_office_won_at_tick = v_tick
             WHERE id = v_pol.id;
        END IF;
        IF v_race.race_tier = 'community' THEN
            UPDATE factions
               SET politician_former_community_organizer = TRUE
             WHERE id = v_pol.id;
        END IF;

        -- Mayor WIN city stamp (20270718/20270719). Unchanged.
        IF v_race.race_tier = 'mayor' AND v_race.city_id IS NOT NULL THEN
            UPDATE cities
               SET mayor_first_name    = v_pol.leader_first_name,
                   mayor_last_name     = v_pol.leader_last_name,
                   mayor_age           = COALESCE(v_pol.leader_age, mayor_age),
                   mayor_archetype     = NULL,
                   mayor_party_id      = v_pol.politician_party_id,
                   mayor_term_end_tick = v_tick + 48
             WHERE id = v_race.city_id;
            IF FOUND THEN
                v_city_stamp := jsonb_build_object(
                    'city_id',             v_race.city_id,
                    'mayor_first',         v_pol.leader_first_name,
                    'mayor_last',          v_pol.leader_last_name,
                    'mayor_party_id',      v_pol.politician_party_id,
                    'mayor_term_end_tick', v_tick + 48
                );
            END IF;
        END IF;

        -- CCM / CCP WIN council seat stamp (20270722). Unchanged.
        IF v_race.race_tier IN ('city_council', 'city_council_president')
           AND v_race.city_id IS NOT NULL THEN
            SELECT abbreviation, faction_name
              INTO v_pol_party_abbr, v_pol_party_name
              FROM factions
             WHERE id = v_pol.politician_party_id
             LIMIT 1;

            SELECT * INTO v_city_row FROM cities WHERE id = v_race.city_id;
            IF v_city_row.id IS NOT NULL AND v_city_row.council IS NOT NULL THEN
                IF v_race.race_tier = 'city_council_president' THEN
                    v_seat_idx := 0;
                ELSE
                    SELECT (t.idx - 1)::int INTO v_seat_idx
                      FROM jsonb_array_elements(v_city_row.council)
                           WITH ORDINALITY AS t(elem, idx)
                     WHERE elem->>'seat' LIKE 'member_%'
                       AND (elem->>'holder_faction_id') IS NULL
                     ORDER BY idx
                     LIMIT 1;
                    IF v_seat_idx IS NULL THEN
                        SELECT (t.idx - 1)::int INTO v_seat_idx
                          FROM jsonb_array_elements(v_city_row.council)
                               WITH ORDINALITY AS t(elem, idx)
                         WHERE elem->>'seat' LIKE 'member_%'
                         ORDER BY NULLIF(elem->>'term_end_tick', '')::int ASC NULLS FIRST
                         LIMIT 1;
                    END IF;
                END IF;

                IF v_seat_idx IS NOT NULL THEN
                    v_seat_kind := v_city_row.council->v_seat_idx->>'seat';
                    v_new_seat := jsonb_build_object(
                        'seat',              v_seat_kind,
                        'holder_faction_id', v_pol.id,
                        'first_name',        v_pol.leader_first_name,
                        'last_name',         v_pol.leader_last_name,
                        'age',               v_pol.leader_age,
                        'party_id',          v_pol.politician_party_id,
                        'party_abbr',        v_pol_party_abbr,
                        'party_name',        v_pol_party_name,
                        'archetype',         NULL,
                        'term_end_tick',     v_tick + CASE v_race.race_tier
                                                  WHEN 'city_council_president' THEN 36
                                                  ELSE                                12
                                              END
                    );
                    UPDATE cities
                       SET council = jsonb_set(council, ARRAY[v_seat_idx::text], v_new_seat)
                     WHERE id = v_race.city_id;
                    v_city_stamp := jsonb_build_object(
                        'city_id',   v_race.city_id,
                        'seat',      v_seat_kind,
                        'seat_idx',  v_seat_idx
                    );
                END IF;
            END IF;
        END IF;
    END IF;

    -- Mayor LOSS — incumbent eviction. 20270724 adds the cap
    -- subtraction (-3) when the player loses re-election; both the
    -- cap and the clamped pop ride down so the party doesn't sit
    -- above its new ceiling. Mayor of Capital has no symmetric
    -- subtract path today (no incumbent-loss branch for the
    -- capital race tier).
    -- 20270882: MP / Senior MP incumbent eviction — losing the
    -- re-election vacates the seat, mirroring the Mayor branch
    -- below. A plain MP losing a senior_mp NOMINATION keeps their
    -- seat (tier must match the office held); a sitting Senior MP
    -- losing either parliament-tier race is out entirely. The
    -- party's seat count rides down (wins ride it up above).
    IF NOT v_won
       AND ((v_race.race_tier = 'parliament' AND v_pol.politician_office = 'member_of_parliament')
            OR (v_race.race_tier IN ('parliament', 'senior_mp')
                AND v_pol.politician_office = 'senior_mp')) THEN
        UPDATE factions
           SET politician_office             = NULL,
               politician_office_won_at_tick = NULL
         WHERE id = v_pol.id;
        UPDATE factions
           SET seats = GREATEST(0, COALESCE(seats, 0) - 1)
         WHERE id = v_pol.politician_party_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL;
    END IF;

    IF NOT v_won AND v_race.race_tier = 'mayor' AND v_race.city_id IS NOT NULL THEN
        SELECT * INTO v_city_row FROM cities WHERE id = v_race.city_id;
        v_was_incumbent :=
            v_city_row.id IS NOT NULL
            AND v_city_row.mayor_party_id   = v_pol.politician_party_id
            AND v_city_row.mayor_first_name = v_pol.leader_first_name
            AND v_city_row.mayor_last_name  = v_pol.leader_last_name;
        IF v_was_incumbent THEN
            SELECT first_name_pool, last_name_pool INTO v_first_pool, v_last_pool
              FROM nations WHERE id = v_pol.nation_id;
            v_evict_first := COALESCE(pick_random_pool_name(v_first_pool), 'Mayor');
            v_evict_last  := COALESCE(pick_random_pool_name(v_last_pool),  'Smith');
            UPDATE cities
               SET mayor_first_name    = v_evict_first,
                   mayor_last_name     = v_evict_last,
                   mayor_age           = 35 + floor(random() * 31)::int,
                   mayor_archetype     = NULL,
                   mayor_party_id      = NULL,
                   mayor_term_end_tick = NULL
             WHERE id = v_race.city_id;
            UPDATE factions
               SET politician_office             = NULL,
                   politician_office_won_at_tick = NULL
             WHERE id = v_pol.id;

            -- 20270724: pull the +3 ceiling bonus back. GREATEST(0,
            -- ...) is defensive against accounting drift; the LEAST
            -- pop clamp keeps it from ranging above the new cap.
            -- v_pol.politician_party_id can be NULL (player left
            -- party while mayor) — UPDATE WHERE then matches nothing
            -- and the subtraction is silently skipped. That's an
            -- accepted edge from 20270719.
            UPDATE factions
               SET popularity_cap_pct = GREATEST(0, COALESCE(popularity_cap_pct, 0) - 3),
                   popularity_pct     = LEAST(
                       GREATEST(0, COALESCE(popularity_cap_pct, 0) - 3),
                       COALESCE(popularity_pct, 0)
                   )
             WHERE id = v_pol.politician_party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL;

            v_city_stamp := jsonb_build_object(
                'city_id',                  v_race.city_id,
                'evicted',                  true,
                'new_mayor',                v_evict_first || ' ' || v_evict_last,
                'popularity_cap_delta',     -3
            );
        END IF;
    END IF;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, v_event, v_race.district,
        jsonb_build_object(
            'race_tier',              v_race.race_tier,
            'district',               v_race.district,
            'opponent',               v_opp_full,
            'opp_party_name',         v_race.opp_party_name,
            'polling_you',            v_race.polling_you_pct,
            'polling_opp',            v_race.polling_opp_pct,
            'political_capital_delta', v_actual_delta,
            'party_reward',           v_party_reward,
            'party_penalty',          v_party_penalty,
            'stat_reward',            v_stat_reward,
            'office_gained',          v_office,
            'city_id',                v_race.city_id,
            'city_stamp',             v_city_stamp
        )
    );
    DELETE FROM politician_active_election WHERE politician_id = v_pol.id;
    RETURN jsonb_build_object(
        'success',                true,
        'resolved',               true,
        'won',                    v_won,
        'race_tier',              v_race.race_tier,
        'district',               v_race.district,
        'opponent',               v_opp_full,
        'opp_party_name',         v_race.opp_party_name,
        'polling_you',            v_race.polling_you_pct,
        'polling_opp',            v_race.polling_opp_pct,
        'political_capital_delta', v_actual_delta,
        'politician_influence',   v_new_cap,
        'party_reward',           v_party_reward,
        'party_penalty',          v_party_penalty,
        'stat_reward',            v_stat_reward,
        'office_gained',          v_office,
        'city_stamp',             v_city_stamp
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.politician_resolve_due_elections() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_resolve_due_elections() TO authenticated;

-- ── 2. Repair the already-affected ─────────────────────────────────
DO $do$
DECLARE
    v_loser RECORD;
    v_fixed int := 0;
BEGIN
    FOR v_loser IN
        SELECT f.id, f.politician_party_id, f.leader_first_name, f.leader_last_name
          FROM factions f
         WHERE f.faction_type = 'politician'
           AND f.abandoned_at IS NULL
           AND f.politician_office IN ('member_of_parliament', 'senior_mp')
           AND (
               SELECT e.event_type
                 FROM politician_career_events e
                WHERE e.faction_id = f.id
                  AND e.event_type IN ('won_election', 'lost_election')
                  AND COALESCE(e.metadata->>'race_tier', '') IN ('parliament', 'senior_mp')
                  AND (f.politician_office = 'senior_mp'
                       OR COALESCE(e.metadata->>'race_tier', '') = 'parliament')
                  AND e.event_tick >= COALESCE(f.politician_office_won_at_tick, 0)
                ORDER BY e.event_tick DESC, e.created_at DESC
                LIMIT 1
           ) = 'lost_election'
    LOOP
        UPDATE factions
           SET politician_office             = NULL,
               politician_office_won_at_tick = NULL
         WHERE id = v_loser.id;
        UPDATE factions
           SET seats = GREATEST(0, COALESCE(seats, 0) - 1)
         WHERE id = v_loser.politician_party_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL;
        v_fixed := v_fixed + 1;
        RAISE NOTICE '20270882 repair: evicted % % (lost re-election)',
            v_loser.leader_first_name, v_loser.leader_last_name;
    END LOOP;
    RAISE NOTICE '20270882 repair: % eviction(s)', v_fixed;
END $do$;

NOTIFY pgrst, 'reload schema';

COMMIT;
