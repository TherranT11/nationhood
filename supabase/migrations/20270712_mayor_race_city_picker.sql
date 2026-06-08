-- ════════════════════════════════════════════════════════════════════
-- 20270712 — Mayor race: city picker, city stamp on win, party rewards
--
-- The 20270709 Mayor race shipped without a per-city dimension —
-- every "Run for Mayor" filed against an opaque "Mayor of a city"
-- district, and a win stamped politician_office='mayor' without
-- touching any cities row. Three things to fix per user spec:
--
-- 1. Players pick WHICH non-capital city to run in. politician_active
--    _election.city_id wires the chosen city through register →
--    resolve so the race and the resulting office point at the same
--    place. Required for target_office='mayor'; ignored for every
--    other tier (so the Community / CCM / Parliament flows are
--    untouched).
--
-- 2. On a mayor win, the cities row is rewritten to put the player
--    in the chair — first/last name from the player's faction, age
--    from the player's leader_age, mayor_party_id from the player's
--    politician_party_id. mayor_archetype is left alone; the Geography
--    card prefers party.archetype when the FK is set (20270708),
--    making the legacy archetype text harmless dead fallback.
--
-- 3. Mayor win also pays the party: +2 popularity_pct (cap-respecting,
--    matching CCM's pattern from 20270709), +$200K party_funds. Lines
--    up with the CCP reward shape — no popularity_cap bump, no seat
--    bump (mayors don't sit in parliament). User spec phrasing:
--      "+1 Experience (already from 20270709's unified +1 Skill block)
--       +2% Party Popularity
--       +200k Party Funds"
--
-- Mayor of Capital + Regional Leader are NOT changed in this pass —
-- the capital is a single deterministic city, no picker needed; the
-- RL race is region-level, not city-level. Both keep their existing
-- "no party reward" V1 behavior so the user can tune them later.
--
-- Active race card on home and the career-event templates are fixed
-- in the same commit (politician-home.html) so the "Community
-- Organizer · Mayor of a city" mis-render goes away as soon as the
-- migration lands.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Add city_id column to politician_active_election ────────────
ALTER TABLE public.politician_active_election
    ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.politician_active_election.city_id IS
    'Target city for mayor races (20270712). NULL for every other race tier. References cities(id); ON DELETE SET NULL so a city teardown converts the in-flight race to a generic mayor race rather than dropping it.';


-- ── 2. politician_register_for_office re-emit ─────────────────────
-- Same body as 20270709, plus:
--   • p_city_id parameter (NULL default keeps backwards-compatible
--     callers happy — only Mayor needs it today).
--   • Mayor branch validates p_city_id: must be a non-capital city
--     in the politician's nation. Returns 'invalid_city' otherwise.
--   • District string for Mayor swaps the generic "Mayor of a city"
--     for "Mayor of {city_name}" so the home page + career events
--     read naturally.
--   • city_id stored on politician_active_election so the resolver
--     can stamp the right city on win.
--
-- DROP the old (uuid, text) signature first — PostgreSQL identifies
-- functions by their argument types, so adding a DEFAULT-valued third
-- parameter creates a SECOND overload rather than replacing the old
-- one. Calls like rpc('politician_register_for_office', {p_faction_id,
-- p_target_office}) would then match both overloads and error on
-- ambiguity. Drop avoids that. CASCADE not needed — no other DB
-- objects depend on this function.
DROP FUNCTION IF EXISTS public.politician_register_for_office(uuid, text);

CREATE OR REPLACE FUNCTION public.politician_register_for_office(
    p_faction_id    uuid,
    p_target_office text,
    p_city_id       uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_tick         int;
    v_shard_id     uuid;
    v_first_pool   text[];
    v_last_pool    text[];
    v_opp_first    text;
    v_opp_last     text;
    v_opp_stat     int;
    v_your_stat    int;
    v_race_tier    text;
    v_resolve      int;
    v_next_elect   int;
    v_term_ticks   int;
    v_won_at       int;
    v_player_share numeric;
    v_poll_you     int;
    v_poll_opp     int;
    v_poll_und     int;
    v_next_action  int;
    v_district     text;
    v_opp_blurb    text;
    v_stake_win    int;
    v_stake_lose   int;
    v_exp_threshold int;
    v_city         cities%ROWTYPE;
    v_active_city  uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_target_office NOT IN (
        'city_council_member', 'senior_mp', 'city_council_president',
        'mayor', 'mayor_of_capital', 'regional_leader'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_target_office');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_party');
    END IF;
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    SELECT current_tick, id INTO v_tick, v_shard_id FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF EXISTS (SELECT 1 FROM politician_active_election WHERE politician_id = v_pol.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'race_in_progress');
    END IF;

    IF p_target_office = 'city_council_member' THEN
        IF COALESCE(v_pol.politician_skill, 0) < 20 THEN
            IF v_pol.politician_office <> 'community_organizer'
               AND COALESCE(v_pol.politician_former_community_organizer, FALSE) IS NOT TRUE THEN
                RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                    'have', v_pol.politician_office, 'expected', 'community_organizer_now_or_past');
            END IF;
            IF v_pol.politician_office = 'community_organizer' THEN
                v_won_at := COALESCE(v_pol.politician_office_won_at_tick, v_tick);
                IF v_tick < v_won_at + 9 THEN
                    RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                        'opens_at_tick', v_won_at + 9, 'current_tick', v_tick);
                END IF;
            END IF;
        END IF;
        v_race_tier  := 'city_council';
        v_your_stat  := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat   := 2 + floor(random() * 6)::int;
        v_resolve    := v_tick + 1;
        v_district   := 'City Council seat';
        v_opp_blurb  := 'Independent challenger for the council seat';
        v_stake_win  := 0;
        v_stake_lose := 0;

    ELSIF p_target_office = 'city_council_president' THEN
        IF COALESCE(v_pol.politician_skill, 0) < 40 THEN
            IF v_pol.politician_office <> 'city_council_member' THEN
                RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                    'have', v_pol.politician_office, 'expected', 'city_council_member');
            END IF;
            v_won_at := COALESCE(v_pol.politician_office_won_at_tick, v_tick);
            IF v_tick < v_won_at + 9 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                    'opens_at_tick', v_won_at + 9, 'current_tick', v_tick);
            END IF;
        END IF;
        v_race_tier  := 'city_council_president';
        v_your_stat  := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat   := 6 + floor(random() * 6)::int;
        v_resolve    := v_tick + 1;
        v_district   := 'City Council Presidency';
        v_opp_blurb  := 'Independent contender for the council chair';
        v_stake_win  := 3;
        v_stake_lose := 0;

    ELSIF p_target_office IN ('mayor', 'mayor_of_capital', 'regional_leader') THEN
        v_exp_threshold := CASE p_target_office
            WHEN 'mayor'             THEN 50
            WHEN 'mayor_of_capital'  THEN 60
            WHEN 'regional_leader'   THEN 75
        END;
        IF COALESCE(v_pol.politician_skill, 0) < v_exp_threshold THEN
            RETURN jsonb_build_object('success', false, 'reason', 'experience_too_low',
                'experience', COALESCE(v_pol.politician_skill, 0),
                'required',   v_exp_threshold);
        END IF;

        v_race_tier  := p_target_office;
        v_your_stat  := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat   := CASE p_target_office
            WHEN 'mayor'             THEN 6  + floor(random() * 10)::int   -- 1d10 + 5
            WHEN 'mayor_of_capital'  THEN 7  + floor(random() * 10)::int   -- 1d10 + 6
            WHEN 'regional_leader'   THEN 11 + floor(random() * 15)::int   -- 1d15 + 10
        END;
        v_resolve    := v_tick + 1;

        -- 20270712: Mayor (non-capital) requires a specific city id.
        -- We look the row up to validate it belongs to the player's
        -- nation and isn't the capital, then use city_name as the
        -- district string. Mayor of Capital + Regional Leader keep
        -- their pre-existing static district copy.
        IF p_target_office = 'mayor' THEN
            IF p_city_id IS NULL THEN
                RETURN jsonb_build_object('success', false, 'reason', 'city_required');
            END IF;
            SELECT * INTO v_city FROM cities
             WHERE id        = p_city_id
               AND nation_id = v_pol.nation_id
             LIMIT 1;
            IF v_city.id IS NULL THEN
                RETURN jsonb_build_object('success', false, 'reason', 'invalid_city');
            END IF;
            IF v_city.city_type = 'capital' THEN
                RETURN jsonb_build_object('success', false, 'reason', 'capital_blocked',
                    'detail', 'Use target_office=mayor_of_capital for the capital city.');
            END IF;
            v_active_city := v_city.id;
            -- District stores the city name only (e.g. "Miramar del
            -- Sur"). The home page's active race card prepends
            -- "Mayor ·" via TIER_DISPLAY; career event templates
            -- wrap "Mayor of {district}" around it. Keeps the
            -- rendering free of the "Mayor · Mayor of X" repetition
            -- you'd get from storing "Mayor of X" here.
            v_district    := COALESCE(v_city.city_name, 'a city');
            v_opp_blurb   := 'Independent challenger for the ' || COALESCE(v_city.city_name, 'city') || ' mayoralty';
        ELSIF p_target_office = 'mayor_of_capital' THEN
            v_district   := 'Mayor of the Capital';
            v_opp_blurb  := 'Independent challenger for the capital''s mayoralty';
        ELSE  -- regional_leader
            v_district   := 'Regional Leader';
            v_opp_blurb  := 'Independent challenger for the regional leadership';
        END IF;

        v_stake_win  := 0;
        v_stake_lose := 0;

    ELSE  -- senior_mp
        IF v_pol.politician_office <> 'member_of_parliament' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'wrong_current_office',
                'have', v_pol.politician_office, 'expected', 'member_of_parliament');
        END IF;
        SELECT next_election_tick, COALESCE(parliamentary_term_ticks, 24)
          INTO v_next_elect, v_term_ticks
          FROM nations WHERE id = v_pol.nation_id;
        IF v_next_elect IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_general_election');
        END IF;
        IF v_pol.politician_office_won_at_tick IS NULL
           OR v_tick < v_pol.politician_office_won_at_tick + v_term_ticks THEN
            RETURN jsonb_build_object('success', false, 'reason', 'term_too_short',
                'won_at',           v_pol.politician_office_won_at_tick,
                'term_ticks',       v_term_ticks,
                'eligible_at_tick', COALESCE(v_pol.politician_office_won_at_tick, 0) + v_term_ticks,
                'current_tick',     v_tick);
        END IF;
        IF v_tick < v_next_elect - 6 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'too_early',
                'opens_at_tick', v_next_elect - 6, 'current_tick', v_tick);
        END IF;
        IF v_tick > v_next_elect THEN
            RETURN jsonb_build_object('success', false, 'reason', 'window_closed',
                'last_open_tick', v_next_elect);
        END IF;
        v_race_tier  := 'senior_mp';
        v_your_stat  := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat   := 1 + floor(random() * 6)::int;
        v_resolve    := v_next_elect;
        v_district   := 'Senior MP slot';
        v_opp_blurb  := 'Independent contender for the Senior MP nomination';
        v_stake_win  := 4;
        v_stake_lose := -3;
    END IF;

    SELECT first_name_pool, last_name_pool INTO v_first_pool, v_last_pool
      FROM nations WHERE id = v_pol.nation_id;
    v_opp_first := COALESCE(pick_random_pool_name(v_first_pool), 'Opponent');
    v_opp_last  := COALESCE(pick_random_pool_name(v_last_pool),  'Smith');

    v_player_share := v_your_stat::numeric / GREATEST(1, v_your_stat + v_opp_stat);
    v_poll_you     := ROUND(v_player_share * 85)::int;
    v_poll_opp     := 85 - v_poll_you;
    v_poll_und     := 15;

    INSERT INTO politician_active_election (
        politician_id, shard_id, race_tier, district,
        opp_first, opp_last, opp_blurb, opp_party_name,
        your_stat, opp_stat, win_odds_pct, stake_win, stake_lose,
        resolve_tick,
        polling_you_pct, polling_opp_pct, polling_undecided_pct,
        party_id, city_id
    ) VALUES (
        v_pol.id, v_shard_id, v_race_tier, v_district,
        v_opp_first, v_opp_last, v_opp_blurb, NULL,
        v_your_stat, v_opp_stat,
        GREATEST(1, LEAST(99, v_poll_you)),
        v_stake_win, v_stake_lose,
        v_resolve,
        v_poll_you, v_poll_opp, v_poll_und,
        v_pol.politician_party_id, v_active_city
    );

    v_next_action := v_tick + 1;
    UPDATE factions SET next_member_action_tick = v_next_action WHERE id = v_pol.id;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, 'stood_for_election', v_district,
        jsonb_build_object(
            'race_tier',      v_race_tier,
            'your_stat',      v_your_stat,
            'opp_stat',       v_opp_stat,
            'opponent',       v_opp_first || ' ' || v_opp_last,
            'resolve_tick',   v_resolve,
            'polling_you',    v_poll_you,
            'polling_opp',    v_poll_opp,
            'polling_und',    v_poll_und,
            'city_id',        v_active_city
        )
    );

    RETURN jsonb_build_object(
        'success',                true,
        'target_office',          p_target_office,
        'opponent',               v_opp_first || ' ' || v_opp_last,
        'resolve_tick',           v_resolve,
        'your_stat',              v_your_stat,
        'opp_stat',               v_opp_stat,
        'win_odds_pct',           GREATEST(1, LEAST(99, v_poll_you)),
        'next_member_action_tick',v_next_action,
        'city_id',                v_active_city,
        'district',               v_district
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_register_for_office(uuid, text, uuid) TO authenticated;


-- ── 3. politician_resolve_due_elections re-emit ───────────────────
-- Same body as 20270709 plus a Mayor-win block that:
--   (a) writes the player into the chosen cities row (first/last/age,
--       mayor_party_id from the player's politician_party_id), and
--   (b) pays the party +2 popularity_pct (cap-respecting) and +$200K
--       party_funds.
-- The existing +1 politician_skill (Experience) reward from 20270709
-- is kept — race_tier='mayor' is still in the unified skill list.
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

    -- Party rewards. Per-tier blocks unchanged from 20270709 except
    -- a new 'mayor' branch (20270712): +2 popularity_pct cap-respecting,
    -- +$200K party_funds. Mayor of Capital + Regional Leader stay at
    -- "no party reward in V1" so they can be tuned independently.
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
            UPDATE factions
               SET popularity_pct = LEAST(
                       COALESCE(popularity_cap_pct, 100),
                       COALESCE(popularity_pct, 0) + 2
                   ),
                   party_funds    = COALESCE(party_funds, 0) + 200000
             WHERE id = v_race.party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
            RETURNING popularity_pct, party_funds, faction_name
                 INTO v_party_pop, v_party_funds, v_party_name;
            IF FOUND THEN
                v_party_reward := jsonb_build_object(
                    'kind',             'mayor',
                    'popularity_delta', 2,
                    'popularity_new',   v_party_pop,
                    'funds_delta',      200000,
                    'funds_new',        v_party_funds,
                    'party_name',       v_party_name
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

    -- Player stat reward — unchanged from 20270709.
    IF v_won THEN
        IF v_race.race_tier IN ('parliament', 'senior_mp') THEN
            UPDATE factions
               SET politician_capital = COALESCE(politician_capital, 1) + 1
             WHERE id = v_pol.id
            RETURNING politician_capital INTO v_new_cha;
            v_stat_reward := jsonb_build_object('kind', 'influence', 'delta', 1, 'new_value', v_new_cha);
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

        -- 20270712: Mayor win stamps the cities row with the player's
        -- identity + party. Guarded on city_id NOT NULL so a (broken)
        -- mayor race without a city_id resolves to politician_office
        -- only — the legacy NPC mayor stays in the cities row, which
        -- is preferable to nulling out the chair.
        IF v_race.race_tier = 'mayor' AND v_race.city_id IS NOT NULL THEN
            UPDATE cities
               SET mayor_first_name = v_pol.leader_first_name,
                   mayor_last_name  = v_pol.leader_last_name,
                   mayor_age        = COALESCE(v_pol.leader_age, mayor_age),
                   mayor_party_id   = v_pol.politician_party_id
             WHERE id = v_race.city_id;
            IF FOUND THEN
                v_city_stamp := jsonb_build_object(
                    'city_id',        v_race.city_id,
                    'mayor_first',    v_pol.leader_first_name,
                    'mayor_last',     v_pol.leader_last_name,
                    'mayor_party_id', v_pol.politician_party_id
                );
            END IF;
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

GRANT EXECUTE ON FUNCTION public.politician_resolve_due_elections() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
