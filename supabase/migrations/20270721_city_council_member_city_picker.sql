-- ════════════════════════════════════════════════════════════════════
-- 20270721 — City Council Member race: per-city picker
--
-- 20270712 added p_city_id to politician_register_for_office for
-- the Mayor race only; the CCM branch still filed against a generic
-- "City Council seat" district with no city. Per user spec the CCM
-- race now mirrors the Mayor flow — player picks which city's
-- council they're running for. Same modal vocabulary, same city_id
-- column on politician_active_election.
--
-- Differences from the Mayor city pick:
--   • Capital is ALLOWED. Every city has a council, so the
--     'capital_blocked' guard from the Mayor branch is not copied
--     across.
--   • District string is the bare city name (same as Mayor) — the
--     home page's TIER_DISPLAY for race_tier='city_council' already
--     reads "City Council Member · {district}", so renaming
--     "Local Ward" to e.g. "Puerto Rey" produces a clean header
--     without further client work.
--   • No cities-table stamp on win. The CCM seat is still a nation-
--     level office (politician_office='city_council_member'); the
--     per-city council schema (1 CCP + 3 CCMs filed on the city
--     row) is the next step and stays out of this commit. city_id
--     rides the active election row so a future resolver pass can
--     read it once the schema lands.
--
-- Body otherwise byte-faithful to 20270713's register_for_office.
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

        -- 20270721: per-city picker. Required, validated against the
        -- caller's nation. Capital is allowed (every city has a
        -- council). City_id rides through to politician_active
        -- _election so a future resolver pass can read it when the
        -- per-city council schema lands.
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
            v_active_city := v_city.id;
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

NOTIFY pgrst, 'reload schema';

COMMIT;
