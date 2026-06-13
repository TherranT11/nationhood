-- ════════════════════════════════════════════════════════════════════
-- 20270891 — No downward runs on the local ladder
--
-- Bug (user report): a sitting mayor could register for a city
-- council seat and, on winning, hold both — the win overwrites
-- politician_office to city_council_member while the cities row's
-- mayor_* stamp (and the old council stamp) stay in place. The same
-- hole let any office-holder with Experience >= 40 file for CCP via
-- the newcomer jumpstart, and let sitting CCMs re-file their own
-- 1-tick race to farm the +1 Experience win reward.
--
-- politician_register_for_office re-emitted (20270751 body) with two
-- gates, both returning the existing already_holds_office reason:
--   • city_council_member: only newcomers (no office) and Community
--     Organizers may file.
--   • city_council_president: anyone above Council Member is blocked
--     before the Experience >= 40 bypass is consulted.
-- Mayor-tier targets already had this guard; senior MP requires
-- sitting MP. Everything else is byte-identical to 20270751.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
        -- 20270891: no downward runs. A sitting council member or
        -- anyone above that rung (CCP, mayor, MP, ...) cannot file
        -- for a council seat — winning would overwrite their office
        -- while the city's mayor/council stamps kept the old seat,
        -- leaving them holding both.
        IF v_pol.politician_office IS NOT NULL
           AND v_pol.politician_office <> 'community_organizer' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'already_holds_office',
                'office', v_pol.politician_office);
        END IF;
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
        v_active_city := v_city.id;

        v_race_tier  := 'city_council';
        v_your_stat  := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat   := 2 + floor(random() * 6)::int;
        v_resolve    := v_tick + 1;
        v_district   := COALESCE(v_city.city_name, 'a city');
        v_opp_blurb  := 'Independent challenger for a ' || COALESCE(v_city.city_name, 'city') || ' council seat';
        v_stake_win  := 0;
        v_stake_lose := 0;

    ELSIF p_target_office = 'city_council_president' THEN
        -- 20270891: the Experience >= 40 jumpstart is for newcomers,
        -- not for sitting CCPs / mayors / MPs trading down the
        -- ladder. Anyone above Council Member is blocked outright.
        IF v_pol.politician_office IS NOT NULL
           AND v_pol.politician_office NOT IN ('community_organizer', 'city_council_member') THEN
            RETURN jsonb_build_object('success', false, 'reason', 'already_holds_office',
                'office', v_pol.politician_office);
        END IF;
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
        v_active_city := v_city.id;

        v_race_tier  := 'city_council_president';
        v_your_stat  := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat   := 6 + floor(random() * 6)::int;
        v_resolve    := v_tick + 1;
        v_district   := COALESCE(v_city.city_name, 'City Council Presidency');
        v_opp_blurb  := 'Independent contender for the ' || COALESCE(v_city.city_name, 'city') || ' council chair';
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

        IF v_pol.politician_office IN ('mayor', 'mayor_of_capital', 'regional_leader') THEN
            RETURN jsonb_build_object('success', false, 'reason', 'already_holds_office',
                'office', v_pol.politician_office);
        END IF;

        v_race_tier  := p_target_office;
        v_your_stat  := COALESCE(v_pol.politician_skill, 1);
        v_opp_stat   := CASE p_target_office
            WHEN 'mayor'             THEN 46 + floor(random() * 10)::int   -- 45 + 1d10 → 46..55
            WHEN 'mayor_of_capital'  THEN 56 + floor(random() * 10)::int   -- 55 + 1d10 → 56..65
            WHEN 'regional_leader'   THEN 71 + floor(random() * 10)::int   -- 70 + 1d10 → 71..80
        END;
        v_resolve    := v_tick + 1;

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
            -- 20270751: player-held seat → 6-tick filing window.
            -- mayor_term_end_tick is NULL for NPC mayors (20270719
            -- convention), so this gate fires only when the seat is
            -- held by a real player.
            IF v_city.mayor_term_end_tick IS NOT NULL
               AND v_tick < v_city.mayor_term_end_tick - 6 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'mayor_player_too_early',
                    'opens_at_tick', v_city.mayor_term_end_tick - 6,
                    'term_end_tick', v_city.mayor_term_end_tick,
                    'current_tick',  v_tick);
            END IF;
            v_active_city := v_city.id;
            v_district    := COALESCE(v_city.city_name, 'a city');
            v_opp_blurb   := 'Independent challenger for the ' || COALESCE(v_city.city_name, 'city') || ' mayoralty';
        ELSIF p_target_office = 'mayor_of_capital' THEN
            -- 20270751: capital case — load the capital row to honour
            -- the same player-held filing-window gate. The race
            -- itself isn't city-scoped (v_active_city stays NULL).
            SELECT * INTO v_city FROM cities
             WHERE nation_id = v_pol.nation_id AND city_type = 'capital'
             LIMIT 1;
            IF v_city.id IS NOT NULL
               AND v_city.mayor_term_end_tick IS NOT NULL
               AND v_tick < v_city.mayor_term_end_tick - 6 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'mayor_player_too_early',
                    'opens_at_tick', v_city.mayor_term_end_tick - 6,
                    'term_end_tick', v_city.mayor_term_end_tick,
                    'current_tick',  v_tick);
            END IF;
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
        'city_id',                v_active_city,
        'district',               v_district
    );
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
